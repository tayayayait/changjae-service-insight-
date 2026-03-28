import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const GUEST_STORAGE_KEY = "saju:guest-session-id";
const LEGACY_GUEST_STORAGE_KEY = "guest_id";

console.log("Supabase URL in use:", supabaseUrl || "http://127.0.0.1:54321 (FALLBACK)");

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const normalizeGuestId = (value: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : "";
};

const resolveGuestHeader = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const primary = normalizeGuestId(window.localStorage.getItem(GUEST_STORAGE_KEY));
  const legacy = normalizeGuestId(window.localStorage.getItem(LEGACY_GUEST_STORAGE_KEY));
  const resolved = primary || legacy || window.crypto.randomUUID();

  if (primary !== resolved) {
    window.localStorage.setItem(GUEST_STORAGE_KEY, resolved);
  }
  if (legacy !== resolved) {
    window.localStorage.setItem(LEGACY_GUEST_STORAGE_KEY, resolved);
  }

  return resolved;
};

const guestHeaderId = resolveGuestHeader();

export const getSupabaseGuestId = () => guestHeaderId;

if (!isSupabaseConfigured) {
  console.warn("Supabase environment values are missing. Check your .env file.");
}

const fallbackUrl = "http://127.0.0.1:54321";
const fallbackAnon = "public-anon-key";

export const supabase = createClient(supabaseUrl || fallbackUrl, supabaseAnonKey || fallbackAnon, {
  auth: {
    storage: window.sessionStorage,
  },
  global: {
    headers: {
      "x-guest-id": guestHeaderId,
    },
  },
});
