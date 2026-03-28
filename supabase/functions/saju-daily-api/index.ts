import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.14.0";
import { corsHeaders } from "../_shared/cors.ts";

type FortuneCategoryId = "total" | "love" | "wealth" | "career" | "study" | "health";

const apiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
const genAI = new GoogleGenerativeAI(apiKey);
const GEMINI_TIMEOUT_MS = 60_000;
const VALID_CATEGORY_IDS: FortuneCategoryId[] = ["total", "love", "wealth", "career", "study", "health"];

const CATEGORY_META: Record<FortuneCategoryId, { label: string; focus: string }> = {
  total: {
    label: "총운",
    focus: "오늘 하루 전체 흐름과 우선순위",
  },
  love: {
    label: "애정운",
    focus: "관계 흐름, 감정 표현, 대화 타이밍",
  },
  wealth: {
    label: "금전운",
    focus: "수입/지출 관리, 금전 판단, 손실 회피 포인트",
  },
  career: {
    label: "직장운",
    focus: "업무 집중, 협업 커뮤니케이션, 실행 성과",
  },
  study: {
    label: "학업·성취운",
    focus: "집중 리듬, 학습 효율, 목표 달성 전략",
  },
  health: {
    label: "건강운",
    focus: "체력 리듬, 회복 우선순위, 생활 습관 관리",
  },
};

const withGeminiTimeout = async <T>(promise: Promise<T>, timeoutMs = GEMINI_TIMEOUT_MS): Promise<T> => {
  let timeoutId: number | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("upstream_timeout"));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
};

const resolveCategoryId = (value: unknown): FortuneCategoryId | null => {
  if (typeof value !== "string") {
    return null;
  }

  return VALID_CATEGORY_IDS.includes(value as FortuneCategoryId) ? (value as FortuneCategoryId) : null;
};

const buildSingleCategorySchema = (categoryId: FortuneCategoryId, label: string) => `{
  "score": 85,
  "summary": "${label} 중심 오늘 운세 요약",
  "details": "${label} 중심 상세 해석",
  "luckyColor": "행운 색상",
  "luckyItem": "행운 아이템",
  "luckyNumber": 7,
  "healthTip": "오늘 컨디션 관리 한 줄 팁",
  "categories": {
    "${categoryId}": {
      "score": 85,
      "summary": "${label} 요약",
      "detail": "${label} 상세 해석",
      "advice": "실행 가능한 행동 조언",
      "luckyTip": "작은 행운을 만드는 팁",
      "cautionPoint": "주의 포인트"
    }
  }
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { sajuData, dateContext, categoryId: rawCategoryId } = await req.json();

    if (!sajuData) {
      return new Response(JSON.stringify({ error: "sajuData is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const categoryId = resolveCategoryId(rawCategoryId);
    if (!categoryId) {
      return new Response(JSON.stringify({ error: "categoryId is required and must be one of total,love,wealth,career,study,health." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const contextType = dateContext?.type || "today";
    const targetDate = dateContext?.date || new Date().toISOString().split("T")[0];
    const categoryMeta = CATEGORY_META[categoryId];
    const schema = buildSingleCategorySchema(categoryId, categoryMeta.label);

    const prompt = `
당신은 사주 기반 오늘의 운세 전문가입니다.

[사용자 사주 데이터]
팔자: ${JSON.stringify(sajuData.palja)}
오행: ${JSON.stringify(sajuData.oheng)}

[분석 요청]
- 기간 타입: ${contextType}
- 기준 날짜: ${targetDate}
- 요청 카테고리: ${categoryMeta.label} (${categoryId})
- 분석 초점: ${categoryMeta.focus}

중요 규칙:
1) categories 객체에는 반드시 "${categoryId}" 키 하나만 포함하세요.
2) total, love, wealth, career, study, health 중 "${categoryId}" 외 나머지 키는 절대 생성하지 마세요.
3) score는 0~100 정수로 작성하세요.
4) "details"와 categories.${categoryId}.detail은 3~5문장 이상으로 구체적으로 작성하세요.
5) advice, luckyTip, cautionPoint는 실행 가능한 문장으로 작성하세요.
6) JSON 외 텍스트(설명, 코드블록, 주석)를 출력하지 마세요.

아래 JSON 구조를 정확히 따르세요:
${schema}
`;

    const result = await withGeminiTimeout(model.generateContent(prompt));
    const text = result.response.text();

    return new Response(text, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    if (message === "upstream_timeout") {
      return new Response(
        JSON.stringify({
          error: "AI 분석 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
          code: "UPSTREAM_TIMEOUT",
        }),
        {
          status: 504,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.error("Gemini Fortune Error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
