import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CosmicCalendarPage from "@/pages/CosmicCalendarPage";

const mockFns = vi.hoisted(() => ({
  getAstrologyAICalendar: vi.fn(),
}));

vi.mock("@/lib/astrologyClient", () => ({
  getAstrologyAICalendar: mockFns.getAstrologyAICalendar,
}));

describe("CosmicCalendarPage", () => {
  it("renders structured monthly report sections", async () => {
    mockFns.getAstrologyAICalendar.mockResolvedValueOnce({
      success: true,
      year: 2026,
      month: 3,
      summary: {
        headline: "3월 핵심 리듬은 집중과 검증입니다.",
        focus: "한 번에 하나씩 완료하세요.",
        caution: "후반부엔 속도보다 확인이 필요합니다.",
      },
      highlights: [
        { title: "집중 구간", score: 80, note: "중순 실행력이 좋습니다." },
        { title: "주의 구간", score: 43, note: "후반부 과부하를 피하세요." },
        { title: "관계 흐름", score: 69, note: "확인 대화가 중요합니다." },
        { title: "일/재정 흐름", score: 67, note: "누수 차단이 핵심입니다." },
      ],
      events: [
        {
          date: "2026-03-05",
          title: "실행 드라이브",
          impact: "high",
          meaning: "밀린 과제를 처리하기 좋습니다.",
          action: "핵심 과제 1개에 집중하세요.",
        },
      ],
      chapters: [
        {
          id: "career",
          title: "일/커리어",
          interpretation: "단일 목표 집중이 유리합니다.",
          actionGuide: ["KPI 1개 고정"],
        },
        {
          id: "relationship",
          title: "관계",
          interpretation: "오해를 줄이는 확인 질문이 필요합니다.",
          actionGuide: ["대화 전 의도 확인"],
        },
        {
          id: "energy",
          title: "감정/컨디션",
          interpretation: "중반 이후 피로 관리가 필요합니다.",
          actionGuide: ["일정 1개 제거"],
        },
        {
          id: "money",
          title: "재정/소비",
          interpretation: "확장보다 누수 차단이 먼저입니다.",
          actionGuide: ["고정비 점검"],
        },
      ],
      checklist: {
        do: ["핵심 목표 1개 유지"],
        dont: ["동시 다중 확장 금지"],
      },
      deepData: {
        sourceNotes: ["test note"],
      },
    });

    render(<CosmicCalendarPage />);

    await screen.findByText("3월 핵심 리듬은 집중과 검증입니다.");
    expect(screen.getByText("날짜별 이벤트")).toBeInTheDocument();
    expect(screen.getByText("행동 체크리스트")).toBeInTheDocument();
    expect(screen.getByText("심화 데이터")).toBeInTheDocument();
  });
});
