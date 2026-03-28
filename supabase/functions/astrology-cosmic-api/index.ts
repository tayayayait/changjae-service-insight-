import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  AstrologyRequestInput,
  buildCalendarFallback,
  buildNatalChart,
  buildTransitMonth,
  normalizeBirthRequest,
  resolveCoordinatesFromLocation,
} from "../_shared/astrology-core.ts";

type AnyRecord = Record<string, unknown>;
const CALC_ENGINE_ERROR_CODE = "CALC_ENGINE_UNAVAILABLE";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const isRecord = (value: unknown): value is AnyRecord => typeof value === "object" && value !== null;
const toNum = (value: unknown, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const toInt = (value: unknown, fallback: number) => Math.trunc(toNum(value, fallback));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const resolveCalendarRequest = (body: unknown) => {
  const payload = isRecord(body) && isRecord(body.payload) ? body.payload : body;
  const year = clamp(toInt(isRecord(payload) ? payload.year : undefined, new Date().getFullYear()), 1900, 2100);
  const month = clamp(toInt(isRecord(payload) ? payload.month : undefined, new Date().getMonth() + 1), 1, 12);
  const profile = isRecord(payload) && isRecord(payload.profile) ? payload.profile : null;
  return { year, month, profile };
};

const buildBirthRequestFromProfile = (profile: AnyRecord | null): Partial<AstrologyRequestInput> => {
  const coords = resolveCoordinatesFromLocation(profile?.location);
  const hourValue = profile?.hour;
  const minuteValue = profile?.minute;
  const birthTimeKnown = typeof hourValue === "number" && Number.isFinite(hourValue);

  return normalizeBirthRequest({
    name: typeof profile?.name === "string" && profile.name.trim() ? profile.name.trim() : "User",
    year: toInt(profile?.year, 1995),
    month: toInt(profile?.month, 1),
    day: toInt(profile?.day, 1),
    hour: birthTimeKnown ? toInt(hourValue, 12) : 12,
    minute: birthTimeKnown ? toInt(minuteValue, 0) : 0,
    lat: typeof profile?.lat === "number" ? profile.lat : coords.lat,
    lng: typeof profile?.lng === "number" ? profile.lng : coords.lng,
    tz_str: typeof profile?.tz_str === "string" ? profile.tz_str : coords.tz,
    birthTimeKnown,
  });
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
    const request = resolveCalendarRequest(body);
    console.info("[astrology-cosmic-api] request", { year: request.year, month: request.month });

    const birthRequest = buildBirthRequestFromProfile(request.profile);
    const natal = await buildNatalChart(birthRequest);
    const transitMonth = await buildTransitMonth(birthRequest, request.year, request.month);
    const deterministic = buildCalendarFallback(transitMonth, natal);

    console.info("[astrology-cosmic-api] complete", { elapsedMs: Date.now() - startedAt });
    return jsonResponse(deterministic);
  } catch (error) {
    console.error("[astrology-cosmic-api] unhandled error:", error);
    const message = error instanceof Error ? error.message : "unknown error";

    if (message.includes("CircularNatalHoroscopeJS calculation failed")) {
      return jsonResponse(
        {
          error: "계산 엔진을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
          code: CALC_ENGINE_ERROR_CODE,
          status: 503,
        },
        503,
      );
    }

    return jsonResponse(
      { error: message, code: "COSMIC_CALENDAR_BUILD_FAILED", status: 500 },
      500,
    );
  }
});
