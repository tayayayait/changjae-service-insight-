import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.14.0";
import { corsHeaders } from "../_shared/cors.ts";

const apiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
const genAI = new GoogleGenerativeAI(apiKey);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { sajuData, year } = await req.json();

    if (!sajuData?.palja || !sajuData?.oheng || !year) {
      return new Response(JSON.stringify({ error: "sajuData and year are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "yearly-fortune is unavailable: missing GEMINI_API_KEY" }), {
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
당신은 한국어 사주 연간운 분석가입니다.
기준 연도: ${year}
팔자: ${JSON.stringify(sajuData.palja)}
오행: ${JSON.stringify(sajuData.oheng)}

아래 JSON 형식으로만 답변하세요:
{
  "year": ${year},
  "overallScore": 0~100 정수,
  "summary": "연간 총평 2~3문장",
  "focus": ["집중 포인트1", "집중 포인트2", "집중 포인트3"],
  "cautions": ["주의 포인트1", "주의 포인트2", "주의 포인트3"],
  "months": [
    { "month": 1, "score": 0~100 정수, "summary": "해당 월 한 줄 요약" }
  ]
}

조건:
- months는 1~12월을 모두 포함
- 공포/단정 금지
- 행동 가능한 조언 중심
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
