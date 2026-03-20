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
    const { input } = await req.json();
    const symbols = Array.isArray(input?.symbols) ? input.symbols : [];
    const freeText = typeof input?.freeText === "string" ? input.freeText.trim() : "";

    if (symbols.length === 0 && !freeText) {
      return new Response(JSON.stringify({ error: "symbols or freeText is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "dream-interpretation is unavailable: missing GEMINI_API_KEY" }), {
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
당신은 한국어 꿈해몽 분석가입니다.
심볼 목록: ${JSON.stringify(symbols)}
사용자 자유서술: ${freeText || "없음"}

아래 JSON 형식으로만 답변하세요:
{
  "summary": "1~2문장 핵심 요약",
  "themes": ["핵심 테마1", "핵심 테마2", "핵심 테마3"],
  "cautions": ["주의 포인트1", "주의 포인트2", "주의 포인트3"],
  "advice": "실행 가능한 행동 조언 2~3문장",
  "luckyTip": "선택사항, 짧은 행운 팁"
}

조건:
- 단정적 예언 금지
- 불안 조장 금지
- 실천 가능한 표현 위주
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
