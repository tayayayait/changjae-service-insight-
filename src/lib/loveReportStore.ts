import { LoveContext, LoveFeatureSet, LoveReportRecord, LoveServiceType, LoveSubjectInput } from "@/types/love";
import { isSupabaseConfigured, supabase } from "./supabase";
import { ensureGuestSessionId } from "./resultStore";

const STORAGE_KEYS = {
  index: "saju:love-report-index",
};

const INVOKE_TIMEOUT_BY_ACTION_MS: Record<string, number> = {
  create: 45_000,
  get_preview: 15_000,
  unlock: 15_000,
  list: 15_000,
  delete: 15_000,
};
const DEFAULT_INVOKE_TIMEOUT_MS = 15_000;
const LOVE_REPORTS_CENTER_FUNCTION_NAME = "love-reports-center";
const LOVE_CREATE_FUNCTION_BY_SERVICE: Record<LoveServiceType, string> = {
  "future-partner": "love-future-partner-api",
  "couple-report": "love-couple-report-api",
  "crush-reunion": "love-crush-reunion-api",
};

const reportStorageKey = (id: string) => `saju:love-report:${id}`;

interface FunctionResponse<T> {
  ok: boolean;
  data: T;
  error?: string;
}

export interface CreateLoveReportRequest {
  serviceType: LoveServiceType;
  relationMode?: string;
  baseSajuResultId?: string;
  inputSnapshot: {
    subjectA: LoveSubjectInput;
    subjectB?: LoveSubjectInput;
    context: LoveContext;
  };
  featureSet: LoveFeatureSet;
}

const parseFunctionResponse = <T>(payload: unknown): FunctionResponse<T> => {
  if (typeof payload === "string") {
    return JSON.parse(payload) as FunctionResponse<T>;
  }
  return payload as FunctionResponse<T>;
};

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

const appendIndex = (id: string) => {
  const current = readJson<string[]>(STORAGE_KEYS.index, []);
  const next = [id, ...current.filter((item) => item !== id)].slice(0, 50);
  writeJson(STORAGE_KEYS.index, next);
};

const removeFromIndex = (id: string) => {
  const current = readJson<string[]>(STORAGE_KEYS.index, []);
  writeJson(
    STORAGE_KEYS.index,
    current.filter((item) => item !== id),
  );
};

const persistLocal = (report: LoveReportRecord) => {
  if (!report.id) {
    return;
  }
  writeJson(reportStorageKey(report.id), report);
  appendIndex(report.id);
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, action: string): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`love reports ${action} timed out after ${Math.ceil(timeoutMs / 1000)}s`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const resolveLoveFunctionName = (action: string, payload?: Record<string, unknown>): string => {
  if (action !== "create") {
    return LOVE_REPORTS_CENTER_FUNCTION_NAME;
  }

  const serviceType = typeof payload?.serviceType === "string" ? payload.serviceType : "";
  if (serviceType === "future-partner" || serviceType === "couple-report" || serviceType === "crush-reunion") {
    return LOVE_CREATE_FUNCTION_BY_SERVICE[serviceType];
  }

  return LOVE_REPORTS_CENTER_FUNCTION_NAME;
};

const invokeLove = async <T>(action: string, payload?: Record<string, unknown>): Promise<T> => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

  const guestSessionId = ensureGuestSessionId();
  const timeoutMs = INVOKE_TIMEOUT_BY_ACTION_MS[action] ?? DEFAULT_INVOKE_TIMEOUT_MS;
  const functionName = resolveLoveFunctionName(action, payload);
  const { data, error } = await withTimeout(
    supabase.functions.invoke(functionName, {
      body: {
        action,
        payload: payload ?? {},
      },
      headers: {
        "x-guest-id": guestSessionId,
      },
    }),
    timeoutMs,
    action,
  );

  if (error) {
    throw new Error(error.message || `${functionName} invoke failed`);
  }

  const parsed = parseFunctionResponse<T>(data);
  if (!parsed.ok) {
    throw new Error(parsed.error || `${functionName} returned error`);
  }

  return parsed.data;
};

export const createLoveReport = async (req: CreateLoveReportRequest): Promise<LoveReportRecord> => {
  const created = await invokeLove<LoveReportRecord>("create", {
    serviceType: req.serviceType,
    relationMode: req.relationMode ?? null,
    baseSajuResultId: req.baseSajuResultId ?? null,
    inputSnapshot: req.inputSnapshot,
    featureSet: req.featureSet,
  });
  created.dataSource = created.dataSource ?? "real";
  persistLocal(created);
  return created;
};

export const getLoveReportPreview = async (id: string): Promise<LoveReportRecord | null> => {
  const local = readJson<LoveReportRecord | null>(reportStorageKey(id), null);
  if (local) {
    return local;
  }

  if (!isSupabaseConfigured) {
    return null;
  }

  const remote = await invokeLove<LoveReportRecord | null>("get_preview", { id });
  if (remote) {
    persistLocal(remote);
  }
  return remote;
};

export const unlockLoveReport = async (params: {
  id: string;
  productCode: string;
  amountKrw: number;
  provider?: string;
  providerOrderId?: string;
}): Promise<LoveReportRecord> => {
  const unlocked = await invokeLove<LoveReportRecord>("unlock", {
    id: params.id,
    productCode: params.productCode,
    amountKrw: params.amountKrw,
    provider: params.provider ?? "mock",
    providerOrderId: params.providerOrderId,
  });
  unlocked.dataSource = unlocked.dataSource ?? "real";
  persistLocal(unlocked);
  return unlocked;
};

export const listLoveReports = async (): Promise<LoveReportRecord[]> => {
  const localIds = readJson<string[]>(STORAGE_KEYS.index, []);
  const localItems = localIds
    .map((id) => readJson<LoveReportRecord | null>(reportStorageKey(id), null))
    .filter(Boolean) as LoveReportRecord[];

  if (!isSupabaseConfigured) {
    return localItems;
  }

  const remote = await invokeLove<LoveReportRecord[]>("list", { limit: 30 });
  remote.forEach(persistLocal);
  return remote;
};

export const deleteLoveReport = async (id: string) => {
  localStorage.removeItem(reportStorageKey(id));
  removeFromIndex(id);

  if (!isSupabaseConfigured) {
    return;
  }

  try {
    await invokeLove<boolean>("delete", { id });
  } catch (error) {
    console.error("deleteLoveReport failed:", error);
  }
};
