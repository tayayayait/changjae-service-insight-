import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LockedChapterCard } from "@/components/love/LockedChapterCard";

describe("LockedChapterCard", () => {
  it("renders chapter title and benefit in default mode", () => {
    render(
      <LockedChapterCard
        chapter={{
          type: "scenario",
          title: "관계 흐름을 더 깊게 읽어야 하는 이유",
          teaser: "30일 안에 무엇이 가장 중요하게 움직일지 먼저 보여주는 프리뷰입니다.",
          benefit: "지금 바로 판단하지 말아야 할 지점과 실제로 움직여야 할 행동 순서를 함께 확인할 수 있습니다.",
        }}
      />,
    );

    expect(screen.getByTestId("locked-chapter-label")).toBeInTheDocument();
    expect(screen.getByText("관계 흐름을 더 깊게 읽어야 하는 이유")).toBeInTheDocument();
    expect(screen.getByText("지금 바로 판단하지 말아야 할 지점과 실제로 움직여야 할 행동 순서를 함께 확인할 수 있습니다.")).toBeInTheDocument();
  });
});
