import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.14.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";
import { buildDailyPromptContext, resolveSignByInput } from "../_shared/astrology-core.ts";

type AnyRecord = Record<string, unknown>;
type MetaBasis = "sign_context";

const apiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
const genAI = new GoogleGenerativeAI(apiKey);
const GEMINI_TIMEOUT_MS = 60_000;

// Supabase 관리자 클라이언트 초기화 (조회 및 저장용)
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

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

const isRecord = (value: unknown): value is AnyRecord => typeof value === "object" && value !== null;

const toNonEmptyString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : "";

const resolveRequestDate = (payload: unknown, fallbackDate: string) => {
  if (!isRecord(payload) || !isRecord(payload.context)) return fallbackDate;
  const candidate = toNonEmptyString(payload.context.requestDate);
  if (!candidate) return fallbackDate;
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : fallbackDate;
};

const withProxyMeta = (payload: unknown, requestDate: string, basis: MetaBasis, mode: "cached" | "generated") => {
  if (!isRecord(payload)) return payload;
  const meta = isRecord(payload.meta) ? payload.meta : {};
  return {
    ...payload,
    meta: {
      ...meta,
      source: "proxy",
      basis,
      requestDate,
      engine: `gemini_3_flash_preview_sign_context_v2_${mode}`,
    },
  };
};

const toKstDisplayDate = (isoDate: string) => {
  const safe = /^\d{4}-\d{2}-\d{2}$/.test(isoDate)
    ? isoDate
    : new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
  const date = new Date(`${safe}T00:00:00+09:00`);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  }).format(date);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "POST only" }, 405);
  }

  try {
    const startedAt = Date.now();
    const body = await req.json();
    const payload = isRecord(body?.payload) ? body.payload : body;
    const sign = resolveSignByInput(isRecord(payload) ? payload.sign : undefined);

    // 기본 날짜. KST 기준 오늘 날짜 문자열(sv-SE 포맷) 제공
    const defaultDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
    const requestDate = resolveRequestDate(payload, defaultDate);
    const dateLabel = toKstDisplayDate(requestDate);
    const basis: MetaBasis = "sign_context";

    // 1. Supabase 데이터베이스 캐시(Cache Hit) 조회
    const { data: cachedData, error: selectError } = await supabase
      .from("daily_horoscope_cache")
      .select("horoscope")
      .eq("target_date", requestDate)
      .eq("sign_id", sign.id)
      .maybeSingle();

    if (!selectError && cachedData?.horoscope) {
      console.info("[astrology-daily-api] cache hit", { sign: sign.id, requestDate, elapsedMs: Date.now() - startedAt });
      const payloadResult = {
        success: true,
        data: {
          sign: sign.id,
          horoscope: cachedData.horoscope,
        },
      };
      return jsonResponse(withProxyMeta(payloadResult, requestDate, basis, "cached"));
    }

    // 2. 캐시 미스(Cache Miss): LLM을 사용해 새 운세 생성
    console.info("[astrology-daily-api] cache miss - generating", { sign: sign.id, requestDate, llm: true });
    const context = buildDailyPromptContext(sign.id);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });

    const prompt = `
당신은 친절하고 전문적인 서양 점성학(Astrology) 운세 전문가입니다.

[요청 정보]
별자리: ${context.signKo} (${context.element}, ${context.quality})
대상 날짜: ${dateLabel} (${requestDate})

위 사용자의 별자리 특성(원소, 모드 등)이 지정된 '대상 날짜'의 전반적인 우주 에너지 흐름(행성들의 일상적인 운행 등)과 어떻게 상호작용하는지 분석하여, 오늘 맞춤형 운세를 작성해 주세요. 
**중요**: 날짜가 다르면 매일매일 완전히 달라지는 새롭고 구체적인 내용과 조언을 생성해야 합니다. 고정된 답변을 반복하지 마세요.

반드시 아래 마크다운 템플릿의 형식을 정확히 지켜서 출력하세요. (제목 항목 기호 ### 유지)

\`\`\`markdown
### ${context.signKo} 오늘의 흐름
기준일: ${dateLabel} (KST)
(여기에 당일의 에너지 흐름을 점성학적 관점에서 3~4문장으로 따뜻하게 서술)

### 오늘 한 줄 결론
(오늘 가장 핵심이 되는 행동 지침을 1문장으로 요약)

### 지금 할 일 1개
(지금 당장 실천할 수 있는 가장 확실하고 구체적인 행동 1가지)

### 오늘 피할 일 1개
(오늘 하루 가장 경계하거나 피해야 할 구체적인 상황/행동 1가지)

### 오늘 즉시 실행 체크리스트
- 지금 10분: (할 일 구체화)
- 집중 시간: (핵심 작업 명시)
- 종료 점검: (마무리 조언)

### 집중 시간대
(예: 오전 09:00~11:00 등 오늘 가장 효율이 좋은 시간대 1개)

### 관계 한 문장
(인간관계나 대화에서 도움되는 명확한 팁 1문장)

### 컨디션 한 문장
(건강 관리, 멘탈, 루틴에 관한 명확한 팁 1문장)

### 럭키 사인
- 행운 컬러: (오늘 어울리는 컬러 1개)
- 행운 키워드: (오늘을 대표하는 단어 1개)
\`\`\`
`.trim();

    const result = await withGeminiTimeout(model.generateContent(prompt));
    let horoscopeText = result.response.text().trim();

    // LLM이 마크다운 코드블럭(```markdown ... ```)으로 감싸서 준 경우 벗겨냄
    if (horoscopeText.startsWith('```markdown')) {
      horoscopeText = horoscopeText.replace(/^```markdown\n?/i, '').replace(/\n?```$/i, '').trim();
    } else if (horoscopeText.startsWith('```')) {
      horoscopeText = horoscopeText.replace(/^```\n?/i, '').replace(/\n?```$/i, '').trim();
    }

    const payloadResult = {
      success: true,
      data: {
        sign: context.signId,
        horoscope: horoscopeText,
      },
    };

    // 3. 생성된 운세를 데이터베이스에 Upsert 저장
    if (supabaseUrl && supabaseServiceKey) {
      const { error: upsertError } = await supabase.from("daily_horoscope_cache").upsert(
        {
          target_date: requestDate,
          sign_id: sign.id,
          horoscope: horoscopeText,
          // created_at 은 DB DEFAULT NOW() 를 따름
        },
        { onConflict: "target_date,sign_id" }
      );

      if (upsertError) {
        console.error("[astrology-daily-api] Cache save error:", upsertError);
      }
    }

    console.info("[astrology-daily-api] complete generation and saved cache", {
      source: "proxy",
      basis,
      llm: true,
      elapsedMs: Date.now() - startedAt,
    });

    return jsonResponse(withProxyMeta(payloadResult, requestDate, basis, "generated"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    if (message === "upstream_timeout") {
      return jsonResponse(
        {
          error: "AI 분석 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
          code: "UPSTREAM_TIMEOUT",
        },
        504,
      );
    }

    console.error("Gemini Horoscoper Error:", error);
    return jsonResponse(
      { error: message },
      500,
    );
  }
});
