import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { parseJsonBody, proxyEdgeFunction } from "../_shared/function-proxy.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const payload = await parseJsonBody(request);
  return proxyEdgeFunction({
    targetFunction: "daily-fortune",
    payload,
    request,
    timeoutMs: 45_000,
  });
});
