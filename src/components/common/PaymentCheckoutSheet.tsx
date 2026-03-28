import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { requestPayment, type PortonePaymentResult } from "@/lib/portone";
import { useOwnerStore } from "@/store/useOwnerStore";
import { ensureGuestSessionId, digestSha256 } from "@/lib/ownerIdentity";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";

interface BuyerInfo {
  name: string;
  phone: string;
  email: string;
}

interface ChatCreditSyncPayload {
  applied: boolean;
  remaining: number;
  total: number;
  nextFreeResetAt: string | null;
}

interface TestOrderInsertPayload {
  order_number: string;
  report_id: string;
  guest_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone_hash: string;
  service_id: string;
  amount_krw: number;
  status: "paid";
  paid_at?: string;
}

const CREATE_ORDER_TIMEOUT_MS = 12_000;
const OWNER_RESOLVE_TIMEOUT_MS = 8_000;
const PAYMENT_RECONCILE_TIMEOUT_MS = 10_000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const extractFunctionErrorMessage = async (err: unknown): Promise<string | null> => {
  if (!err || typeof err !== "object" || !("context" in err)) {
    return null;
  }

  const context = (err as { context?: unknown }).context;
  if (!(context instanceof Response)) {
    return null;
  }

  const payload = await context
    .clone()
    .json()
    .catch(() => null) as { error?: unknown; message?: unknown } | null;

  if (payload && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }
  if (payload && typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  return null;
};

const toNonEmptyString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const toChatCreditPayload = (value: unknown): ChatCreditSyncPayload | undefined => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const row = value as {
    applied?: unknown;
    remaining?: unknown;
    total?: unknown;
    nextFreeResetAt?: unknown;
  };

  if (
    typeof row.applied !== "boolean" ||
    typeof row.remaining !== "number" ||
    !Number.isFinite(row.remaining) ||
    typeof row.total !== "number" ||
    !Number.isFinite(row.total)
  ) {
    return undefined;
  }

  return {
    applied: row.applied,
    remaining: Math.max(0, Math.trunc(row.remaining)),
    total: Math.max(0, Math.trunc(row.total)),
    nextFreeResetAt:
      typeof row.nextFreeResetAt === "string" && row.nextFreeResetAt.trim()
        ? row.nextFreeResetAt
        : null,
  };
};

const reconcilePaidOrder = async (params: {
  orderNumber: string;
  paymentResult: PortonePaymentResult;
}) => {
  const txId =
    toNonEmptyString(params.paymentResult.txId) ??
    toNonEmptyString(params.paymentResult.imp_uid) ??
    toNonEmptyString(params.paymentResult.paymentId) ??
    params.orderNumber;

  const payload = {
    type: "Transaction.Paid",
    data: {
      payment_id: params.orderNumber,
      transaction_id: txId,
    },
    merchant_uid: params.orderNumber,
    imp_uid: txId,
    status: "paid",
  };

  const { data, error } = await withTimeout(
    supabase.functions.invoke("payment-webhook", { body: payload }),
    PAYMENT_RECONCILE_TIMEOUT_MS,
    "결제 반영",
  );

  if (error) {
    throw error;
  }

  const response = data as { ok?: boolean; error?: string; chatCredit?: unknown } | null;
  if (response && response.ok === false) {
    throw new Error(response.error || "결제 반영 처리에 실패했습니다.");
  }

  return {
    chatCredit: toChatCreditPayload(response?.chatCredit),
  };
};

interface PaymentCheckoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: {
    orderNumber: string;
    reportId: string;
    paymentResult: PortonePaymentResult;
    buyerInfo: BuyerInfo;
    ownerKey: string;
    chatCredit?: ChatCreditSyncPayload;
  }) => void | Promise<void>;
  serviceId: string;
  serviceType: string;
  serviceName: string;
  amount: number;
  inputSnapshot?: Record<string, unknown>;
  reportPayload?: Record<string, unknown>;
  previewPayload?: Record<string, unknown>;
  assumePaid?: boolean;
  ownerKeyOverride?: string | null;
}

export const PaymentCheckoutSheet: React.FC<PaymentCheckoutSheetProps> = ({
  isOpen,
  onClose,
  onSuccess,
  serviceId,
  serviceType,
  serviceName,
  amount,
  inputSnapshot = {},
  reportPayload = {},
  previewPayload = {},
  assumePaid = (import.meta.env.VITE_ASTROLOGY_ASSUME_PAID ?? "true").toLowerCase() === "true",
  ownerKeyOverride = null,
}) => {
  const [buyer, setBuyer] = useState<BuyerInfo>({
    name: "",
    phone: "",
    email: "",
  });
  const activeOwnerKey = useOwnerStore((state) => state.activeOwnerKey);
  const setOwnerFromVerifiedContact = useOwnerStore((state) => state.setOwnerFromVerifiedContact);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isThirdPartyAgreed, setIsThirdPartyAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!buyer.name || !buyer.phone) {
      alert("이름과 휴대폰 번호를 입력해주세요.");
      return;
    }
    if (!buyer.email || !buyer.email.includes("@")) {
      alert("이메일을 정확히 입력해주세요. (재조회 시 필요합니다)");
      return;
    }
    if (!isAgreed || !isThirdPartyAgreed) {
      alert("모든 필수 약관 및 정보 제공에 동의해주세요.");
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = buyer.phone.replace(/[^0-9]/g, "");
      const normalizedEmail = buyer.email.trim().toLowerCase();

      const completeSuccess = (payload: {
        orderNumber: string;
        reportId: string;
        paymentResult: PortonePaymentResult;
        buyerInfo: BuyerInfo;
        ownerKey: string;
        chatCredit?: ChatCreditSyncPayload;
      }) => {
        onClose();
        void Promise.resolve(onSuccess(payload)).catch((callbackErr) => {
          console.error("Payment success callback error:", callbackErr);
          alert("결제는 완료되었지만 리포트 이동에 실패했습니다. 내 리포트 찾기에서 다시 조회해 주세요.");
        });
      };

      if (assumePaid) {
        const orderNumber = `ASSUME-${Date.now()}`;
        
        // 1. Create a real report in DB for testing lookup
        const { data: testReport, error: reportErr } = await supabase
          .from("reports")
          .insert({
            guest_id: ensureGuestSessionId(),
            service_id: serviceId,
            service_type: serviceType,
            input_snapshot: inputSnapshot || {},
            preview_payload: previewPayload || {},
            is_unlocked: true,
          })
          .select("id")
          .single();

        if (reportErr) throw reportErr;
        const reportId = testReport.id;

        // 2. Create a "paid" order in DB (bypassing edge function)
        const buyerPhoneHash = await digestSha256(normalizedPhone);
        const orderPayload: TestOrderInsertPayload = {
          order_number: orderNumber,
          report_id: reportId,
          guest_id: ensureGuestSessionId(),
          buyer_name: buyer.name,
          buyer_email: normalizedEmail,
          buyer_phone_hash: buyerPhoneHash,
          service_id: serviceId,
          amount_krw: amount,
          status: "paid", // Mark as paid immediately for test
          paid_at: new Date().toISOString(),
        };

        let { error: orderErr } = await supabase.from("orders").insert(orderPayload);

        // Fallback if paid_at column is missing in remote DB
        if (orderErr && orderErr.code === "PGRST204" && orderErr.message.includes("paid_at")) {
          console.warn("paid_at column missing, retrying without it...");
          delete orderPayload.paid_at;
          const retry = await supabase.from("orders").insert(orderPayload);
          orderErr = retry.error;
        }

        if (orderErr) throw orderErr;

        const paymentResult: PortonePaymentResult = {
          success: true,
          merchant_uid: orderNumber,
          imp_uid: `mock_${orderNumber}`,
          simulated: true,
        };

        const ownerKey = await useOwnerStore.getState().setOwnerFromVerifiedContact({
          phone: normalizedPhone,
          email: normalizedEmail,
        });

        completeSuccess({ orderNumber, reportId, paymentResult, buyerInfo: buyer, ownerKey });
        setLoading(false);
        return;
      }

      const normalizedOwnerOverride = ownerKeyOverride?.trim();
      const ownerKey = normalizedOwnerOverride
        ? normalizedOwnerOverride
        : await withTimeout(
          setOwnerFromVerifiedContact({
            phone: normalizedPhone,
            email: normalizedEmail || undefined,
          }),
          OWNER_RESOLVE_TIMEOUT_MS,
          "본인 확인 정보 처리",
        );

      // 1. Create order via Edge Function
      const { data, error } = await withTimeout(
        supabase.functions.invoke("create-order", {
          body: {
            serviceId,
            serviceType,
            inputSnapshot,
            reportPayload,
            previewPayload,
            buyerInfo: {
              ...buyer,
              phone: normalizedPhone,
              email: normalizedEmail,
              amount,
            },
            ownerKey,
          },
        }),
        CREATE_ORDER_TIMEOUT_MS,
        "주문 생성",
      );

      if (error) throw error;
      const response = data as { ok?: boolean; error?: string; orderNumber?: string; reportId?: string } | null;
      if (!response?.ok) throw new Error(response?.error || "주문 생성에 실패했습니다.");
      if (!response.orderNumber || !response.reportId) {
        throw new Error("결제 요청에 필요한 정보가 누락되었습니다.");
      }

      const { orderNumber, reportId } = response;

      // 2. Trigger PortOne V2 Payment
      const paymentResult = await requestPayment({
        pg: "inicis_v2",
        pay_method: "card",
        merchant_uid: orderNumber,
        name: serviceName,
        amount: amount,
        buyer_name: buyer.name,
        buyer_email: normalizedEmail,
        buyer_tel: normalizedPhone,
      });

      // 결제 실패 또는 취소 처리
      if (!paymentResult.success) {
        const msg = String(paymentResult.message || "");
        if (paymentResult.code === "FAILURE_TYPE_CANCEL" || msg.includes("취소")) {
          // 사용자가 직접 취소한 경우 → 조용히 종료
          setLoading(false);
          return;
        }
        throw new Error(msg || "결제에 실패했습니다.");
      }

      // 3. 결제 성공 → 포트원 서버가 자동으로 webhook을 호출하여 주문 상태를 업데이트합니다.
      //    프런트엔드에서는 짧은 대기 후 성공 콜백을 실행합니다.
      //    (webhook이 아직 도착하지 않았을 수 있으므로 약간의 여유를 줍니다)
      let reconcileResult: { chatCredit?: ChatCreditSyncPayload } | null = null;
      try {
        reconcileResult = await reconcilePaidOrder({ orderNumber, paymentResult });
      } catch (reconcileErr) {
        console.warn("payment-webhook reconcile failed (will rely on retry sync):", reconcileErr);
      }

      // 4. Success (Frontend side)
      completeSuccess({
        orderNumber,
        reportId,
        paymentResult,
        buyerInfo: buyer,
        ownerKey,
        chatCredit: reconcileResult?.chatCredit,
      });
    } catch (err: unknown) {
      console.error("Payment flow error:", err);
      const functionMessage = await extractFunctionErrorMessage(err);
      
      let message = functionMessage || (err instanceof Error ? err.message : "결제 진행 중 오류가 발생했습니다.");
      
      // 상세 진단 정보 추가 (사용자 화면에서 원인 파악을 위해)
      if (!functionMessage && err && typeof err === "object") {
        const errObj = err as {
          name?: unknown;
          status?: unknown;
          statusText?: unknown;
          code?: unknown;
        };
        const details: string[] = [];
        if (errObj.name) details.push(`Name: ${String(errObj.name)}`);
        if (errObj.status) details.push(`Status: ${String(errObj.status)}`);
        if (errObj.statusText) details.push(`StatusText: ${String(errObj.statusText)}`);
        if (errObj.code) details.push(`Code: ${String(errObj.code)}`);
        
        if (details.length > 0) {
          message += `\n\n[Diagnostic Info]\n${details.join("\n")}\nURL: ${import.meta.env.VITE_SUPABASE_URL || "fallback"}`;
        }
      }

      if (!message.includes("사용자가 결제를 취소")) {
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      modal={false}
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !loading) {
          onClose();
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="left-1/2 right-auto w-[calc(100vw-1rem)] max-w-[720px] -translate-x-1/2 h-auto max-h-[78dvh] sm:max-h-[84dvh] rounded-t-2xl sm:rounded-t-3xl border-t-0 bg-stone-50 dark:bg-stone-950 p-4 sm:p-5 md:p-6 overflow-y-auto"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-500" />
            결제 정보 입력
          </SheetTitle>
          <SheetDescription>
            비회원 리포트 조회를 위해 정확한 정보를 입력해주세요.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 py-3 sm:space-y-6 sm:py-4">
          <div className="bg-white dark:bg-stone-900 p-3.5 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
            <p className="text-xs text-stone-500 mb-1">결제 상품</p>
            <p className="text-lg font-bold text-stone-900 dark:text-stone-100">{serviceName}</p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-black text-indigo-600">{amount.toLocaleString()}</span>
              <span className="text-sm font-bold text-indigo-600">원</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buyer-name" className="text-sm font-semibold ml-1">주문자 성함</Label>
              <Input
                id="buyer-name"
                placeholder="홍길동"
                value={buyer.name}
                onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                className="rounded-xl h-11 sm:h-12 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer-phone" className="text-sm font-semibold ml-1">휴대폰 번호</Label>
              <Input
                id="buyer-phone"
                type="tel"
                placeholder="01012345678"
                value={buyer.phone}
                onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
                className="rounded-xl h-11 sm:h-12 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-stone-500 ml-1 leading-relaxed">
                ※ 주문자 성함/휴대폰 번호를 기준으로 재조회됩니다. 이메일까지 입력했다면 조회 시 함께 입력해 주세요.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer-email" className="text-sm font-semibold ml-1">이메일 (필수)</Label>
              <Input
                id="buyer-email"
                type="email"
                placeholder="example@email.com"
                value={buyer.email}
                onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                className="rounded-xl h-11 sm:h-12 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:ring-indigo-500"
                required
              />
              <p className="text-[11px] text-stone-500 ml-1 leading-relaxed">
                ※ 이름·전화번호·이메일을 기준으로 리포트를 재조회할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="terms" 
                checked={isAgreed} 
                onCheckedChange={(checked) => setIsAgreed(checked as boolean)} 
                className="mt-1 border-stone-300 dark:border-stone-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="terms" className="text-sm font-medium leading-none cursor-pointer">
                  개인정보 수집 및 이용 동의 (필수)
                </Label>
                <p className="text-[11px] text-stone-500 leading-normal">
                  리포트 제공 및 비회원 본인 확인을 위해 이름, 휴대폰 번호, 이메일을 수집합니다.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox 
                id="third-party" 
                checked={isThirdPartyAgreed} 
                onCheckedChange={(checked) => setIsThirdPartyAgreed(checked as boolean)} 
                className="mt-1 border-stone-300 dark:border-stone-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="third-party" className="text-sm font-medium leading-none cursor-pointer">
                  결제 서비스 제공을 위한 개인정보 제3자 제공 동의 (필수)
                </Label>
                <p className="text-[11px] text-stone-500 leading-normal">
                  전자금융거래 및 결제 대행 서비스 이용을 위해 필수 정보를 포트원에 제공함에 동의합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-3 pb-4 sm:mt-4 sm:pb-6">
          <Button
            className="w-full h-12 sm:h-14 rounded-2xl text-base sm:text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-70"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                결제 요청 중...
              </>
            ) : (
              "결제하기"
            )}
          </Button>
          <div className="flex justify-center items-center gap-1.5 mt-4 text-[10px] text-stone-400 opacity-70">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            256비트 암호화 보안 결제 적용
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
