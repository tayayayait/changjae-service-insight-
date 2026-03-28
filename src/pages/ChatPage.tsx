import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { ServiceIntroScreen } from "@/components/common/ServiceIntroScreen";
import { PaymentCheckoutSheet } from "@/components/common/PaymentCheckoutSheet";
import { ChatSessionToolbar } from "@/components/chat/ChatSessionToolbar";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { SajuContextBanner } from "@/components/chat/SajuContextBanner";
import { cn } from "@/lib/utils";
import { buildOwnerKeyFromUserId } from "@/lib/ownerIdentity";
import { supabase } from "@/lib/supabase";
import { useChatAccess } from "@/hooks/chat/useChatAccess";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { usePaymentStore } from "@/store/usePaymentStore";

const POST_PAYMENT_SYNC_MAX_ATTEMPTS = 8;
const POST_PAYMENT_SYNC_DELAY_MS = 1200;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const toNonEmptyString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

type PaymentReconcileTarget = {
  orderNumber: string;
  txId: string;
};

type ChatCreditSyncPayload = {
  applied: boolean;
  remaining: number;
  total: number;
  nextFreeResetAt: string | null;
};

const isChatCreditSyncPayload = (value: unknown): value is ChatCreditSyncPayload => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as {
    applied?: unknown;
    remaining?: unknown;
    total?: unknown;
    nextFreeResetAt?: unknown;
  };

  return (
    typeof row.applied === "boolean" &&
    typeof row.remaining === "number" &&
    Number.isFinite(row.remaining) &&
    typeof row.total === "number" &&
    Number.isFinite(row.total) &&
    (row.nextFreeResetAt === null ||
      row.nextFreeResetAt === undefined ||
      (typeof row.nextFreeResetAt === "string" && row.nextFreeResetAt.trim().length > 0))
  );
};

export const ChatPage: React.FC = () => {
  const {
    remaining,
    isRefreshing,
    quotaState,
    quotaError,
    syncedOwnerKey,
    refreshQuota,
    isPaidChatOpen,
    isProfileReadyForChat,
  } = useChatAccess();
  const chatIsLoading = useChatStore((state) => state.isLoading);
  const chatSajuContext = useChatStore((state) => state.sajuContext);
  const authUser = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const setLoginModalOpen = useAuthStore((state) => state.setLoginModalOpen);
  const navigate = useNavigate();
  const authOwnerKey = buildOwnerKeyFromUserId(authUser?.id ?? null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasAutoOpenedCheckout, setHasAutoOpenedCheckout] = useState(false);
  const [postPaymentSyncState, setPostPaymentSyncState] = useState<"idle" | "syncing" | "failed">("idle");
  const [lastPaymentReconcileTarget, setLastPaymentReconcileTarget] = useState<PaymentReconcileTarget | null>(null);

  useBeforeUnload(chatIsLoading);

  useEffect(() => {
    if (!authUser || isProfileReadyForChat) {
      return;
    }
    navigate(`/setup-profile?next=${encodeURIComponent("/chat")}`, { replace: true });
  }, [authUser, isProfileReadyForChat, navigate]);

  const isSyncedForCurrentOwner = useMemo(
    () => Boolean(authOwnerKey) && syncedOwnerKey === authOwnerKey,
    [authOwnerKey, syncedOwnerKey],
  );

  const canGateByQuota = Boolean(chatSajuContext);
  const isPostPaymentSyncing = postPaymentSyncState === "syncing";
  const isPostPaymentSyncFailed = postPaymentSyncState === "failed";

  const showQuotaLoadingGate =
    canGateByQuota && !isPostPaymentSyncing && !isPostPaymentSyncFailed && quotaState === "loading";
  const showQuotaErrorGate =
    canGateByQuota && !isPostPaymentSyncing && !isPostPaymentSyncFailed && quotaState === "error";
  const showQuotaGate =
    canGateByQuota &&
    !isPostPaymentSyncing &&
    !isPostPaymentSyncFailed &&
    isPaidChatOpen &&
    quotaState === "ready" &&
    isSyncedForCurrentOwner &&
    remaining === 0;
  const isBlockingOverlayActive =
    showQuotaLoadingGate || showQuotaErrorGate || showQuotaGate || isPostPaymentSyncing || isPostPaymentSyncFailed;
  const shouldShowOverlayLogout = isBlockingOverlayActive || isCheckoutOpen;
  const shouldDimChat =
    showQuotaLoadingGate || showQuotaErrorGate || showQuotaGate || isPostPaymentSyncing || isPostPaymentSyncFailed;

  useEffect(() => {
    if (showQuotaGate && !hasAutoOpenedCheckout) {
      setIsCheckoutOpen(true);
      setHasAutoOpenedCheckout(true);
      return;
    }

    // Do not reset latch during loading; this prevents checkout reopening
    // right after successful payment while quota is re-synced.
    if (quotaState === "loading") {
      return;
    }

    if (
      quotaState === "ready" &&
      (remaining > 0 || !isSyncedForCurrentOwner || !isPaidChatOpen || !canGateByQuota)
    ) {
      setHasAutoOpenedCheckout(false);
    }
  }, [canGateByQuota, hasAutoOpenedCheckout, isPaidChatOpen, isSyncedForCurrentOwner, quotaState, remaining, showQuotaGate]);

  useEffect(() => {
    if (postPaymentSyncState !== "syncing") {
      return;
    }

    if (quotaState === "ready" && isSyncedForCurrentOwner && remaining > 0) {
      setPostPaymentSyncState("idle");
    }
  }, [isSyncedForCurrentOwner, postPaymentSyncState, quotaState, remaining]);

  const tryReconcilePaidOrder = useCallback(async (target: PaymentReconcileTarget | null) => {
    if (!target) {
      return;
    }

    const payload = {
      type: "Transaction.Paid",
      data: {
        payment_id: target.orderNumber,
        transaction_id: target.txId,
      },
      merchant_uid: target.orderNumber,
      imp_uid: target.txId,
      status: "paid",
    };

    const { data, error } = await supabase.functions.invoke("payment-webhook", {
      body: payload,
    });
    if (error) {
      throw error;
    }

    const response = data as { ok?: boolean; error?: string } | null;
    if (response && response.ok === false) {
      throw new Error(response.error || "결제 반영 처리에 실패했습니다.");
    }
  }, []);

  const syncQuotaAfterPayment = useCallback(async (target?: PaymentReconcileTarget | null) => {
    const reconcileTarget = target ?? lastPaymentReconcileTarget;
    setPostPaymentSyncState("syncing");
    setIsCheckoutOpen(false);
    setHasAutoOpenedCheckout(true);

    try {
      await tryReconcilePaidOrder(reconcileTarget);
    } catch (reconcileErr) {
      console.warn("payment reconcile retry failed:", reconcileErr);
    }

    for (let attempt = 0; attempt < POST_PAYMENT_SYNC_MAX_ATTEMPTS; attempt += 1) {
      await refreshQuota();

      const snapshot = usePaymentStore.getState();
      const ownerSynced = Boolean(authOwnerKey) && snapshot.syncedOwnerKey === authOwnerKey;
      if (snapshot.quotaState === "ready" && ownerSynced && snapshot.remaining > 0) {
        setPostPaymentSyncState("idle");
        setHasAutoOpenedCheckout(false);
        return;
      }

      if (attempt < POST_PAYMENT_SYNC_MAX_ATTEMPTS - 1) {
        if (attempt === 2 || attempt === 5) {
          try {
            await tryReconcilePaidOrder(reconcileTarget);
          } catch (reconcileErr) {
            console.warn("payment reconcile retry failed:", reconcileErr);
          }
        }
        await wait(POST_PAYMENT_SYNC_DELAY_MS);
      }
    }

    setPostPaymentSyncState("failed");
  }, [authOwnerKey, lastPaymentReconcileTarget, refreshQuota, tryReconcilePaidOrder]);

  const handleSignOut = useCallback(async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      await signOut();
      setIsCheckoutOpen(false);
      setLoginModalOpen(true);
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, setLoginModalOpen, signOut]);

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-background text-foreground transition-all duration-300">
      <SajuContextBanner />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <ChatSessionToolbar
          showLogout={!shouldShowOverlayLogout}
          onLogout={() => {
            void handleSignOut();
          }}
          isLogoutDisabled={isSigningOut}
        />

        {shouldShowOverlayLogout ? (
          <div className="pointer-events-none absolute right-4 top-3 z-[70]">
            <button
              type="button"
              aria-label="chat-overlay-logout"
              onClick={() => {
                void handleSignOut();
              }}
              disabled={isSigningOut}
              className="pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-600 bg-zinc-900/90 px-3 text-xs font-semibold text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LogOut className="h-3.5 w-3.5" />
              로그아웃
            </button>
          </div>
        ) : null}
        <ChatMessageList />

        {showQuotaGate && !isCheckoutOpen ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/60 p-6 sm:p-10">
            {isPaidChatOpen ? (
              <ServiceIntroScreen
                serviceId="saju-ai-chat"
                onStart={() => setIsCheckoutOpen(true)}
                ctaText="결제창 다시 열기"
              />
            ) : null}
          </div>
        ) : null}

        {showQuotaLoadingGate ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/55 p-6">
            <div className="rounded-xl border border-border/70 bg-card/95 px-5 py-4 text-sm font-semibold text-foreground shadow">
              질문 가능 횟수를 확인하는 중입니다...
            </div>
          </div>
        ) : null}

        {showQuotaErrorGate ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/70 p-6">
            <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/95 p-6 text-center shadow">
              <p className="text-sm font-bold text-foreground">무료 사용 횟수 확인에 실패했습니다.</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {quotaError ? quotaError : "잠시 후 다시 시도해 주세요."}
              </p>
              <button
                type="button"
                onClick={() => {
                  void refreshQuota();
                }}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : null}

        {isPostPaymentSyncing ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/70 p-6">
            <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/95 p-6 text-center shadow">
              <p className="text-sm font-bold text-foreground">결제 완료를 확인하는 중입니다.</p>
              <p className="mt-2 text-xs text-muted-foreground">이용권 반영까지 몇 초 정도 걸릴 수 있습니다.</p>
            </div>
          </div>
        ) : null}

        {isPostPaymentSyncFailed ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/70 p-6">
            <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/95 p-6 text-center shadow">
              <p className="text-sm font-bold text-foreground">결제 반영이 지연되고 있습니다.</p>
              <p className="mt-2 text-xs text-muted-foreground">
                다시 확인 버튼을 누르면 무료/유료 잔여 횟수를 다시 동기화합니다.
              </p>
              <button
                type="button"
                onClick={() => {
                  void syncQuotaAfterPayment();
                }}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                다시 확인
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className={cn("transition-opacity duration-300", shouldDimChat && "pointer-events-none opacity-20")}>
        <div className="flex items-center justify-between border-t border-border/70 bg-bg-surface/45 px-6 py-2 text-[11px] text-text-secondary">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-state-success" />
            {isRefreshing || quotaState === "loading" ? (
              <span>질문 가능 횟수를 확인하는 중입니다...</span>
            ) : quotaState === "error" ? (
              <span>무료 사용 횟수 확인 실패</span>
            ) : (
              <>
                오늘 질문: <span className="font-bold text-primary">{remaining}개</span>
              </>
            )}
          </div>
          <div>계정 연결 완료</div>
        </div>
        <ChatInput />
      </div>

      <PaymentCheckoutSheet
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={async (payload) => {
          const txId =
            toNonEmptyString(payload.paymentResult.txId) ??
            toNonEmptyString(payload.paymentResult.imp_uid) ??
            toNonEmptyString(payload.paymentResult.paymentId) ??
            payload.orderNumber;
          const nextTarget: PaymentReconcileTarget = {
            orderNumber: payload.orderNumber,
            txId,
          };
          setLastPaymentReconcileTarget(nextTarget);

          if (isChatCreditSyncPayload(payload.chatCredit)) {
            usePaymentStore.getState().setQuotaFromChatResponse({
              remaining: payload.chatCredit.remaining,
              total: payload.chatCredit.total,
              charged: payload.chatCredit.applied,
              nextFreeResetAt: payload.chatCredit.nextFreeResetAt,
            });
            setIsCheckoutOpen(false);
            setPostPaymentSyncState("idle");
            setHasAutoOpenedCheckout(true);
            void refreshQuota();
            return;
          }

          await syncQuotaAfterPayment(nextTarget);
        }}
        serviceId="saju-ai-chat"
        serviceType="saju"
        serviceName="AI 사주 상담 10회권"
        amount={2000}
        ownerKeyOverride={authOwnerKey}
      />
    </div>
  );
};

export default ChatPage;
