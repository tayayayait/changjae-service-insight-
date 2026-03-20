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
    const { zodiac, period, date } = await req.json();

    if (!zodiac || !period || !date) {
      return new Response(JSON.stringify({ error: "zodiac, period, date are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "zodiac-fortune is unavailable: missing GEMINI_API_KEY" }), {
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
당신은 한국어 운세 에디터입니다.
대상 띠: ${zodiac}
분석 기간: ${period}
기준 날짜: ${date}

아래 JSON 형식으로만 답변하세요:
{
  "score": 0~100 정수,
  "summary": "한 줄 요약",
  "details": "3~4문장 설명",
  "luckyColor": "행운 색상",
  "luckyItem": "행운 아이템"
}

조건:
- 공포/단정 표현 금지
- 실천 가능한 조언 포함
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
