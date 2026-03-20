import {
  CompatibilityResult,
  DreamResult,
  FortuneResult,
  GeminiAnalysis,
  LifetimeGeminiAnalysis,
  SajuResult,
  UserBirthData,
  UserInterest,
} from "../types/result";
import { isSupabaseConfigured, supabase } from "./supabase";
import { calculateSaju } from "./sajuEngine";
import { normalizeTimeBlockId } from "./timeBlocks";

const STORAGE_KEYS = {
  guestSessionId: "saju:guest-session-id",
  sajuIndex: "saju:result-index",
  compatibilityIndex: "saju:compat-index",
  fortuneIndex: "saju:fortune-index",
  dreamIndex: "saju:dream-index",
};
const EDGE_FUNCTION_TIMEOUT_MS = 45_000;
const EDGE_FUNCTION_TIMEOUT_MESSAGE = "요청 시간이 지연되고 있습니다. 잠시 후 다시 시도해주세요.";
export const SAJU_ANALYSIS_PROMPT_VERSION = "2026-03-19";

const sajuStorageKey = (id: string) => `saju:result:${id}`;
const compatibilityStorageKey = (id: string) => `saju:compat:${id}`;
const fortuneStorageKey = (id: string) => `saju:fortune:${id}`;
const dreamStorageKey = (id: string) => `saju:dream:${id}`;

interface FunctionResponse<T> {
  ok: boolean;
  data: T;
  error?: string;
}

export interface SajuRequestFingerprintInput {
  serviceType: string;
  profileData: UserBirthData;
  interests: UserInterest[];
  freeQuestion?: string;
  promptVersion?: string;
}

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const appendIndex = (key: string, id: string) => {
  const current = readJson<string[]>(key, []);
  const next = [id, ...current.filter((item) => item !== id)].slice(0, 50);
  writeJson(key, next);
};

const removeFromIndex = (key: string, id: string) => {
  const current = readJson<string[]>(key, []);
  writeJson(
    key,
    current.filter((item) => item !== id),
  );
};

const parseFunctionResponse = <T>(payload: unknown): FunctionResponse<T> => {
  if (typeof payload === "string") {
    return JSON.parse(payload) as FunctionResponse<T>;
  }
  return payload as FunctionResponse<T>;
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    });
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const normalizeBirthData = (birthData: UserBirthData) => ({
  calendarType: birthData.calendarType,
  year: birthData.year,
  month: birthData.month,
  day: birthData.day,
  hour: typeof birthData.hour === "number" ? birthData.hour : null,
  minute: typeof birthData.minute === "number" ? birthData.minute : null,
  timeBlock: birthData.timeBlock ?? null,
  birthPrecision: birthData.birthPrecision ?? "unknown",
  location: birthData.location ?? "서울",
  gender: birthData.gender,
});

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    const sortedEntries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]);
    return Object.fromEntries(sortedEntries);
  }
  return value;
};

const hashString = (input: string): string => {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }
  return (hash >>> 0).toString(16);
};

const listLocalSajuResults = (): SajuResult[] => {
  const localIds = readJson<string[]>(STORAGE_KEYS.sajuIndex, []);
  return localIds
    .map((id) => readJson<SajuResult | null>(sajuStorageKey(id), null))
    .filter(Boolean) as SajuResult[];
};

export const buildSajuRequestFingerprint = (input: SajuRequestFingerprintInput): string => {
  const normalizedPayload = canonicalize({
    serviceType: input.serviceType,
    profileData: normalizeBirthData(input.profileData),
    interests: [...input.interests].sort(),
    freeQuestion: input.freeQuestion?.trim() || "",
    promptVersion: input.promptVersion ?? SAJU_ANALYSIS_PROMPT_VERSION,
  });
  const serialized = JSON.stringify(normalizedPayload);
  return `saju:${hashString(serialized)}`;
};

interface UserProfileRow {
  id: string;
  calendar_type: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number | null;
  time_block: string | null;
  location: string | null;
  gender: string;
}

const isCalendarType = (value: unknown): value is UserBirthData["calendarType"] => {
  return value === "solar" || value === "lunar" || value === "lunar-leap";
};

const isGender = (value: unknown): value is UserBirthData["gender"] => {
  return value === "male" || value === "female";
};

const toBirthDataFromProfile = (profile: UserProfileRow): UserBirthData | null => {
  if (!isCalendarType(profile.calendar_type) || !isGender(profile.gender)) {
    return null;
  }

  if (
    typeof profile.year !== "number" ||
    typeof profile.month !== "number" ||
    typeof profile.day !== "number"
  ) {
    return null;
  }

  const normalizedTimeBlock = normalizeTimeBlockId(profile.time_block);
  const hasExactTime = typeof profile.hour === "number";

  return {
    calendarType: profile.calendar_type,
    year: profile.year,
    month: profile.month,
    day: profile.day,
    hour: hasExactTime ? profile.hour ?? undefined : undefined,
    minute: hasExactTime ? profile.minute ?? 0 : undefined,
    timeBlock: !hasExactTime ? (normalizedTimeBlock ?? undefined) : undefined,
    birthPrecision: hasExactTime ? "exact" : normalizedTimeBlock ? "time-block" : "unknown",
    location: profile.location || "서울",
    gender: profile.gender,
  };
};

const buildSajuResultFromProfile = (profile: UserProfileRow): SajuResult | null => {
  const profileData = toBirthDataFromProfile(profile);
  if (!profileData) {
    return null;
  }

  const calculated = calculateSaju(profileData);

  return {
    id: `profile-fallback-${profile.id}`,
    userId: profile.id,
    profileData,
    palja: calculated.palja,
    oheng: calculated.oheng,
    yongsin: calculated.yongsin,
    sinsal: calculated.sinsal,
    interests: [],
    summary: "회원 프로필 기반 자동 인식 결과",
    sections: [],
    consultationType: "profile-fallback",
    createdAt: new Date().toISOString(),
  };
};

const persistSajuLocal = (result: SajuResult) => {
  if (!result.id) {
    return;
  }
  writeJson(sajuStorageKey(result.id), result);
  appendIndex(STORAGE_KEYS.sajuIndex, result.id);
};

const persistCompatibilityLocal = (result: CompatibilityResult) => {
  if (!result.id) {
    return;
  }
  writeJson(compatibilityStorageKey(result.id), result);
  appendIndex(STORAGE_KEYS.compatibilityIndex, result.id);
};

const persistFortuneLocal = (result: FortuneResult) => {
  if (!result.id) {
    return;
  }
  writeJson(fortuneStorageKey(result.id), result);
  appendIndex(STORAGE_KEYS.fortuneIndex, result.id);
};

const persistDreamLocal = (result: DreamResult) => {
  if (!result.id) {
    return;
  }
  writeJson(dreamStorageKey(result.id), result);
  appendIndex(STORAGE_KEYS.dreamIndex, result.id);
};

export const ensureGuestSessionId = () => {
  const existing = localStorage.getItem(STORAGE_KEYS.guestSessionId);
  if (existing) {
    return existing;
  }

  const next = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEYS.guestSessionId, next);
  return next;
};

const getAuthUserId = async () => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

const invokeSecure = async <T>(action: string, payload?: Record<string, unknown>): Promise<T> => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

  const guestSessionId = ensureGuestSessionId();
  const { data, error } = await withTimeout(
    supabase.functions.invoke("secure-results", {
      body: {
        action,
        payload,
      },
      headers: {
        "x-guest-id": guestSessionId,
      },
      timeout: EDGE_FUNCTION_TIMEOUT_MS,
    }),
    EDGE_FUNCTION_TIMEOUT_MS,
    EDGE_FUNCTION_TIMEOUT_MESSAGE,
  );

  if (error) {
    throw new Error(error.message || "secure-results invoke failed");
  }

  const parsed = parseFunctionResponse<T>(data);
  if (!parsed.ok) {
    throw new Error(parsed.error || "secure-results returned error");
  }

  return parsed.data;
};

export const saveSajuResult = async (result: SajuResult): Promise<SajuResult> => {
  const guestSessionId = result.guestSessionId ?? ensureGuestSessionId();
  const userId = result.userId ?? (await getAuthUserId());
  const dataPrivacyMode = result.dataPrivacyMode ?? "local-only";

  const fallbackResult: SajuResult = {
    ...result,
    dataPrivacyMode,
    id: result.id ?? crypto.randomUUID(),
    userId: userId ?? undefined,
    guestSessionId,
    createdAt: result.createdAt ?? new Date().toISOString(),
  };

  if (!isSupabaseConfigured || dataPrivacyMode !== "cloud-save") {
    persistSajuLocal(fallbackResult);
    return fallbackResult;
  }

  try {
    const saved = await invokeSecure<SajuResult>("save_saju", { result: fallbackResult as unknown as Record<string, unknown> });
    persistSajuLocal(saved);
    return saved;
  } catch (error) {
    console.error("saveSajuResult fallback to localStorage:", error);
    persistSajuLocal(fallbackResult);
    return fallbackResult;
  }
};

export const getSajuResultById = async (id: string): Promise<SajuResult | null> => {
  const local = readJson<SajuResult | null>(sajuStorageKey(id), null);
  if (local) {
    return local;
  }

  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const remote = await invokeSecure<SajuResult | null>("get_saju", { id });
    if (remote) {
      persistSajuLocal(remote);
    }
    return remote;
  } catch {
    return null;
  }
};

export const getSajuResultByFingerprint = async (requestFingerprint: string): Promise<SajuResult | null> => {
  const localMatch = listLocalSajuResults().find((item) => item.requestFingerprint === requestFingerprint) ?? null;
  if (localMatch) {
    return localMatch;
  }

  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const remote = await invokeSecure<SajuResult | null>("get_saju_by_fingerprint", { requestFingerprint });
    if (remote) {
      persistSajuLocal(remote);
    }
    return remote;
  } catch {
    return null;
  }
};

export const listSajuResults = async (): Promise<SajuResult[]> => {
  const localResults = listLocalSajuResults();

  if (!isSupabaseConfigured) {
    return localResults;
  }

  try {
    const remote = await invokeSecure<SajuResult[]>("list_saju", { limit: 20 });
    remote.forEach(persistSajuLocal);
    return remote;
  } catch (error) {
    console.error("listSajuResults fallback to localStorage:", error);
    return localResults;
  }
};

export const deleteSajuResult = async (id: string) => {
  localStorage.removeItem(sajuStorageKey(id));
  removeFromIndex(STORAGE_KEYS.sajuIndex, id);

  if (!isSupabaseConfigured) {
    return;
  }

  try {
    await invokeSecure<boolean>("delete_saju", { id });
  } catch (error) {
    console.error("deleteSajuResult remote delete failed:", error);
  }
};

export const getLatestSajuResult = async () => {
  const results = await listSajuResults();
  return results[0] ?? null;
};

export const getLatestSajuResultOrProfile = async (): Promise<SajuResult | null> => {
  const latest = await getLatestSajuResult();
  if (latest) {
    return latest;
  }

  if (!isSupabaseConfigured) {
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, calendar_type, year, month, day, hour, minute, time_block, location, gender")
    .eq("id", user.id)
    .maybeSingle<UserProfileRow>();

  if (profileError || !profile) {
    return null;
  }

  return buildSajuResultFromProfile(profile);
};

export const saveCompatibilityResult = async (result: CompatibilityResult): Promise<CompatibilityResult> => {
  const guestSessionId = result.guestSessionId ?? ensureGuestSessionId();
  const userId = result.userId ?? (await getAuthUserId());

  const fallbackResult: CompatibilityResult = {
    ...result,
    id: result.id ?? crypto.randomUUID(),
    userId: userId ?? undefined,
    guestSessionId,
    createdAt: result.createdAt ?? new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    persistCompatibilityLocal(fallbackResult);
    return fallbackResult;
  }

  try {
    const saved = await invokeSecure<CompatibilityResult>("save_compatibility", {
      result: fallbackResult as unknown as Record<string, unknown>,
    });
    persistCompatibilityLocal(saved);
    return saved;
  } catch (error) {
    console.error("saveCompatibilityResult fallback to localStorage:", error);
    persistCompatibilityLocal(fallbackResult);
    return fallbackResult;
  }
};

export const listCompatibilityResults = async (): Promise<CompatibilityResult[]> => {
  const localIds = readJson<string[]>(STORAGE_KEYS.compatibilityIndex, []);
  const localResults = localIds
    .map((id) => readJson<CompatibilityResult | null>(compatibilityStorageKey(id), null))
    .filter(Boolean) as CompatibilityResult[];

  if (!isSupabaseConfigured) {
    return localResults;
  }

  try {
    const remote = await invokeSecure<CompatibilityResult[]>("list_compatibility", { limit: 20 });
    remote.forEach(persistCompatibilityLocal);
    return remote;
  } catch (error) {
    console.error("listCompatibilityResults fallback to localStorage:", error);
    return localResults;
  }
};

export const deleteCompatibilityResult = async (id: string) => {
  localStorage.removeItem(compatibilityStorageKey(id));
  removeFromIndex(STORAGE_KEYS.compatibilityIndex, id);

  if (!isSupabaseConfigured) {
    return;
  }

  try {
    await invokeSecure<boolean>("delete_compatibility", { id });
  } catch (error) {
    console.error("deleteCompatibilityResult remote delete failed:", error);
  }
};

export const saveFortuneResult = async (result: FortuneResult): Promise<FortuneResult> => {
  if (result.sourceKind && result.sourceKind !== "personal") {
    throw new Error("개인 운세만 저장할 수 있습니다.");
  }

  const guestSessionId = result.guestSessionId ?? ensureGuestSessionId();
  const userId = result.userId ?? (await getAuthUserId());
  const fallbackResult: FortuneResult = {
    ...result,
    sourceKind: "personal",
    id: result.id ?? crypto.randomUUID(),
    userId: userId ?? undefined,
    guestSessionId,
    createdAt: result.createdAt ?? new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    persistFortuneLocal(fallbackResult);
    return fallbackResult;
  }

  try {
    const saved = await invokeSecure<FortuneResult>("save_fortune", {
      result: fallbackResult as unknown as Record<string, unknown>,
    });
    persistFortuneLocal(saved);
    return saved;
  } catch (error) {
    console.error("saveFortuneResult fallback to localStorage:", error);
    persistFortuneLocal(fallbackResult);
    return fallbackResult;
  }
};

export const listFortuneResults = async (): Promise<FortuneResult[]> => {
  const localIds = readJson<string[]>(STORAGE_KEYS.fortuneIndex, []);
  const localResults = localIds
    .map((id) => readJson<FortuneResult | null>(fortuneStorageKey(id), null))
    .filter(Boolean) as FortuneResult[];

  if (!isSupabaseConfigured) {
    return localResults;
  }

  try {
    const remote = await invokeSecure<FortuneResult[]>("list_fortune", { limit: 20 });
    remote.forEach(persistFortuneLocal);
    return remote;
  } catch (error) {
    console.error("listFortuneResults fallback to localStorage:", error);
    return localResults;
  }
};

export const deleteFortuneResult = async (id: string) => {
  localStorage.removeItem(fortuneStorageKey(id));
  removeFromIndex(STORAGE_KEYS.fortuneIndex, id);

  if (!isSupabaseConfigured) {
    return;
  }

  try {
    await invokeSecure<boolean>("delete_fortune", { id });
  } catch (error) {
    console.error("deleteFortuneResult remote delete failed:", error);
  }
};

export const saveDreamResult = async (result: DreamResult): Promise<DreamResult> => {
  const guestSessionId = result.guestSessionId ?? ensureGuestSessionId();
  const userId = result.userId ?? (await getAuthUserId());
  const fallbackResult: DreamResult = {
    ...result,
    id: result.id ?? crypto.randomUUID(),
    userId: userId ?? undefined,
    guestSessionId,
    createdAt: result.createdAt ?? new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    persistDreamLocal(fallbackResult);
    return fallbackResult;
  }

  try {
    const saved = await invokeSecure<DreamResult>("save_dream", {
      result: fallbackResult as unknown as Record<string, unknown>,
    });
    persistDreamLocal(saved);
    return saved;
  } catch (error) {
    console.error("saveDreamResult fallback to localStorage:", error);
    persistDreamLocal(fallbackResult);
    return fallbackResult;
  }
};

export const listDreamResults = async (): Promise<DreamResult[]> => {
  const localIds = readJson<string[]>(STORAGE_KEYS.dreamIndex, []);
  const localResults = localIds
    .map((id) => readJson<DreamResult | null>(dreamStorageKey(id), null))
    .filter(Boolean) as DreamResult[];

  if (!isSupabaseConfigured) {
    return localResults;
  }

  try {
    const remote = await invokeSecure<DreamResult[]>("list_dream", { limit: 20 });
    remote.forEach(persistDreamLocal);
    return remote;
  } catch (error) {
    console.error("listDreamResults fallback to localStorage:", error);
    return localResults;
  }
};

export const deleteDreamResult = async (id: string) => {
  localStorage.removeItem(dreamStorageKey(id));
  removeFromIndex(STORAGE_KEYS.dreamIndex, id);

  if (!isSupabaseConfigured) {
    return;
  }

  try {
    await invokeSecure<boolean>("delete_dream", { id });
  } catch (error) {
    console.error("deleteDreamResult remote delete failed:", error);
  }
};

export const clearAllStoredData = async () => {
  const sajuIds = readJson<string[]>(STORAGE_KEYS.sajuIndex, []);
  const compatIds = readJson<string[]>(STORAGE_KEYS.compatibilityIndex, []);
  const fortuneIds = readJson<string[]>(STORAGE_KEYS.fortuneIndex, []);
  const dreamIds = readJson<string[]>(STORAGE_KEYS.dreamIndex, []);

  sajuIds.forEach((id) => localStorage.removeItem(sajuStorageKey(id)));
  compatIds.forEach((id) => localStorage.removeItem(compatibilityStorageKey(id)));
  fortuneIds.forEach((id) => localStorage.removeItem(fortuneStorageKey(id)));
  dreamIds.forEach((id) => localStorage.removeItem(dreamStorageKey(id)));
  writeJson(STORAGE_KEYS.sajuIndex, []);
  writeJson(STORAGE_KEYS.compatibilityIndex, []);
  writeJson(STORAGE_KEYS.fortuneIndex, []);
  writeJson(STORAGE_KEYS.dreamIndex, []);

  if (!isSupabaseConfigured) {
    return;
  }

  try {
    await invokeSecure<boolean>("clear_all", {});
  } catch (error) {
    console.error("clearAllStoredData remote clear failed:", error);
  }
};

export const buildSajuResultFromAnalysis = (
  base: Omit<SajuResult, "summary" | "sections">,
  analysis: GeminiAnalysis | LifetimeGeminiAnalysis,
): SajuResult => {
  const lifetime =
    "lifetimeScore" in analysis
      ? {
          lifetimeScore: analysis.lifetimeScore,
          daeunPeriods: analysis.daeunPeriods,
          goldenPeriods: analysis.goldenPeriods,
          personalityType: analysis.personalityType,
        }
      : {};

  return {
    ...base,
    summary: analysis.summary,
    sections: analysis.sections,
    reportTemplateVersion: analysis.reportTemplateVersion,
    reportPayload: analysis.reportPayload,
    ...lifetime,
  };
};

export const buildFortuneResult = (
  baseResultId: string,
  guestSessionId: string,
  fortune: FortuneResult,
): FortuneResult => {
  return {
    ...fortune,
    sourceKind: fortune.sourceKind ?? "personal",
    baseResultId,
    guestSessionId,
    createdAt: fortune.createdAt ?? new Date().toISOString(),
  };
};
