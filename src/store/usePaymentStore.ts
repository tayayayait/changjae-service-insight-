import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { getDefaultOwnerKey } from "@/lib/ownerIdentity";

/**
 * Chat policy:
 * - Credits are server-authoritative owner ledger (`ownerKey`) for free/paid balance.
 * - Free allowance is rolling-window based and evaluated by backend RPC.
 * - Chat context/history remains `ownerKey + profileKey`.
 */
export const PAID_CHAT_OPEN = true;
export const PAYMENT_STORE_STORAGE_KEY = "saju:payment-store:v5";

const DEFAULT_FREE_QUESTIONS = 2;

export interface ChatQuotaSnapshot {
  remaining: number;
  total: number;
  charged: boolean;
  nextFreeResetAt?: string | null;
}

export type ChatQuotaState = "idle" | "loading" | "ready" | "error";

interface PaymentState {
  activeOwnerKey: string | null;
  activeProfileKey: string | null;
  remaining: number;
  total: number;
  quotaState: ChatQuotaState;
  quotaError: string | null;
  syncedOwnerKey: string | null;
  isQuotaReady: boolean;
  isRefreshing: boolean;
  lastSyncedAt: number | null;
  nextFreeResetAt: string | null;

  setActiveOwnerKey: (ownerKey: string | null) => void;
  setActiveProfileKey: (profileKey: string | null) => void;
  refreshQuota: () => Promise<void>;
  setQuotaFromChatResponse: (quota: ChatQuotaSnapshot) => void;
  consumeQuotaFallback: () => void;
  hasValidPass: () => boolean;
  getRemainingQuestions: () => number;
  purchaseDayPass: () => boolean; // purchase flow is handled by checkout sheet
  resetQuotaCache: () => void;
}

const normalizeOwnerKey = (ownerKey: string | null) => {
  const next = ownerKey?.trim();
  return next ? next : null;
};

const normalizeProfileKey = (profileKey: string | null) => {
  const next = profileKey?.trim();
  return next ? next : null;
};

const clampToNonNegativeInt = (value: unknown, fallback = 0) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.trunc(value));
};

const isGuestOwnerKey = (ownerKey: string | null) => {
  const normalized = normalizeOwnerKey(ownerKey);
  return !normalized || normalized.startsWith("owner:guest:");
};

type StatusResponse = {
  owner_key?: string;
  free_used?: number;
  paid_remaining?: number;
  total?: number;
  remaining?: number;
  next_free_reset_at?: string | null;
} | null;

const normalizeTimestamp = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return new Date(parsed).toISOString();
};

const shouldApplyBootstrapQuotaFallback = (params: {
  ownerKey: string;
  syncedOwnerKey: string | null;
}) => {
  if (!params.ownerKey) {
    return false;
  }
  return params.syncedOwnerKey !== params.ownerKey;
};

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      activeOwnerKey: getDefaultOwnerKey(),
      activeProfileKey: null,
      remaining: 0,
      total: DEFAULT_FREE_QUESTIONS,
      quotaState: "idle",
      quotaError: null,
      syncedOwnerKey: null,
      isQuotaReady: false,
      isRefreshing: false,
      lastSyncedAt: null,
      nextFreeResetAt: null,

      setActiveOwnerKey: (ownerKey) => {
        const normalizedOwnerKey = normalizeOwnerKey(ownerKey) ?? getDefaultOwnerKey();
        set({
          activeOwnerKey: normalizedOwnerKey,
          remaining: 0,
          total: DEFAULT_FREE_QUESTIONS,
          quotaState: "loading",
          quotaError: null,
          syncedOwnerKey: null,
          isQuotaReady: false,
          isRefreshing: false,
          lastSyncedAt: null,
          nextFreeResetAt: null,
        });
      },

      setActiveProfileKey: (profileKey) => {
        set({
          activeProfileKey: normalizeProfileKey(profileKey),
        });
      },

      refreshQuota: async () => {
        const state = get();
        const ownerKey = normalizeOwnerKey(state.activeOwnerKey);
        if (!ownerKey || isGuestOwnerKey(ownerKey)) {
          set({
            remaining: 0,
            total: DEFAULT_FREE_QUESTIONS,
            quotaState: "ready",
            quotaError: null,
            syncedOwnerKey: ownerKey,
            isQuotaReady: true,
            isRefreshing: false,
            lastSyncedAt: Date.now(),
            nextFreeResetAt: null,
          });
          return;
        }

        set({ isRefreshing: true, quotaState: "loading", quotaError: null });
        try {
          const { data, error } = await supabase.rpc("chat_credit_status", {
            p_owner_key: ownerKey,
          });

          if (error) {
            throw error;
          }

          const row = (Array.isArray(data) ? data[0] : data) as StatusResponse;
          if (!row) {
            throw new Error("failed to load chat credit status");
          }

          const nextRemaining = clampToNonNegativeInt(row.remaining, 0);
          const nextTotal = Math.max(
            DEFAULT_FREE_QUESTIONS,
            clampToNonNegativeInt(row.total, DEFAULT_FREE_QUESTIONS),
          );
          const nextFreeResetAt =
            row.next_free_reset_at === undefined
              ? state.nextFreeResetAt
              : normalizeTimestamp(row.next_free_reset_at);
          set({
            remaining: nextRemaining,
            total: nextTotal,
            quotaState: "ready",
            quotaError: null,
            syncedOwnerKey: ownerKey,
            isQuotaReady: true,
            isRefreshing: false,
            lastSyncedAt: Date.now(),
            nextFreeResetAt: nextFreeResetAt,
          });
          return;
        } catch (rpcError) {
          console.error("refreshQuota rpc error:", rpcError);
        }

        try {
          const { data, error } = await supabase.functions.invoke("chat-credit-status", {
            body: { ownerKey },
          });

          if (error) {
            throw error;
          }

          const quota = (data as { quota?: ChatQuotaSnapshot } | null)?.quota;
          if (!quota) {
            throw new Error("chat-credit-status quota payload missing");
          }

          const nextRemaining = clampToNonNegativeInt(quota.remaining, 0);
          const nextTotal = Math.max(
            DEFAULT_FREE_QUESTIONS,
            clampToNonNegativeInt(quota.total, DEFAULT_FREE_QUESTIONS),
          );
          const nextFreeResetAt =
            quota.nextFreeResetAt === undefined
              ? state.nextFreeResetAt
              : normalizeTimestamp(quota.nextFreeResetAt);

          set({
            remaining: nextRemaining,
            total: nextTotal,
            quotaState: "ready",
            quotaError: null,
            syncedOwnerKey: ownerKey,
            isQuotaReady: true,
            isRefreshing: false,
            lastSyncedAt: Date.now(),
            nextFreeResetAt: nextFreeResetAt,
          });
        } catch (fallbackError) {
          console.error("refreshQuota fallback error:", fallbackError);
          const fallbackMessage =
            fallbackError instanceof Error
              ? fallbackError.message
              : "failed to load free quota";
          set((current) => {
            if (
              shouldApplyBootstrapQuotaFallback({
                ownerKey,
                syncedOwnerKey: normalizeOwnerKey(current.syncedOwnerKey),
              })
            ) {
              console.warn(
                "refreshQuota bootstrap fallback applied for unsynced owner:",
                ownerKey,
              );
              return {
                remaining: DEFAULT_FREE_QUESTIONS,
                total: DEFAULT_FREE_QUESTIONS,
                quotaState: "ready",
                quotaError: null,
                syncedOwnerKey: ownerKey,
                isRefreshing: false,
                isQuotaReady: true,
                lastSyncedAt: Date.now(),
                nextFreeResetAt: null,
              };
            }

            return {
              remaining: clampToNonNegativeInt(current.remaining, 0),
              total: Math.max(
                DEFAULT_FREE_QUESTIONS,
                clampToNonNegativeInt(current.total, DEFAULT_FREE_QUESTIONS),
              ),
              quotaState: "error",
              quotaError: fallbackMessage,
              syncedOwnerKey: null,
              isRefreshing: false,
              isQuotaReady: false,
              lastSyncedAt: Date.now(),
              nextFreeResetAt: current.nextFreeResetAt,
            };
          });
        }
      },

      setQuotaFromChatResponse: (quota) => {
        const current = get();
        const nextFreeResetAt =
          quota.nextFreeResetAt === undefined
            ? current.nextFreeResetAt
            : normalizeTimestamp(quota.nextFreeResetAt);
        set({
          remaining: clampToNonNegativeInt(quota.remaining, 0),
          total: Math.max(
            DEFAULT_FREE_QUESTIONS,
            clampToNonNegativeInt(quota.total, DEFAULT_FREE_QUESTIONS),
          ),
          quotaState: "ready",
          quotaError: null,
          syncedOwnerKey: normalizeOwnerKey(current.activeOwnerKey),
          isQuotaReady: true,
          isRefreshing: false,
          lastSyncedAt: Date.now(),
          nextFreeResetAt: nextFreeResetAt,
        });
      },

      consumeQuotaFallback: () => {
        set((current) => ({
          remaining: Math.max(0, current.remaining - 1),
          total: Math.max(
            DEFAULT_FREE_QUESTIONS,
            clampToNonNegativeInt(current.total, DEFAULT_FREE_QUESTIONS),
          ),
          quotaState: "ready",
          quotaError: null,
          syncedOwnerKey: normalizeOwnerKey(current.activeOwnerKey),
          isQuotaReady: true,
          isRefreshing: false,
          lastSyncedAt: Date.now(),
          nextFreeResetAt: current.nextFreeResetAt,
        }));
      },

      hasValidPass: () => {
        const state = get();
        return state.quotaState === "ready" && state.remaining > 0;
      },

      getRemainingQuestions: () => get().remaining,

      purchaseDayPass: () => false,

      resetQuotaCache: () => {
        set({
          remaining: 0,
          total: DEFAULT_FREE_QUESTIONS,
          quotaState: "idle",
          quotaError: null,
          syncedOwnerKey: null,
          isQuotaReady: false,
          isRefreshing: false,
          lastSyncedAt: null,
          nextFreeResetAt: null,
        });
      },
    }),
    {
      name: PAYMENT_STORE_STORAGE_KEY,
      version: 1,
      partialize: (state) => ({
        activeOwnerKey: state.activeOwnerKey,
        activeProfileKey: state.activeProfileKey,
        remaining: state.remaining,
        total: state.total,
        lastSyncedAt: state.lastSyncedAt,
        nextFreeResetAt: state.nextFreeResetAt,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<PaymentState>;
        return {
          ...currentState,
          activeOwnerKey:
            normalizeOwnerKey(
              typeof persisted.activeOwnerKey === "string"
                ? persisted.activeOwnerKey
                : null,
            ) ?? getDefaultOwnerKey(),
          activeProfileKey: normalizeProfileKey(
            typeof persisted.activeProfileKey === "string"
              ? persisted.activeProfileKey
              : null,
          ),
          remaining: clampToNonNegativeInt(persisted.remaining, 0),
          total: Math.max(
            DEFAULT_FREE_QUESTIONS,
            clampToNonNegativeInt(persisted.total, DEFAULT_FREE_QUESTIONS),
          ),
          quotaState: "idle",
          quotaError: null,
          syncedOwnerKey: null,
          isQuotaReady: false,
          isRefreshing: false,
          lastSyncedAt:
            typeof persisted.lastSyncedAt === "number" && Number.isFinite(persisted.lastSyncedAt)
              ? persisted.lastSyncedAt
              : null,
          nextFreeResetAt: normalizeTimestamp(persisted.nextFreeResetAt),
        };
      },
    },
  ),
);

