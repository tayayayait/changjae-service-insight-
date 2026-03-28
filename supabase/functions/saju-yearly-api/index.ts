import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.14.0";
import { corsHeaders } from "../_shared/cors.ts";
import { getSajuReportStrategy } from "../_shared/prompt-templates.ts";
import {
  buildSajuGenerationCacheKey,
  getSajuGenerationCacheClient,
  readSajuGenerationCache,
  writeSajuGenerationCache,
} from "../_shared/saju-generation-cache.ts";

const apiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
const genAI = new GoogleGenerativeAI(apiKey);
const FUNCTION_NAME = "saju-yearly-api";
const DEFAULT_NEW_YEAR = 2026;
const GEMINI_TIMEOUT_MS = 60_000;
const UPSTREAM_TIMEOUT_CODE = "UPSTREAM_TIMEOUT";
const SAJU_GENERATION_CACHE_VERSION = "2026-03-28-yearly-gate-v1";
const YEARLY_QUALITY_GATE_VERSION = "yearly-quality-gate-v1";

const NEW_YEAR_2026_SERVICE_TYPES = new Set([
  "saju-2026-overview",
  "saju-2026-study-exam",
  "saju-2026-yearly-outlook",
  "saju-love-focus",
  "saju-2026-wealth-business",
  "saju-2026-investment-assets",
  "saju-2026-career-aptitude",
  "saju-2026-health-balance",
]);

const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

const normalizeYear = (value: unknown, fallbackYear: number): number => {
  const numericYear = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericYear)) {
    return fallbackYear;
  }
  return Math.trunc(numericYear);
};

const normalizeServiceType = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const logEvent = (stage: string, details: Record<string, unknown>) => {
  console.info(JSON.stringify({ function: FUNCTION_NAME, stage, ...details }));
};

const withGeminiTimeout = async <T>(promise: Promise<T>, timeoutMs = GEMINI_TIMEOUT_MS): Promise<T> => {
  let timeoutId: number | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("upstream_timeout")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
};

const parseJsonSafely = (value: string): unknown | null => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const requestStartedAt = Date.now();
  let traceId = crypto.randomUUID();
  let serviceTypeForLog = "yearly-summary";

  try {
    const payload = (await req.json()) as Record<string, unknown>;
    const { sajuData, year, serviceType, interests, freeQuestion, requestMeta } = payload;
    const normalizedServiceType = normalizeServiceType(serviceType);
    if (
      typeof requestMeta === "object" &&
      requestMeta !== null &&
      typeof (requestMeta as { traceId?: unknown }).traceId === "string" &&
      (requestMeta as { traceId: string }).traceId.trim().length > 0
    ) {
      traceId = (requestMeta as { traceId: string }).traceId;
    }
    const parsedSajuData =
      typeof sajuData === "object" && sajuData !== null ? (sajuData as Record<string, unknown>) : null;
    const isNewYear2026Service =
      typeof normalizedServiceType === "string" && NEW_YEAR_2026_SERVICE_TYPES.has(normalizedServiceType);
    if (normalizedServiceType) {
      serviceTypeForLog = normalizedServiceType;
    }
    const targetYear = normalizeYear(year, DEFAULT_NEW_YEAR);
    const cacheClient = getSajuGenerationCacheClient();

    logEvent("request_parsed", {
      traceId,
      serviceType: serviceTypeForLog,
      isNewYear2026Service,
      targetYear,
    });

    if (!parsedSajuData?.palja || !parsedSajuData?.oheng) {
      return new Response(JSON.stringify({ error: "sajuData.palja and sajuData.oheng are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (normalizedServiceType && !isNewYear2026Service) {
      return new Response(
        JSON.stringify({
          error: "unsupported serviceType for saju-yearly-api",
          serviceType: normalizedServiceType,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "yearly-fortune is unavailable: missing GEMINI_API_KEY" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    if (isNewYear2026Service) {
      const strategy = getSajuReportStrategy(normalizedServiceType);
      const normalizedInterests = normalizeStringArray(interests);
      const normalizedQuestion =
        typeof freeQuestion === "string" && freeQuestion.trim().length > 0 ? freeQuestion.trim() : "none";
      const profileMeta =
        parsedSajuData && typeof parsedSajuData.profileMeta === "object" && parsedSajuData.profileMeta !== null
          ? (parsedSajuData.profileMeta as Record<string, unknown>)
          : {};
      const promptProfileMeta = {
        timezone: typeof profileMeta.timezone === "string" ? profileMeta.timezone : "Asia/Seoul",
        solarDate: profileMeta.solarDate ?? null,
        birthPrecision: profileMeta.birthPrecision ?? "unknown",
        currentYear: profileMeta.currentYear ?? targetYear,
      };
      let cacheKey: string | null = null;

      if (cacheClient) {
        try {
          cacheKey = await buildSajuGenerationCacheKey({
            cacheVersion: SAJU_GENERATION_CACHE_VERSION,
            yearlyQualityGateVersion: YEARLY_QUALITY_GATE_VERSION,
            mode: "new-year-2026-service",
            serviceType: normalizedServiceType,
            reportTemplateVersion: strategy.reportTemplateVersion,
            targetYear,
            sajuData: parsedSajuData,
            interests: normalizedInterests,
            freeQuestion: normalizedQuestion,
          });

          const cachedPayload = await readSajuGenerationCache(cacheClient, cacheKey);
          if (cachedPayload !== null) {
            logEvent("cache_hit", {
              traceId,
              serviceType: serviceTypeForLog,
              cacheKey,
              reportTemplateVersion: strategy.reportTemplateVersion,
            });
            return new Response(JSON.stringify(cachedPayload), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          logEvent("cache_miss", {
            traceId,
            serviceType: serviceTypeForLog,
            cacheKey,
            reportTemplateVersion: strategy.reportTemplateVersion,
          });
        } catch (cacheError) {
          console.warn("[saju-yearly-api] cache lookup skipped", {
            traceId,
            serviceType: serviceTypeForLog,
            error: cacheError instanceof Error ? cacheError.message : String(cacheError),
          });
        }
      }

      let prompt = `
${strategy.systemInstruction}

[User Saju Data]
Palja: ${JSON.stringify(parsedSajuData.palja)}
Oheng: ${JSON.stringify(parsedSajuData.oheng)}
Yongsin: ${JSON.stringify(parsedSajuData.yongsin ?? [])}
Sinsal: ${JSON.stringify(parsedSajuData.sinsal ?? [])}
Profile Meta (compact): ${JSON.stringify(promptProfileMeta)}

[Interests / Question]
Interests: ${normalizedInterests.length > 0 ? normalizedInterests.join(", ") : "none"}
Question: ${normalizedQuestion}
Service Type: ${normalizedServiceType}
Target Year: ${targetYear}

Return only JSON in this schema:
${strategy.responseSchema}
`;
      prompt = strategy.postProcessor(prompt);

      const result = await withGeminiTimeout(model.generateContent(prompt));
      const text = result.response.text();
      const parsedResponse = parseJsonSafely(text);

      if (cacheClient && cacheKey && parsedResponse !== null) {
        await writeSajuGenerationCache(cacheClient, {
          cacheKey,
          serviceType: normalizedServiceType,
          reportTemplateVersion: strategy.reportTemplateVersion,
          responsePayload: parsedResponse,
        });
        logEvent("cache_written", {
          traceId,
          serviceType: serviceTypeForLog,
          cacheKey,
          reportTemplateVersion: strategy.reportTemplateVersion,
        });
      }

      logEvent("response_sent", {
        traceId,
        serviceType: serviceTypeForLog,
        status: 200,
        elapsedMs: Date.now() - requestStartedAt,
      });

      return new Response(text, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof year !== "number" || !Number.isFinite(year)) {
      return new Response(JSON.stringify({ error: "year is required for yearly summary mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let summaryCacheKey: string | null = null;
    if (cacheClient) {
      try {
        summaryCacheKey = await buildSajuGenerationCacheKey({
          cacheVersion: SAJU_GENERATION_CACHE_VERSION,
          yearlyQualityGateVersion: YEARLY_QUALITY_GATE_VERSION,
          mode: "yearly-summary",
          serviceType: "yearly-summary",
          reportTemplateVersion: "yearly-summary-v1",
          targetYear,
          sajuData: {
            palja: parsedSajuData.palja,
            oheng: parsedSajuData.oheng,
          },
        });

        const cachedPayload = await readSajuGenerationCache(cacheClient, summaryCacheKey);
        if (cachedPayload !== null) {
          logEvent("cache_hit", {
            traceId,
            serviceType: serviceTypeForLog,
            cacheKey: summaryCacheKey,
            reportTemplateVersion: "yearly-summary-v1",
          });
          return new Response(JSON.stringify(cachedPayload), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        logEvent("cache_miss", {
          traceId,
          serviceType: serviceTypeForLog,
          cacheKey: summaryCacheKey,
          reportTemplateVersion: "yearly-summary-v1",
        });
      } catch (cacheError) {
        console.warn("[saju-yearly-api] summary cache lookup skipped", {
          traceId,
          serviceType: serviceTypeForLog,
          error: cacheError instanceof Error ? cacheError.message : String(cacheError),
        });
      }
    }

    const prompt = `
당신은 한국어 사주 연간운 분석가입니다.
기준 연도: ${targetYear}
팔자: ${JSON.stringify(parsedSajuData.palja)}
오행: ${JSON.stringify(parsedSajuData.oheng)}

아래 JSON 형식으로만 답변하세요:
{
  "year": ${targetYear},
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
- summary는 2-3문장으로 간결하게 유지하되, 전체적인 해석(detailed explanation)은 최대한 상세하고 풍부하게 작성
- 공포/단정 금지
- 행동 가능한 조언 중심
- 한국어
`;

    const result = await withGeminiTimeout(model.generateContent(prompt));
    const text = result.response.text();
    const parsedResponse = parseJsonSafely(text);

    if (cacheClient && summaryCacheKey && parsedResponse !== null) {
      await writeSajuGenerationCache(cacheClient, {
        cacheKey: summaryCacheKey,
        serviceType: "yearly-summary",
        reportTemplateVersion: "yearly-summary-v1",
        responsePayload: parsedResponse,
      });
      logEvent("cache_written", {
        traceId,
        serviceType: serviceTypeForLog,
        cacheKey: summaryCacheKey,
        reportTemplateVersion: "yearly-summary-v1",
      });
    }

    logEvent("response_sent", {
      traceId,
      serviceType: serviceTypeForLog,
      status: 200,
      elapsedMs: Date.now() - requestStartedAt,
    });

    return new Response(text, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    if (message === "upstream_timeout") {
      logEvent("upstream_timeout", {
        traceId,
        serviceType: serviceTypeForLog,
        elapsedMs: Date.now() - requestStartedAt,
        timeoutMs: GEMINI_TIMEOUT_MS,
      });
      return new Response(
        JSON.stringify({
          error: "AI 분석 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
          code: UPSTREAM_TIMEOUT_CODE,
          traceId,
          serviceType: serviceTypeForLog,
        }),
        {
          status: 504,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    logEvent("request_failed", {
      traceId,
      serviceType: serviceTypeForLog,
      elapsedMs: Date.now() - requestStartedAt,
      message,
    });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
