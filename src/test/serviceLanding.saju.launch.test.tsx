import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ServiceLandingPage from "@/pages/ServiceLandingPage";

function SajuLaunchProbe() {
  const location = useLocation();

  return (
    <div data-testid="saju-launch-state">
      {JSON.stringify({
        pathname: location.pathname,
        search: location.search,
        state: location.state,
      })}
    </div>
  );
}

describe("ServiceLandingPage saju launch handoff", () => {
  it("shows a business-only notice on the wealth-business intro", () => {
    render(
      <MemoryRouter initialEntries={["/service/saju-2026-wealth-business"]}>
        <Routes>
          <Route path="/service/:serviceId" element={<ServiceLandingPage />} />
          <Route path="/saju" element={<SajuLaunchProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("2026 사업자 재물/사업운")).toBeInTheDocument();
    expect(screen.getByText("사업자 전용")).toBeInTheDocument();
    expect(screen.getByText(/직접 매출, 비용, 운영 책임을 지는 사용자/i)).toBeInTheDocument();
  });

  it("passes the love preset interests into the saju input flow", async () => {
    render(
      <MemoryRouter initialEntries={["/service/saju-love-focus"]}>
        <Routes>
          <Route path="/service/:serviceId" element={<ServiceLandingPage />} />
          <Route path="/saju" element={<SajuLaunchProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /분석 시작하기/i }));

    await waitFor(() => {
      expect(screen.getByTestId("saju-launch-state")).toHaveTextContent('"initialInterests":["love"]');
      expect(screen.getByTestId("saju-launch-state")).toHaveTextContent('"search":"?mode=new-year-2026&focus=love"');
    });
  });
});
