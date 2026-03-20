import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import FortuneQuickPage from "@/pages/fortune/FortuneQuickPage";

const mockFns = vi.hoisted(() => ({
  getZodiacFortune: vi.fn(),
  getStarSignFortune: vi.fn(),
}));

vi.mock("@/lib/geminiClient", () => ({
  getZodiacFortune: mockFns.getZodiacFortune,
  getStarSignFortune: mockFns.getStarSignFortune,
}));

describe("FortuneQuickPage", () => {
  it("loads zodiac and star-sign fortune cards independently", async () => {
    mockFns.getZodiacFortune.mockResolvedValueOnce({
      period: "today",
      score: 78,
      summary: "띠 요약",
      details: "띠 세부 설명",
      luckyColor: "파랑",
      luckyItem: "노트",
      sourceKind: "zodiac",
    });

    mockFns.getStarSignFortune.mockResolvedValueOnce({
      period: "today",
      score: 74,
      summary: "별자리 요약",
      details: "별자리 세부 설명",
      luckyColor: "초록",
      luckyItem: "펜",
      sourceKind: "starSign",
    });

    render(
      <MemoryRouter initialEntries={["/fortune/quick?period=today"]}>
        <FortuneQuickPage />
      </MemoryRouter>,
    );

    await screen.findByText("띠 요약");
    await screen.findByText("별자리 요약");

    expect(mockFns.getZodiacFortune).toHaveBeenCalledTimes(1);
    expect(mockFns.getStarSignFortune).toHaveBeenCalledTimes(1);
  });
});
