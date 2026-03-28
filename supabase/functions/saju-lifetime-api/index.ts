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

const FUNCTION_NAME = "saju-lifetime-api";
const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_TIMEOUT_MS = 60_000;
const SAJU_GENERATION_CACHE_VERSION = "2026-03-28-lifetime-v2.9";
const YEARLY_CACHE_VERSION = "2026-03-28-yearly-v2.9";
const YEARLY_QUALITY_GATE_VERSION = "yearly-gate-v2.9";

const apiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
const genAI = new GoogleGenerativeAI(apiKey);

type RequestMeta = {
  source?: "manual" | "profile-auto";
  traceId?: string;
};

type ResponseLogMeta = {
  traceId: string;
  source: "manual" | "profile-auto";
  serviceType: string;
  elapsedMs: number;
  code?: string;
};

const logEvent = (stage: string, details: Record<string, unknown>) => {
  console.info(JSON.stringify({
    function: FUNCTION_NAME,
    stage,
    ...details,
  }));
};

const logError = (stage: string, details: Record<string, unknown>) => {
  console.error(JSON.stringify({
    function: FUNCTION_NAME,
    stage,
    ...details,
  }));
};

const buildJsonResponse = (
  body: Record<string, unknown>,
  status: number,
  meta: ResponseLogMeta,
) => {
  logEvent("response_sent", {
    traceId: meta.traceId,
    source: meta.source,
    serviceType: meta.serviceType,
    status,
    elapsedMs: meta.elapsedMs,
    code: meta.code,
    responseKind: "json",
  });

  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
};

const buildRawJsonResponse = (body: string, meta: ResponseLogMeta) => {
  logEvent("response_sent", {
    traceId: meta.traceId,
    source: meta.source,
    serviceType: meta.serviceType,
    status: 200,
    elapsedMs: meta.elapsedMs,
    responseKind: "raw-json",
    bodyLength: body.length,
  });

  return new Response(body, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const parseJsonSafely = (value: string): unknown | null => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const formatDateParts = (date: Date, timeZone?: string): { year: number; month: number; day: number } => {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(date);
    const year = Number(parts.find((part) => part.type === "year")?.value ?? NaN);
    const month = Number(parts.find((part) => part.type === "month")?.value ?? NaN);
    const day = Number(parts.find((part) => part.type === "day")?.value ?? NaN);
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      return { year, month, day };
    }
  } catch {
    // ignore
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
};

const calculateManAge = (
  profile: { year?: number; month?: number; day?: number } | null,
  timeZone?: string,
): number | null => {
  if (!profile || !Number.isFinite(Number(profile.year)) || !Number.isFinite(Number(profile.month)) || !Number.isFinite(Number(profile.day))) {
    return null;
  }

  const now = formatDateParts(new Date(), timeZone);
  const birthYear = Number(profile.year);
  const birthMonth = Number(profile.month);
  const birthDay = Number(profile.day);
  let age = now.year - birthYear;
  const birthdayNotPassed = now.month < birthMonth || (now.month === birthMonth && now.day < birthDay);
  if (birthdayNotPassed) {
    age -= 1;
  }

  return clamp(age, 0, 89);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const requestStartedAt = Date.now();
  let traceId = crypto.randomUUID();
  let source: "manual" | "profile-auto" = "manual";
  let serviceType = "traditional-saju";

  try {
    const payload = await req.json();
    const {
      sajuData,
      interests,
      freeQuestion,
      serviceType: nextServiceType = "traditional-saju",
      requestMeta,
    } = payload as {
      sajuData?: unknown;
      interests?: unknown;
      freeQuestion?: unknown;
      serviceType?: unknown;
      requestMeta?: RequestMeta;
    };

    if (requestMeta?.source === "profile-auto" || requestMeta?.source === "manual") {
      source = requestMeta.source;
    }
    if (typeof requestMeta?.traceId === "string" && requestMeta.traceId.trim()) {
      traceId = requestMeta.traceId;
    }
    if (typeof nextServiceType === "string" && nextServiceType.trim()) {
      serviceType = nextServiceType;
    }

    logEvent("request_parsed", {
      traceId,
      source,
      serviceType,
      interestCount: Array.isArray(interests) ? interests.length : 0,
      hasFreeQuestion: typeof freeQuestion === "string" && freeQuestion.trim().length > 0,
    });

    if (!sajuData || !Array.isArray(interests)) {
      return buildJsonResponse(
        {
          error: "sajuData and interests are required.",
          traceId,
          serviceType,
        },
        400,
        {
          traceId,
          source,
          serviceType,
          elapsedMs: Date.now() - requestStartedAt,
        },
      );
    }

    if (!apiKey) {
      return buildJsonResponse(
        {
          error: "saju-lifetime-api is unavailable: missing GEMINI_API_KEY",
          traceId,
          serviceType,
        },
        503,
        {
          traceId,
          source,
          serviceType,
          elapsedMs: Date.now() - requestStartedAt,
        },
      );
    }

    const strategy = getSajuReportStrategy(serviceType);
    const isYearlyCalendarService = serviceType === "saju-yearly-action-calendar";
    const effectiveCacheVersion = isYearlyCalendarService
      ? `${YEARLY_CACHE_VERSION}-${YEARLY_QUALITY_GATE_VERSION}`
      : SAJU_GENERATION_CACHE_VERSION;
    const now = new Date();
    const profileMeta = (sajuData as { profileMeta?: Record<string, unknown> }).profileMeta ?? {};
    const profileData = (profileMeta as { profileData?: Record<string, unknown> }).profileData ?? {};
    const timeZone = typeof (profileMeta as { timezone?: unknown }).timezone === "string"
      ? String((profileMeta as { timezone?: unknown }).timezone)
      : "Asia/Seoul";
    const currentDateParts = formatDateParts(now, timeZone);
    const currentAge = calculateManAge(
      {
        year: Number((profileData as { year?: unknown }).year ?? NaN),
        month: Number((profileData as { month?: unknown }).month ?? NaN),
        day: Number((profileData as { day?: unknown }).day ?? NaN),
      },
      timeZone,
    );
    const currentDateLocal = `${currentDateParts.year}-${String(currentDateParts.month).padStart(2, "0")}-${String(currentDateParts.day).padStart(2, "0")}`;
    const promptProfileMeta = {
      timezone: timeZone,
      solarDate: (profileMeta as { solarDate?: unknown }).solarDate ?? null,
      birthPrecision: (profileMeta as { birthPrecision?: unknown }).birthPrecision ?? "unknown",
      currentYear: (profileMeta as { currentYear?: unknown }).currentYear ?? currentDateParts.year,
    };
    const normalizedFreeQuestion = typeof freeQuestion === "string" && freeQuestion.trim().length > 0
      ? freeQuestion.trim()
      : "none";
    const cacheClient = getSajuGenerationCacheClient();
    let cacheKey: string | null = null;

    if (cacheClient) {
      try {
        cacheKey = await buildSajuGenerationCacheKey({
          cacheVersion: effectiveCacheVersion,
          serviceType,
          reportTemplateVersion: strategy.reportTemplateVersion,
          currentDateLocal,
          currentYear: currentDateParts.year,
          currentAge: typeof currentAge === "number" ? currentAge : "unknown",
          timezone: timeZone,
          sajuData,
          interests,
          freeQuestion: normalizedFreeQuestion,
        });

        const cachedPayload = await readSajuGenerationCache(cacheClient, cacheKey);
        if (cachedPayload !== null) {
          const cachedBody = typeof cachedPayload === "string"
            ? cachedPayload
            : JSON.stringify(cachedPayload);
          logEvent("cache_hit", {
            traceId,
            source,
            serviceType,
            cacheKey,
            reportTemplateVersion: strategy.reportTemplateVersion,
            yearlyQualityGateVersion: isYearlyCalendarService ? YEARLY_QUALITY_GATE_VERSION : undefined,
          });
          return buildRawJsonResponse(cachedBody, {
            traceId,
            source,
            serviceType,
            elapsedMs: Date.now() - requestStartedAt,
          });
        }

        logEvent("cache_miss", {
          traceId,
          source,
          serviceType,
          cacheKey,
          reportTemplateVersion: strategy.reportTemplateVersion,
          yearlyQualityGateVersion: isYearlyCalendarService ? YEARLY_QUALITY_GATE_VERSION : undefined,
        });
      } catch (cacheError) {
        console.warn("[saju-lifetime-api] cache lookup skipped", {
          traceId,
          serviceType,
          error: cacheError instanceof Error ? cacheError.message : String(cacheError),
        });
      }
    }

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { responseMimeType: "application/json" },
    });

    let prompt = `
${strategy.systemInstruction}

[User Saju Data]
Palja: ${JSON.stringify((sajuData as { palja?: unknown }).palja ?? {})}
Oheng: ${JSON.stringify((sajuData as { oheng?: unknown }).oheng ?? [])}
Yongsin: ${JSON.stringify((sajuData as { yongsin?: unknown }).yongsin ?? [])}
Sinsal: ${JSON.stringify((sajuData as { sinsal?: unknown }).sinsal ?? [])}
Profile Meta (compact): ${JSON.stringify(promptProfileMeta)}

[Interests / Question]
Interests: ${interests.join(", ")}
Question: ${normalizedFreeQuestion}
Service Type: ${serviceType}

[Time Anchor Context]
Timezone: ${timeZone}
Current Date (Local): ${currentDateLocal}
Current Year: ${currentDateParts.year}
Current Age (만 나이, 0~89): ${typeof currentAge === "number" ? currentAge : "unknown"}
Age Upper Bound: 89
Anchor Rule: 모든 리포트는 현재 시점을 공통 기준으로 사용하되, 서비스별 시간 해상도 규칙을 따를 것.

Return only JSON in this schema:
${strategy.responseSchema}
`;
    prompt = strategy.postProcessor(prompt);

    logEvent("prompt_built", {
      traceId,
      source,
      serviceType,
      promptLength: prompt.length,
      reportTemplateVersion: strategy.reportTemplateVersion,
    });

    const geminiStartedAt = Date.now();
    logEvent("gemini_started", {
      traceId,
      source,
      serviceType,
      model: GEMINI_MODEL,
      timeoutMs: GEMINI_TIMEOUT_MS,
    });

    const result = await withGeminiTimeout(model.generateContent(prompt));
    const text = result.response.text();
    const parsedResponse = parseJsonSafely(text);

    logEvent("gemini_succeeded", {
      traceId,
      source,
      serviceType,
      elapsedMs: Date.now() - geminiStartedAt,
      bodyLength: text.length,
    });

    if (cacheClient && cacheKey && parsedResponse !== null) {
      await writeSajuGenerationCache(cacheClient, {
        cacheKey,
        serviceType,
        reportTemplateVersion: strategy.reportTemplateVersion,
        responsePayload: parsedResponse,
      });
      logEvent("cache_written", {
        traceId,
        source,
        serviceType,
        cacheKey,
        reportTemplateVersion: strategy.reportTemplateVersion,
        yearlyQualityGateVersion: isYearlyCalendarService ? YEARLY_QUALITY_GATE_VERSION : undefined,
      });
    }

    return buildRawJsonResponse(text, {
      traceId,
      source,
      serviceType,
      elapsedMs: Date.now() - requestStartedAt,
    });
  } catch (error) {
    const elapsedMs = Date.now() - requestStartedAt;
    const message = error instanceof Error ? error.message : "unknown error";

    if (message === "upstream_timeout") {
      logError("gemini_timed_out", {
        traceId,
        source,
        serviceType,
        elapsedMs,
        timeoutMs: GEMINI_TIMEOUT_MS,
      });

      return buildJsonResponse(
        {
          error: "AI 분석 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
          code: "UPSTREAM_TIMEOUT",
          traceId,
          elapsedMs,
          serviceType,
        },
        504,
        {
          traceId,
          source,
          serviceType,
          elapsedMs,
          code: "UPSTREAM_TIMEOUT",
        },
      );
    }

    logError("request_failed", {
      traceId,
      source,
      serviceType,
      elapsedMs,
      message,
    });

    return buildJsonResponse(
      {
        error: message,
        traceId,
        serviceType,
      },
      500,
      {
        traceId,
        source,
        serviceType,
        elapsedMs,
      },
    );
  }
});
