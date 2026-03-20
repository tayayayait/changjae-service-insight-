import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.14.0";
import { corsHeaders } from "../_shared/cors.ts";
import { DAILY_FORTUNE_SCHEMA } from "../_shared/prompt-templates.ts";

const apiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
const genAI = new GoogleGenerativeAI(apiKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sajuData, dateContext } = await req.json();

    if (!sajuData) {
      return new Response(JSON.stringify({ error: "sajuData is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    // dateContext: { type: 'today' | 'week' | 'month', date: '2026-03-16' } 등 
    const contextType = dateContext?.type || 'today';
    const targetDate = dateContext?.date || new Date().toISOString().split('T')[0];

    const prompt = `
당신은 친절한 명리학 운세 전문가입니다.

[사용자 사주 데이터]
팔자: ${JSON.stringify(sajuData.palja)}
오행: ${JSON.stringify(sajuData.oheng)}

이 사용자의 사주와 [대상 날짜: ${targetDate}] 일진(천간, 지지 기운)의 상호작용을 깊이 있게 분석하여,
오늘의 운세를 6가지 핵심 카테고리별로 나누어 알려주세요.

답변은 반드시 아래 JSON 구조로 작성해주세요:
${DAILY_FORTUNE_SCHEMA}

각 카테고리의 score는 0~100 사이의 점수이며, advice와 luckyTip 등 실질적인 행동 지침을 포함해주세요.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return new Response(text, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Gemini Fortune Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
