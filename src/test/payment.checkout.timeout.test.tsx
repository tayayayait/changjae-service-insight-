import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentCheckoutSheet } from "@/components/common/PaymentCheckoutSheet";

const invokeMock = vi.fn();
const setOwnerFromVerifiedContactMock = vi.fn();
const requestPaymentMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
  },
}));

vi.mock("@/lib/portone", () => ({
  requestPayment: (...args: unknown[]) => requestPaymentMock(...args),
}));

vi.mock("@/store/useOwnerStore", () => ({
  useOwnerStore: (
    selector: (state: {
      activeOwnerKey: string;
      setOwnerFromVerifiedContact: typeof setOwnerFromVerifiedContactMock;
    }) => unknown,
  ) =>
    selector({
      activeOwnerKey: "owner:guest:test",
      setOwnerFromVerifiedContact: setOwnerFromVerifiedContactMock,
    }),
}));

describe("PaymentCheckoutSheet timeout guard", () => {
  const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    setOwnerFromVerifiedContactMock.mockResolvedValue("owner:phone:hash");
    requestPaymentMock.mockResolvedValue({
      success: true,
      merchant_uid: "ORDER-001",
      imp_uid: "imp-001",
    });
  });

  it("shows timeout error and releases loading state when create-order stalls", async () => {
    invokeMock.mockRejectedValueOnce(
      new Error("주문 생성 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요."),
    );

    render(
      <PaymentCheckoutSheet
        isOpen
        onClose={() => {}}
        onSuccess={async () => {}}
        serviceId="astro-natal-report-v2"
        serviceType="astro"
        serviceName="Natal Chart Full Report"
        amount={2000}
        assumePaid={false}
      />,
    );

    const nameInput = document.getElementById("buyer-name");
    const phoneInput = document.getElementById("buyer-phone");
    const emailInput = document.getElementById("buyer-email");
    if (!nameInput || !phoneInput || !emailInput) {
      throw new Error("Payment form inputs are missing");
    }

    fireEvent.change(nameInput, { target: { value: "홍길동" } });
    fireEvent.change(phoneInput, { target: { value: "01012345678" } });
    fireEvent.change(emailInput, { target: { value: "hong@example.com" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /결제/ }));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalled();
    });

    const firstMessage = String(alertMock.mock.calls[0]?.[0] ?? "");
    expect(firstMessage.length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /결제하기/ })).not.toBeDisabled();
    });

    expect(requestPaymentMock).not.toHaveBeenCalled();
  });

  it("prefers ownerKeyOverride over contact-based owner resolution", async () => {
    const onSuccessMock = vi.fn(async () => {});
    invokeMock
      .mockResolvedValueOnce({
        data: { ok: true, orderNumber: "ORDER-001", reportId: "report-001" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { ok: true },
        error: null,
      });

    render(
      <PaymentCheckoutSheet
        isOpen
        onClose={() => {}}
        onSuccess={onSuccessMock}
        serviceId="saju-ai-chat"
        serviceType="saju"
        serviceName="AI 사주 상담 10회권"
        amount={2000}
        assumePaid={false}
        ownerKeyOverride="owner:user:fixed"
      />,
    );

    const nameInput = document.getElementById("buyer-name");
    const phoneInput = document.getElementById("buyer-phone");
    const emailInput = document.getElementById("buyer-email");
    if (!nameInput || !phoneInput || !emailInput) {
      throw new Error("Payment form inputs are missing");
    }

    fireEvent.change(nameInput, { target: { value: "홍길동" } });
    fireEvent.change(phoneInput, { target: { value: "01012345678" } });
    fireEvent.change(emailInput, { target: { value: "hong@example.com" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "결제하기" }));

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalled();
    });

    expect(setOwnerFromVerifiedContactMock).not.toHaveBeenCalled();
    expect(invokeMock).toHaveBeenCalledWith(
      "create-order",
      expect.objectContaining({
        body: expect.objectContaining({
          ownerKey: "owner:user:fixed",
        }),
      }),
    );
  });

  it("forwards webhook chatCredit payload to onSuccess callback", async () => {
    const onSuccessMock = vi.fn(async () => {});
    invokeMock
      .mockResolvedValueOnce({
        data: { ok: true, orderNumber: "ORDER-002", reportId: "report-002" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          ok: true,
          chatCredit: {
            applied: true,
            remaining: 10,
            total: 12,
            nextFreeResetAt: "2026-03-28T00:00:00.000Z",
          },
        },
        error: null,
      });

    render(
      <PaymentCheckoutSheet
        isOpen
        onClose={() => {}}
        onSuccess={onSuccessMock}
        serviceId="saju-ai-chat"
        serviceType="saju"
        serviceName="AI 사주 상담 10회권"
        amount={2000}
        assumePaid={false}
        ownerKeyOverride="owner:user:fixed"
      />,
    );

    const nameInput = document.getElementById("buyer-name");
    const phoneInput = document.getElementById("buyer-phone");
    const emailInput = document.getElementById("buyer-email");
    if (!nameInput || !phoneInput || !emailInput) {
      throw new Error("Payment form inputs are missing");
    }

    fireEvent.change(nameInput, { target: { value: "홍길동" } });
    fireEvent.change(phoneInput, { target: { value: "01012345678" } });
    fireEvent.change(emailInput, { target: { value: "hong@example.com" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "결제하기" }));

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNumber: "ORDER-002",
          chatCredit: {
            applied: true,
            remaining: 10,
            total: 12,
            nextFreeResetAt: "2026-03-28T00:00:00.000Z",
          },
        }),
      );
    });
  });
});
