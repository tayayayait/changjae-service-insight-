import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.14.0";
import { corsHeaders } from "../_shared/cors.ts";
import {
  buildChatPrompt,
  trimHistory,
  type ChatTurn,
  type SajuChatContext,
} from "../_shared/chatPrompts.ts";

const FUNCTION_NAME = "saju-chat-api";
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_TIMEOUT_MS = 60_000;
const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_TURNS = 10;
const NO_CREDITS_CODE = "NO_CREDITS";
const CREDIT_CONSUME_FAILED_CODE = "CREDIT_CONSUME_FAILED";

const apiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const genAI = new GoogleGenerativeAI(apiKey);

type RequestMeta = {
  traceId?: string;
};

type UsageSource = "input" | "suggestion";

type ResponseLogMeta = {
  traceId: string;
  status: number;
  elapsedMs: number;
  code?: string;
};

type ConsumeRow = {
  charged: boolean;
  reason: string;
  free_used: number;
  paid_remaining: number;
  total: number;
  remaining: number;
  charged_from: string | null;
  next_free_reset_at: string | null;
};

type RefundRow = {
  applied: boolean;
  reason: string;
  free_used: number;
  paid_remaining: number;
  total: number;
  remaining: number;
  next_free_reset_at: string | null;
};

type ModelPayload = {
  reply: string;
  tags?: string[];
  followUpSuggestions?: string[];
};

const logEvent = (stage: string, details: Record<string, unknown>) => {
  console.info(
    JSON.stringify({
      function: FUNCTION_NAME,
      stage,
      ...details,
    }),
  );
};

const logError = (stage: string, details: Record<string, unknown>) => {
  console.error(
    JSON.stringify({
      function: FUNCTION_NAME,
      stage,
      ...details,
    }),
  );
};

const normalizeToken = (value: unknown) => String(value ?? "").trim();
const isUsageSource = (value: string): value is UsageSource =>
  value === "input" || value === "suggestion";

const buildJsonResponse = (body: Record<string, unknown>, meta: ResponseLogMeta) => {
  logEvent("response_sent", {
    traceId: meta.traceId,
    status: meta.status,
    elapsedMs: meta.elapsedMs,
    code: meta.code,
  });

  return new Response(JSON.stringify(body), {
    status: meta.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
};

const buildJsonErrorResponse = (
  body: { error: string; code?: string; traceId: string; elapsedMs?: number; quota?: Record<string, unknown> },
  meta: ResponseLogMeta,
) => {
  logError("request_failed", {
    traceId: meta.traceId,
    status: meta.status,
    code: meta.code,
    error: body.error,
    elapsedMs: meta.elapsedMs,
  });

  return buildJsonResponse(body, meta);
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isValidChatTurn = (turn: unknown): turn is ChatTurn => {
  if (!isRecord(turn)) return false;
  return (
    (turn.role === "user" || turn.role === "assistant") &&
    typeof turn.content === "string"
  );
};

const parseModelPayload = (text: string): ModelPayload => {
  const parsed = JSON.parse(text) as Partial<ModelPayload>;
  const reply = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
  if (!reply) {
    throw new Error("invalid_ai_payload");
  }

  return {
    reply,
    tags: Array.isArray(parsed.tags) ? parsed.tags.filter((item) => typeof item === "string") : [],
    followUpSuggestions: Array.isArray(parsed.followUpSuggestions)
      ? parsed.followUpSuggestions.filter((item) => typeof item === "string")
      : [],
  };
};

const toQuotaPayload = (
  row: Pick<ConsumeRow, "remaining" | "total" | "next_free_reset_at">,
  charged: boolean,
) => ({
  remaining: Number(row.remaining ?? 0),
  total: Number(row.total ?? 0),
  charged,
  nextFreeResetAt:
    typeof row.next_free_reset_at === "string" && row.next_free_reset_at.trim()
      ? row.next_free_reset_at
      : null,
});

const refundConsumedCredit = async (params: {
  supabase: ReturnType<typeof createClient>;
  ownerKey: string;
  profileKey: string;
  usageId: string;
  traceId: string;
}) => {
  const { supabase, ownerKey, profileKey, usageId, traceId } = params;
  const { data, error } = await supabase.rpc("chat_credit_refund", {
    p_owner_key: ownerKey,
    p_usage_id: usageId,
    p_profile_key: profileKey,
    p_source: "ai-failure-refund",
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (Array.isArray(data) ? data[0] : data) as RefundRow | null;
  logEvent("refund_result", {
    traceId,
    usageId,
    applied: Boolean(row?.applied),
    reason: row?.reason ?? "unknown",
    remaining: Number(row?.remaining ?? 0),
  });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const requestStartedAt = Date.now();
  let traceId = crypto.randomUUID();
  let consumeRow: ConsumeRow | null = null;
  let ownerKey = "";
  let profileKey = "";
  let usageId = "";

  try {
    const body = await req.json() as {
      message?: unknown;
      conversationHistory?: unknown;
      sajuContext?: unknown;
      requestMeta?: RequestMeta;
      ownerKey?: unknown;
      profileKey?: unknown;
      usageId?: unknown;
      usageSource?: unknown;
    };

    const requestMeta = isRecord(body.requestMeta) ? (body.requestMeta as RequestMeta) : null;
    if (typeof requestMeta?.traceId === "string" && requestMeta.traceId.trim()) {
      traceId = requestMeta.traceId;
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    const rawHistory = Array.isArray(body.conversationHistory) ? body.conversationHistory : [];
    const sajuContext: SajuChatContext | null =
      isRecord(body.sajuContext) ? (body.sajuContext as SajuChatContext) : null;
    ownerKey = normalizeToken(body.ownerKey);
    profileKey = normalizeToken(body.profileKey);
    usageId = normalizeToken(body.usageId);
    const usageSourceToken = normalizeToken(body.usageSource);
    const usageSource = isUsageSource(usageSourceToken) ? usageSourceToken : null;

    logEvent("request_parsed", {
      traceId,
      messageLength: message.length,
      rawHistoryCount: rawHistory.length,
      hasSajuContext: Boolean(sajuContext),
      hasOwnerKey: Boolean(ownerKey),
      hasProfileKey: Boolean(profileKey),
      hasUsageId: Boolean(usageId),
      usageSource,
    });

    if (!message) {
      return buildJsonErrorResponse(
        { error: "message is required.", traceId },
        { traceId, status: 400, elapsedMs: Date.now() - requestStartedAt },
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return buildJsonErrorResponse(
        { error: `message must be <= ${MAX_MESSAGE_LENGTH} chars.`, traceId },
        { traceId, status: 400, elapsedMs: Date.now() - requestStartedAt },
      );
    }

    if (!sajuContext || !isRecord(sajuContext.palja)) {
      return buildJsonErrorResponse(
        { error: "sajuContext is required.", traceId },
        { traceId, status: 400, elapsedMs: Date.now() - requestStartedAt },
      );
    }

    if (!ownerKey || !profileKey || !usageId || !usageSource) {
      return buildJsonErrorResponse(
        {
          error: "ownerKey, profileKey, usageId, usageSource are required.",
          traceId,
        },
        { traceId, status: 400, elapsedMs: Date.now() - requestStartedAt },
      );
    }

    if (!apiKey) {
      return buildJsonErrorResponse(
        { error: "service unavailable: GEMINI_API_KEY missing", traceId },
        { traceId, status: 503, elapsedMs: Date.now() - requestStartedAt },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: consumeData, error: consumeError } = await supabase.rpc("chat_credit_consume", {
      p_owner_key: ownerKey,
      p_usage_id: usageId,
      p_source: usageSource,
      p_profile_key: profileKey,
    });

    if (consumeError) {
      logError("consume_failed", {
        traceId,
        code: consumeError.code,
        details: consumeError.details,
        hint: consumeError.hint,
        message: consumeError.message,
      });
      return buildJsonErrorResponse(
        {
          error: `consume failed: ${consumeError.message}`,
          code: CREDIT_CONSUME_FAILED_CODE,
          traceId,
        },
        {
          traceId,
          status: 500,
          elapsedMs: Date.now() - requestStartedAt,
          code: CREDIT_CONSUME_FAILED_CODE,
        },
      );
    }

    consumeRow = (Array.isArray(consumeData) ? consumeData[0] : consumeData) as ConsumeRow | null;
    if (!consumeRow) {
      logError("consume_failed", {
        traceId,
        message: "consume returned empty row",
      });
      return buildJsonErrorResponse(
        {
          error: "consume failed: empty row",
          code: CREDIT_CONSUME_FAILED_CODE,
          traceId,
        },
        {
          traceId,
          status: 500,
          elapsedMs: Date.now() - requestStartedAt,
          code: CREDIT_CONSUME_FAILED_CODE,
        },
      );
    }

    if (!consumeRow.charged && consumeRow.reason === "no_credits") {
      return buildJsonErrorResponse(
        {
          error: "질문 가능 횟수를 모두 사용했습니다.",
          code: NO_CREDITS_CODE,
          traceId,
          quota: toQuotaPayload(consumeRow, false),
        },
        {
          traceId,
          status: 402,
          elapsedMs: Date.now() - requestStartedAt,
          code: NO_CREDITS_CODE,
        },
      );
    }

    const validHistory: ChatTurn[] = rawHistory
      .filter(isValidChatTurn)
      .map((turn: ChatTurn) => ({
        role: turn.role,
        content: turn.content.slice(0, 1000),
      }));
    const trimmedHistory = trimHistory(validHistory, MAX_HISTORY_TURNS);
    const prompt = buildChatPrompt(sajuContext, message, trimmedHistory);

    logEvent("prompt_built", {
      traceId,
      promptLength: prompt.length,
      historyTurns: trimmedHistory.length,
      charged: consumeRow.charged,
      chargeReason: consumeRow.reason,
      quotaRemaining: consumeRow.remaining,
    });

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { responseMimeType: "application/json" },
    });

    const geminiStartedAt = Date.now();
    const result = await withGeminiTimeout(model.generateContent(prompt));
    const payload = parseModelPayload(result.response.text());

    logEvent("gemini_succeeded", {
      traceId,
      elapsedMs: Date.now() - geminiStartedAt,
      replyLength: payload.reply.length,
    });

    return buildJsonResponse(
      {
        reply: payload.reply,
        tags: payload.tags ?? [],
        followUpSuggestions: payload.followUpSuggestions ?? [],
        quota: toQuotaPayload(consumeRow, Boolean(consumeRow.charged)),
      },
      {
        traceId,
        status: 200,
        elapsedMs: Date.now() - requestStartedAt,
      },
    );
  } catch (error) {
    const elapsedMs = Date.now() - requestStartedAt;
    const message = error instanceof Error ? error.message : "unknown error";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (consumeRow?.charged && ownerKey && profileKey && usageId) {
      try {
        await refundConsumedCredit({
          supabase,
          ownerKey,
          profileKey,
          usageId,
          traceId,
        });
      } catch (refundError) {
        logError("refund_failed", {
          traceId,
          usageId,
          error: refundError instanceof Error ? refundError.message : String(refundError),
        });
      }
    }

    if (message === "upstream_timeout") {
      return buildJsonErrorResponse(
        {
          error: "AI chat response is delayed. please retry shortly.",
          code: "UPSTREAM_TIMEOUT",
          traceId,
          elapsedMs,
        },
        {
          traceId,
          status: 504,
          elapsedMs,
          code: "UPSTREAM_TIMEOUT",
        },
      );
    }

    return buildJsonErrorResponse(
      {
        error: message,
        traceId,
      },
      {
        traceId,
        status: 500,
        elapsedMs,
      },
    );
  }
});
