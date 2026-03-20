import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const GUEST_STORAGE_KEY = "saju:guest-session-id";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const resolveGuestHeader = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const current = window.localStorage.getItem(GUEST_STORAGE_KEY);
  if (current) {
    return current;
  }

  const generated = window.crypto.randomUUID();
  window.localStorage.setItem(GUEST_STORAGE_KEY, generated);
  return generated;
};

if (!isSupabaseConfigured) {
  console.warn("⚠️ Supabase 환경 변수가 설정되지 않았습니다. (.env 파일 확인 필요)");
}

const fallbackUrl = "http://127.0.0.1:54321";
const fallbackAnon = "public-anon-key";

export const supabase = createClient(supabaseUrl || fallbackUrl, supabaseAnonKey || fallbackAnon, {
  global: {
    headers: {
      "x-guest-id": resolveGuestHeader(),
    },
  },
});
