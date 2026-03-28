import { beforeEach, describe, expect, it, vi } from "vitest";
import { PAYMENT_STORE_STORAGE_KEY, PAID_CHAT_OPEN, usePaymentStore } from "@/store/usePaymentStore";

const rpcMock = vi.hoisted(() => vi.fn());
const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: rpcMock,
    functions: {
      invoke: invokeMock,
    },
  },
}));

describe("usePaymentStore", () => {
  beforeEach(() => {
    window.localStorage.removeItem(PAYMENT_STORE_STORAGE_KEY);
    rpcMock.mockReset();
    invokeMock.mockReset();
    usePaymentStore.setState({
      activeOwnerKey: "owner:guest:test",
      activeProfileKey: null,
      remaining: 0,
      total: 2,
      quotaState: "idle",
      quotaError: null,
      syncedOwnerKey: null,
      isQuotaReady: false,
      isRefreshing: false,
      lastSyncedAt: null,
      nextFreeResetAt: null,
    });
  });

  it("loads server-authoritative quota for verified owner", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          owner_key: "owner:user:u1",
          free_used: 1,
          paid_remaining: 0,
          remaining: 1,
          total: 2,
          next_free_reset_at: "2026-03-27T12:00:00.000Z",
        },
      ],
      error: null,
    });

    usePaymentStore.getState().setActiveOwnerKey("owner:user:u1");
    await usePaymentStore.getState().refreshQuota();

    expect(rpcMock).toHaveBeenCalledWith("chat_credit_status", {
      p_owner_key: "owner:user:u1",
    });
    expect(usePaymentStore.getState().getRemainingQuestions()).toBe(1);
    expect(usePaymentStore.getState().hasValidPass()).toBe(true);
    expect(usePaymentStore.getState().quotaState).toBe("ready");
    expect(usePaymentStore.getState().syncedOwnerKey).toBe("owner:user:u1");
    expect(usePaymentStore.getState().nextFreeResetAt).toBe("2026-03-27T12:00:00.000Z");
  });

  it("does not call server quota API for guest owner", async () => {
    usePaymentStore.getState().setActiveOwnerKey("owner:guest:test");
    await usePaymentStore.getState().refreshQuota();

    expect(rpcMock).not.toHaveBeenCalled();
    expect(usePaymentStore.getState().getRemainingQuestions()).toBe(0);
    expect(usePaymentStore.getState().hasValidPass()).toBe(false);
    expect(usePaymentStore.getState().quotaState).toBe("ready");
    expect(usePaymentStore.getState().syncedOwnerKey).toBe("owner:guest:test");
  });

  it("falls back to chat-credit-status edge function when rpc fails", async () => {
    usePaymentStore.getState().setActiveOwnerKey("owner:user:new-user");
    rpcMock.mockRejectedValueOnce(new Error("rpc down"));
    invokeMock.mockResolvedValueOnce({
      data: {
        ok: true,
        quota: {
          ownerKey: "owner:user:new-user",
          freeUsed: 0,
          paidRemaining: 0,
          remaining: 2,
          total: 2,
          nextFreeResetAt: null,
        },
      },
      error: null,
    });

    await usePaymentStore.getState().refreshQuota();

    expect(invokeMock).toHaveBeenCalledWith("chat-credit-status", {
      body: { ownerKey: "owner:user:new-user" },
    });
    expect(usePaymentStore.getState().getRemainingQuestions()).toBe(2);
    expect(usePaymentStore.getState().hasValidPass()).toBe(true);
    expect(usePaymentStore.getState().quotaState).toBe("ready");
    expect(usePaymentStore.getState().syncedOwnerKey).toBe("owner:user:new-user");
  });

  it("sets error state when rpc and edge fallback both fail", async () => {
    usePaymentStore.setState({
      activeOwnerKey: "owner:user:u2",
      activeProfileKey: null,
      remaining: 1,
      total: 2,
      quotaState: "idle",
      quotaError: null,
      syncedOwnerKey: "owner:user:u2",
      isQuotaReady: false,
      isRefreshing: false,
      lastSyncedAt: null,
      nextFreeResetAt: "2026-03-27T12:00:00.000Z",
    });
    rpcMock.mockRejectedValueOnce(new Error("rpc down"));
    invokeMock.mockRejectedValueOnce(new Error("edge down"));

    await usePaymentStore.getState().refreshQuota();

    expect(usePaymentStore.getState().quotaState).toBe("error");
    expect(usePaymentStore.getState().isQuotaReady).toBe(false);
    expect(usePaymentStore.getState().syncedOwnerKey).toBeNull();
    expect(usePaymentStore.getState().hasValidPass()).toBe(false);
    expect(usePaymentStore.getState().getRemainingQuestions()).toBe(1);
  });

  it("applies bootstrap free quota when both lookups fail for unsynced owner", async () => {
    usePaymentStore.setState({
      activeOwnerKey: "owner:user:new-signup",
      activeProfileKey: null,
      remaining: 0,
      total: 2,
      quotaState: "loading",
      quotaError: null,
      syncedOwnerKey: null,
      isQuotaReady: false,
      isRefreshing: true,
      lastSyncedAt: null,
      nextFreeResetAt: null,
    });
    rpcMock.mockRejectedValueOnce(new Error("rpc down"));
    invokeMock.mockRejectedValueOnce(new Error("edge down"));

    await usePaymentStore.getState().refreshQuota();

    expect(usePaymentStore.getState().quotaState).toBe("ready");
    expect(usePaymentStore.getState().quotaError).toBeNull();
    expect(usePaymentStore.getState().isQuotaReady).toBe(true);
    expect(usePaymentStore.getState().syncedOwnerKey).toBe("owner:user:new-signup");
    expect(usePaymentStore.getState().getRemainingQuestions()).toBe(2);
  });

  it("resets quota state to loading on owner switch to avoid stale guest gate", () => {
    usePaymentStore.setState({
      activeOwnerKey: "owner:guest:test",
      activeProfileKey: null,
      remaining: 0,
      total: 2,
      quotaState: "ready",
      quotaError: null,
      syncedOwnerKey: "owner:guest:test",
      isQuotaReady: true,
      isRefreshing: false,
      lastSyncedAt: Date.now(),
      nextFreeResetAt: null,
    });

    usePaymentStore.getState().setActiveOwnerKey("owner:user:u3");

    expect(usePaymentStore.getState().activeOwnerKey).toBe("owner:user:u3");
    expect(usePaymentStore.getState().quotaState).toBe("loading");
    expect(usePaymentStore.getState().isQuotaReady).toBe(false);
    expect(usePaymentStore.getState().syncedOwnerKey).toBeNull();
    expect(usePaymentStore.getState().hasValidPass()).toBe(false);
  });

  it("updates quota from chat response payload", () => {
    usePaymentStore.setState({ activeOwnerKey: "owner:user:u4" });

    usePaymentStore.getState().setQuotaFromChatResponse({
      remaining: 1,
      total: 12,
      charged: true,
      nextFreeResetAt: "2026-03-27T12:00:00.000Z",
    });

    expect(usePaymentStore.getState().getRemainingQuestions()).toBe(1);
    expect(usePaymentStore.getState().hasValidPass()).toBe(true);
    expect(usePaymentStore.getState().total).toBe(12);
    expect(usePaymentStore.getState().quotaState).toBe("ready");
    expect(usePaymentStore.getState().syncedOwnerKey).toBe("owner:user:u4");
    expect(usePaymentStore.getState().nextFreeResetAt).toBe("2026-03-27T12:00:00.000Z");
  });

  it("decrements remaining when quota payload is missing", () => {
    usePaymentStore.setState({
      activeOwnerKey: "owner:user:u5",
      activeProfileKey: null,
      remaining: 2,
      total: 2,
      quotaState: "ready",
      quotaError: null,
      syncedOwnerKey: "owner:user:u5",
      isQuotaReady: true,
      isRefreshing: false,
      lastSyncedAt: null,
      nextFreeResetAt: "2026-03-27T12:00:00.000Z",
    });

    usePaymentStore.getState().consumeQuotaFallback();
    usePaymentStore.getState().consumeQuotaFallback();

    expect(usePaymentStore.getState().getRemainingQuestions()).toBe(0);
    expect(usePaymentStore.getState().nextFreeResetAt).toBe("2026-03-27T12:00:00.000Z");
  });

  it("keeps paid open gate enabled by default", () => {
    expect(PAID_CHAT_OPEN).toBe(true);
    expect(usePaymentStore.getState().purchaseDayPass()).toBe(false);
  });
});
