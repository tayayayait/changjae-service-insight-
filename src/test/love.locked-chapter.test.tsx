import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LockedChapterCard } from "@/components/love/LockedChapterCard";

describe("LockedChapterCard", () => {
  it("renders locked counseling section title, teaser and benefit copy", () => {
    render(
      <LockedChapterCard
        chapter={{
          type: "scenario",
          title: "언제 시도하고 언제 멈춰야 하나",
          teaser: "30일 안에 가장 중요한 분기점은 먼저 연락하는 시점입니다.",
          benefit: "재접촉 타이밍과 피해야 할 접근 방식을 이어서 확인할 수 있습니다.",
        }}
      />,
    );

    expect(screen.getByText("이어지는 상담 주제")).toBeInTheDocument();
    expect(screen.getByText("언제 시도하고 언제 멈춰야 하나")).toBeInTheDocument();
    expect(screen.getByText("재접촉 타이밍과 피해야 할 접근 방식을 이어서 확인할 수 있습니다.")).toBeInTheDocument();
  });
});
