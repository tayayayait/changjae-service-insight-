export type PalmThickness = "thin" | "normal" | "thick";
export type PalmNailShape = "round" | "pointed" | "square" | "rectangular";

export interface PalmAnalyzeAuxiliaryInput {
  palmThickness?: PalmThickness;
  nailShape?: PalmNailShape;
}

export interface PalmLineAnalysis {
  visible: boolean;
  length: "short" | "medium" | "long";
  depth: "shallow" | "medium" | "deep";
  curvature: "straight" | "slight" | "curved";
  breaks: number;
  branches: number;
  description: string;
}

export interface PalmOverlayPoint {
  x: number;
  y: number;
}

export interface PalmOverlayResponse {
  lines: {
    heart: { points: PalmOverlayPoint[] };
    head: { points: PalmOverlayPoint[] };
    life: { points: PalmOverlayPoint[] };
    fate: { points: PalmOverlayPoint[] };
  };
  labels: {
    heart: PalmOverlayPoint;
    head: PalmOverlayPoint;
    life: PalmOverlayPoint;
    fate: PalmOverlayPoint;
  };
}

export interface PalmVisionResponse {
  lines: {
    life: PalmLineAnalysis;
    heart: PalmLineAnalysis;
    head: PalmLineAnalysis;
    fate: PalmLineAnalysis;
  };
  sections: {
    personality: { summary: string; details: string[] };
    wealth_career: { summary: string; details: string[] };
    relationship: { summary: string; details: string[] };
    timing: { summary: string; details: string[] };
  };
  overlay?: PalmOverlayResponse;
  overall_type: string;
  dominant_line: "Life" | "Heart" | "Head" | "Fate";
  confidence: number;
}

export const PALM_VISION_SYSTEM_PROMPT = `
You are a palmistry vision analyst.
Analyze the uploaded palm image and output only JSON.

Rules:
1. Detect and describe life, heart, head, and fate lines.
2. Return sections.personality/wealth_career/relationship/timing in Korean.
3. Keep descriptions practical and non-fatalistic.
4. If a line is unclear, set visible=false and keep conservative values.
5. If possible, include normalized overlay coordinates (0~1):
   - overlay.lines.heart/head/life/fate.points: polyline points (at least 2 when provided)
   - overlay.labels.heart/head/life/fate: label anchor point
6. Output must match schema and must be valid JSON only.
`;

const auxiliaryText = (auxiliary?: PalmAnalyzeAuxiliaryInput) => {
  if (!auxiliary) {
    return "No auxiliary input.";
  }

  const thickness = auxiliary.palmThickness ?? "unknown";
  const nailShape = auxiliary.nailShape ?? "unknown";
  return `Auxiliary input:
- palmThickness: ${thickness}
- nailShape: ${nailShape}
Use these as secondary indicators for interpretation tone only.`;
};

export const buildPalmVisionUserPrompt = (
  handedness: "left" | "right" | "unknown",
  auxiliary?: PalmAnalyzeAuxiliaryInput,
) => `Analyze this palm image.
Handedness: ${handedness}
${auxiliaryText(auxiliary)}

Return strict JSON with this shape:
{
  "lines": {
    "life": { "visible": true, "length": "long", "depth": "medium", "curvature": "curved", "breaks": 0, "branches": 1, "description": "..." },
    "heart": { "visible": true, "length": "medium", "depth": "deep", "curvature": "slight", "breaks": 0, "branches": 0, "description": "..." },
    "head": { "visible": true, "length": "medium", "depth": "medium", "curvature": "straight", "breaks": 0, "branches": 0, "description": "..." },
    "fate": { "visible": false, "length": "short", "depth": "shallow", "curvature": "straight", "breaks": 0, "branches": 0, "description": "..." }
  },
  "sections": {
    "personality": { "summary": "...", "details": ["...", "..."] },
    "wealth_career": { "summary": "...", "details": ["...", "..."] },
    "relationship": { "summary": "...", "details": ["...", "..."] },
    "timing": { "summary": "...", "details": ["...", "..."] }
  },
  "overlay": {
    "lines": {
      "heart": { "points": [{ "x": 0.1, "y": 0.2 }, { "x": 0.7, "y": 0.3 }] },
      "head": { "points": [{ "x": 0.1, "y": 0.45 }, { "x": 0.7, "y": 0.5 }] },
      "life": { "points": [{ "x": 0.25, "y": 0.22 }, { "x": 0.35, "y": 0.8 }] },
      "fate": { "points": [{ "x": 0.5, "y": 0.2 }, { "x": 0.5, "y": 0.8 }] }
    },
    "labels": {
      "heart": { "x": 0.72, "y": 0.28 },
      "head": { "x": 0.72, "y": 0.52 },
      "life": { "x": 0.38, "y": 0.82 },
      "fate": { "x": 0.53, "y": 0.82 }
    }
  },
  "overall_type": "balanced",
  "dominant_line": "Life",
  "confidence": 0.84
}`;

export const PALM_QA_V2_SYSTEM_PROMPT = `
당신은 손금 분석 결과 기반 Q&A 어시스턴트입니다.
규칙:
1. 제공된 palmResult 범위 안에서만 답변합니다.
2. 없는 정보를 추측하지 않습니다.
3. 한국어 3~5문장으로 간결하게 답변합니다.
4. 마지막 문장은 실행 가능한 한 줄 조언으로 마무리합니다.
`;

