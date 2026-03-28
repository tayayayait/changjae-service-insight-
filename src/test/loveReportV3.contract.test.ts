import { describe, expect, it } from "vitest";
import {
  getLoveReportStrategy,
  getLoveReportStrategyMap,
} from "../../supabase/functions/_shared/love-report-v3";

describe("getLoveReportStrategy", () => {
  it("defines three differentiated report layouts with distinct section ids", () => {
    const strategyMap = getLoveReportStrategyMap();
    const future = strategyMap["future-partner"];
    const couple = strategyMap["couple-report"];
    const reunion = strategyMap["crush-reunion"];

    expect(future.reportLayout).toBe("future-partner-v3");
    expect(couple.reportLayout).toBe("couple-report-v3");
    expect(reunion.reportLayout).toBe("crush-reunion-v3");

    expect(future.sections.map((section) => section.id)).toEqual([
      "partner-profile",
      "my-pattern",
      "meeting-flow",
      "marriage-timing",
      "reality-check",
    ]);
    expect(couple.sections.map((section) => section.id)).toEqual([
      "relationship-state",
      "conflict-trigger-map",
      "communication-speed",
      "agreement-structure",
      "repair-protocol",
    ]);
    expect(reunion.sections.map((section) => section.id)).toEqual([
      "chance-verdict",
      "break-cause",
      "signal-reading",
      "contact-window",
      "attempt-or-stop",
      "evidence-note",
    ]);
  });

  it("returns service-specific prompt/schema guidance rather than a single shared template", () => {
    const future = getLoveReportStrategy("future-partner");
    expect(future.systemInstruction).toContain("현재 상대를 전제하지 않는다.");
    expect(future.responseSchema).toContain("\"meetingChannels\"");
    expect(future.responseSchema).toContain("\"selfCheckCriteria\"");

    const couple = getLoveReportStrategy("couple-report");
    expect(couple.systemInstruction).toContain("단순 잘 맞음/안 맞음 판정 금지.");
    expect(couple.responseSchema).toContain("\"agreementChecklist\"");
    expect(couple.responseSchema).toContain("\"doNotSay\"");

    const reunion = getLoveReportStrategy("crush-reunion");
    expect(reunion.systemInstruction).toContain("가능성 있음 / 제한적 / 확실한 정보 없음");
    expect(reunion.responseSchema).toContain("\"chanceVerdict\"");
    expect(reunion.responseSchema).toContain("\"contactScripts\"");
  });
});
