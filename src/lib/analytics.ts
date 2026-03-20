import { isSupabaseConfigured, supabase } from "./supabase";

export type AnalyticsEventName =
  | "input_started"
  | "analysis_completed"
  | "share_clicked"
  | "save_clicked"
  | "auth_converted"
  | "empty_state_view"
  | "empty_cta_click"
  | "fallback_card_click";

const persistLocalEvent = (name: AnalyticsEventName, props?: Record<string, unknown>) => {
  const payload = {
    event: name,
    props: props ?? {},
    ts: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const existing = window.localStorage.getItem("saju:analytics-events");
    const parsed = existing ? (JSON.parse(existing) as unknown[]) : [];
    const next = [payload, ...parsed].slice(0, 200);
    window.localStorage.setItem("saju:analytics-events", JSON.stringify(next));
  }

  console.info("[analytics]", payload);
};

export const trackEvent = async (name: AnalyticsEventName, props?: Record<string, unknown>) => {
  try {
    persistLocalEvent(name, props);

    if (!isSupabaseConfigured) {
      return;
    }

    await supabase.functions.invoke("secure-results", {
      body: {
        action: "track_event",
        payload: {
          name,
          props: props ?? {},
        },
      },
    });
  } catch {
    // Ignore analytics failures to keep UX stable.
  }
};
