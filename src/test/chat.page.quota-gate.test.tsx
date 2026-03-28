import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatPage } from "@/pages/ChatPage";

const mocks = vi.hoisted(() => ({
  chatAccess: {
    remaining: 2,
    isRefreshing: false,
    quotaState: "ready",
    quotaError: null,
    syncedOwnerKey: "owner:user:u1",
    refreshQuota: vi.fn().mockResolvedValue(undefined),
    isPaidChatOpen: true,
    isProfileReadyForChat: true,
  },
  chatStore: {
    isLoading: false,
    sajuContext: { palja: { day: { gan: "갑", ji: "자" } } },
  },
  authStore: {
    user: { id: "u1" },
    signOut: vi.fn().mockResolvedValue(undefined),
    setLoginModalOpen: vi.fn(),
  },
  paymentStoreState: {
    remaining: 0,
    total: 2,
    quotaState: "ready",
    syncedOwnerKey: "owner:user:u1",
    setQuotaFromChatResponse: vi.fn((quota: { remaining: number; total: number }) => {
      mocks.chatAccess.remaining = quota.remaining;
      mocks.chatAccess.quotaState = "ready";
      mocks.chatAccess.syncedOwnerKey = "owner:user:u1";
      mocks.paymentStoreState.remaining = quota.remaining;
      mocks.paymentStoreState.total = quota.total;
    }),
  },
}));

vi.mock("@/hooks/chat/useChatAccess", () => ({
  useChatAccess: () => mocks.chatAccess,
}));

vi.mock("@/store/useChatStore", () => ({
  useChatStore: (selector: (state: typeof mocks.chatStore) => unknown) => selector(mocks.chatStore),
}));

vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: (selector: (state: typeof mocks.authStore) => unknown) => selector(mocks.authStore),
}));

vi.mock("@/store/usePaymentStore", () => ({
  usePaymentStore: {
    getState: () => mocks.paymentStoreState,
  },
}));

vi.mock("@/hooks/useBeforeUnload", () => ({
  useBeforeUnload: vi.fn(),
}));

vi.mock("@/lib/ownerIdentity", () => ({
  buildOwnerKeyFromUserId: (id: string | null | undefined) => (id ? `owner:user:${id}` : null),
  getDefaultOwnerKey: () => "owner:guest:test-session",
}));

vi.mock("@/components/chat/ChatSessionToolbar", () => ({
  ChatSessionToolbar: () => <div>toolbar</div>,
}));

vi.mock("@/components/chat/ChatMessageList", () => ({
  ChatMessageList: () => <div>messages</div>,
}));

vi.mock("@/components/chat/ChatInput", () => ({
  ChatInput: () => <div>input</div>,
}));

vi.mock("@/components/chat/SajuContextBanner", () => ({
  SajuContextBanner: () => <div>banner</div>,
}));

vi.mock("@/components/common/ServiceIntroScreen", () => ({
  ServiceIntroScreen: ({ ctaText }: { ctaText: string }) => <div data-testid="service-intro">{ctaText}</div>,
}));

vi.mock("@/components/common/PaymentCheckoutSheet", () => ({
  PaymentCheckoutSheet: ({
    isOpen,
    onSuccess,
  }: {
    isOpen: boolean;
    onSuccess: (payload: {
      orderNumber: string;
      reportId: string;
      paymentResult: Record<string, unknown>;
      buyerInfo: { name: string; phone: string; email: string };
      ownerKey: string;
      chatCredit?: {
        applied: boolean;
        remaining: number;
        total: number;
        nextFreeResetAt: string | null;
      };
    }) => Promise<void> | void;
  }) =>
    isOpen ? (
      <div data-testid="checkout-open">
        checkout-open
        <button
          type="button"
          onClick={() =>
            onSuccess({
              orderNumber: "ORDER-CHAT-1",
              reportId: "report-chat-1",
              paymentResult: { txId: "tx-chat-1" },
              buyerInfo: { name: "홍길동", phone: "01012345678", email: "hong@example.com" },
              ownerKey: "owner:user:u1",
              chatCredit: {
                applied: true,
                remaining: 10,
                total: 12,
                nextFreeResetAt: "2026-03-28T00:00:00.000Z",
              },
            })
          }
        >
          simulate-success
        </button>
      </div>
    ) : null,
}));

describe("ChatPage quota gate", () => {
  beforeEach(() => {
    mocks.chatAccess.refreshQuota.mockClear();
    mocks.chatAccess.remaining = 2;
    mocks.chatAccess.isRefreshing = false;
    mocks.chatAccess.quotaState = "ready";
    mocks.chatAccess.quotaError = null;
    mocks.chatAccess.syncedOwnerKey = "owner:user:u1";
    mocks.chatAccess.isPaidChatOpen = true;
    mocks.chatAccess.isProfileReadyForChat = true;
    mocks.chatStore.sajuContext = { palja: { day: { gan: "갑", ji: "자" } } };
    mocks.authStore.user = { id: "u1" };
    mocks.authStore.signOut.mockClear();
    mocks.authStore.setLoginModalOpen.mockClear();
    mocks.paymentStoreState.remaining = 0;
    mocks.paymentStoreState.total = 2;
    mocks.paymentStoreState.quotaState = "ready";
    mocks.paymentStoreState.syncedOwnerKey = "owner:user:u1";
    mocks.paymentStoreState.setQuotaFromChatResponse.mockClear();
  });

  it("keeps chat open when ready and remaining is positive", () => {
    render(
      <MemoryRouter initialEntries={["/chat"]}>
        <ChatPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText("결제창 다시 열기")).not.toBeInTheDocument();
    expect(screen.queryByTestId("checkout-open")).not.toBeInTheDocument();
  });

  it("auto-opens checkout when remaining is zero and hides intro while checkout is open", async () => {
    mocks.chatAccess.remaining = 0;
    mocks.chatAccess.quotaState = "ready";
    mocks.chatAccess.syncedOwnerKey = "owner:user:u1";

    render(
      <MemoryRouter initialEntries={["/chat"]}>
        <ChatPage />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId("checkout-open")).toBeInTheDocument();
    expect(screen.queryByTestId("service-intro")).not.toBeInTheDocument();
  });

  it("applies webhook chatCredit immediately and runs background quota refresh after checkout success", async () => {
    mocks.chatAccess.remaining = 0;
    mocks.chatAccess.quotaState = "ready";
    mocks.chatAccess.syncedOwnerKey = "owner:user:u1";

    render(
      <MemoryRouter initialEntries={["/chat"]}>
        <ChatPage />
      </MemoryRouter>,
    );

    const checkout = await screen.findByTestId("checkout-open");
    expect(checkout).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "simulate-success" }));

    await waitFor(() => {
      expect(mocks.paymentStoreState.setQuotaFromChatResponse).toHaveBeenCalledWith({
        remaining: 10,
        total: 12,
        charged: true,
        nextFreeResetAt: "2026-03-28T00:00:00.000Z",
      });
    });

    await waitFor(() => {
      expect(mocks.chatAccess.refreshQuota).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByTestId("checkout-open")).not.toBeInTheDocument();
    });
  });

  it("keeps logout available while checkout is open", async () => {
    mocks.chatAccess.remaining = 0;
    mocks.chatAccess.quotaState = "ready";
    mocks.chatAccess.syncedOwnerKey = "owner:user:u1";

    render(
      <MemoryRouter initialEntries={["/chat"]}>
        <ChatPage />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId("checkout-open")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "chat-overlay-logout" }));

    await waitFor(() => {
      expect(mocks.authStore.signOut).toHaveBeenCalledTimes(1);
    });

    expect(mocks.authStore.setLoginModalOpen).toHaveBeenCalledWith(true);
  });

  it("does not show payment gate when synced owner is stale", () => {
    mocks.chatAccess.remaining = 0;
    mocks.chatAccess.quotaState = "ready";
    mocks.chatAccess.syncedOwnerKey = "owner:guest:stale";

    render(
      <MemoryRouter initialEntries={["/chat"]}>
        <ChatPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText("결제창 다시 열기")).not.toBeInTheDocument();
  });

  it("shows retry gate instead of payment when quota lookup is in error", () => {
    mocks.chatAccess.quotaState = "error";
    mocks.chatAccess.quotaError = "lookup failed";

    render(
      <MemoryRouter initialEntries={["/chat"]}>
        <ChatPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("무료 사용 횟수 확인에 실패했습니다.")).toBeInTheDocument();
    expect(screen.queryByText("결제창 다시 열기")).not.toBeInTheDocument();
  });
});
