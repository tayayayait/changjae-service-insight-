import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MatchScorePanel } from "@/components/love/MatchScorePanel";

describe("MatchScorePanel", () => {
  it("renders counseling-focused score labels", () => {
    render(
      <MatchScorePanel
        scoreSet={{
          overall: 82,
          pull: 78,
          pace: 66,
          alignment: 74,
          repair: 69,
          timing: 71,
        }}
      />,
    );

    expect(screen.getByText("상담 진단 지표")).toBeInTheDocument();
    expect(screen.getByText("끌림")).toBeInTheDocument();
    expect(screen.getByText("감정 속도")).toBeInTheDocument();
    expect(screen.getByText("생활 합의력")).toBeInTheDocument();
    expect(screen.getByText("회복 탄력성")).toBeInTheDocument();
    expect(screen.getByText("관계 시기성")).toBeInTheDocument();
  });
});
