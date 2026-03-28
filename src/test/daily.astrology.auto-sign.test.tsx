import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DailyAstrologyPage from "@/pages/DailyAstrologyPage";
import { useAuthStore } from "@/store/useAuthStore";

const getSunSignHoroscopeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/astrologyClient", () => ({
  getSunSignHoroscope: getSunSignHoroscopeMock,
}));

describe("DailyAstrologyPage auto sign", () => {
  beforeEach(() => {
    getSunSignHoroscopeMock.mockReset();
    useAuthStore.setState({ profile: null });
  });

  it("auto-selects sign from profile birthday but sends requestDate only", async () => {
    getSunSignHoroscopeMock.mockResolvedValueOnce({
      success: true,
      data: {
        sign: "Cancer",
        horoscope: ["### 게자리 오늘 한 줄", "오늘은 핵심 목표 1개에 집중하세요.", "", "### 오늘 한 줄 결론", "실행 우선순위를 분명히 하세요."].join("\n"),
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

    const [, contextArg] = getSunSignHoroscopeMock.mock.calls[0] ?? [];
    expect(contextArg).not.toHaveProperty("profile");

    await screen.findByText(/CircularNatalHoroscopeJS 기반 보정 리포트/i);
  });
});
