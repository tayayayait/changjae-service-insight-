import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import FortunePersonalPage from "@/pages/fortune/FortunePersonalPage";

const mockFns = vi.hoisted(() => ({
  getLatestSajuResult: vi.fn(),
  getDailyFortune: vi.fn(),
}));

vi.mock("@/lib/resultStore", () => ({
  buildFortuneResult: vi.fn((_: string, __: string, fortune: unknown) => fortune),
  ensureGuestSessionId: vi.fn(() => "guest-1"),
  getLatestSajuResult: mockFns.getLatestSajuResult,
  saveFortuneResult: vi.fn(),
}));

vi.mock("@/lib/geminiClient", () => ({
  getDailyFortune: mockFns.getDailyFortune,
}));

describe("FortunePersonalPage", () => {
  it("shows empty state when base saju data does not exist and skips daily fortune call", async () => {
    mockFns.getLatestSajuResult.mockResolvedValueOnce(null);

    render(
      <MemoryRouter initialEntries={["/fortune/personal"]}>
        <FortunePersonalPage />
      </MemoryRouter>,
    );

    await screen.findByText("기준 사주 데이터가 없습니다");

    await waitFor(() => {
      expect(mockFns.getDailyFortune).not.toHaveBeenCalled();
    });
  });
});
