import {
  CompatibilityResult,
  DreamResult,
  FortuneResult,
  GeminiAnalysis,
  LifetimeGeminiAnalysis,
  SajuAnalysisResponse,
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
const EDGE_FUNCTION_TIMEOUT_MS_BY_ACTION: Partial<Record<string, number>> = {
  get_saju_by_fingerprint: 8_000,
};

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

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
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
  writeJson(key, current.filter((item) => item !== id));
};

const parseFunctionResponse = <T>(payload: unknown): FunctionResponse<T> => {
  if (typeof payload === "string") return JSON.parse(payload) as FunctionResponse<T>;
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
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export const ensureGuestSessionId = () => {
  const existing = localStorage.getItem(STORAGE_KEYS.guestSessionId);
  if (existing) return existing;
  const next = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEYS.guestSessionId, next);
  return next;
};

const invokeSecure = async <T>(action: string, payload?: Record<string, unknown>): Promise<T> => {
  if (!isSupabaseConfigured) throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");

  const guestSessionId = ensureGuestSessionId();
  const timeoutMs = EDGE_FUNCTION_TIMEOUT_MS_BY_ACTION[action] ?? EDGE_FUNCTION_TIMEOUT_MS;
  
  const { data, error } = await withTimeout(
    supabase.functions.invoke("secure-results", {
      body: { action, payload },
      headers: { "x-guest-id": guestSessionId },
      timeout: timeoutMs,
    }),
    timeoutMs,
    EDGE_FUNCTION_TIMEOUT_MESSAGE
  );

  if (error) throw new Error(error.message || "secure-results invoke failed");

  const parsed = parseFunctionResponse<T>(data);
  if (!parsed.ok) throw new Error(parsed.error || "secure-results returned error");

  return parsed.data;
};

// Local Persistence Helpers
const persistSajuLocal = (result: SajuResult) => {
  if (!result.id) return;
  writeJson(sajuStorageKey(result.id), result);
  appendIndex(STORAGE_KEYS.sajuIndex, result.id);
};

const persistCompatibilityLocal = (result: CompatibilityResult) => {
  if (!result.id) return;
  writeJson(compatibilityStorageKey(result.id), result);
  appendIndex(STORAGE_KEYS.compatibilityIndex, result.id);
};

const persistFortuneLocal = (result: FortuneResult) => {
  if (!result.id) return;
  writeJson(fortuneStorageKey(result.id), result);
  appendIndex(STORAGE_KEYS.fortuneIndex, result.id);
};

const persistDreamLocal = (result: DreamResult) => {
  if (!result.id) return;
  writeJson(dreamStorageKey(result.id), result);
  appendIndex(STORAGE_KEYS.dreamIndex, result.id);
};

// Public Functions
export const saveSajuResult = async (result: SajuResult): Promise<SajuResult> => {
  const guestSessionId = result.guestSessionId ?? ensureGuestSessionId();
  const dataPrivacyMode = result.dataPrivacyMode ?? "local-only";

  const fallbackResult: SajuResult = {
    ...result,
    id: result.id ?? crypto.randomUUID(),
    guestSessionId,
    createdAt: result.createdAt ?? new Date().toISOString(),
  };

  if (!isSupabaseConfigured || dataPrivacyMode !== "cloud-save") {
    persistSajuLocal(fallbackResult);
    return fallbackResult;
  }

  try {
    const saved = await invokeSecure<SajuResult>("save_saju", { result: fallbackResult });
    persistSajuLocal(saved);
    return saved;
  } catch (error) {
    console.error("saveSajuResult fallback:", error);
    persistSajuLocal(fallbackResult);
    return fallbackResult;
  }
};

export const getSajuResultById = async (id: string): Promise<SajuResult | null> => {
  const local = readJson<SajuResult | null>(sajuStorageKey(id), null);
  if (local) return local;

  if (!isSupabaseConfigured) return null;

  try {
    const remote = await invokeSecure<SajuResult | null>("get_saju", { id });
    if (remote) persistSajuLocal(remote);
    return remote;
  } catch (error) {
    console.warn("getSajuResultById failed:", error);
    return null;
  }
};

export const unlockSajuResultLocally = (params: {
  resultId: string;
  serviceId?: string;
}): SajuResult | null => {
  const local = readJson<SajuResult | null>(sajuStorageKey(params.resultId), null);
  if (!local) {
    return null;
  }

  const nextUnlockedItems = [...(local.unlockedItems ?? [])];
  const normalizedServiceId = params.serviceId?.trim();
  if (
    normalizedServiceId &&
    !nextUnlockedItems.includes(normalizedServiceId as (typeof nextUnlockedItems)[number])
  ) {
    nextUnlockedItems.push(normalizedServiceId as (typeof nextUnlockedItems)[number]);
  }

  const updated: SajuResult = {
    ...local,
    isLocked: false,
    unlockedItems: nextUnlockedItems,
  };

  persistSajuLocal(updated);
  return updated;
};

export const listSajuResults = async (): Promise<SajuResult[]> => {
  const localIds = readJson<string[]>(STORAGE_KEYS.sajuIndex, []);
  const localResults = localIds
    .map((id) => readJson<SajuResult | null>(sajuStorageKey(id), null))
    .filter(Boolean) as SajuResult[];

  if (!isSupabaseConfigured) return localResults;

  try {
    const remote = await invokeSecure<SajuResult[]>("list_saju", { limit: 20 });
    remote.forEach(persistSajuLocal);
    
    const merged = [...remote];
    const remoteIds = new Set(remote.map(r => r.id));
    localResults.forEach(local => {
      if (local.id && !remoteIds.has(local.id)) merged.push(local);
    });
    
    return merged.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  } catch (error) {
    return localResults;
  }
};

export const buildSajuRequestFingerprint = (data: {
  serviceType: string;
  profileData: UserBirthData;
  interests?: UserInterest[];
  freeQuestion?: string;
  promptVersion: string;
}) => {
  const normalizedInterests = data.interests ? [...data.interests].sort() : undefined;
  const normalizedFreeQuestion = data.freeQuestion?.trim().replace(/\s+/g, " ");

  const payload = JSON.stringify({
    st: data.serviceType,
    pd: {
      ct: data.profileData.calendarType,
      y: data.profileData.year,
      m: data.profileData.month,
      d: data.profileData.day,
      h: data.profileData.hour,
      min: data.profileData.minute,
      tb: data.profileData.timeBlock,
      lc: data.profileData.location,
      g: data.profileData.gender,
    },
    it: normalizedInterests,
    fq: normalizedFreeQuestion,
    pv: data.promptVersion,
  });

  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `fp-${Math.abs(hash).toString(36)}`;
};

export const getSajuResultByFingerprint = async (requestFingerprint: string): Promise<SajuResult | null> => {
  const localIds = readJson<string[]>(STORAGE_KEYS.sajuIndex, []);
  const localMatch = localIds
    .map((id) => readJson<SajuResult | null>(sajuStorageKey(id), null))
    .find((item) => item?.requestFingerprint === requestFingerprint) ?? null;

  if (localMatch) return localMatch;

  if (!isSupabaseConfigured) return null;

  try {
    const remote = await invokeSecure<SajuResult | null>("get_saju_by_fingerprint", { requestFingerprint });
    if (remote) persistSajuLocal(remote);
    return remote;
  } catch (error) {
    console.warn("getSajuResultByFingerprint failed:", error);
    return null;
  }
};

export const getLatestSajuResultByServiceId = async (serviceId: string): Promise<SajuResult | null> => {
  const results = await listSajuResults();
  return (
    results
      .filter((r) => r.sourceServiceId === serviceId)
      .sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )[0] ?? null
  );
};

export const getLatestSajuResult = async () => {
  // 개별적으로 최신 결과를 가져오는 기능은 유지하되, 
  // 시스템에서 자동으로 데이터를 복구하는 용도로는 사용하지 않도록 주의가 필요합니다.
  const results = await listSajuResults();
  return results[0] ?? null;
};

export const getLatestSajuResultOrProfile = async (): Promise<SajuResult | null> => {
  // 보안 및 공용 이용을 위해 시스템 진입 시 기존 정보를 자동으로 불러오는 기능을 완전히 비활성화합니다.
  // 사용자는 항상 새로운 정보를 입력하거나 명시적으로 저장된 리스트에서 선택해야 합니다.
  return null;
};

export const saveCompatibilityResult = async (result: CompatibilityResult): Promise<CompatibilityResult> => {
  const guestSessionId = result.guestSessionId ?? ensureGuestSessionId();
  const fallbackResult: CompatibilityResult = {
    ...result,
    id: result.id ?? crypto.randomUUID(),
    guestSessionId,
    createdAt: result.createdAt ?? new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    persistCompatibilityLocal(fallbackResult);
    return fallbackResult;
  }

  try {
    const saved = await invokeSecure<CompatibilityResult>("save_compatibility", { result: fallbackResult });
    persistCompatibilityLocal(saved);
    return saved;
  } catch (error) {
    persistCompatibilityLocal(fallbackResult);
    return fallbackResult;
  }
};

export const listCompatibilityResults = async (): Promise<CompatibilityResult[]> => {
  const localIds = readJson<string[]>(STORAGE_KEYS.compatibilityIndex, []);
  const localResults = localIds
    .map((id) => readJson<CompatibilityResult | null>(compatibilityStorageKey(id), null))
    .filter(Boolean) as CompatibilityResult[];

  if (!isSupabaseConfigured) return localResults;

  try {
    const remote = await invokeSecure<CompatibilityResult[]>("list_compatibility", { limit: 20 });
    remote.forEach(persistCompatibilityLocal);
    return remote;
  } catch {
    return localResults;
  }
};

export const saveFortuneResult = async (result: FortuneResult): Promise<FortuneResult> => {
  const guestSessionId = result.guestSessionId ?? ensureGuestSessionId();
  const fallbackResult: FortuneResult = {
    ...result,
    sourceKind: "personal",
    id: result.id ?? crypto.randomUUID(),
    guestSessionId,
    createdAt: result.createdAt ?? new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    persistFortuneLocal(fallbackResult);
    return fallbackResult;
  }

  try {
    const saved = await invokeSecure<FortuneResult>("save_fortune", { result: fallbackResult });
    persistFortuneLocal(saved);
    return saved;
  } catch {
    persistFortuneLocal(fallbackResult);
    return fallbackResult;
  }
};

export const listFortuneResults = async (): Promise<FortuneResult[]> => {
  const localIds = readJson<string[]>(STORAGE_KEYS.fortuneIndex, []);
  const localResults = localIds
    .map((id) => readJson<FortuneResult | null>(fortuneStorageKey(id), null))
    .filter(Boolean) as FortuneResult[];

  if (!isSupabaseConfigured) return localResults;

  try {
    const remote = await invokeSecure<FortuneResult[]>("list_fortune", { limit: 20 });
    remote.forEach(persistFortuneLocal);
    return remote;
  } catch {
    return localResults;
  }
};

export const deleteSajuResult = async (id: string) => {
  localStorage.removeItem(sajuStorageKey(id));
  removeFromIndex(STORAGE_KEYS.sajuIndex, id);
  if (isSupabaseConfigured) {
    try { await invokeSecure("delete_saju", { id }); } catch (e) { console.error("deleteSajuResult remote failed:", e); }
  }
};

export const deleteCompatibilityResult = async (id: string) => {
  localStorage.removeItem(compatibilityStorageKey(id));
  removeFromIndex(STORAGE_KEYS.compatibilityIndex, id);
  if (isSupabaseConfigured) {
    try { await invokeSecure("delete_compatibility", { id }); } catch (e) { console.error("deleteCompatibilityResult remote failed:", e); }
  }
};

export const deleteFortuneResult = async (id: string) => {
  localStorage.removeItem(fortuneStorageKey(id));
  removeFromIndex(STORAGE_KEYS.fortuneIndex, id);
  if (isSupabaseConfigured) {
    try { await invokeSecure("delete_fortune", { id }); } catch (e) { console.error("deleteFortuneResult remote failed:", e); }
  }
};

export const deleteDreamResult = async (id: string) => {
  localStorage.removeItem(dreamStorageKey(id));
  removeFromIndex(STORAGE_KEYS.dreamIndex, id);
  if (isSupabaseConfigured) {
    try { await invokeSecure("delete_dream", { id }); } catch (e) { console.error("deleteDreamResult remote failed:", e); }
  }
};

export const clearAllStoredData = async () => {
  const keys = Object.values(STORAGE_KEYS);
  keys.forEach(k => {
    if (k !== STORAGE_KEYS.guestSessionId) {
      const ids = readJson<string[]>(k, []);
      ids.forEach(id => {
        localStorage.removeItem(sajuStorageKey(id));
        localStorage.removeItem(compatibilityStorageKey(id));
        localStorage.removeItem(fortuneStorageKey(id));
        localStorage.removeItem(dreamStorageKey(id));
      });
      writeJson(k, []);
    }
  });

  if (isSupabaseConfigured) {
    try { await invokeSecure("clear_all", {}); } catch (e) { console.error("clearAllStoredData remote failed:", e); }
  }
};

export const buildSajuResultFromAnalysis = (
  base: Omit<SajuResult, "summary" | "sections">,
  analysis: SajuAnalysisResponse,
): SajuResult => ({
  ...base,
  summary: analysis.summary,
  sections: analysis.sections,
  reportTemplateVersion: analysis.reportTemplateVersion,
  reportPayload: analysis.reportPayload,
  ...("lifetimeScore" in analysis ? {
    lifetimeScore: analysis.lifetimeScore,
    daeunPeriods: analysis.daeunPeriods,
    goldenPeriods: analysis.goldenPeriods,
    personalityType: analysis.personalityType,
  } : {}),
});

export const buildFortuneResult = (
  baseResultId: string,
  guestSessionId: string,
  analysis: FortuneResult
): FortuneResult => ({
  ...analysis,
  id: analysis.id ?? crypto.randomUUID(),
  baseResultId,
  guestSessionId,
  createdAt: analysis.createdAt ?? new Date().toISOString(),
});

export const buildCompatibilityResult = (
  personA: UserBirthData,
  personB: UserBirthData,
  analysis: CompatibilityResult
): CompatibilityResult => ({
  ...analysis,
  id: analysis.id ?? crypto.randomUUID(),
  personA,
  personB,
  guestSessionId: ensureGuestSessionId(),
  createdAt: analysis.createdAt ?? new Date().toISOString(),
});

export const buildDreamResult = (
  input: { symbols: string[]; freeText?: string },
  analysis: DreamResult
): DreamResult => ({
  ...analysis,
  id: analysis.id ?? crypto.randomUUID(),
  input,
  guestSessionId: ensureGuestSessionId(),
  createdAt: analysis.createdAt ?? new Date().toISOString(),
});
