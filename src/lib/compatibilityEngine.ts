import { OhengDistribution, Palja, SajuResult } from "../types/result";
import { getGanOheng, getJiOheng } from "./ohengCalculator";

export interface CompatibilityScore {
  total: number;
  summary: string;
  strengths: string[];
  cautions: string[];
  advice: string;
}

const OHENG_RELATION = {
  // Saeng (Producing)
  "목": "화", "화": "토", "토": "금", "금": "수", "수": "목",
};

const OHENG_CONTROL = {
  // Geuk (Controlling)
  "목": "토", "화": "금", "토": "수", "금": "목", "수": "화",
};

export const calculateCompatibility = (personA: SajuResult, personB: SajuResult): CompatibilityScore => {
  let score = 70; // Base score
  const strengths: string[] = [];
  const cautions: string[] = [];

  const aIlgan = personA.palja.day.gan;
  const bIlgan = personB.palja.day.gan;
  const aIlganOheng = getGanOheng(aIlgan);
  const bIlganOheng = getGanOheng(bIlgan);

  // 1. Ilgan (Day Stem) Relation
  if (aIlganOheng === bIlganOheng) {
    score += 5;
    strengths.push("비슷한 성향을 가지고 있어 서로를 잘 이해합니다.");
  } else if (OHENG_RELATION[aIlganOheng as keyof typeof OHENG_RELATION] === bIlganOheng || 
             OHENG_RELATION[bIlganOheng as keyof typeof OHENG_RELATION] === aIlganOheng) {
    score += 10;
    strengths.push("서로에게 긍정적인 에너지를 주는 상생의 관계입니다.");
  } else if (OHENG_CONTROL[aIlganOheng as keyof typeof OHENG_CONTROL] === bIlganOheng || 
             OHENG_CONTROL[bIlganOheng as keyof typeof OHENG_CONTROL] === aIlganOheng) {
    score -= 5;
    cautions.push("가끔씩 의견 충돌이나 주도권 다툼이 있을 수 있습니다.");
  }

  // 2. Oheng Complementarity (Filling lack of Oheng)
  const aLacks = personA.oheng.filter(o => o.count === 0).map(o => o.element);
  const bLacks = personB.oheng.filter(o => o.count === 0).map(o => o.element);

  const aFillsB = bLacks.some(lack => personA.oheng.find(o => o.element === lack && o.count >= 2));
  const bFillsA = aLacks.some(lack => personB.oheng.find(o => o.element === lack && o.count >= 2));

  if (aFillsB || bFillsA) {
    score += 10;
    strengths.push("서로의 부족한 기운을 채워주는 보완적인 관계입니다.");
  }

  // 3. Score Clamp
  score = Math.min(100, Math.max(40, score));

  let summary = "";
  let advice = "";

  if (score >= 90) {
    summary = "천생연분, 최상의 조화를 이루는 관계입니다.";
    advice = "서로에 대한 신뢰를 바탕으로 함께 발전해 나갈 수 있습니다.";
  } else if (score >= 75) {
    summary = "안정적이고 조화로운 관계입니다.";
    advice = "작은 차이를 존중한다면 더욱 깊은 관계로 발전할 것입니다.";
  } else {
    summary = "서로의 노력이 필요한 보완형 관계입니다.";
    advice = "상대방의 다른 점을 인정하고 소통에 더 힘쓰는 것이 좋습니다.";
  }

  return {
    total: score,
    summary,
    strengths,
    cautions,
    advice,
  };
};
