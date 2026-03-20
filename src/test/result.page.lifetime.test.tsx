import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ResultPage from "@/pages/ResultPage";
import type { SajuResult } from "@/types/result";

const loadLatestResult = vi.fn();
const loadResultById = vi.fn();

const sampleResult: SajuResult = {
  id: "result-1",
  consultationType: "saju-lifetime-roadmap",
  profileData: {
    calendarType: "solar",
    year: 1995,
    month: 6,
    day: 29,
    birthPrecision: "exact",
    hour: 4,
    minute: 30,
    location: "서울",
    gender: "male",
  },
  palja: {
    year: { gan: "을", ji: "해", ohengGan: "목", ohengJi: "수" },
    month: { gan: "임", ji: "오", ohengGan: "수", ohengJi: "화" },
    day: { gan: "신", ji: "묘", ohengGan: "금", ohengJi: "목" },
    time: { gan: "경", ji: "인", ohengGan: "금", ohengJi: "목" },
  },
  oheng: [
    { element: "목", count: 3, percentage: 38 },
    { element: "화", count: 1, percentage: 13 },
    { element: "토", count: 0, percentage: 0 },
    { element: "금", count: 2, percentage: 25 },
    { element: "수", count: 2, percentage: 25 },
  ],
  interests: ["career"],
  summary: "요약",
  sections: [{ title: "기본", interpretation: "해석", advice: "조언" }],
  lifetimeScore: 91,
  daeunPeriods: [
    {
      startAge: 35,
      endAge: 44,
      startYear: 2029,
      endYear: 2038,
      gan: "정",
      ji: "묘",
      oheng: "목",
      score: 93,
      keyword: "풍요로운 수확",
      isCurrent: false,
    },
  ],
  goldenPeriods: [{ startAge: 35, endAge: 44, startYear: 2029, endYear: 2038, reason: "핵심 상승 구간" }],
  personalityType: {
    title: "전략형",
    description: "설명",
    strengths: ["집중력"],
    weaknesses: ["완고함"],
  },
};

vi.mock("@/store/useResultStore", () => ({
  useResultStore: () => ({
    currentResult: sampleResult,
    loadLatestResult,
    loadResultById,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/lib/share", () => ({
  copyResultUrl: vi.fn(async () => "https://example.com"),
  downloadShareCard: vi.fn(async () => undefined),
  tryNativeShare: vi.fn(async () => true),
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

describe("ResultPage lifetime rendering", () => {
  it("renders stored daeun/golden periods without synthetic year calculation", async () => {
    render(
      <MemoryRouter initialEntries={["/result/result-1"]}>
        <Routes>
          <Route path="/result/:resultId" element={<ResultPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect((await screen.findAllByText("인생 총운 리포트")).length).toBeGreaterThan(0);
    expect(screen.getByText("인생 총점")).toBeInTheDocument();
    expect(screen.getByText("91점")).toBeInTheDocument();
    expect(screen.getByText("2029년 ~ 2038년")).toBeInTheDocument();
    expect(screen.getByText("핵심 상승 구간")).toBeInTheDocument();
    expect(screen.getByText("35~44세")).toBeInTheDocument();
    expect(screen.queryByText("2009년")).not.toBeInTheDocument();
  });
});
