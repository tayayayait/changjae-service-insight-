import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { FortuneSpecialGrid } from "@/components/fortune/FortuneSpecialGrid";

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});

describe("FortuneSpecialGrid", () => {
  it("routes each 2026 new-year tile to a distinct service entry screen", () => {
    render(
      <MemoryRouter>
        <FortuneSpecialGrid />
      </MemoryRouter>,
    );

    const expectedRoutes = [
      "/service/saju-2026-overview",
      "/service/saju-2026-study-exam",
      "/service/saju-love-focus",
      "/service/saju-2026-wealth-business",
      "/service/saju-2026-investment-assets",
      "/service/saju-2026-career-aptitude",
      "/service/saju-2026-health-balance",
    ];

    const renderedRoutes = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => Boolean(href));

    expect(renderedRoutes).toHaveLength(expectedRoutes.length);
    expect(new Set(renderedRoutes)).toEqual(new Set(expectedRoutes));
    expect(renderedRoutes).not.toContain("/category/saju?tab=lifetime");
    expect(screen.getByText("사업자 재물/사업운")).toBeInTheDocument();
  });
});
