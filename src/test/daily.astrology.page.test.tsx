import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DailyAstrologyPage from "@/pages/DailyAstrologyPage";
import { useAuthStore } from "@/store/useAuthStore";

const getSunSignHoroscopeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/astrologyClient", () => ({
  getSunSignHoroscope: getSunSignHoroscopeMock,
}));

describe("DailyAstrologyPage", () => {
  beforeEach(() => {
    getSunSignHoroscopeMock.mockReset();
    useAuthStore.setState({ profile: null });
  });

  it("renders realtime horoscope with sign_context provenance", async () => {
    getSunSignHoroscopeMock.mockResolvedValueOnce({
      success: true,
      data: {
        sign: "Cancer",
        horoscope: [
          "### 게자리 오늘의 흐름",
          "계획을 꼼꼼하게 세우고 실행은 빠르게 가져가세요.",
          "",
          "### 오늘 한 줄 결론",
          "핵심 목표 1개를 먼저 붙잡고 마무리는 꼼꼼하게 챙기세요.",
          "",
          "### 오늘 즉시 실행 체크리스트",
          "가장 중요한 3가지 목록을 적고 바로 시작하세요.",
          "",
          "### 관계 한 문장",
          "감정 반응 즉시 메시지 전송은 피하고 확인 질문을 먼저 하세요.",
          "",
          "### 집중 시간대",
          "오전 09:00~11:00",
          "",
          "### 관계 조언 문장",
          "사소한 충돌이 보여도 먼저 의도를 확인하고 차분히 질문하세요.",
          "",
          "### 컨디션 조언 문장",
          "불필요한 소모를 줄이고 짧은 휴식 루틴을 먼저 배치하세요.",
        ].join("\n"),
      },
      meta: {
        source: "proxy",
        basis: "sign_context",
        requestDate: "2026-03-21",
      },
    });

    render(<DailyAstrologyPage />);

    fireEvent.click(screen.getAllByRole("button")[0]);

    await screen.findByText("Today Quick Brief");
    expect(screen.getByText("핵심 목표 1개를 먼저 붙잡고 마무리는 꼼꼼하게 챙기세요.")).toBeInTheDocument();
    expect(screen.getByText("오전 9:00~11:00")).toBeInTheDocument();
    expect(screen.getByText(/CircularNatalHoroscopeJS/)).toBeInTheDocument();
    expect(screen.getByText(/보정/)).toBeInTheDocument();
    expect(screen.queryByText(/보정 리포트는 제공하지 않습니다/)).not.toBeInTheDocument();

    expect(getSunSignHoroscopeMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        requestDate: expect.any(String),
      }),
    );
  });

  it("shows error state and recovers on retry", async () => {
    getSunSignHoroscopeMock.mockRejectedValueOnce(
      new Error("실시간 운세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
    );
    getSunSignHoroscopeMock.mockResolvedValueOnce({
      success: true,
      data: {
        sign: "Cancer",
        horoscope: "### 오늘 한 줄 결론\n다시 불러오기에 성공했습니다.",
      },
      meta: {
        source: "proxy",
        basis: "sign_context",
      },
    });

    render(<DailyAstrologyPage />);

    fireEvent.click(screen.getAllByRole("button")[0]);

    await screen.findByText("실시간 운세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");

    const retryButton = screen.getByRole("button", { name: /retry|다시/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText("다시 불러오기에 성공했습니다.")).toBeInTheDocument();
    });
    expect(getSunSignHoroscopeMock).toHaveBeenCalledTimes(2);
  });

  it("keeps manual selection mode after back to selection", async () => {
    getSunSignHoroscopeMock.mockResolvedValueOnce({
      success: true,
      data: {
        sign: "Cancer",
        horoscope: "### 오늘 한 줄 결론\n게자리 결과",
      },
      meta: {
        source: "proxy",
        basis: "sign_context",
        requestDate: "2026-03-21",
      },
    });
    getSunSignHoroscopeMock.mockResolvedValueOnce({
      success: true,
      data: {
        sign: "Aries",
        horoscope: "### 오늘 한 줄 결론\n양자리 결과",
      },
      meta: {
        source: "proxy",
        basis: "sign_context",
        requestDate: "2026-03-21",
      },
    });

    useAuthStore.setState({
      profile: {
        month: 7,
        day: 10,
      },
    });

    render(<DailyAstrologyPage />);

    await waitFor(() => {
      expect(getSunSignHoroscopeMock).toHaveBeenCalledWith(
        "Cancer",
        expect.objectContaining({
          requestDate: expect.any(String),
        }),
      );
    });

    const backButton = await screen.findByRole("button", { name: "back-to-sign-selection" });
    fireEvent.click(backButton);

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(getSunSignHoroscopeMock).toHaveBeenCalledTimes(1);

    const ariesButton = await screen.findByRole("button", { name: "select-sign-Aries" });
    fireEvent.click(ariesButton);

    await waitFor(() => {
      expect(getSunSignHoroscopeMock).toHaveBeenCalledTimes(2);
    });
    expect(getSunSignHoroscopeMock).toHaveBeenLastCalledWith(
      "Aries",
      expect.objectContaining({
        requestDate: expect.any(String),
      }),
    );
  });
});
