import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Index from "@/pages/Index";

describe("Index page", () => {
  it("renders the portal hero and primary entry points", () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    );

    expect(screen.getByText("내 사주를 3분 안에 이해하는 생활형 해석")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "내 사주 시작" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "오늘의 운세 보기" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "궁합 보기" })).toBeInTheDocument();
    expect(screen.getByText("입력 없이 읽는 해석 피드")).toBeInTheDocument();
  }, 15_000);
});
