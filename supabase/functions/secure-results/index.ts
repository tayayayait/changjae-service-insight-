import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  buildAdminClientOptions,
  ensureOwnerContext,
  extractBearerToken,
  extractJwtSubClaim,
  toOwnerContext,
  toOwnerFilter,
} from "../_shared/secure-results-owner.ts";

type JsonObject = Record<string, unknown>;

const SAJU_COLUMNS = "id, user_id, guest_id, privacy_mode, request_fingerprint, source_service_id, prompt_version, born_data, born_data_enc, born_data_iv, palja_data, oheng_data, interests, free_question, gemini_summary, gemini_sections, service_type, report_template_version, report_payload, lifetime_score, daeun_periods, golden_periods, personality_type, created_at";
const COMPATIBILITY_COLUMNS = "id, user_id, guest_id, person_a_data, person_b_data, person_a_data_enc, person_a_data_iv, person_b_data_enc, person_b_data_iv, person_a_palja, person_b_palja, person_a_oheng, person_b_oheng, score, summary, strengths, cautions, advice, created_at";
const FORTUNE_COLUMNS = "id, user_id, guest_id, base_result_id, period, score, summary, details, lucky_color, lucky_item, source_kind, created_at";
const DREAM_COLUMNS = "id, user_id, guest_id, dream_input, dream_input_enc, dream_input_iv, interpretation, created_at";

interface ActionRequest {
  action: string;
  payload?: JsonObject;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const encryptionSeed = Deno.env.get("DATA_ENCRYPTION_KEY") ?? "";

// Debug logging (keys only)
console.log("Available env keys:", Object.keys(Deno.env.toObject()).join(", "));

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bytesToBase64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes));

const base64ToBytes = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

let cachedKey: CryptoKey | null = null;

const getEncryptionKey = async () => {
  if (cachedKey) {
    return cachedKey;
  }

  if (!encryptionSeed) {
    console.error("CRITICAL ERROR: DATA_ENCRYPTION_KEY is not set.");
    throw new Error("DATA_ENCRYPTION_KEY environment variable is required but missing. Please set it using 'supabase secrets set DATA_ENCRYPTION_KEY=your-key'.");
  }

  try {
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(encryptionSeed));
    cachedKey = await crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
    return cachedKey;
  } catch (e) {
    console.error("Failed to import encryption key:", e);
    throw new Error("Failed to initialize encryption system.");
  }
};

const encryptJson = async (value: unknown) => {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(JSON.stringify(value));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

  return {
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  };
};

const decryptJson = async <T>(ciphertext?: string | null, iv?: string | null): Promise<T | null> => {
  if (!ciphertext || !iv) {
    return null;
  }

  const key = await getEncryptionKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ciphertext),
  );

  return JSON.parse(decoder.decode(new Uint8Array(decrypted))) as T;
};

const getSupabaseAdminClient = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("CRITICAL ERROR: Supabase configuration missing.", {
      url: !!supabaseUrl,
      serviceRole: !!serviceRoleKey
    });
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SERVICE_ROLE_KEY) are required but missing. Ensure they are set in Supabase secrets.");
  }

  return createClient(supabaseUrl, serviceRoleKey, buildAdminClientOptions());
};

const resolveOwner = async (authorization: string | null, guestId: string) => {
  const client = getSupabaseAdminClient();
  let userId: string | null = null;

  const token = extractBearerToken(authorization);
  if (token) {
    const jwtSub = extractJwtSubClaim(token);
    if (!jwtSub) {
      console.info("resolveOwner: token has no JWT sub claim. treating request as guest.");
      return toOwnerContext(null, guestId);
    }

    try {
      const { data, error } = await client.auth.getUser(token);
      if (error) {
        console.warn("Auth warning in resolveOwner:", error.message);
      }
      userId = data?.user?.id ?? null;
    } catch (e) {
      console.warn("Unexpected auth warning in resolveOwner auth check:", e);
    }
  }

  return toOwnerContext(userId, guestId);
};

const resolveStorageOwner = async (
  client: ReturnType<typeof createClient>,
  owner: { userId: string | null; guestId: string },
) => {
  if (!owner.userId) {
    return owner;
  }

  const { data, error } = await client
    .from("user_profiles")
    .select("id")
    .eq("id", owner.userId)
    .maybeSingle();

  if (error) {
    throw new Error(`failed to verify user_profiles row: ${error.message}`);
  }

  if (data?.id) {
    return owner;
  }

  if (owner.guestId) {
    console.warn("user_profiles row missing for authenticated user. falling back to guest owner.", {
      userId: owner.userId,
      guestId: owner.guestId,
    });
    return toOwnerContext(null, owner.guestId);
  }

  throw new Error("authenticated user has no user_profiles row and no guest id");
};

const mapSajuRow = async (row: Record<string, unknown>) => {
  const profileData = await decryptJson<Record<string, unknown>>(
    row.born_data_enc as string | undefined,
    row.born_data_iv as string | undefined,
  );

  return {
    id: row.id,
    userId: (row.user_id as string | null) ?? undefined,
    guestSessionId: (row.guest_id as string | null) ?? undefined,
    dataPrivacyMode: ((row.privacy_mode as string | null) ?? "cloud-save"),
    requestFingerprint: (row.request_fingerprint as string | null) ?? undefined,
    sourceServiceId: (row.source_service_id as string | null) ?? undefined,
    promptVersion: (row.prompt_version as string | null) ?? undefined,
    profileData: profileData ?? ((row.born_data as Record<string, unknown>) ?? {}),
    palja: row.palja_data,
    oheng: row.oheng_data,
    interests: (row.interests as unknown[]) ?? [],
    freeQuestion: (row.free_question as string | null) ?? undefined,
    summary: (row.gemini_summary as string | null) ?? "",
    sections: (row.gemini_sections as unknown[]) ?? [],
    consultationType: (row.service_type as string | null) ?? undefined,
    reportTemplateVersion: (row.report_template_version as string | null) ?? undefined,
    reportPayload:
      row.report_payload && typeof row.report_payload === "object"
        ? (row.report_payload as Record<string, unknown>)
        : undefined,
    lifetimeScore: Number.isFinite(Number(row.lifetime_score)) ? Number(row.lifetime_score) : undefined,
    daeunPeriods: Array.isArray(row.daeun_periods) ? (row.daeun_periods as unknown[]) : undefined,
    goldenPeriods: Array.isArray(row.golden_periods) ? (row.golden_periods as unknown[]) : undefined,
    personalityType:
      row.personality_type && typeof row.personality_type === "object"
        ? (row.personality_type as Record<string, unknown>)
        : undefined,
    createdAt: row.created_at,
  };
};

const mapCompatibilityRow = async (row: Record<string, unknown>) => {
  const personA = await decryptJson<Record<string, unknown>>(
    row.person_a_data_enc as string | undefined,
    row.person_a_data_iv as string | undefined,
  );

  const personB = await decryptJson<Record<string, unknown>>(
    row.person_b_data_enc as string | undefined,
    row.person_b_data_iv as string | undefined,
  );

  return {
    id: row.id,
    userId: (row.user_id as string | null) ?? undefined,
    guestSessionId: (row.guest_id as string | null) ?? undefined,
    personA: personA ?? ((row.person_a_data as Record<string, unknown>) ?? {}),
    personB: personB ?? ((row.person_b_data as Record<string, unknown>) ?? {}),
    personAPalja: row.person_a_palja,
    personBPalja: row.person_b_palja,
    personAOheng: row.person_a_oheng,
    personBOheng: row.person_b_oheng,
    score: row.score,
    summary: row.summary,
    strengths: (row.strengths as unknown[]) ?? [],
    cautions: (row.cautions as unknown[]) ?? [],
    advice: row.advice,
    createdAt: row.created_at,
  };
};

const mapFortuneRow = (row: Record<string, unknown>) => {
  return {
    id: row.id,
    userId: (row.user_id as string | null) ?? undefined,
    guestSessionId: (row.guest_id as string | null) ?? undefined,
    baseResultId: (row.base_result_id as string | null) ?? undefined,
    period: row.period,
    score: row.score,
    summary: row.summary,
    details: row.details,
    luckyColor: (row.lucky_color as string | null) ?? undefined,
    luckyItem: (row.lucky_item as string | null) ?? undefined,
    sourceKind: (row.source_kind as string | null) ?? "personal",
    createdAt: row.created_at,
  };
};

const mapDreamRow = async (row: Record<string, unknown>) => {
  const input = await decryptJson<Record<string, unknown>>(
    row.dream_input_enc as string | undefined,
    row.dream_input_iv as string | undefined,
  );

  return {
    id: row.id,
    userId: (row.user_id as string | null) ?? undefined,
    guestSessionId: (row.guest_id as string | null) ?? undefined,
    input: input ?? ((row.dream_input as Record<string, unknown>) ?? {}),
    interpretation: row.interpretation,
    createdAt: row.created_at,
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authorization = req.headers.get("Authorization");
    const guestId = req.headers.get("x-guest-id") ?? "";

    let body: ActionRequest;
    try {
      body = (await req.json()) as ActionRequest;
    } catch {
      return new Response(JSON.stringify({
        ok: false,
        error: "invalid JSON request body",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const action = body.action;
    const payload = body.payload ?? {};

    const client = getSupabaseAdminClient();
    const owner = await resolveOwner(authorization, guestId);
    ensureOwnerContext(owner);

    const storageOwner = await resolveStorageOwner(client, owner);
    ensureOwnerContext(storageOwner);

    const ownerFilter = toOwnerFilter(storageOwner);

    if (action === "save_saju") {
      const result = payload.result as Record<string, unknown>;
      const dataPrivacyMode = (result.dataPrivacyMode as string | undefined) ?? "local-only";

      if (dataPrivacyMode !== "cloud-save") {
        return new Response(
          JSON.stringify({ ok: false, error: "cloud-save mode only" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const encryptedBirth = await encryptJson(result.profileData);

      const { data, error } = await client
        .from("saju_results")
        .insert({
          user_id: ownerFilter.user_id,
          guest_id: ownerFilter.guest_id,
          privacy_mode: "cloud-save",
          born_data: { redacted: true },
          born_data_enc: encryptedBirth.ciphertext,
          born_data_iv: encryptedBirth.iv,
          palja_data: result.palja,
          oheng_data: result.oheng,
          interests: result.interests ?? [],
          free_question: (result.freeQuestion as string | undefined) ?? null,
          gemini_summary: (result.summary as string | undefined) ?? "",
          gemini_sections: result.sections ?? [],
          service_type: (result.consultationType as string | undefined) ?? "traditional-saju",
          request_fingerprint: (result.requestFingerprint as string | undefined) ?? null,
          source_service_id: (result.sourceServiceId as string | undefined) ?? null,
          prompt_version: (result.promptVersion as string | undefined) ?? null,
          report_payload:
            result.reportPayload && typeof result.reportPayload === "object"
              ? (result.reportPayload as Record<string, unknown>)
              : null,
          report_template_version: (result.reportTemplateVersion as string | undefined) ?? null,
          lifetime_score: typeof result.lifetimeScore === "number" ? result.lifetimeScore : null,
          daeun_periods: Array.isArray(result.daeunPeriods) ? result.daeunPeriods : null,
          golden_periods: Array.isArray(result.goldenPeriods) ? result.goldenPeriods : null,
          personality_type: result.personalityType ?? null,
        })
        .select(SAJU_COLUMNS)
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "failed to save saju");
      }

      const mapped = await mapSajuRow(data as Record<string, unknown>);
      return new Response(JSON.stringify({ ok: true, data: mapped }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list_saju") {
      const limit = Number(payload.limit ?? 20);
      let query = client.from("saju_results").select(SAJU_COLUMNS).order("created_at", { ascending: false }).limit(limit);

      if (ownerFilter.user_id) {
        query = query.eq("user_id", ownerFilter.user_id);
      } else {
        query = query.eq("guest_id", ownerFilter.guest_id);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      const mapped = await Promise.all((data ?? []).map((row) => mapSajuRow(row as Record<string, unknown>)));
      return new Response(JSON.stringify({ ok: true, data: mapped }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_saju") {
      const id = payload.id as string;
      let query = client.from("saju_results").select(SAJU_COLUMNS).eq("id", id).limit(1);

      if (ownerFilter.user_id) {
        query = query.eq("user_id", ownerFilter.user_id);
      } else {
        query = query.eq("guest_id", ownerFilter.guest_id);
      }

      const { data, error } = await query.maybeSingle();
      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        return new Response(JSON.stringify({ ok: true, data: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const mapped = await mapSajuRow(data as Record<string, unknown>);
      return new Response(JSON.stringify({ ok: true, data: mapped }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_saju_by_fingerprint") {
      const requestFingerprint = payload.requestFingerprint as string | undefined;
      if (!requestFingerprint) {
        return new Response(JSON.stringify({ ok: false, error: "requestFingerprint is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let query = client
        .from("saju_results")
        .select(SAJU_COLUMNS)
        .eq("request_fingerprint", requestFingerprint)
        .order("created_at", { ascending: false })
        .limit(1);

      if (ownerFilter.user_id) {
        query = query.eq("user_id", ownerFilter.user_id);
      } else {
        query = query.eq("guest_id", ownerFilter.guest_id);
      }

      const { data, error } = await query.maybeSingle();
      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        return new Response(JSON.stringify({ ok: true, data: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const mapped = await mapSajuRow(data as Record<string, unknown>);
      return new Response(JSON.stringify({ ok: true, data: mapped }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_saju") {
      const id = payload.id as string;
      let query = client.from("saju_results").delete().eq("id", id);

      if (ownerFilter.user_id) {
        query = query.eq("user_id", ownerFilter.user_id);
      } else {
        query = query.eq("guest_id", ownerFilter.guest_id);
      }

      const { error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      return new Response(JSON.stringify({ ok: true, data: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "save_compatibility") {
      const result = payload.result as Record<string, unknown>;
      const encryptedA = await encryptJson(result.personA);
      const encryptedB = await encryptJson(result.personB);

      const { data, error } = await client
        .from("compatibility_results")
        .insert({
          user_id: ownerFilter.user_id,
          guest_id: ownerFilter.guest_id,
          person_a_data: { redacted: true },
          person_b_data: { redacted: true },
          person_a_data_enc: encryptedA.ciphertext,
          person_a_data_iv: encryptedA.iv,
          person_b_data_enc: encryptedB.ciphertext,
          person_b_data_iv: encryptedB.iv,
          person_a_palja: result.personAPalja,
          person_b_palja: result.personBPalja,
          person_a_oheng: result.personAOheng,
          person_b_oheng: result.personBOheng,
          score: result.score,
          summary: result.summary,
          strengths: result.strengths ?? [],
          cautions: result.cautions ?? [],
          advice: result.advice,
        })
        .select(COMPATIBILITY_COLUMNS)
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "failed to save compatibility");
      }

      const mapped = await mapCompatibilityRow(data as Record<string, unknown>);
      return new Response(JSON.stringify({ ok: true, data: mapped }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list_compatibility") {
      const limit = Number(payload.limit ?? 20);
      let query = client.from("compatibility_results").select(COMPATIBILITY_COLUMNS).order("created_at", { ascending: false }).limit(limit);

      if (ownerFilter.user_id) {
        query = query.eq("user_id", ownerFilter.user_id);
      } else {
        query = query.eq("guest_id", ownerFilter.guest_id);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      const mapped = await Promise.all((data ?? []).map((row) => mapCompatibilityRow(row as Record<string, unknown>)));
      return new Response(JSON.stringify({ ok: true, data: mapped }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_compatibility") {
      const id = payload.id as string;
      let query = client.from("compatibility_results").delete().eq("id", id);

      if (ownerFilter.user_id) {
        query = query.eq("user_id", ownerFilter.user_id);
      } else {
        query = query.eq("guest_id", ownerFilter.guest_id);
      }

      const { error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      return new Response(JSON.stringify({ ok: true, data: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "save_fortune") {
      const result = payload.result as Record<string, unknown>;
      const sourceKind = (result.sourceKind as string | undefined) ?? "personal";

      if (sourceKind !== "personal") {
        return new Response(JSON.stringify({ ok: false, error: "personal fortune only" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await client
        .from("fortune_results")
        .insert({
          user_id: ownerFilter.user_id,
          guest_id: ownerFilter.guest_id,
          base_result_id: (result.baseResultId as string | undefined) ?? null,
          period: result.period,
          score: result.score,
          summary: result.summary,
          details: result.details,
          lucky_color: (result.luckyColor as string | undefined) ?? null,
          lucky_item: (result.luckyItem as string | undefined) ?? null,
          source_kind: "personal",
        })
        .select(FORTUNE_COLUMNS)
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "failed to save fortune");
      }

      const mapped = mapFortuneRow(data as Record<string, unknown>);
      return new Response(JSON.stringify({ ok: true, data: mapped }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list_fortune") {
      const limit = Number(payload.limit ?? 20);
      let query = client.from("fortune_results").select(FORTUNE_COLUMNS).order("created_at", { ascending: false }).limit(limit);

      if (ownerFilter.user_id) {
        query = query.eq("user_id", ownerFilter.user_id);
      } else {
        query = query.eq("guest_id", ownerFilter.guest_id);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      const mapped = (data ?? []).map((row) => mapFortuneRow(row as Record<string, unknown>));
      return new Response(JSON.stringify({ ok: true, data: mapped }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_fortune") {
      const id = payload.id as string;
      let query = client.from("fortune_results").delete().eq("id", id);

      if (ownerFilter.user_id) {
        query = query.eq("user_id", ownerFilter.user_id);
      } else {
        query = query.eq("guest_id", ownerFilter.guest_id);
      }

      const { error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      return new Response(JSON.stringify({ ok: true, data: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "save_dream") {
      const result = payload.result as Record<string, unknown>;
      const encryptedInput = await encryptJson(result.input);

      const { data, error } = await client
        .from("dream_results")
        .insert({
          user_id: ownerFilter.user_id,
          guest_id: ownerFilter.guest_id,
          dream_input: { redacted: true },
          dream_input_enc: encryptedInput.ciphertext,
          dream_input_iv: encryptedInput.iv,
          interpretation: result.interpretation,
        })
        .select(DREAM_COLUMNS)
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "failed to save dream");
      }

      const mapped = await mapDreamRow(data as Record<string, unknown>);
      return new Response(JSON.stringify({ ok: true, data: mapped }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list_dream") {
      const limit = Number(payload.limit ?? 20);
      let query = client.from("dream_results").select(DREAM_COLUMNS).order("created_at", { ascending: false }).limit(limit);

      if (ownerFilter.user_id) {
        query = query.eq("user_id", ownerFilter.user_id);
      } else {
        query = query.eq("guest_id", ownerFilter.guest_id);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      const mapped = await Promise.all((data ?? []).map((row) => mapDreamRow(row as Record<string, unknown>)));
      return new Response(JSON.stringify({ ok: true, data: mapped }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_dream") {
      const id = payload.id as string;
      let query = client.from("dream_results").delete().eq("id", id);

      if (ownerFilter.user_id) {
        query = query.eq("user_id", ownerFilter.user_id);
      } else {
        query = query.eq("guest_id", ownerFilter.guest_id);
      }

      const { error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      return new Response(JSON.stringify({ ok: true, data: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "clear_all") {
      if (ownerFilter.user_id) {
        await Promise.all([
          client.from("saju_results").delete().eq("user_id", ownerFilter.user_id),
          client.from("compatibility_results").delete().eq("user_id", ownerFilter.user_id),
          client.from("fortune_results").delete().eq("user_id", ownerFilter.user_id),
          client.from("dream_results").delete().eq("user_id", ownerFilter.user_id),
          client.from("analytics_events").delete().eq("user_id", ownerFilter.user_id),
        ]);
      } else {
        await Promise.all([
          client.from("saju_results").delete().eq("guest_id", ownerFilter.guest_id),
          client.from("compatibility_results").delete().eq("guest_id", ownerFilter.guest_id),
          client.from("fortune_results").delete().eq("guest_id", ownerFilter.guest_id),
          client.from("dream_results").delete().eq("guest_id", ownerFilter.guest_id),
          client.from("analytics_events").delete().eq("guest_id", ownerFilter.guest_id),
        ]);
      }

      return new Response(JSON.stringify({ ok: true, data: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "track_event") {
      const eventName = payload.name as string;
      if (!eventName) {
        throw new Error("event name is required");
      }

      const { error } = await client.from("analytics_events").insert({
        user_id: ownerFilter.user_id,
        guest_id: ownerFilter.guest_id,
        event_name: eventName,
        payload: payload.props ?? {},
      });

      if (error) {
        throw new Error(error.message);
      }

      return new Response(JSON.stringify({ ok: true, data: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }



    return new Response(JSON.stringify({ ok: false, error: `unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    const stack = error instanceof Error ? error.stack : "";
    console.error("secure-results error detail:", { message, stack });

    return new Response(JSON.stringify({
      ok: false,
      error: message,
      debug: Deno.env.get("ENVIRONMENT") === "development" ? stack : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
