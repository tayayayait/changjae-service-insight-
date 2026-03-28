import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AstrologyPurchasedReportPage from "@/pages/astrology/AstrologyPurchasedReportPage";
import { buildFallbackAstrologyBirthReport, toAstrologyDeepData } from "@/lib/astrologyReport";

const invokeMock = vi.fn();
const getAstrologyBirthReportMock = vi.fn();
const reportViewSpy = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
  },
}));

vi.mock("@/lib/astrologyClient", () => ({
  getAstrologyBirthReport: (...args: unknown[]) => getAstrologyBirthReportMock(...args),
}));

vi.mock("@/components/layout/AnalysisPageShell", () => ({
  AnalysisPageShell: ({ children }: { children: unknown }) => (
    <div data-testid="mock-shell">{children}</div>
  ),
}));

vi.mock("@/components/astrology/AstrologyPrintButton", () => ({
  AstrologyPrintButton: () => <button data-testid="mock-print">print</button>,
}));

vi.mock("@/components/astrology/AstrologyReportView", () => ({
  AstrologyReportView: (props: unknown) => {
    reportViewSpy(props);
    return <div data-testid="mock-report-view">report-view</div>;
  },
}));

const fallbackReport = buildFallbackAstrologyBirthReport(toAstrologyDeepData({}), { birthTimeKnown: true }, null);

describe("AstrologyPurchasedReportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("generates local report using inputSnapshot", async () => {
    getAstrologyBirthReportMock.mockResolvedValueOnce(fallbackReport);

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/astrology/purchased/local-42",
            state: {
              buyerName: "테스터",
              buyerPhone: "01012345678",
              inputSnapshot: {
                name: "테스터",
                year: 1995,
                month: 6,
                day: 29,
                hour: 4,
                minute: 30,
                lat: 37.5665,
                lng: 126.978,
                timezone: "Asia/Seoul",
              },
              localReportStorageKey: "astrology-local-report:local-42",
            },
          },
        ]}
      >
        <Routes>
          <Route path="/astrology/purchased/:reportId" element={<AstrologyPurchasedReportPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("mock-report-view")).toBeInTheDocument();
    });

    expect(getAstrologyBirthReportMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).not.toHaveBeenCalled();

    const requestArg = getAstrologyBirthReportMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(requestArg.birthTimeKnown).toBe(true);
  });

  it("does not force birthTimeKnown=true when snapshot has no time", async () => {
    const inline = {
      ...fallbackReport,
      confidence: {
        ...fallbackReport.confidence,
        birthTimeKnown: false,
      },
      meta: {
        ...fallbackReport.meta,
        birthTimeKnown: false,
      },
    };

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/astrology/purchased/local-99",
            state: {
              inlineReportPayload: inline,
              inputSnapshot: {
                name: "무시각",
                year: 1992,
                month: 8,
                day: 3,
                lat: 37.5,
                lng: 127,
                timezone: "Asia/Seoul",
                birthTimeKnown: false,
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/astrology/purchased/:reportId" element={<AstrologyPurchasedReportPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("mock-report-view")).toBeInTheDocument();
    });

    const lastProps = reportViewSpy.mock.calls.at(-1)?.[0] as {
      record: { reportPayload: { confidence: { birthTimeKnown: boolean } } };
    };
    expect(lastProps.record.reportPayload.confidence.birthTimeKnown).toBe(false);
  });
});
