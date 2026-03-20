import { corsHeaders } from "./cors.ts";

const DEFAULT_PROXY_TIMEOUT_MS = 25_000;

const resolveSupabaseUrl = () => {
  const raw = Deno.env.get("SUPABASE_URL") ?? "";
  return raw.replace(/\/+$/, "");
};

const resolveServiceRoleKey = () =>
  Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

type ProxyEdgeFunctionOptions = {
  targetFunction: string;
  payload: unknown;
  request?: Request;
  timeoutMs?: number;
};

export const proxyEdgeFunction = async ({
  targetFunction,
  payload,
  request,
  timeoutMs = DEFAULT_PROXY_TIMEOUT_MS,
}: ProxyEdgeFunctionOptions): Promise<Response> => {
  const supabaseUrl = resolveSupabaseUrl();
  const serviceRoleKey = resolveServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "SUPABASE_URL and SERVICE_ROLE_KEY are required" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const incomingAuthorization = request?.headers.get("authorization");
  const incomingGuestId = request?.headers.get("x-guest-id");
  const incomingContentType = request?.headers.get("content-type");

  const headers: Record<string, string> = {
    apikey: serviceRoleKey,
    Authorization: incomingAuthorization || `Bearer ${serviceRoleKey}`,
    "Content-Type": incomingContentType || "application/json",
  };

  if (incomingGuestId) {
    headers["x-guest-id"] = incomingGuestId;
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${targetFunction}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const bodyText = await response.text();
    const responseContentType = response.headers.get("content-type") || "application/json";

    return new Response(bodyText, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": responseContentType,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "proxy invocation failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const parseJsonBody = async (request: Request): Promise<Record<string, unknown>> => {
  try {
    const payload = await request.json();
    if (isRecord(payload)) {
      return payload;
    }
    return {};
  } catch {
    return {};
  }
};
