import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { parseJsonBody, proxyEdgeFunction } from "../_shared/function-proxy.ts";

const ALLOWED_ACTIONS = new Set(["create", "get_preview", "unlock", "list", "delete"]);

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const body = await parseJsonBody(request);
  const action = typeof body.action === "string" ? body.action : "";

  if (!ALLOWED_ACTIONS.has(action)) {
    return new Response(JSON.stringify({ error: "unsupported action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return proxyEdgeFunction({
    targetFunction: "love-reports",
    payload: body,
    request,
    timeoutMs: 45_000,
  });
});
