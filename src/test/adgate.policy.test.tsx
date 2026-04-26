import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdGate } from "@/components/common/AdGate";

describe("AdGate", () => {
  it("renders content immediately without a countdown ad gate", () => {
    render(
      <AdGate enabled countdownSec={5}>
        <section>무료 운세 결과</section>
      </AdGate>,
    );

    expect(screen.getByText("무료 운세 결과")).toBeInTheDocument();
    expect(screen.queryByText("ADVERTISEMENT")).not.toBeInTheDocument();
    expect(screen.queryByText(/광고를 잠시만/)).not.toBeInTheDocument();
  });
});
