import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DailyAstrologyPage from "@/pages/DailyAstrologyPage";

const getSunSignHoroscopeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/astrologyClient", () => ({
  getSunSignHoroscope: getSunSignHoroscopeMock,
}));

describe("DailyAstrologyPage", () => {
  beforeEach(() => {
    getSunSignHoroscopeMock.mockReset();
  });

  it("loads and renders horoscope after selecting a sign", async () => {
    getSunSignHoroscopeMock.mockResolvedValueOnce({
      success: true,
      data: {
        sign: "Cancer",
        horoscope: [
          "### 게자리 오늘의 흐름",
          "오늘은 차분하게 우선순위를 정리하세요.",
          "",
          "### 오늘 한 줄 결론",
          "핵심 작업 1개를 끝내는 데 집중하세요.",
          "",
          "### 지금 할 일 1개",
          "완료 기준 한 문장을 적고 바로 시작하세요.",
          "",
          "### 오늘 피할 일 1개",
          "신규 작업을 동시에 늘리지 마세요.",
          "",
          "### 집중 시간대",
          "오후 16:00~18:00",
          "",
          "### 관계 한 문장",
          "결론 전에 상대 의도를 한 번 확인하세요.",
          "",
          "### 컨디션 한 문장",
          "짧은 회복 루틴을 미리 캘린더에 넣으세요.",
          "",
          "### 럭키 포인트",
          "- 행운 컬러: 스카이 블루",
          "- 행운 키워드: 우선순위 정리",
        ].join("\n"),
      },
    });

    render(<DailyAstrologyPage />);

    fireEvent.click(screen.getByRole("button", { name: /게자리/i }));

    await screen.findByText("오늘 한 줄 결론");
    expect(screen.getByText("핵심 작업 1개를 끝내는 데 집중하세요.")).toBeInTheDocument();
    expect(screen.getByText("오늘 바로 실행")).toBeInTheDocument();
    expect(screen.getByText("오늘 바로 활용 정보")).toBeInTheDocument();
    expect(screen.getByText("행운 컬러 스카이 블루")).toBeInTheDocument();
    expect(getSunSignHoroscopeMock).toHaveBeenCalledWith("Cancer");
  });

  it("shows error state with retry and recovers on second attempt", async () => {
    getSunSignHoroscopeMock.mockRejectedValueOnce(new Error("응답이 지연되고 있습니다."));
    getSunSignHoroscopeMock.mockResolvedValueOnce({
      success: true,
      data: {
        sign: "Cancer",
        horoscope: "재시도 성공",
      },
    });

    render(<DailyAstrologyPage />);

    fireEvent.click(screen.getByRole("button", { name: /게자리/i }));

    await screen.findByText(/운세 조회 실패/);
    expect(screen.getByText("응답이 지연되고 있습니다.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    await screen.findByText("재시도 성공");
    expect(getSunSignHoroscopeMock).toHaveBeenCalledTimes(2);
  });

  it("renders fallback result with notice instead of error card", async () => {
    getSunSignHoroscopeMock.mockResolvedValueOnce({
      success: true,
      data: {
        sign: "Cancer",
        horoscope: [
          "### 게자리 오늘의 흐름",
          "지연 상황에서 보정된 운세입니다.",
          "",
          "### 오늘 한 줄 결론",
          "핵심 한 가지를 끝까지 진행하세요.",
        ].join("\n"),
      },
      meta: {
        source: "client_fallback",
        reason: "client_timeout",
      },
    });

    render(<DailyAstrologyPage />);

    fireEvent.click(screen.getByRole("button", { name: /게자리/i }));

    await screen.findByText("실시간 응답 지연으로 보정 리포트를 표시 중입니다.");
    expect(screen.getByText("핵심 한 가지를 끝까지 진행하세요.")).toBeInTheDocument();
    expect(screen.queryByText(/운세 조회 실패/)).not.toBeInTheDocument();
  });
});
