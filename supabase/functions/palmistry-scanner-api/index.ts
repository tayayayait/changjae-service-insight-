import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { parseJsonBody, proxyEdgeFunction } from "../_shared/function-proxy.ts";

const ALLOWED_ACTIONS = new Set(["palm_analyze", "ai_palm_qa"]);

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const payload = await parseJsonBody(request);
  const action = typeof payload.action === "string" && ALLOWED_ACTIONS.has(payload.action)
    ? payload.action
    : "palm_analyze";

  return proxyEdgeFunction({
    targetFunction: "astrology-api",
    payload: {
      ...payload,
      action,
    },
    request,
    timeoutMs: 30_000,
  });
});
