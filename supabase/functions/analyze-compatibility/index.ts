import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.14.0";
import { corsHeaders } from "../_shared/cors.ts";

const apiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
const genAI = new GoogleGenerativeAI(apiKey);

const calcScore = (a: Array<{ percentage: number }>, b: Array<{ percentage: number }>) => {
  const diff = a.reduce((acc, item, index) => acc + Math.abs(item.percentage - (b[index]?.percentage ?? 0)), 0);
  return Math.max(0, Math.round(100 - diff / 2));
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { mode, personA, personB } = await req.json();

    if (!mode || !personA?.oheng || !personB?.oheng) {
      return new Response(JSON.stringify({ error: "mode, personA.oheng, personB.oheng are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const score = calcScore(personA.oheng, personB.oheng);

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "analyze-compatibility is unavailable: missing GEMINI_API_KEY" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
당신은 명리 기반 관계 분석가입니다.
관계 모드: ${mode}
사람 A 오행: ${JSON.stringify(personA.oheng)}
사람 B 오행: ${JSON.stringify(personB.oheng)}
기본 계산 점수: ${score}

아래 JSON으로만 답변하세요:
{
  "score": ${score},
  "summary": "한 줄 요약",
  "strengths": ["강점1", "강점2", "강점3"],
  "cautions": ["주의1", "주의2", "주의3"],
  "advice": "행동 조언 1문장"
}

조건:
- 점수(score)는 그대로 유지
- 과도한 단정 금지
- 실행 가능한 조언 중심
- 한국어
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return new Response(text, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
