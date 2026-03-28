import { fireEvent, render, screen } from "@testing-library/react";
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

const hasLinkWithHref = (href: string) =>
  screen
    .getAllByRole("link")
    .some((link) => link.getAttribute("href") === href);

describe("CategoryPage love card visibility", () => {
  it("recovers invalid tab query and exposes the 3 core love service cards", () => {
    render(
      <MemoryRouter initialEntries={["/category/love?tab=lifetime"]}>
        <Routes>
          <Route path="/category/:categoryId" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "미래 배우자" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "커플 궁합" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "재회 가능성" })).toBeInTheDocument();

    expect(hasLinkWithHref("/service/love-future-partner")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "커플 궁합" }));
    expect(hasLinkWithHref("/service/love-couple-report")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "재회 가능성" }));
    expect(hasLinkWithHref("/service/love-crush-reunion")).toBe(true);
  });
});

