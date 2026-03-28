import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AstrologyPage from "@/pages/AstrologyPage";

const navigateMock = vi.fn();

let lastCheckoutProps: Record<string, unknown> | null = null;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: () => ({
    initialized: true,
  }),
}));

vi.mock("@/store/useConsultStore", () => ({
  useConsultStore: () => ({
    userProfile: {
      name: "유창재",
      year: 1995,
      month: 6,
      day: 29,
      hour: 4,
      minute: 30,
      lat: 37.5665,
      lng: 126.978,
      timezone: "Asia/Seoul",
    },
  }),
}));

vi.mock("@/components/layout/AnalysisPageShell", () => ({
  AnalysisPageShell: ({ children }: { children: unknown }) => (
    <div data-testid="mock-shell">{children}</div>
  ),
}));

vi.mock("@/components/common/ServiceIntroScreen", () => ({
  ServiceIntroScreen: () => <div data-testid="mock-intro" />,
}));

vi.mock("@/components/astrology/AstrologyInput", () => ({
  AstrologyInput: () => <div data-testid="mock-input" />,
}));

vi.mock("@/components/common/PaymentCheckoutSheet", () => ({
  PaymentCheckoutSheet: (props: Record<string, unknown>) => {
    lastCheckoutProps = props;
    return (
      <button
        data-testid="mock-complete-payment"
        onClick={() =>
          (props.onSuccess as (value: unknown) => void)({
            orderNumber: "ASSUME-001",
            reportId: "local-001",
            paymentResult: {
              success: true,
              merchant_uid: "ASSUME-001",
              imp_uid: "mock_ASSUME-001",
            },
            buyerInfo: {
              name: "유창재",
              phone: "01012345678",
              email: "user@example.com",
            },
            ownerKey: "owner:phone:mock",
          })
        }
      >
        complete
      </button>
    );
  },
}));

describe("Astrology checkout flow", () => {
  it("navigates immediately to purchased page in local QA mode", async () => {
    render(
      <MemoryRouter>
        <AstrologyPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("mock-complete-payment"));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(
        "/astrology/purchased/local-001",
        expect.objectContaining({
          state: expect.objectContaining({
            buyerName: "유창재",
            buyerPhone: "01012345678",
            buyerEmail: "user@example.com",
            localPreview: true,
            localReportStorageKey: "astrology-local-report:local-001",
            inputSnapshot: expect.objectContaining({
              name: "유창재",
              year: 1995,
              month: 6,
              day: 29,
            }),
          }),
        }),
      );
    });

    const state = (navigateMock.mock.calls[0]?.[1] as { state?: Record<string, unknown> } | undefined)?.state ?? {};
    expect(state.inlineReportPayload).toBeUndefined();
    expect(lastCheckoutProps?.assumePaid).toBe(true);
  });
});
