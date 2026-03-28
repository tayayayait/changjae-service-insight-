import { getSupabaseGuestId, supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { normalizeAstrologyBirthReport } from "@/lib/astrologyReport";
import { AstrologyReportRecord } from "@/types/astrology";

const resolveGuestSessionId = () => {
  const fromSupabaseHeader = getSupabaseGuestId().trim();
  if (fromSupabaseHeader) {
    return fromSupabaseHeader;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const primary = window.localStorage.getItem("saju:guest-session-id")?.trim();
  if (primary) {
    return primary;
  }

  const legacy = window.localStorage.getItem("guest_id")?.trim();
  return legacy || null;
};

const normalizeNumber = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const toBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
};

const toNormalizedLatitude = (value: unknown) => normalizeNumber(value, 37.5665).toFixed(3);
const toNormalizedLongitude = (value: unknown) => normalizeNumber(value, 126.978).toFixed(3);

const buildAstrologyFingerprintBase = (snapshot: Record<string, unknown>) => {
  const year = Math.trunc(normalizeNumber(snapshot.year, 1990));
  const month = Math.trunc(normalizeNumber(snapshot.month, 1));
  const day = Math.trunc(normalizeNumber(snapshot.day, 1));
  const hour = Math.trunc(normalizeNumber(snapshot.hour, 12));
  const minute = Math.trunc(normalizeNumber(snapshot.minute, 0));
  const tz = typeof snapshot.timezone === "string" && snapshot.timezone.trim()
    ? snapshot.timezone.trim()
    : "Asia/Seoul";
  const birthTimeKnown = toBoolean(
    snapshot.birthTimeKnown ?? snapshot.birth_time_known,
    snapshot.hour !== undefined && snapshot.hour !== null,
  );

  return [
    year,
    month,
    day,
    hour,
    minute,
    toNormalizedLatitude(snapshot.lat),
    toNormalizedLongitude(snapshot.lng),
    tz,
    birthTimeKnown ? "1" : "0",
  ].join("|");
};

const buildAstrologyFingerprint = async (snapshot: Record<string, unknown>) => {
  const base = buildAstrologyFingerprintBase(snapshot);
  if (typeof crypto === "undefined" || !crypto.subtle) {
    return `legacy_${base}`;
  }

  try {
    const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(base));
    return Array.from(new Uint8Array(buffer))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return `fallback_${base}`;
  }
};

const isMissingColumnError = (error: unknown, column: string) => {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  return code === "PGRST204" && message.includes(`'${column}'`);
};

const getUserIdFilters = () => {
  const state = useAuthStore.getState();
  const userId = state.user?.id;
  const guestId = resolveGuestSessionId();

  if (userId) {
    return { user_id: userId };
  }
  if (guestId) {
    return { guest_id: guestId };
  }
  return {};
};

const mapAstrologyReportRow = (row: any): AstrologyReportRecord => ({
  id: row.id,
  userId: row.user_id,
  guestId: row.guest_id,
  serviceType: row.service_type,
  inputSnapshot: row.input_snapshot,
  inputFingerprint: row.input_fingerprint,
  reportPayload: normalizeAstrologyBirthReport(row.report_payload),
  templateVersion: row.template_version,
  isUnlocked: row.is_unlocked,
  createdAt: row.created_at,
});

export const listAstrologyReports = async (): Promise<AstrologyReportRecord[]> => {
  try {
    const filters = getUserIdFilters();
    if (!filters.user_id && !filters.guest_id) {
      return [];
    }

    const { data, error } = await supabase
      .from("astrology_reports")
      .select("*")
      .match(filters)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to list astrology reports:", error);
      return [];
    }

    return (data || []).map(mapAstrologyReportRow);
  } catch (error) {
    console.error("Failed to list astrology reports:", error);
    return [];
  }
};

export const deleteAstrologyReport = async (id: string): Promise<boolean> => {
  try {
    const filters = getUserIdFilters();
    if (!filters.user_id && !filters.guest_id) {
      return false;
    }

    const { error } = await supabase
      .from("astrology_reports")
      .delete()
      .eq("id", id)
      .match(filters);

    if (error) {
      console.error("Failed to delete astrology report:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to delete astrology report:", error);
    return false;
  }
};

export const getAstrologyReport = async (id: string): Promise<AstrologyReportRecord | null> => {
  try {
    const filters = getUserIdFilters();
    if (!filters.user_id && !filters.guest_id) {
      return null;
    }

    const { data, error } = await supabase
      .from("astrology_reports")
      .select("*")
      .eq("id", id)
      .match(filters)
      .limit(1);

    if (error) {
      console.error("Failed to get astrology report:", error);
      return null;
    }

    if (Array.isArray(data) && data.length > 0) {
      return mapAstrologyReportRow(data[0]);
    }

    // Filters can drift from the fixed x-guest-id header. Fall back to id-only query
    // so RLS decides ownership using the request header.
    const fallback = await supabase
      .from("astrology_reports")
      .select("*")
      .eq("id", id)
      .limit(1);

    if (fallback.error) {
      console.error("Failed to get astrology report (id-only fallback):", fallback.error);
      return null;
    }

    if (!Array.isArray(fallback.data) || fallback.data.length === 0) {
      return null;
    }

    return mapAstrologyReportRow(fallback.data[0]);
  } catch (error) {
    console.error("Failed to get astrology report:", error);
    return null;
  }
};

export const saveAstrologyReport = async (payload: {
  serviceType: string;
  inputSnapshot: Record<string, unknown>;
  reportPayload: any;
  isUnlocked: boolean;
}): Promise<AstrologyReportRecord> => {
  const state = useAuthStore.getState();
  const userId = state.user?.id;
  const guestId = resolveGuestSessionId();
  const inputFingerprint = await buildAstrologyFingerprint(payload.inputSnapshot);
  const onConflict = userId
    ? "user_id,service_type,template_version,input_fingerprint"
    : "guest_id,service_type,template_version,input_fingerprint";

  const baseRow = {
    user_id: userId,
    guest_id: userId ? null : guestId,
    service_type: payload.serviceType,
    input_snapshot: payload.inputSnapshot,
    input_fingerprint: inputFingerprint,
    report_payload: payload.reportPayload,
    template_version: "v5",
  };

  const writeRow = async (includeUnlockColumn: boolean) =>
    supabase
      .from("astrology_reports")
      .upsert(
        includeUnlockColumn
          ? {
            ...baseRow,
            is_unlocked: payload.isUnlocked,
          }
          : baseRow,
        { onConflict },
      )
      .select()
      .single();

  let { data, error } = await writeRow(true);
  if (error && isMissingColumnError(error, "is_unlocked")) {
    ({ data, error } = await writeRow(false));
  }

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("astrology_reports write succeeded but no row was returned");
  }

  return {
    ...mapAstrologyReportRow(data),
  };
};
