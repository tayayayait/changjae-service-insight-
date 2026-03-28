import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.14.0";
import { corsHeaders } from "../_shared/cors.ts";
const apiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
const genAI = new GoogleGenerativeAI(apiKey);
const GEMINI_TIMEOUT_MS = 6e4;
const VALID_CATEGORY_IDS = ["total", "love", "wealth", "career", "study", "health"];
const CATEGORY_META = {
  total: {
    label: "\uCD1D\uC6B4",
    focus: "\uC624\uB298 \uD558\uB8E8 \uC804\uCCB4 \uD750\uB984\uACFC \uC6B0\uC120\uC21C\uC704"
  },
  love: {
    label: "\uC560\uC815\uC6B4",
    focus: "\uAD00\uACC4 \uD750\uB984, \uAC10\uC815 \uD45C\uD604, \uB300\uD654 \uD0C0\uC774\uBC0D"
  },
  wealth: {
    label: "\uAE08\uC804\uC6B4",
    focus: "\uC218\uC785/\uC9C0\uCD9C \uAD00\uB9AC, \uAE08\uC804 \uD310\uB2E8, \uC190\uC2E4 \uD68C\uD53C \uD3EC\uC778\uD2B8"
  },
  career: {
    label: "\uC9C1\uC7A5\uC6B4",
    focus: "\uC5C5\uBB34 \uC9D1\uC911, \uD611\uC5C5 \uCEE4\uBBA4\uB2C8\uCF00\uC774\uC158, \uC2E4\uD589 \uC131\uACFC"
  },
  study: {
    label: "\uD559\uC5C5\xB7\uC131\uCDE8\uC6B4",
    focus: "\uC9D1\uC911 \uB9AC\uB4EC, \uD559\uC2B5 \uD6A8\uC728, \uBAA9\uD45C \uB2EC\uC131 \uC804\uB7B5"
  },
  health: {
    label: "\uAC74\uAC15\uC6B4",
    focus: "\uCCB4\uB825 \uB9AC\uB4EC, \uD68C\uBCF5 \uC6B0\uC120\uC21C\uC704, \uC0DD\uD65C \uC2B5\uAD00 \uAD00\uB9AC"
  }
};
const withGeminiTimeout = async (promise, timeoutMs = GEMINI_TIMEOUT_MS) => {
  let timeoutId = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("upstream_timeout"));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
};
const resolveCategoryId = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  return VALID_CATEGORY_IDS.includes(value) ? value : null;
};
const buildSingleCategorySchema = (categoryId, label) => `{
  "score": 85,
  "summary": "${label} \uC911\uC2EC \uC624\uB298 \uC6B4\uC138 \uC694\uC57D",
  "details": "${label} \uC911\uC2EC \uC0C1\uC138 \uD574\uC11D",
  "luckyColor": "\uD589\uC6B4 \uC0C9\uC0C1",
  "luckyItem": "\uD589\uC6B4 \uC544\uC774\uD15C",
  "luckyNumber": 7,
  "healthTip": "\uC624\uB298 \uCEE8\uB514\uC158 \uAD00\uB9AC \uD55C \uC904 \uD301",
  "categories": {
    "${categoryId}": {
      "score": 85,
      "summary": "${label} \uC694\uC57D",
      "detail": "${label} \uC0C1\uC138 \uD574\uC11D",
      "advice": "\uC2E4\uD589 \uAC00\uB2A5\uD55C \uD589\uB3D9 \uC870\uC5B8",
      "luckyTip": "\uC791\uC740 \uD589\uC6B4\uC744 \uB9CC\uB4DC\uB294 \uD301",
      "cautionPoint": "\uC8FC\uC758 \uD3EC\uC778\uD2B8"
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
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const categoryId = resolveCategoryId(rawCategoryId);
    if (!categoryId) {
      return new Response(JSON.stringify({ error: "categoryId is required and must be one of total,love,wealth,career,study,health." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });
    const contextType = dateContext?.type || "today";
    const targetDate = dateContext?.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const categoryMeta = CATEGORY_META[categoryId];
    const schema = buildSingleCategorySchema(categoryId, categoryMeta.label);
    const prompt = `
\uB2F9\uC2E0\uC740 \uC0AC\uC8FC \uAE30\uBC18 \uC624\uB298\uC758 \uC6B4\uC138 \uC804\uBB38\uAC00\uC785\uB2C8\uB2E4.

[\uC0AC\uC6A9\uC790 \uC0AC\uC8FC \uB370\uC774\uD130]
\uD314\uC790: ${JSON.stringify(sajuData.palja)}
\uC624\uD589: ${JSON.stringify(sajuData.oheng)}

[\uBD84\uC11D \uC694\uCCAD]
- \uAE30\uAC04 \uD0C0\uC785: ${contextType}
- \uAE30\uC900 \uB0A0\uC9DC: ${targetDate}
- \uC694\uCCAD \uCE74\uD14C\uACE0\uB9AC: ${categoryMeta.label} (${categoryId})
- \uBD84\uC11D \uCD08\uC810: ${categoryMeta.focus}

\uC911\uC694 \uADDC\uCE59:
1) categories \uAC1D\uCCB4\uC5D0\uB294 \uBC18\uB4DC\uC2DC "${categoryId}" \uD0A4 \uD558\uB098\uB9CC \uD3EC\uD568\uD558\uC138\uC694.
2) total, love, wealth, career, study, health \uC911 "${categoryId}" \uC678 \uB098\uBA38\uC9C0 \uD0A4\uB294 \uC808\uB300 \uC0DD\uC131\uD558\uC9C0 \uB9C8\uC138\uC694.
3) score\uB294 0~100 \uC815\uC218\uB85C \uC791\uC131\uD558\uC138\uC694.
4) "details"\uC640 categories.${categoryId}.detail\uC740 3~5\uBB38\uC7A5 \uC774\uC0C1\uC73C\uB85C \uAD6C\uCCB4\uC801\uC73C\uB85C \uC791\uC131\uD558\uC138\uC694.
5) advice, luckyTip, cautionPoint\uB294 \uC2E4\uD589 \uAC00\uB2A5\uD55C \uBB38\uC7A5\uC73C\uB85C \uC791\uC131\uD558\uC138\uC694.
6) JSON \uC678 \uD14D\uC2A4\uD2B8(\uC124\uBA85, \uCF54\uB4DC\uBE14\uB85D, \uC8FC\uC11D)\uB97C \uCD9C\uB825\uD558\uC9C0 \uB9C8\uC138\uC694.

\uC544\uB798 JSON \uAD6C\uC870\uB97C \uC815\uD655\uD788 \uB530\uB974\uC138\uC694:
${schema}
`;
    const result = await withGeminiTimeout(model.generateContent(prompt));
    const text = result.response.text();
    return new Response(text, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    if (message === "upstream_timeout") {
      return new Response(
        JSON.stringify({
          error: "AI \uBD84\uC11D \uC751\uB2F5\uC774 \uC9C0\uC5F0\uB418\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.",
          code: "UPSTREAM_TIMEOUT"
        }),
        {
          status: 504,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    console.error("Gemini Fortune Error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
