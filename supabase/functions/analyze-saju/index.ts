import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.14.0";
import { corsHeaders } from "../_shared/cors.ts";
import { getSajuReportStrategy } from "../_shared/prompt-templates.ts";

const apiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
const genAI = new GoogleGenerativeAI(apiKey);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      sajuData,
      interests,
      freeQuestion,
      serviceType = "traditional-saju",
    } = await req.json();

    if (!sajuData || !Array.isArray(interests)) {
      return new Response(JSON.stringify({ error: "sajuData and interests are required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "analyze-saju is unavailable: missing GEMINI_API_KEY" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const strategy = getSajuReportStrategy(serviceType);
    const now = new Date();

    let prompt = `
${strategy.systemInstruction}

[User Saju Data]
Palja: ${JSON.stringify(sajuData.palja)}
Oheng: ${JSON.stringify(sajuData.oheng)}
Yongsin: ${JSON.stringify(sajuData.yongsin ?? [])}
Sinsal: ${JSON.stringify(sajuData.sinsal ?? [])}
Profile Meta: ${JSON.stringify(sajuData.profileMeta ?? {})}

[Interests / Question]
Interests: ${interests.join(", ")}
Question: ${freeQuestion ? freeQuestion : "none"}
Service Type: ${serviceType}
Current Date (ISO): ${now.toISOString()}

Return only JSON in this schema:
${strategy.responseSchema}
`;
    prompt = strategy.postProcessor(prompt);

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return new Response(text, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("Gemini Error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
