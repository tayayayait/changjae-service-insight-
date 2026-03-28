import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FREE_LIMIT = 2;
const ROLLING_WINDOW_MS = 24 * 60 * 60 * 1000;

type StatusRow = {
  owner_key: string;
  free_used: number;
  paid_remaining: number;
  total: number;
  remaining: number;
  next_free_reset_at: string | null;
};

type WalletRow = {
  owner_key: string;
  free_used: number;
  paid_remaining: number;
  free_window_started_at?: string | null;
};

const asNonNegativeInt = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
};

const buildQuotaFromWallet = (wallet: WalletRow) => {
  const freeUsed = asNonNegativeInt(wallet.free_used);
  const paidRemaining = asNonNegativeInt(wallet.paid_remaining);
  const startedAt =
    typeof wallet.free_window_started_at === "string" && wallet.free_window_started_at.trim()
      ? wallet.free_window_started_at
      : null;
  const startedAtMs = startedAt ? Date.parse(startedAt) : NaN;
  const hasStartedWindow = Number.isFinite(startedAtMs);

  const nextResetAt = hasStartedWindow
    ? new Date(startedAtMs + ROLLING_WINDOW_MS).toISOString()
    : null;

  return {
    owner_key: wallet.owner_key,
    free_used: freeUsed,
    paid_remaining: paidRemaining,
    total: FREE_LIMIT + paidRemaining,
    remaining: Math.max(0, FREE_LIMIT - freeUsed) + paidRemaining,
    next_free_reset_at: nextResetAt,
  } satisfies StatusRow;
};

const shouldResetWindow = (startedAt: string | null | undefined) => {
  if (!startedAt || !startedAt.trim()) {
    return false;
  }
  const startedAtMs = Date.parse(startedAt);
  if (!Number.isFinite(startedAtMs)) {
    return false;
  }
  return startedAtMs + ROLLING_WINDOW_MS <= Date.now();
};

const loadStatusFromWalletTable = async (
  supabase: ReturnType<typeof createClient>,
  ownerKey: string,
): Promise<StatusRow> => {
  const { error: upsertError } = await supabase
    .from("chat_credit_wallets")
    .upsert({ owner_key: ownerKey }, { onConflict: "owner_key" });
  if (upsertError) {
    throw new Error(`wallet upsert failed: ${upsertError.message}`);
  }

  let walletData: WalletRow | null = null;
  let hasWindowColumn = true;

  const withWindow = await supabase
    .from("chat_credit_wallets")
    .select("owner_key, free_used, paid_remaining, free_window_started_at")
    .eq("owner_key", ownerKey)
    .maybeSingle();

  if (withWindow.error) {
    const looksLikeMissingWindowColumn =
      withWindow.error.message?.includes("free_window_started_at") ?? false;
    if (!looksLikeMissingWindowColumn) {
      throw new Error(`wallet select failed: ${withWindow.error.message}`);
    }

    hasWindowColumn = false;
    const withoutWindow = await supabase
      .from("chat_credit_wallets")
      .select("owner_key, free_used, paid_remaining")
      .eq("owner_key", ownerKey)
      .maybeSingle();

    if (withoutWindow.error) {
      throw new Error(`wallet select legacy failed: ${withoutWindow.error.message}`);
    }
    walletData = withoutWindow.data as WalletRow | null;
  } else {
    walletData = withWindow.data as WalletRow | null;
  }

  if (!walletData) {
    throw new Error("wallet row not found");
  }

  if (hasWindowColumn && shouldResetWindow(walletData.free_window_started_at)) {
    const resetResult = await supabase
      .from("chat_credit_wallets")
      .update({ free_used: 0, free_window_started_at: null, updated_at: new Date().toISOString() })
      .eq("owner_key", ownerKey)
      .select("owner_key, free_used, paid_remaining, free_window_started_at")
      .maybeSingle();

    if (resetResult.error) {
      throw new Error(`wallet window reset failed: ${resetResult.error.message}`);
    }

    walletData = (resetResult.data as WalletRow | null) ?? {
      ...walletData,
      free_used: 0,
      free_window_started_at: null,
    };
  }

  return buildQuotaFromWallet(walletData);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const ownerKey = String(body?.ownerKey ?? "").trim();
    if (!ownerKey) {
      throw new Error("ownerKey is required");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase.rpc("chat_credit_status", {
      p_owner_key: ownerKey,
    });

    let row = (Array.isArray(data) ? data[0] : data) as StatusRow | null;
    if (error || !row) {
      console.warn(
        "chat-credit-status rpc failed, falling back to wallet table.",
        error?.message ?? "empty row",
      );
      row = await loadStatusFromWalletTable(supabase, ownerKey);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        quota: {
          ownerKey: row.owner_key,
          freeUsed: Number(row.free_used ?? 0),
          paidRemaining: Number(row.paid_remaining ?? 0),
          total: Number(row.total ?? 0),
          remaining: Number(row.remaining ?? 0),
          nextFreeResetAt:
            typeof row.next_free_reset_at === "string" && row.next_free_reset_at.trim()
              ? row.next_free_reset_at
              : null,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed to load credit status";
    const status = message === "ownerKey is required" ? 400 : 500;
    console.error("chat-credit-status error:", message);
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
