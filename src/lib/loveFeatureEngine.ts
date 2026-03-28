import { LoveContext, LoveContextAnswer, LoveFeatureSet, LoveScoreSet, LoveServiceType, LoveSubjectInput } from "@/types/love";
import { CalculatedSajuPayload } from "./sajuEngine";
import { Oheng } from "@/types/result";
import { getGanOheng } from "./ohengCalculator";

const GAN_POLARITY: Record<string, 1 | -1> = {
  "甲": 1,
  "乙": -1,
  "丙": 1,
  "丁": -1,
  "戊": 1,
  "己": -1,
  "庚": 1,
  "辛": -1,
  "壬": 1,
  "癸": -1,
  "갑": 1,
  "을": -1,
  "병": 1,
  "정": -1,
  "무": 1,
  "기": -1,
  "경": 1,
  "신": -1,
  "임": 1,
  "계": -1,
};

const GAN_TO_HANJA: Record<string, string> = {
  갑: "甲",
  을: "乙",
  병: "丙",
  정: "丁",
  무: "戊",
  기: "己",
  경: "庚",
  신: "辛",
  임: "壬",
  계: "癸",
};

const JI_TO_HANJA: Record<string, string> = {
  자: "子",
  축: "丑",
  인: "寅",
  묘: "卯",
  진: "辰",
  사: "巳",
  오: "午",
  미: "未",
  신: "申",
  유: "酉",
  술: "戌",
  해: "亥",
};

const GENERATION_MAP: Record<Oheng, Oheng> = {
  목: "화",
  화: "토",
  토: "금",
  금: "수",
  수: "목",
};

const CONTROL_MAP: Record<Oheng, Oheng> = {
  목: "토",
  화: "금",
  토: "수",
  금: "목",
  수: "화",
};

const BRANCH_COMBINES = new Set(["子-丑", "寅-亥", "卯-戌", "辰-酉", "巳-申", "午-未"]);
const BRANCH_CLASHES = new Set(["子-午", "丑-未", "寅-申", "卯-酉", "辰-戌", "巳-亥"]);
const BRANCH_PUNISH = new Set(["寅-巳", "巳-申", "寅-申", "丑-戌", "戌-未", "丑-未", "子-卯", "辰-辰", "午-午", "酉-酉", "亥-亥"]);
const BRANCH_BREAK = new Set(["子-酉", "午-卯", "寅-亥", "申-巳", "辰-丑", "戌-未"]);
const BRANCH_HARM = new Set(["子-未", "丑-午", "寅-巳", "卯-辰", "申-亥", "酉-戌"]);

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(value)));

const toHanjaGan = (value: string) => GAN_TO_HANJA[value] ?? value;
const toHanjaJi = (value: string) => JI_TO_HANJA[value] ?? value;

const pairKey = (a: string, b: string) => {
  return [toHanjaJi(a), toHanjaJi(b)].sort().join("-");
};

const controllerOf = (target: Oheng): Oheng => {
  const pair = Object.entries(CONTROL_MAP).find(([, controlled]) => controlled === target);
  return (pair?.[0] as Oheng | undefined) ?? "토";
};

const getTimeConfidence = (subject: LoveSubjectInput): number => {
  if (subject.birthPrecision === "exact" || typeof subject.hour === "number") {
    return 100;
  }
  if (subject.birthPrecision === "time-block" || (subject.timeBlock && subject.timeBlock !== "모름")) {
    return 70;
  }
  return 45;
};

const buildBranchRelation = (aBranch: string, bBranch?: string) => {
  if (!bBranch) {
    return { relation: "중립" as const, description: "상대 지지 정보가 없어 개인 흐름 기준으로 해석했습니다." };
  }

  const key = pairKey(aBranch, bBranch);
  if (BRANCH_COMBINES.has(key)) {
    return { relation: "합" as const, description: "지지 합이 있어 관계 합의점이 비교적 빠르게 형성됩니다." };
  }
  if (BRANCH_CLASHES.has(key)) {
    return { relation: "충" as const, description: "지지 충이 강해 감정 기복과 주도권 충돌이 생기기 쉽습니다." };
  }
  if (BRANCH_PUNISH.has(key)) {
    return { relation: "형" as const, description: "지지 형 에너지가 있어 사소한 말투가 갈등으로 번지기 쉽습니다." };
  }
  if (BRANCH_BREAK.has(key)) {
    return { relation: "파" as const, description: "지지 파가 있어 계획 변경과 약속 어긋남이 반복될 수 있습니다." };
  }
  if (BRANCH_HARM.has(key)) {
    return { relation: "해" as const, description: "지지 해가 있어 오해성 신호를 줄이는 대화가 중요합니다." };
  }

  return { relation: "중립" as const, description: "강한 합충 신호가 없어 일상적 조율이 핵심입니다." };
};

const buildStemRelation = (aGanElement: Oheng, bGanElement?: Oheng) => {
  if (!bGanElement) {
    return "neutral" as const;
  }

  if (aGanElement === bGanElement) {
    return "same" as const;
  }
  if (GENERATION_MAP[aGanElement] === bGanElement || GENERATION_MAP[bGanElement] === aGanElement) {
    return "generating" as const;
  }
  if (CONTROL_MAP[aGanElement] === bGanElement || CONTROL_MAP[bGanElement] === aGanElement) {
    return "controlled" as const;
  }
  return "neutral" as const;
};

const buildSpouseStar = (subject: LoveSubjectInput, saju: CalculatedSajuPayload) => {
  const dayGan = toHanjaGan(saju.palja.day.gan);
  const dayPolarity = GAN_POLARITY[dayGan] ?? 1;
  const dayElement = getGanOheng(dayGan);

  const isMale = subject.gender === "male";
  const targetElement = isMale ? CONTROL_MAP[dayElement] : controllerOf(dayElement);
  const samePolarityType = isMale ? "편재" : "편관";
  const oppositePolarityType = isMale ? "정재" : "정관";

  const candidateGans = [saju.palja.year.gan, saju.palja.month.gan, saju.palja.time.gan].map(toHanjaGan);
  let sameCount = 0;
  let oppositeCount = 0;
  for (const gan of candidateGans) {
    if (getGanOheng(gan) !== targetElement) {
      continue;
    }
    const polarity = GAN_POLARITY[gan] ?? 1;
    if (polarity === dayPolarity) {
      sameCount += 1;
    } else {
      oppositeCount += 1;
    }
  }

  const total = sameCount + oppositeCount;
  const dominantType = (total === 0 ? "mixed" : sameCount >= oppositeCount ? samePolarityType : oppositePolarityType) as "mixed" | "편재" | "편관" | "정재" | "정관";
  const score = clamp(45 + total * 15 + oppositeCount * 8, 30, 95);
  const reason = total === 0
    ? "원국 천간에 배우자성이 약해 현실 관계 경험을 통해 배우자상이 구체화되는 유형입니다."
    : `${dominantType} 신호가 상대적으로 강해 관계에서 ${dominantType === "정관" || dominantType === "정재" ? "안정성과 책임감" : "강한 끌림과 변동성"}이 크게 작동합니다.`;

  return {
    targetElement,
    dominantType,
    score,
    reason,
  };
};

const complementarityScore = (a: CalculatedSajuPayload, b?: CalculatedSajuPayload) => {
  if (!b) {
    return 55;
  }
  const diff = a.oheng.reduce((acc, item, index) => {
    return acc + Math.abs(item.percentage - (b.oheng[index]?.percentage ?? 0));
  }, 0);
  return clamp(100 - diff / 2, 15, 100);
};

export const extractLoveFeatureSet = ({
  subjectA,
  sajuA,
  subjectB,
  sajuB,
}: {
  subjectA: LoveSubjectInput;
  sajuA: CalculatedSajuPayload;
  subjectB?: LoveSubjectInput;
  sajuB?: CalculatedSajuPayload;
}): LoveFeatureSet => {
  const spouseStar = buildSpouseStar(subjectA, sajuA);
  const relationStars = (sajuA.sinsal ?? []).map((item) => item.name);
  const branchRelation = buildBranchRelation(sajuA.palja.day.ji, sajuB?.palja.day.ji);

  const missing = sajuA.oheng.filter((item) => item.count === 0).map((item) => item.element);
  const dominant = [...sajuA.oheng].sort((x, y) => y.count - x.count).slice(0, 2).map((item) => item.element);

  const timeConfidence = clamp(
    subjectB ? Math.min(getTimeConfidence(subjectA), getTimeConfidence(subjectB)) : getTimeConfidence(subjectA),
    20,
    100,
  );

  return {
    spouseStar,
    spousePalace: {
      dayBranch: sajuA.palja.day.ji,
      relationWithPartner: branchRelation,
      hasCollisionRisk: branchRelation.relation === "충" || branchRelation.relation === "형",
    },
    relationStars: {
      hasDohwa: relationStars.includes("도화살"),
      hasCheoneul: relationStars.includes("천을귀인"),
      names: relationStars,
    },
    ohengBalance: {
      missing,
      dominant,
      complementarity: complementarityScore(sajuA, sajuB),
    },
    stemRelation: buildStemRelation(getGanOheng(sajuA.palja.day.gan), sajuB ? getGanOheng(sajuB.palja.day.gan) : undefined),
    branchRelation,
    timeConfidence,
  };
};

const extractContextBonus = (context?: LoveContext) => {
  if (!context) {
    return { pullBonus: 0, paceBonus: 0, alignmentBonus: 0, repairBonus: 0, timingBonus: 0 };
  }

  const marriageIntent = context.marriageIntent ?? "";
  const preferredStyle = context.preferredRelationshipStyle ?? "";
  const contextAnswers: LoveContextAnswer[] = context.contextAnswers ?? [];
  const futureFocusKey = contextAnswers.find((a) => a.questionKey === "future_focus")?.answerKey ?? "";
  
  // couple-report specifics
  const mainConcernKey = contextAnswers.find((a) => a.questionKey === "main_concern")?.answerKey ?? "";
  const coupleOutcomeKey = contextAnswers.find((a) => a.questionKey === "couple_outcome")?.answerKey ?? "";
  const relationshipTemperatureKey = contextAnswers.find((a) => a.questionKey === "relationship_temperature")?.answerKey ?? "";

  let pullBonus = 0;
  let paceBonus = 0;
  let alignmentBonus = 0;
  let repairBonus = 0;
  let timingBonus = 0;

  if (marriageIntent === "strong") {
    timingBonus += 8;
    alignmentBonus += 5;
  } else if (marriageIntent === "none") {
    timingBonus -= 5;
  }

  if (preferredStyle === "안정형") {
    alignmentBonus += 6;
    repairBonus += 4;
  } else if (preferredStyle === "설렘형") {
    pullBonus += 7;
    paceBonus += 3;
  } else if (preferredStyle === "현실형") {
    alignmentBonus += 5;
    paceBonus += 5;
  } else if (preferredStyle === "성장형") {
    repairBonus += 6;
    paceBonus += 4;
  }

  if (futureFocusKey === "timing") {
    timingBonus += 6;
  } else if (futureFocusKey === "marriage_potential") {
    alignmentBonus += 5;
  } else if (futureFocusKey === "my_pattern") {
    repairBonus += 5;
  } else if (futureFocusKey === "person_type") {
    pullBonus += 4;
  }
  
  // couple-report context bonus
  if (mainConcernKey === "communication") {
    repairBonus += 6;
  } else if (mainConcernKey === "repeated-conflict") {
    repairBonus += 5;
    pullBonus -= 3;
  } else if (mainConcernKey === "trust") {
    alignmentBonus += 5;
    repairBonus += 4;
  } else if (mainConcernKey === "life-money") {
    paceBonus += 5;
    alignmentBonus += 4;
  } else if (mainConcernKey === "marriage-path") {
    timingBonus += 6;
    alignmentBonus += 5;
  }

  if (coupleOutcomeKey === "mutual_understanding") {
    pullBonus += 4;
  } else if (coupleOutcomeKey === "conflict_relief") {
    repairBonus += 5;
  } else if (coupleOutcomeKey === "future_direction") {
    timingBonus += 5;
  } else if (coupleOutcomeKey === "risk_points") {
    alignmentBonus += 4;
  }

  if (relationshipTemperatureKey === "stable") {
    paceBonus += 4;
  } else if (relationshipTemperatureKey === "frequent_clash") {
    repairBonus += 4;
    pullBonus -= 3;
  } else if (relationshipTemperatureKey === "future_anxiety") {
    timingBonus += 4;
  }

  return { pullBonus, paceBonus, alignmentBonus, repairBonus, timingBonus };
};

export const calculateLoveScoreSet = (serviceType: LoveServiceType, feature: LoveFeatureSet, context?: LoveContext): LoveScoreSet => {
  let base = serviceType === "future-partner" ? 62 : serviceType === "couple-report" ? 58 : 55;

  if (feature.stemRelation === "generating") {
    base += 10;
  } else if (feature.stemRelation === "same") {
    base += 6;
  } else if (feature.stemRelation === "controlled") {
    base -= 7;
  }

  if (feature.branchRelation.relation === "합") {
    base += 9;
  } else if (feature.branchRelation.relation === "충") {
    base -= 10;
  } else if (feature.branchRelation.relation === "형" || feature.branchRelation.relation === "파" || feature.branchRelation.relation === "해") {
    base -= 6;
  }

  if (feature.ohengBalance.complementarity >= 80) {
    base += 10;
  } else if (feature.ohengBalance.complementarity >= 65) {
    base += 5;
  } else if (feature.ohengBalance.complementarity <= 45) {
    base -= 6;
  }

  if (feature.relationStars.hasCheoneul) {
    base += 4;
  }
  if (feature.relationStars.hasDohwa) {
    base += 3;
  }
  if (feature.spousePalace.hasCollisionRisk) {
    base -= 6;
  }

  const bonus = extractContextBonus(context);
  const overall = clamp(base, 15, 99);
  const pull = clamp(
    overall +
    (feature.relationStars.hasDohwa ? 6 : 0) +
    (feature.branchRelation.relation === "합" ? 4 : 0) -
    (feature.branchRelation.relation === "충" ? 7 : 0) +
    bonus.pullBonus,
    10,
    99,
  );
  const pace = clamp(
    overall +
    (feature.stemRelation === "same" ? 5 : 0) +
    (feature.stemRelation === "controlled" ? -7 : 0) +
    (feature.timeConfidence >= 80 ? 4 : feature.timeConfidence <= 50 ? -4 : 0) +
    bonus.paceBonus,
    10,
    99,
  );
  const alignment = clamp(
    overall +
    (feature.ohengBalance.complementarity >= 75 ? 8 : feature.ohengBalance.complementarity <= 45 ? -8 : 0) +
    (feature.branchRelation.relation === "합" ? 5 : 0) -
    (feature.branchRelation.relation === "파" ? 6 : 0) +
    bonus.alignmentBonus,
    10,
    99,
  );
  const repair = clamp(
    overall +
    (feature.relationStars.hasCheoneul ? 5 : 0) +
    (feature.stemRelation === "generating" ? 4 : 0) -
    (feature.spousePalace.hasCollisionRisk ? 10 : 0) +
    bonus.repairBonus,
    10,
    99,
  );
  const timing = clamp(
    Math.round(feature.timeConfidence * 0.7) +
    (serviceType === "future-partner" ? 15 : 0) +
    (feature.branchRelation.relation === "합" ? 5 : 0) -
    (feature.branchRelation.relation === "충" ? 6 : 0) +
    bonus.timingBonus,
    20,
    99,
  );

  return {
    overall,
    pull,
    pace,
    alignment,
    repair,
    timing,
  };
};
