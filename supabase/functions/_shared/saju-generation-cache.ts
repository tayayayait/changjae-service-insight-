import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const CACHE_TABLE = "saju_generation_cache";

const encoder = new TextEncoder();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }

  if (isRecord(value)) {
    const sortedKeys = Object.keys(value).sort();
    const next: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      next[key] = canonicalize(value[key]);
    }
    return next;
  }

  return value;
};

const toHex = (value: ArrayBuffer) =>
  Array.from(new Uint8Array(value))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

export const buildSajuGenerationCacheKey = async (payload: unknown): Promise<string> => {
  const canonical = JSON.stringify(canonicalize(payload));
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(canonical));
  return toHex(digest);
};

type CacheClient = ReturnType<typeof createClient>;

export const getSajuGenerationCacheClient = (): CacheClient | null => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

export const readSajuGenerationCache = async (
  client: CacheClient,
  cacheKey: string,
): Promise<unknown | null> => {
  const { data, error } = await client
    .from(CACHE_TABLE)
    .select("response_payload")
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (error) {
    console.error("[saju-generation-cache] read failed", {
      cacheKey,
      message: error.message,
    });
    return null;
  }

  if (!data || typeof data.response_payload === "undefined") {
    return null;
  }

  return data.response_payload;
};

export const writeSajuGenerationCache = async (
  client: CacheClient,
  params: {
    cacheKey: string;
    serviceType: string;
    reportTemplateVersion: string;
    responsePayload: unknown;
  },
) => {
  const nowIso = new Date().toISOString();
  const { error } = await client
    .from(CACHE_TABLE)
    .upsert(
      {
        cache_key: params.cacheKey,
        service_type: params.serviceType,
        report_template_version: params.reportTemplateVersion,
        response_payload: params.responsePayload,
        updated_at: nowIso,
        last_hit_at: nowIso,
      },
      { onConflict: "cache_key" },
    );

  if (error) {
    console.error("[saju-generation-cache] write failed", {
      cacheKey: params.cacheKey,
      serviceType: params.serviceType,
      message: error.message,
    });
  }
};
