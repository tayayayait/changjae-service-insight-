import { describe, expect, it } from "vitest";
import { getSajuReportStrategy } from "../../supabase/functions/_shared/prompt-templates";

describe("getSajuReportStrategy", () => {
  it("adds demerit guard rules and analysisBlocks requirements for lifetime roadmap", () => {
    const strategy = getSajuReportStrategy("saju-lifetime-roadmap");
    const guardedPrompt = strategy.postProcessor("PROMPT");

    expect(strategy.reportTemplateVersion).toBe("saju-report-v2.9");
    expect(strategy.systemInstruction).toContain("Never use placeholder tokens");
    expect(strategy.systemInstruction).toContain("coreFlow/evidence/opportunities/risks/actionStrategy");
    expect(strategy.systemInstruction).toContain("opportunities/risks/actionStrategy는 각 2개 이상");
    expect(strategy.systemInstruction).toContain("reportPayload.supplement");

    expect(strategy.responseSchema).toContain("\"lifetimeScore\"");
    expect(strategy.responseSchema).toContain("\"coreQuestion\"");
    expect(strategy.responseSchema).toContain("\"analysisBlocks\"");
    expect(strategy.responseSchema).toContain("\"stageTransitions\"");
    expect(strategy.responseSchema).toContain("\"maturityExpansionCleanup\"");

    expect(guardedPrompt).toContain("Do not use placeholder tokens like");
    expect(guardedPrompt).toContain("For daeunPeriods[*].gan use one of");
    expect(guardedPrompt).toContain(
      "Lifetime 7 services: each analysis block must include opportunities/risks/actionStrategy with 2+ complete sentences each.",
    );
  });

  it("returns dedicated 2026 strategy schemas and focused constraints", () => {
    const overview = getSajuReportStrategy("saju-2026-overview");
    const study = getSajuReportStrategy("saju-2026-study-exam");
    const love = getSajuReportStrategy("saju-love-focus");
    const wealthBusiness = getSajuReportStrategy("saju-2026-wealth-business");
    const investment = getSajuReportStrategy("saju-2026-investment-assets");
    const health = getSajuReportStrategy("saju-2026-health-balance");
    const guardedStudy = study.postProcessor("PROMPT");

    expect(overview.serviceType).toBe("saju-2026-overview");
    expect(overview.reportTemplateVersion).toBe("saju-report-v2.9");
    expect(overview.responseSchema).toContain("\"quickSummary\"");
    expect(overview.responseSchema).toContain("\"signalTrio\"");
    expect(overview.responseSchema).toContain("\"yearTimeline\"");
    expect(overview.responseSchema).toContain("\"focusCards\"");
    expect(overview.responseSchema).toContain("\"consistencyMeta\"");

    expect(study.serviceType).toBe("saju-2026-study-exam");
    expect(study.responseSchema).toContain("\"studyRhythm\"");
    expect(study.responseSchema).toContain("\"studyActionReport\"");
    expect(study.responseSchema).toContain("\"quarterlyDetailed\"");
    expect(study.responseSchema).toContain("\"examTypeGuides\"");
    expect(study.responseSchema).not.toContain("\"focusCards\"");
    expect(study.systemInstruction).toContain("다른 영역 요약 금지");
    expect(study.systemInstruction).toContain("단일 string 필드는 2~4문장");
    expect(study.systemInstruction).toContain("배열 필드는 2~4개의 구체 해석 문장");
    expect(study.systemInstruction).toContain("studyActionReport를 반드시 포함");
    expect(study.systemInstruction).toContain("실행전략형 리포트 구조");

    expect(guardedStudy).toContain(
      "2026 focused 6 services: do not output focusCards; output only service-specific deep fields",
    );
    expect(guardedStudy).toContain(
      "For saju-2026-study-exam: include studyActionReport with coreDiagnosis/keyQuestion/keyInsights(3)",
    );

    expect(love.serviceType).toBe("saju-love-focus");
    expect(love.responseSchema).toContain("\"marriageDecisionBoard\"");
    expect(love.responseSchema).toContain("\"meetingChannelPriority\"");
    expect(love.responseSchema).toContain("\"greenFlagChecklist\"");
    expect(love.responseSchema).toContain("\"redFlagChecklist\"");
    expect(love.responseSchema).toContain("\"conflictProtocol\"");
    expect(love.responseSchema).toContain("\"consumerFaq\"");
    expect(love.systemInstruction).toContain("consumerFaq는 반드시 8개 문항");
    expect(love.systemInstruction).toContain("조건 + 행동 + 확인 기준 구조");
    expect(love.postProcessor("PROMPT")).toContain(
      "For saju-love-focus: include marriageDecisionBoard/meetingChannelPriority/greenFlagChecklist/redFlagChecklist/conflictProtocol and consumerFaq(8 question-answer items).",
    );

    expect(wealthBusiness.serviceType).toBe("saju-2026-wealth-business");
    expect(wealthBusiness.responseSchema).toContain("\"oneLineDiagnosis\"");
    expect(wealthBusiness.responseSchema).toContain("\"keyPoints\"");
    expect(wealthBusiness.responseSchema).toContain("\"quarterlyFlowCards\"");
    expect(wealthBusiness.responseSchema).toContain("\"actionChecklist\"");
    expect(wealthBusiness.responseSchema).toContain("\"closingLine\"");
    expect(wealthBusiness.systemInstruction).toContain("quarterlyFlowCards");
    expect(wealthBusiness.systemInstruction).toContain("쉬운 설명");
    expect(wealthBusiness.systemInstruction).toContain("조언형 표현");

    expect(investment.serviceType).toBe("saju-2026-investment-assets");
    expect(investment.reportTemplateVersion).toBe("saju-report-v2.10-investment");
    expect(investment.responseSchema).toContain("\"reportTemplateVersion\": \"saju-report-v2.10-investment\"");
    expect(investment.responseSchema).toContain("\"entryBias\"");
    expect(investment.responseSchema).toContain("\"capitalRules\"");
    expect(investment.responseSchema).toContain("\"investmentActionReport\"");
    expect(investment.responseSchema).toContain("\"assetClassGuides\"");
    expect(investment.responseSchema).toContain("\"signalBoard\"");
    expect(investment.responseSchema).toContain("\"flowTo2027\"");
    expect(investment.systemInstruction).toContain("investmentActionReport");
    expect(investment.systemInstruction).toContain("전략형 리포트 구조");
    expect(investment.systemInstruction).toContain("종목 추천, 수익 보장, 레버리지 조장 표현은 금지");
    expect(investment.postProcessor("PROMPT")).toContain(
      "For saju-2026-investment-assets: include investmentActionReport with coreDiagnosis/keyQuestion/keyInsights(3)",
    );
    expect(investment.responseSchema).not.toContain("\"focusCards\"");

    expect(health.serviceType).toBe("saju-2026-health-balance");
    expect(health.reportTemplateVersion).toBe("saju-report-v2.10-health");
    expect(health.responseSchema).toContain("\"reportTemplateVersion\": \"saju-report-v2.10-health\"");
    expect(health.responseSchema).toContain("\"bodyPatterns\"");
    expect(health.responseSchema).toContain("\"quarterlyFlowCards\"");
    expect(health.responseSchema).toContain("\"overloadChecklist\"");
    expect(health.responseSchema).toContain("\"routineGuide\"");
    expect(health.systemInstruction).toContain("진단·치료 단정형 표현을 금지");
    expect(health.systemInstruction).toContain("생활 패턴 언어");
    expect(health.postProcessor("PROMPT")).toContain("reportTemplateVersion must be \"saju-report-v2.10-health\"");
  });

  it("defines differentiated fields and hardening rules per lifetime service", () => {
    const daeun = getSajuReportStrategy("saju-daeun-shift");
    const guardedDaeun = daeun.postProcessor("PROMPT");
    expect(daeun.responseSchema).toContain("\"transitionSignals\"");
    expect(daeun.responseSchema).toContain("\"phaseRoadmap\"");
    expect(daeun.responseSchema).toContain("\"longHorizonDirection\"");
    expect(daeun.responseSchema).toContain("\"preAtPostDiff\"");
    expect(daeun.systemInstruction).toContain("전환 전/중/후");
    expect(daeun.systemInstruction).toContain("4단계");
    expect(guardedDaeun).toContain("analysisBlocks must use 4 fixed phases");
    expect(guardedDaeun).toContain("include phaseRoadmap(4 items) and longHorizonDirection");

    const career = getSajuReportStrategy("saju-career-timing");
    const guardedCareer = career.postProcessor("PROMPT");
    expect(career.responseSchema).toContain("\"careerArcSummary\"");
    expect(career.responseSchema).toContain("\"stageFlow\"");
    expect(career.responseSchema).toContain("\"currentYearFocus\"");
    expect(career.responseSchema).toContain("\"decideNow\"");
    expect(career.responseSchema).toContain("\"deferNow\"");
    expect(career.systemInstruction).toContain("decideNow/deferNow");
    expect(career.systemInstruction).toContain("4단계");
    expect(career.systemInstruction).toContain("0~2년/3~5년/6~10년/10년+");
    expect(career.systemInstruction).toContain("currentYearFocus");
    expect(guardedCareer).toContain("include stageFlow(4 items");
    expect(guardedCareer).toContain("single-year references only in currentYearFocus");

    const wealth = getSajuReportStrategy("saju-wealth-flow");
    expect(wealth.responseSchema).toContain("\"incomeStructure\"");
    expect(wealth.responseSchema).toContain("\"financialNoGo\"");
    expect(wealth.responseSchema).toContain("\"assetTrendSeries\"");
    expect(wealth.responseSchema).toContain("\"wealthLifecycleStages\"");
    expect(wealth.systemInstruction).toContain("재무 생애 4단계");
    expect(wealth.systemInstruction).toContain("2026 같은 단년도는 현재 앵커로 1회");
    expect(wealth.postProcessor("PROMPT")).toContain("interpretation text only (chart numbers are deterministic)");
    expect(wealth.postProcessor("PROMPT")).toContain("wealthLifecycleStages(4 items");
    expect(wealth.postProcessor("PROMPT")).toContain("재물 4");

    const helper = getSajuReportStrategy("saju-helper-network");
    const guardedHelper = helper.postProcessor("PROMPT");
    expect(helper.responseSchema).toContain("\"helperProfiles\"");
    expect(helper.responseSchema).toContain("\"relationLayers\"");
    expect(helper.responseSchema).toContain("\"phaseRoadmap\"");
    expect(helper.responseSchema).toContain("\"longHorizonDirection\"");
    expect(helper.systemInstruction).toContain("phaseRoadmap은 최소 4단계를 유지");
    expect(guardedHelper).toContain("include phaseRoadmap(4+ items) and longHorizonDirection");
    expect(guardedHelper).toContain("single-year mentions (e.g. 2026) must remain auxiliary");

    const energy = getSajuReportStrategy("saju-energy-balance");
    expect(energy.responseSchema).toContain("\"immersionMode\"");
    expect(energy.responseSchema).toContain("\"energyRhythmSeries\"");
    expect(energy.responseSchema).toContain("\"innateProfile\"");
    expect(energy.responseSchema).toContain("\"operatingModel\"");
    expect(energy.responseSchema).toContain("\"stageShiftMap\"");
    expect(energy.responseSchema).toContain("\"longRangeStrategy\"");
    expect(energy.postProcessor("PROMPT")).toContain("interpretation text only (chart numbers are deterministic)");
    expect(energy.postProcessor("PROMPT")).toContain("에너지 4+");
    expect(energy.postProcessor("PROMPT")).toContain(
      "innateProfile/operatingModel/stageShiftMap/longRangeStrategy",
    );

    const calendar = getSajuReportStrategy("saju-yearly-action-calendar");
    expect(calendar.responseSchema).toContain("\"quarterThemes\"");
    expect(calendar.responseSchema).toContain("\"actionCheckpoints\"");
    expect(calendar.responseSchema).toContain("\"lifecycleExecutionPattern\"");
    expect(calendar.responseSchema).toContain("\"phaseFocusMap\"");
    expect(calendar.responseSchema).toContain("\"accumulationTransitionFlow\"");
    expect(calendar.responseSchema).toContain("\"longPracticeStrategy\"");
    expect(calendar.responseSchema).toContain("\"yearToLifeBridge\"");
    expect(calendar.reportTemplateVersion).toBe("saju-report-v2.9");
    expect(calendar.responseSchema).toContain("\"oneLineTotalReview\"");
    expect(calendar.responseSchema).toContain("\"currentLifeFlow\"");
    expect(calendar.responseSchema).toContain("\"meaningOfThisYear\"");
    expect(calendar.responseSchema).toContain("\"tenYearFlow\"");
    expect(calendar.responseSchema).toContain("\"longPatternInterpretation\"");
    expect(calendar.responseSchema).toContain("\"keyThemes\"");
    expect(calendar.responseSchema).toContain("\"quarterNarratives\"");
    expect(calendar.responseSchema).toContain("\"yearEndResidue\"");
    expect(calendar.responseSchema).toContain("\"closingLine\"");
    expect(calendar.systemInstruction).toContain("인생 단계 전환과 장기 축적");
    expect(calendar.systemInstruction).toContain("내부 토큰(calendar-map/Q1/Structuring/Acceleration)을 노출하지 마세요");
    expect(calendar.systemInstruction).toContain("단기 표현을 금지");
    const guardedCalendar = calendar.postProcessor("PROMPT");
    expect(guardedCalendar).toContain("prohibit duplicate quarter sentences");
    expect(guardedCalendar).toContain("never expose internal tokens like calendar-map/Q1/Structuring/Acceleration");
    expect(guardedCalendar).toContain("keyThemes must contain exactly 3 items");
    expect(guardedCalendar).toContain("quarterNarratives must contain 4 items");
  });
});
