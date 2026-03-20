import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

type EventType = "move" | "contract" | "confession" | "announcement";

const EVENT_SEED: Record<EventType, number> = {
  move: 7,
  contract: 13,
  confession: 17,
  announcement: 19,
};

const EVENT_REASON: Record<EventType, string> = {
  move: "이동·정리·재배치 흐름이 안정적으로 맞는 구간입니다.",
  contract: "조건 검토와 문서 확정에 집중하기 좋은 구간입니다.",
  confession: "감정 표현과 대화 균형이 비교적 안정적인 구간입니다.",
  announcement: "전달력과 확산력이 살아나는 발표 흐름입니다.",
};

const pad = (value: number) => String(value).padStart(2, "0");

const calcScore = (eventType: EventType, year: number, month: number, day: number) => {
  const seed = EVENT_SEED[eventType];
  const raw = (year * 3 + month * 11 + day * seed) % 41;
  const score = 60 + raw;
  return Math.max(0, Math.min(100, score));
};

const buildCaution = (score: number) => {
  if (score >= 90) {
    return "속도보다 확인 절차를 먼저 맞추면 안정감이 높습니다.";
  }
  if (score >= 80) {
    return "핵심 일정 1개에 집중하면 효율이 좋습니다.";
  }
  return "준비 범위를 좁혀 리스크를 먼저 줄이는 편이 유리합니다.";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { eventType, year, month } = await req.json();

    if (!eventType || !year || !month) {
      return new Response(JSON.stringify({ error: "eventType, year, month are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["move", "contract", "confession", "announcement"].includes(eventType)) {
      return new Response(JSON.stringify({ error: "unsupported eventType" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeYear = Number(year);
    const safeMonth = Number(month);
    const endDay = new Date(safeYear, safeMonth, 0).getDate();
    const typedEventType = eventType as EventType;

    const items = Array.from({ length: endDay }, (_, index) => {
      const day = index + 1;
      const score = calcScore(typedEventType, safeYear, safeMonth, day);
      return {
        date: `${safeYear}-${pad(safeMonth)}-${pad(day)}`,
        score,
        reason: EVENT_REASON[typedEventType],
        caution: buildCaution(score),
      };
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return new Response(JSON.stringify({ items }), {
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
