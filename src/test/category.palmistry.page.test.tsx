import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import CategoryPage from "@/pages/CategoryPage";

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

describe("CategoryPage palmistry IA", () => {
  it("shows one primary palm card and one secondary timing link", async () => {
    render(
      <MemoryRouter initialEntries={["/category/palmistry?tab=palm"]}>
        <Routes>
          <Route path="/category/:categoryId" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("AI 손금 메인 리포트")).toBeInTheDocument();
    expect(screen.getByText("총 1개")).toBeInTheDocument();
    expect(screen.queryByText("손금 재물운 집중 분석")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "변화시기 심화 리포트 보기" })).toBeInTheDocument();
  });
});
