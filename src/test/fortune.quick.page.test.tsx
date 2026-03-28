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
      summary: "띠별 운세",
      details: "오늘은 흐름이 안정적입니다.",
      luckyColor: "남색",
      luckyItem: "메모장",
      sourceKind: "zodiac",
    });

    mockFns.getStarSignFortune.mockResolvedValueOnce({
      period: "today",
      score: 74,
      summary: "별자리 운세",
      details: "별자리 흐름이 부드럽게 이어집니다.",
      luckyColor: "초록",
      luckyItem: "노트북",
      sourceKind: "starSign",
    });

    render(
      <MemoryRouter initialEntries={["/fortune/quick?period=today"]}>
        <FortuneQuickPage />
      </MemoryRouter>,
    );

    await screen.findByText("띠별 운세");
    await screen.findByText("별자리 운세");

    expect(mockFns.getZodiacFortune).toHaveBeenCalledTimes(1);
    expect(mockFns.getStarSignFortune).toHaveBeenCalledTimes(1);
  });
});
