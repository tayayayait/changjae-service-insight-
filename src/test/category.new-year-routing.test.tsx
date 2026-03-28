import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import CategoryPage from "@/pages/CategoryPage";

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

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

Object.defineProperty(window, "scrollTo", {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

describe("CategoryPage new-year 7-tile routing", () => {
  it("renders seven distinct /service entry links instead of routing back to lifetime tab", () => {
    render(
      <MemoryRouter initialEntries={["/category/saju?tab=new-year"]}>
        <Routes>
          <Route path="/category/:categoryId" element={<CategoryPage />} />
        </Routes>
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

    const routeHrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => Boolean(href))
      .filter((href) => href.startsWith("/service/"));

    expect(routeHrefs).toHaveLength(expectedRoutes.length);
    expect(new Set(routeHrefs)).toEqual(new Set(expectedRoutes));
    expect(routeHrefs).not.toContain("/category/saju?tab=lifetime");
  });
});
