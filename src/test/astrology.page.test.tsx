import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AstrologyReportView } from "@/components/astrology/AstrologyReportView";
import { buildFallbackAstrologyBirthReport, toAstrologyDeepData } from "@/lib/astrologyReport";

const createRecord = () => ({
  id: "r1",
  userId: null,
  guestId: "g1",
  serviceType: "astro-natal",
  inputSnapshot: {
    name: "테스트",
    year: 1995,
    month: 6,
    day: 29,
    birthTimeKnown: true,
  },
  inputFingerprint: "fp",
  reportPayload: buildFallbackAstrologyBirthReport(toAstrologyDeepData({}), { birthTimeKnown: true }, null),
  templateVersion: "v5",
  isUnlocked: true,
  createdAt: new Date().toISOString(),
});

const isBefore = (a: HTMLElement, b: HTMLElement) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("AstrologyReportView v5", () => {
  it("renders sections in 9-part fixed order", () => {
    render(<AstrologyReportView record={createRecord()} isLocked={false} />);

    const diagnosis = screen.getByTestId("diagnosis-section");
    const insights = screen.getByTestId("core-insights-section");
    const identity = screen.getByTestId("identity-section");
    const questionInterpretation = screen.getByTestId("question-interpretation-section");
    const operationManual = screen.getByTestId("operation-manual-section");
    const longTermGrowth = screen.getByTestId("long-term-growth-section");
    const actionRoutine = screen.getByTestId("action-routine-section");
    const summaryCard = screen.getByTestId("summary-card-section");
    const detail = screen.getByTestId("detail-accordion");

    expect(isBefore(diagnosis, insights)).toBe(true);
    expect(isBefore(insights, identity)).toBe(true);
    expect(isBefore(identity, questionInterpretation)).toBe(true);
    expect(isBefore(questionInterpretation, operationManual)).toBe(true);
    expect(isBefore(operationManual, longTermGrowth)).toBe(true);
    expect(isBefore(longTermGrowth, actionRoutine)).toBe(true);
    expect(isBefore(actionRoutine, summaryCard)).toBe(true);
    expect(isBefore(summaryCard, detail)).toBe(true);
  });

  it("shows exactly 3 core insights and 5 question cards", () => {
    render(<AstrologyReportView record={createRecord()} isLocked={false} />);

    expect(screen.getByTestId("core-insights-section").querySelectorAll("article").length).toBe(3);
    expect(screen.getByTestId("question-interpretation-section").querySelectorAll("article").length).toBe(5);
  });

  it("shows 4 operation manual cards", () => {
    render(<AstrologyReportView record={createRecord()} isLocked={false} />);
    expect(screen.getByTestId("operation-manual-section").querySelectorAll("article").length).toBe(4);
  });
});
