import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoveInputStepper } from "@/components/love/LoveInputStepper";

const goToNextStep = () => {
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
};

describe("LoveInputStepper", () => {
  it("does not render partner input card for future-partner", () => {
    render(<LoveInputStepper serviceType="future-partner" onSubmit={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "본인 정보" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "상대방 정보" })).not.toBeInTheDocument();
  });

  it("renders partner input card for couple-report", () => {
    render(<LoveInputStepper serviceType="couple-report" onSubmit={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "상대방 정보" })).toBeInTheDocument();
  });

  it("blocks navigation without required selection", () => {
    render(<LoveInputStepper serviceType="future-partner" onSubmit={vi.fn()} />);

    goToNextStep();

    expect(screen.getByRole("alert")).toHaveTextContent("현재 연애 상태는 무엇에 가까운가요?을 선택해 주세요.");
  });

  it("shows breakup branch questions for crush-reunion", () => {
    render(<LoveInputStepper serviceType="crush-reunion" onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "이별" }));
    goToNextStep();

    expect(screen.getByText("이별 이유는 무엇에 가까웠나요?")).toBeInTheDocument();
    expect(screen.getByText("이별 시점은 언제였나요?")).toBeInTheDocument();
  });

  it("keeps chosen answers when user goes back", () => {
    render(<LoveInputStepper serviceType="couple-report" onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "장기 연애" }));
    goToNextStep();
    fireEvent.click(screen.getByRole("button", { name: "신뢰 이슈" }));
    goToNextStep();
    fireEvent.click(screen.getByRole("button", { name: "앞으로의 방향 판단" }));
    fireEvent.click(screen.getByRole("button", { name: "미래 불안" }));

    fireEvent.click(screen.getByRole("button", { name: "이전" }));

    const selectedOption = screen.getByRole("button", { name: "신뢰 이슈" });
    expect(selectedOption).toHaveAttribute("aria-pressed", "true");
  });

  it("allows review step edit jump", () => {
    render(<LoveInputStepper serviceType="future-partner" onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "최근 관계 종료" }));
    goToNextStep();
    fireEvent.click(screen.getByRole("button", { name: "현실형" }));
    goToNextStep();
    fireEvent.click(screen.getByRole("button", { name: "결혼 가능성" }));
    fireEvent.click(screen.getByRole("button", { name: "강함" }));
    goToNextStep();

    const editButtons = screen.getAllByRole("button", { name: "수정" });
    fireEvent.click(editButtons[1]);

    expect(screen.getByText("원하는 관계 스타일은 무엇인가요?")).toBeInTheDocument();
  });

  it("submits contextAnswers and contextSummary payload", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoveInputStepper serviceType="future-partner" onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "최근 관계 종료" }));
    goToNextStep();
    fireEvent.click(screen.getByRole("button", { name: "현실형" }));
    goToNextStep();
    fireEvent.click(screen.getByRole("button", { name: "결혼 가능성" }));
    fireEvent.click(screen.getByRole("button", { name: "강함" }));
    goToNextStep();
    fireEvent.change(screen.getByPlaceholderText("추가 메모 1줄 (선택)"), { target: { value: "관계 안정성 우선" } });
    fireEvent.click(screen.getByRole("button", { name: "미래 인연 상담 시작" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    const payload = onSubmit.mock.calls[0][0];
    expect(payload.context.scenarioKey).toBe("recent-breakup");
    expect(Array.isArray(payload.context.contextAnswers)).toBe(true);
    expect(payload.context.contextAnswers.length).toBeGreaterThanOrEqual(4);
    expect(payload.context.contextSummary).toContain("현재 연애 상태는 무엇에 가까운가요?");
    expect(payload.context.additionalNote).toBe("관계 안정성 우선");
  });
});
