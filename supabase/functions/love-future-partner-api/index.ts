import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { parseJsonBody, proxyEdgeFunction } from "../_shared/function-proxy.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const body = await parseJsonBody(request);
  const rawPayload = typeof body.payload === "object" && body.payload !== null ? body.payload as Record<string, unknown> : {};

  return proxyEdgeFunction({
    targetFunction: "love-reports",
    payload: {
      action: "create",
      payload: {
        ...rawPayload,
        serviceType: "future-partner",
      },
    },
    request,
    timeoutMs: 45_000,
  });
});
