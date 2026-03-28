import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.14.0";
import { corsHeaders } from "../_shared/cors.ts";
import {
  getLoveReportStrategy,
  LOVE_V3_REPORT_VERSION,
  LOVE_V3_TEMPLATE_VERSION,
} from "../_shared/love-report-v3.ts";

type JsonObject = Record<string, unknown>;

interface ActionRequest {
  action: "create" | "get_preview" | "unlock" | "list" | "delete";
  payload?: JsonObject;
}

interface OwnerContext {
  userId: string | null;
  guestId: string;
}

interface OwnershipFilter {
  user_id: string | null;
  guest_id: string | null;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const encryptionSeed = Deno.env.get("DATA_ENCRYPTION_KEY") ?? "";
const geminiApiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
const genAI = new GoogleGenerativeAI(geminiApiKey);
const COUNSEL_REPORT_VERSION = LOVE_V3_REPORT_VERSION;
const COUNSEL_TEMPLATE_VERSION = LOVE_V3_TEMPLATE_VERSION;
const LOVE_FINGERPRINT_VERSION = "love-counsel-fp-v1";
const GEMINI_TIMEOUT_MS = 60_000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const withGeminiTimeout = async <T>(promise: Promise<T>, timeoutMs = GEMINI_TIMEOUT_MS): Promise<T> => {
  let timeoutId: number | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("upstream_timeout"));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
};

const bytesToBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

const base64ToBytes = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

let cachedKey: CryptoKey | null = null;

const getEncryptionKey = async () => {
  if (cachedKey) {
    return cachedKey;
  }

  if (!encryptionSeed) {
    throw new Error("DATA_ENCRYPTION_KEY is required");
  }

  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(encryptionSeed));
  cachedKey = await crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
  return cachedKey;
};

const encryptJson = async (value: unknown) => {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(JSON.stringify(value));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return {
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  };
};

const decryptJson = async <T>(ciphertext?: string | null, iv?: string | null): Promise<T | null> => {
  if (!ciphertext || !iv) {
    return null;
  }
  const key = await getEncryptionKey();
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(iv) }, key, base64ToBytes(ciphertext));
  return JSON.parse(decoder.decode(new Uint8Array(decrypted))) as T;
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(value)));
const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const toHex = (bytes: Uint8Array) => Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");

const normalizeJsonValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeJsonValue(item));
  }

  if (isObjectRecord(value)) {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const current = value[key];
      if (typeof current === "undefined") {
        continue;
      }
      sorted[key] = normalizeJsonValue(current);
    }
    return sorted;
  }

  return value;
};

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return toHex(new Uint8Array(digest));
};

const buildLoveInputFingerprint = async ({
  serviceType,
  relationMode,
  inputSnapshot,
  featureSet,
}: {
  serviceType: string;
  relationMode: string | null;
  inputSnapshot: Record<string, unknown>;
  featureSet: Record<string, unknown>;
}) => {
  const normalizedPayload = normalizeJsonValue({
    fingerprintVersion: LOVE_FINGERPRINT_VERSION,
    serviceType,
    relationMode,
    reportVersion: COUNSEL_REPORT_VERSION,
    templateVersion: COUNSEL_TEMPLATE_VERSION,
    inputSnapshot,
    featureSet,
  });
  return sha256Hex(JSON.stringify(normalizedPayload));
};

const isRefreshWindowLocked = (nextRefreshAt: unknown) => {
  if (typeof nextRefreshAt !== "string" || !nextRefreshAt.trim()) {
    return false;
  }
  const refreshAtMs = Date.parse(nextRefreshAt);
  if (Number.isNaN(refreshAtMs)) {
    return false;
  }
  return Date.now() < refreshAtMs;
};

let cachedClient: ReturnType<typeof createClient> | null = null;

const getSupabaseClient = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: {} },
    });
  }

  return cachedClient;
};

const resolveOwner = async (authorization: string | null, guestId: string): Promise<OwnerContext> => {
  const client = getSupabaseClient();
  let userId: string | null = null;
  const token = authorization?.replace("Bearer ", "").trim();
  if (token) {
    const { data, error } = await client.auth.getUser(token);
    if (!error) {
      userId = data?.user?.id ?? null;
    }
  }
  return {
    userId,
    guestId,
  };
};

const ensureOwner = (owner: OwnerContext) => {
  if (!owner.userId && !owner.guestId) {
    throw new Error("guest id or authenticated user is required");
  }
};

const ownerFilter = (owner: OwnerContext): OwnershipFilter => {
  if (owner.userId) {
    return { user_id: owner.userId, guest_id: null };
  }
  return { user_id: null, guest_id: owner.guestId };
};

const extractContextBonus = (inputSnapshot: Record<string, unknown>) => {
  const context = isObjectRecord(inputSnapshot.context) ? inputSnapshot.context : {};
  const marriageIntent = String(context.marriageIntent ?? "");
  const preferredStyle = String(context.preferredRelationshipStyle ?? "");

  const contextAnswers = Array.isArray(context.contextAnswers) ? context.contextAnswers : [];
  let futureFocusKey = "";
  let mainConcernKey = "";
  let coupleOutcomeKey = "";
  let relationshipTemperatureKey = "";

  for (const answer of contextAnswers) {
    if (isObjectRecord(answer)) {
      const qKey = String(answer.questionKey ?? "");
      const aKey = String(answer.answerKey ?? "");
      if (qKey === "future_focus") futureFocusKey = aKey;
      if (qKey === "main_concern") mainConcernKey = aKey;
      if (qKey === "couple_outcome") coupleOutcomeKey = aKey;
      if (qKey === "relationship_temperature") relationshipTemperatureKey = aKey;
    }
  }

  let pullBonus = 0;
  let paceBonus = 0;
  let alignmentBonus = 0;
  let repairBonus = 0;
  let timingBonus = 0;

  if (marriageIntent === "strong") {
    timingBonus += 8;
    alignmentBonus += 5;
  } else if (marriageIntent === "none") {
    timingBonus -= 5;
  }

  if (preferredStyle === "안정형") {
    alignmentBonus += 6;
    repairBonus += 4;
  } else if (preferredStyle === "설렘형") {
    pullBonus += 7;
    paceBonus += 3;
  } else if (preferredStyle === "현실형") {
    alignmentBonus += 5;
    paceBonus += 5;
  } else if (preferredStyle === "성장형") {
    repairBonus += 6;
    paceBonus += 4;
  }

  if (futureFocusKey === "timing") {
    timingBonus += 6;
  } else if (futureFocusKey === "marriage_potential") {
    alignmentBonus += 5;
  } else if (futureFocusKey === "my_pattern") {
    repairBonus += 5;
  } else if (futureFocusKey === "person_type") {
    pullBonus += 4;
  }

  if (mainConcernKey === "communication") {
    repairBonus += 6;
  } else if (mainConcernKey === "repeated-conflict") {
    repairBonus += 5;
    pullBonus -= 3;
  } else if (mainConcernKey === "trust") {
    alignmentBonus += 5;
    repairBonus += 4;
  } else if (mainConcernKey === "life-money") {
    paceBonus += 5;
    alignmentBonus += 4;
  } else if (mainConcernKey === "marriage-path") {
    timingBonus += 6;
    alignmentBonus += 5;
  }

  if (coupleOutcomeKey === "mutual_understanding") {
    pullBonus += 4;
  } else if (coupleOutcomeKey === "conflict_relief") {
    repairBonus += 5;
  } else if (coupleOutcomeKey === "future_direction") {
    timingBonus += 5;
  } else if (coupleOutcomeKey === "risk_points") {
    alignmentBonus += 4;
  }

  if (relationshipTemperatureKey === "stable") {
    paceBonus += 4;
  } else if (relationshipTemperatureKey === "frequent_clash") {
    repairBonus += 4;
    pullBonus -= 3;
  } else if (relationshipTemperatureKey === "future_anxiety") {
    timingBonus += 4;
  }

  return { pullBonus, paceBonus, alignmentBonus, repairBonus, timingBonus };
};

const calculateScoreSet = (serviceType: string, featureSet: Record<string, unknown>, inputSnapshot?: Record<string, unknown>) => {
  const stemRelation = String(featureSet.stemRelation ?? "neutral");
  const branchRelation = String((featureSet.branchRelation as Record<string, unknown> | undefined)?.relation ?? "중립");
  const hasCheoneul = Boolean((featureSet.relationStars as Record<string, unknown> | undefined)?.hasCheoneul);
  const hasDohwa = Boolean((featureSet.relationStars as Record<string, unknown> | undefined)?.hasDohwa);
  const hasCollisionRisk = Boolean((featureSet.spousePalace as Record<string, unknown> | undefined)?.hasCollisionRisk);
  const complementarity = Number((featureSet.ohengBalance as Record<string, unknown> | undefined)?.complementarity ?? 55);
  const timeConfidence = Number(featureSet.timeConfidence ?? 55);
  const spouseStarScore = Number((featureSet.spouseStar as Record<string, unknown> | undefined)?.score ?? 50);

  let overall = 58;
  if (stemRelation === "generating") {
    overall += 10;
  } else if (stemRelation === "same") {
    overall += 6;
  } else if (stemRelation === "controlled") {
    overall -= 7;
  }

  if (branchRelation === "합") {
    overall += 9;
  } else if (branchRelation === "충") {
    overall -= 10;
  } else if (branchRelation === "형" || branchRelation === "파" || branchRelation === "해") {
    overall -= 6;
  }

  if (complementarity >= 80) {
    overall += 10;
  } else if (complementarity >= 65) {
    overall += 5;
  } else if (complementarity <= 45) {
    overall -= 6;
  }

  if (hasCheoneul) {
    overall += 4;
  }
  if (hasDohwa) {
    overall += 3;
  }
  if (hasCollisionRisk) {
    overall -= 6;
  }

  const bonus = inputSnapshot ? extractContextBonus(inputSnapshot) : { pullBonus: 0, paceBonus: 0, alignmentBonus: 0, repairBonus: 0, timingBonus: 0 };

  const boundedOverall = clamp(overall, 15, 99);
  return {
    overall: boundedOverall,
    pull: clamp(boundedOverall + (hasDohwa ? 6 : 0) + (branchRelation === "합" ? 4 : 0) - (branchRelation === "충" ? 7 : 0) + bonus.pullBonus, 10, 99),
    pace: clamp(
      boundedOverall + (stemRelation === "same" ? 5 : 0) + (stemRelation === "controlled" ? -7 : 0) + (timeConfidence >= 80 ? 4 : timeConfidence <= 50 ? -4 : 0) + bonus.paceBonus,
      10,
      99,
    ),
    alignment: clamp(
      boundedOverall + (complementarity >= 75 ? 8 : complementarity <= 45 ? -8 : 0) + (branchRelation === "합" ? 5 : 0) - (branchRelation === "파" ? 6 : 0) + bonus.alignmentBonus,
      10,
      99,
    ),
    repair: clamp(boundedOverall + (hasCheoneul ? 5 : 0) + (stemRelation === "generating" ? 4 : 0) - (hasCollisionRisk ? 10 : 0) + bonus.repairBonus, 10, 99),
    timing: clamp(Math.round(timeConfidence * 0.7) + (serviceType === "future-partner" ? 15 : 0) + (branchRelation === "합" ? 5 : 0) - (branchRelation === "충" ? 6 : 0) + bonus.timingBonus, 20, 99),
  };
};

const toStringArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value.map((item) => String(item)).filter(Boolean).slice(0, 5);
};

const ensureMinCount = (items: string[], minCount: number, fallback: string) => {
  const next = items.filter(Boolean);
  while (next.length < minCount) {
    next.push(fallback);
  }
  return next;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

interface PromptContextAnswer {
  questionKey: string;
  questionLabel: string;
  answerKey: string;
  answerLabel: string;
}

const parsePromptContextAnswers = (value: unknown): PromptContextAnswer[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      questionKey: String(item.questionKey ?? ""),
      questionLabel: String(item.questionLabel ?? ""),
      answerKey: String(item.answerKey ?? ""),
      answerLabel: String(item.answerLabel ?? ""),
    }))
    .filter((item) => item.questionKey && item.answerKey)
    .slice(0, 12);
};

const parseLegacyContextSummary = (context: Record<string, unknown>) => {
  const legacyParts: string[] = [];

  if (typeof context.currentStatus === "string" && context.currentStatus.trim()) {
    legacyParts.push(`상태=${context.currentStatus.trim()}`);
  }
  if (typeof context.desiredOutcome === "string" && context.desiredOutcome.trim()) {
    legacyParts.push(`목표=${context.desiredOutcome.trim()}`);
  }
  if (typeof context.preferredRelationshipStyle === "string" && context.preferredRelationshipStyle.trim()) {
    legacyParts.push(`관계스타일=${context.preferredRelationshipStyle.trim()}`);
  }
  if (typeof context.lastContactAt === "string" && context.lastContactAt.trim()) {
    legacyParts.push(`기준일=${context.lastContactAt.trim()}`);
  }
  if (Array.isArray(context.concerns)) {
    const concerns = context.concerns.map((item) => String(item)).filter(Boolean);
    if (concerns.length > 0) {
      legacyParts.push(`관심주제=${concerns.join(", ")}`);
    }
  }

  return legacyParts.join(" / ");
};

const extractPromptContext = (inputSnapshot: Record<string, unknown>) => {
  const context = isRecord(inputSnapshot.context) ? inputSnapshot.context : {};
  const contextAnswers = parsePromptContextAnswers(context.contextAnswers);
  const explicitSummary =
    typeof context.contextSummary === "string" && context.contextSummary.trim()
      ? context.contextSummary.trim()
      : "";
  const answerSummary =
    contextAnswers.length > 0
      ? contextAnswers.map((item) => `${item.questionLabel || item.questionKey}: ${item.answerLabel}`).join(" / ")
      : "";
  const legacySummary = parseLegacyContextSummary(context);
  const contextSummary = explicitSummary || answerSummary || legacySummary || "관계 맥락 요약 정보 없음";

  const legacyContext = {
    relationMode: context.relationMode ?? null,
    scenarioKey: context.scenarioKey ?? null,
    currentStatus: context.currentStatus ?? null,
    desiredOutcome: context.desiredOutcome ?? null,
    preferredRelationshipStyle: context.preferredRelationshipStyle ?? null,
    marriageIntent: context.marriageIntent ?? null,
    concerns: Array.isArray(context.concerns) ? context.concerns.map((item) => String(item)) : [],
    lastContactAt: context.lastContactAt ?? null,
    additionalNote: context.additionalNote ?? null,
  };

  const additionalNote =
    typeof context.additionalNote === "string" && context.additionalNote.trim()
      ? context.additionalNote.trim()
      : null;

  return {
    contextSummary,
    contextAnswers,
    legacyContext,
    additionalNote,
  };
};

const getQuickCounselDefaults = (serviceType: string) => {
  if (serviceType === "future-partner") {
    return {
      temperatureLabel: "인연 준비도",
      diagnosis: "지금은 배우자 기준과 만남 채널을 동시에 정리해야 인연운이 살아나는 구간입니다.",
      temperatureText: "기대와 기준은 분명하지만 관계를 여는 행동량이 부족한 상태입니다.",
      immediateAction: "이번 주 안에 내가 만날 사람의 기준 3개와 피할 기준 3개를 먼저 적어보세요.",
    };
  }

  if (serviceType === "couple-report") {
    return {
      temperatureLabel: "관계 온도",
      diagnosis: "지금 관계는 감정보다 운영 방식과 합의 구조를 먼저 손봐야 유지력이 생깁니다.",
      temperatureText: "서로의 애정은 남아 있지만 갈등 처리 방식이 관계를 갉아먹는 상태입니다.",
      immediateAction: "최근 가장 크게 부딪힌 주제 하나만 골라 서로의 요구를 문장으로 분리해 적어보세요.",
    };
  }

  return {
    temperatureLabel: "재접촉 위험도",
    diagnosis: "지금은 감정 확신보다 재접촉의 현실 조건과 멈춤 기준을 먼저 점검해야 하는 구간입니다.",
    temperatureText: "신호를 과대해석하면 손실이 커질 수 있는 민감한 상태입니다.",
    immediateAction: "연락하기 전에 최근 신호 3개를 적고, 그 신호가 사실인지 해석인지부터 구분해 보세요.",
  };
};

const buildScoreNarrativeFallback = (scoreSet: Record<string, number>) => {
  const labelMap: Record<string, string> = {
    overall: "전체 흐름",
    pull: "끌림",
    pace: "속도",
    alignment: "합의력",
    repair: "회복력",
    timing: "타이밍",
  };

  return Object.entries(labelMap).map(([axis, label]) => ({
    axis,
    label,
    score: clamp(Number(scoreSet[axis] ?? 0)),
    interpretation: `${label} 축은 지금 관계에서 가장 먼저 손봐야 할 온도를 보여줍니다.`,
    why: `현재 입력 맥락과 사주 구조를 합쳐 ${label} 점수가 계산되었습니다.`,
  }));
};

const parseScoreNarratives = (value: unknown, scoreSet: Record<string, number>) => {
  if (!Array.isArray(value)) {
    return buildScoreNarrativeFallback(scoreSet);
  }

  const fallback = buildScoreNarrativeFallback(scoreSet);
  const items = value
    .filter(isRecord)
    .map((item, index) => {
      const axis = String(item.axis ?? fallback[index]?.axis ?? "overall");
      const label = String(item.label ?? fallback[index]?.label ?? "전체 흐름");
      return {
        axis,
        label,
        score: clamp(Number(item.score ?? scoreSet[axis] ?? fallback[index]?.score ?? 0)),
        interpretation: String(item.interpretation ?? fallback[index]?.interpretation ?? `${label} 해석을 확인하세요.`),
        why: String(item.why ?? fallback[index]?.why ?? `${label} 점수가 나온 근거를 확인하세요.`),
      };
    });

  return items.length > 0 ? items : fallback;
};

const parseActionRoadmap = (value: unknown, fallbackAction: string, fallbackHighlights: string[]) => {
  if (!isRecord(value)) {
    return {
      now: [fallbackAction, ...(fallbackHighlights.slice(0, 1))],
      within7Days: fallbackHighlights.slice(0, 2),
      within30Days: [...fallbackHighlights.slice(0, 2), "기록한 신호와 반응을 바탕으로 다음 행동을 조정하세요."],
    };
  }

  return {
    now: toStringArray(value.now, [fallbackAction, ...(fallbackHighlights.slice(0, 1))]),
    within7Days: toStringArray(value.within7Days, fallbackHighlights.slice(0, 2)),
    within30Days: toStringArray(value.within30Days, [...fallbackHighlights.slice(0, 2), "기록한 신호와 반응을 바탕으로 다음 행동을 조정하세요."]),
  };
};

const fillDifferentiatedSections = (rawSections: Array<Record<string, unknown>>, serviceType: string) => {
  const strategy = getLoveReportStrategy(serviceType as "future-partner" | "couple-report" | "crush-reunion");

  return strategy.sections.map((template, index) => {
    const section = rawSections[index] ?? {};
    const title = typeof section.title === "string" && section.title.trim() ? section.title : template.title;
    const coreQuestion =
      typeof section.coreQuestion === "string" && section.coreQuestion.trim()
        ? section.coreQuestion
        : template.coreQuestion;
    const verdict = typeof section.verdict === "string" && section.verdict.trim()
      ? section.verdict
      : `${title}에서는 성급한 단정보다 조건과 패턴을 함께 봐야 합니다.`;
    const analysisParagraphs = ensureMinCount(
      toStringArray(section.analysisParagraphs, [
        `${title}은 입력된 관계 맥락과 사주 구조를 함께 봐야 정확도가 높아집니다.`,
        "이번 판단은 한 번의 사건보다 반복되는 패턴과 현실 조건에 더 큰 가중치를 두고 해석했습니다.",
      ]).slice(0, 3),
      2,
      "입력 맥락이 바뀌면 같은 사주 구조라도 해석 결론은 달라질 수 있습니다.",
    );
    const interpretationPoints = ensureMinCount(
      toStringArray(section.interpretationPoints, [
        "현재 맥락이 사주 구조와 어떻게 맞물리는지 확인하세요.",
        "감정 반응보다 반복 패턴을 먼저 보세요.",
        "조건이 달라지면 해석의 결론도 달라질 수 있습니다.",
      ]).slice(0, 4),
      3,
      "신호를 해석할 때 사실과 추측을 분리하세요.",
    );
    const actionTitle = typeof section.actionTitle === "string" && section.actionTitle.trim()
      ? section.actionTitle
      : "지금 적용할 행동";
    const actionItems = ensureMinCount(
      toStringArray(section.actionItems, [
        "지금 상황을 한 문장으로 요약하고, 감정과 사실을 구분하세요.",
        "이번 주 안에 실행 가능한 행동 하나만 먼저 정하세요.",
        "반응을 기록하고 다음 선택을 조정하세요.",
      ]),
      3,
      "행동 후 반응을 기록해 다음 선택 기준으로 삼으세요.",
    );
    const warningNote = typeof section.warningNote === "string" && section.warningNote.trim()
      ? section.warningNote
      : "한 번의 반응을 전체 결론으로 확대하지 마세요.";

    return {
      id: typeof section.id === "string" && section.id.trim() ? section.id : template.id,
      navLabel: typeof section.navLabel === "string" && section.navLabel.trim() ? section.navLabel : template.navLabel,
      title,
      coreQuestion,
      verdict,
      analysisParagraphs,
      interpretationPoints,
      actionTitle,
      actionItems,
      warningNote,
      lockedBenefit: typeof section.lockedBenefit === "string" && section.lockedBenefit.trim()
        ? section.lockedBenefit
        : template.lockedBenefit,
    };
  });
};

const parseServiceInsights = (value: unknown, serviceType: string) => {
  const payload = isRecord(value) ? value : {};

  if (serviceType === "future-partner") {
    const partnerProfile = isRecord(payload.partnerProfile)
      ? {
        matchKeywords: toStringArray(payload.partnerProfile.matchKeywords, ["안정감", "생활 합의력"]),
        avoidKeywords: toStringArray(payload.partnerProfile.avoidKeywords, ["감정 기복", "기준 불명확"]),
        idealDescription: String(payload.partnerProfile.idealDescription ?? "생활 감각과 가치관이 맞는 상대를 찾는 것이 핵심입니다."),
      }
      : {
        matchKeywords: ["안정감", "생활 합의력"],
        avoidKeywords: ["감정 기복", "기준 불명확"],
        idealDescription: "생활 감각과 가치관이 맞는 상대를 찾는 것이 핵심입니다.",
      };

    return {
      kind: "future-partner",
      partnerProfile,
      meetingChannels: toStringArray(payload.meetingChannels, ["친구 연결", "관심사 커뮤니티", "일상 동선 안의 반복 접점"]),
      greenFlags: toStringArray(payload.greenFlags, ["초반부터 일정과 기준을 명확히 말함", "생활 습관과 돈 감각을 숨기지 않음", "과장 없이 꾸준히 반응함"]),
      redFlags: toStringArray(payload.redFlags, ["말과 행동의 일관성이 낮음", "기준을 묻는 대화를 피함", "초반부터 감정 속도를 과하게 밀어붙임"]),
      selfCheckCriteria: toStringArray(payload.selfCheckCriteria, ["내가 원하는 일상과 미래 그림이 선명한가", "조건과 감정을 분리해서 보고 있는가", "초기 호감 때문에 기준을 낮추고 있지 않은가"]),
    };
  }

  if (serviceType === "couple-report") {
    return {
      kind: "couple-report",
      conflictTriggers: toStringArray(payload.conflictTriggers, ["대답 속도 차이", "생활 우선순위 충돌", "돈/시간 사용 기준 차이"]),
      repairRituals: toStringArray(payload.repairRituals, ["감정 정리 시간을 먼저 확보하기", "한 주제씩만 말하기", "사실/감정/요구를 순서대로 말하기"]),
      agreementChecklist: toStringArray(payload.agreementChecklist, ["연락 빈도", "돈과 시간 사용 기준", "미래 계획 공유 범위"]),
      doNotSay: toStringArray(payload.doNotSay, ["넌 원래 그런 사람이야", "말해봤자 소용없어", "그냥 네가 다 틀렸어"]),
      recoverySignals: toStringArray(payload.recoverySignals, ["상대 요구를 요약해 되말함", "방어보다 확인 질문을 먼저 함", "같은 주제로 재폭발하지 않음"]),
    };
  }

  const fallbackVerdict = payload.chanceVerdict === "가능성 있음" || payload.chanceVerdict === "제한적" || payload.chanceVerdict === "확실한 정보 없음"
    ? payload.chanceVerdict
    : "제한적";

  return {
    kind: "crush-reunion",
    chanceVerdict: fallbackVerdict,
    positiveSignals: toStringArray(payload.positiveSignals, ["간헐적이지만 응답이 유지됨", "새 관계를 명시적으로 언급하지 않음", "대화 창을 완전히 닫지 않음"]),
    blockingSignals: toStringArray(payload.blockingSignals, ["읽고도 장기 무응답", "명확한 거리두기 요청", "새 관계나 우선순위 전환 신호"]),
    contactWindow: String(payload.contactWindow ?? "상대 반응이 열리는 짧은 창이 보일 때만 시도하고, 침묵이 길어지면 멈추는 편이 손실이 적습니다."),
    stopLossRules: toStringArray(payload.stopLossRules, ["두 번 이상 일방향 연락하지 않기", "상대가 명확히 선을 그으면 추가 해석하지 않기", "신호가 불명확하면 감정 대신 관찰을 우선하기"]),
    contactScripts: toStringArray(payload.contactScripts, ["오랜 얘기를 다시 꺼내기보다 안부만 짧게 묻고 싶어.", "답을 강요하려는 건 아니고, 오해가 있다면 정리하고 싶었어.", "부담될 것 같다면 여기서 멈출게."]),
  };
};

const buildContextDirectives = (serviceType: string, promptContext: ReturnType<typeof extractPromptContext>) => {
  const directives: string[] = [];
  const { legacyContext, contextAnswers } = promptContext;
  const scenarioKey = String(legacyContext.scenarioKey ?? "");

  if (serviceType === "future-partner") {
    if (scenarioKey === "recent-breakup" || legacyContext.relationMode === "breakup") {
      directives.push("- 최근 이별의 여파가 남아 있는 상태를 반영해, 다음 인연을 열기 전에 정리해야 할 패턴을 함께 짚으세요.");
    }
    const focus = contextAnswers.find((answer) => answer.questionKey === "future_focus")?.answerKey;
    if (focus === "timing") {
      directives.push("- 만남 시기와 환경을 구체적으로 제시하세요.");
    } else if (focus === "person_type") {
      directives.push("- 배우자상과 만나면 안 되는 타입을 더 구체적으로 제시하세요.");
    } else if (focus === "my_pattern") {
      directives.push("- 반복되는 연애 습관과 수정 포인트를 더 깊게 쓰세요.");
    }
  }

  if (serviceType === "couple-report") {
    const concern = contextAnswers.find((answer) => answer.questionKey === "main_concern")?.answerKey;
    if (concern === "communication") {
      directives.push("- 대화 순서와 감정 번역 문제를 중심으로 분석하세요.");
    } else if (concern === "life-money") {
      directives.push("- 생활 리듬과 돈 문제를 합의 구조 관점에서 더 깊게 분석하세요.");
    } else if (concern === "marriage-path") {
      directives.push("- 결혼 관점의 합의도와 일정 감각을 함께 다루세요.");
    }
  }

  if (serviceType === "crush-reunion") {
    if (scenarioKey === "breakup") {
      directives.push("- 이별 이후의 재접촉 가능성과 감정 잔존을 구분해서 설명하세요.");
    } else if (scenarioKey === "no-contact") {
      directives.push("- 무연락 상태의 리스크와 연락 창을 분리해서 설명하세요.");
    }
  }

  return directives;
};

const generateDifferentiatedStory = async ({
  serviceType,
  scoreSet,
  featureSet,
  inputSnapshot,
}: {
  serviceType: string;
  scoreSet: Record<string, number>;
  featureSet: Record<string, unknown>;
  inputSnapshot: Record<string, unknown>;
}) => {
  if (!geminiApiKey) {
    throw new Error("love-reports is unavailable: missing GEMINI_API_KEY");
  }

  const strategy = getLoveReportStrategy(serviceType as "future-partner" | "couple-report" | "crush-reunion");
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.55,
    },
  });

  const promptContext = extractPromptContext(inputSnapshot);
  const sectionsText = strategy.sections
    .map((section, index) => `${index + 1}. id=${section.id}, navLabel=${section.navLabel}, title=${section.title}, coreQuestion=${section.coreQuestion}`)
    .join("\n");
  const contextDirectives = buildContextDirectives(serviceType, promptContext);
  const contextDirectiveBlock = contextDirectives.length > 0
    ? `\n[선택 기반 추가 지시]\n${contextDirectives.join("\n")}\n`
    : "";

  const subjectA = (inputSnapshot.subjectA as Record<string, unknown> | undefined) ?? {};
  const subjectB = inputSnapshot.subjectB as Record<string, unknown> | undefined;
  const isAExact = subjectA.birthPrecision === "exact" || typeof subjectA.hour === "number";
  const isBExact = subjectB ? (subjectB.birthPrecision === "exact" || typeof subjectB.hour === "number") : false;
  const timeConfidenceDetail = featureSet.timeConfidence === 100
    ? serviceType === "future-partner"
      ? "본인의 출생 시간이 정확하게 입력되었습니다."
      : "모든 인물의 출생 시간이 정확하게 입력되었습니다."
    : isAExact && subjectB && !isBExact
      ? "사용자 본인의 출생 시간은 정확하나 상대방의 출생 시간을 모릅니다."
      : !isAExact && subjectB && isBExact
        ? "상대방 출생 시간은 정확하나 사용자 본인의 출생 시간을 모릅니다."
        : !isAExact && !subjectB
          ? "사용자 본인의 출생 시간이 정확하지 않습니다."
          : "본인과 상대방 모두 출생 시간이 명확하지 않습니다.";

  const prompt = `
당신은 한국어 사주 기반 관계 리포트 생성기입니다.
서비스 타입: ${serviceType}
리포트 레이아웃: ${strategy.reportLayout}
톤: ${strategy.tone}
시스템 지시: ${strategy.systemInstruction}

[데이터]
점수 세트: ${JSON.stringify(scoreSet)}
특징 세트: ${JSON.stringify(featureSet)}
관계 맥락 요약: ${promptContext.contextSummary}
관계 선택 응답(라벨 포함): ${JSON.stringify(promptContext.contextAnswers)}
레거시 맥락 필드: ${JSON.stringify(promptContext.legacyContext)}
시간 입력 상태: ${timeConfidenceDetail}
${promptContext.additionalNote ? `사용자 추가 메모: ${promptContext.additionalNote}` : ""}
${contextDirectiveBlock}

[섹션 구조]
${sectionsText}

[절대 규칙]
${strategy.summaryGuardrails.map((rule, index) => `${index + 1}. ${rule}`).join("\n")}
${strategy.sections.length + 1}. headline, quickCounsel.diagnosis, openSection.verdict, previewHighlights는 서로 문장 재사용을 금지합니다.
${strategy.sections.length + 2}. 각 paid section은 analysisParagraphs 2~3개, interpretationPoints 3~4개, actionItems 3개 이상을 반드시 채우세요.
${strategy.sections.length + 3}. conversationPrompts는 실제 문장 예시만 적고 설명을 섞지 마세요.
${strategy.sections.length + 4}. avoidList는 절대 하지 말아야 할 행동만 적으세요.
${strategy.sections.length + 5}. 서비스 전용 산출물(serviceInsights)을 반드시 채우세요.
${strategy.sections.length + 6}. 사용자 추가 메모가 있으면 리포트 전체의 초점, 해석, 행동 가이드에 해당 내용을 반드시 반영하세요.

아래 JSON 스키마를 정확히 따르세요:
${strategy.responseSchema}
`;

  const result = await withGeminiTimeout(model.generateContent(prompt));
  const parsed = JSON.parse(result.response.text()) as Record<string, unknown>;
  const sections = fillDifferentiatedSections(
    Array.isArray(parsed.sections) ? (parsed.sections as Array<Record<string, unknown>>) : [],
    serviceType,
  );
  const quickCounselDefaults = getQuickCounselDefaults(serviceType);
  const quickCounsel = isRecord(parsed.quickCounsel)
    ? {
      diagnosis: String(parsed.quickCounsel.diagnosis ?? quickCounselDefaults.diagnosis),
      temperatureLabel: String(parsed.quickCounsel.temperatureLabel ?? quickCounselDefaults.temperatureLabel),
      temperatureText: String(parsed.quickCounsel.temperatureText ?? quickCounselDefaults.temperatureText),
      immediateAction: String(parsed.quickCounsel.immediateAction ?? quickCounselDefaults.immediateAction),
    }
    : quickCounselDefaults;
  const previewHighlights = toStringArray(
    parsed.previewHighlights,
    sections.slice(0, 3).map((section) => section.verdict),
  ).slice(0, 3);
  const confidenceSummary = typeof parsed.confidenceSummary === "string" && parsed.confidenceSummary.trim()
    ? parsed.confidenceSummary
    : serviceType === "future-partner"
      ? "출생시간 정보가 없으면 타이밍 판단은 보수적으로 읽는 편이 안전합니다."
      : "출생시간이나 상대 정보가 부족하면 해석 강도보다 관찰의 비중을 높여야 합니다.";

  return {
    headline: typeof parsed.headline === "string" ? parsed.headline : quickCounsel.diagnosis,
    summary: typeof parsed.summary === "string" ? parsed.summary : `${quickCounsel.diagnosis} ${quickCounsel.immediateAction}`,
    quickCounsel,
    previewHighlights,
    ctaReason: typeof parsed.ctaReason === "string" ? parsed.ctaReason : "전체 리포트를 열면 실행 가능한 행동과 서비스 전용 판단 자료를 확인할 수 있습니다.",
    confidenceSummary,
    sections,
    scoreNarratives: parseScoreNarratives(parsed.scoreNarratives, scoreSet),
    actionRoadmap: parseActionRoadmap(parsed.actionRoadmap, quickCounsel.immediateAction, previewHighlights),
    serviceInsights: parseServiceInsights(parsed.serviceInsights, serviceType),
    conversationPrompts: toStringArray(parsed.conversationPrompts, ["지금 내 마음보다 상황을 먼저 차분히 정리하고 싶어.", "서로의 기대를 한 번만 확인하고 싶어.", "부담이 된다면 여기서 멈출게."]),
    avoidList: toStringArray(parsed.avoidList, ["확답을 강요하지 마세요.", "한 번의 반응으로 전체를 단정하지 마세요.", "불안 때문에 행동 속도를 올리지 마세요."]),
    confidenceNotes: toStringArray(parsed.confidenceNotes, [confidenceSummary, "입력 맥락이 달라지면 해석의 강도와 우선순위도 달라질 수 있습니다.", "사주 구조보다 실제 행동과 합의가 결과를 바꿀 수 있습니다."]),
    reportLayout: strategy.reportLayout,
  };
};

const buildDifferentiatedPreview = ({
  serviceType,
  scoreSet,
  story,
  nextRefreshAt,
}: {
  serviceType: string;
  scoreSet: Record<string, number>;
  story: ReturnType<typeof generateDifferentiatedStory> extends Promise<infer T> ? T : never;
  nextRefreshAt: string;
}) => {
  const strategy = getLoveReportStrategy(serviceType as "future-partner" | "couple-report" | "crush-reunion");
  const openSection = story.sections[0];
  const lockedSectionSummaries = story.sections.slice(1).map((section, index) => ({
    id: section.id,
    title: section.title,
    teaser: section.analysisParagraphs[0] ?? section.verdict,
    benefit: strategy.sections[index + 1]?.lockedBenefit ?? "해제 후 세부 해석과 실행 가이드를 확인할 수 있습니다.",
  }));

  return {
    headline: story.headline,
    summary: story.summary,
    serviceType,
    reportLayout: story.reportLayout,
    scoreSet,
    quickCounsel: story.quickCounsel,
    previewHighlights: story.previewHighlights,
    openSection,
    lockedSectionSummaries,
    ctaReason: story.ctaReason,
    confidenceSummary: story.confidenceSummary,
    nextRefreshAt,
  };
};

const mapReportRow = async (row: Record<string, unknown>, includeFull = false) => {
  const inputSnapshot = await decryptJson<Record<string, unknown>>(row.input_snapshot_enc as string | undefined, row.input_snapshot_iv as string | undefined);
  const fullReport = includeFull
    ? await decryptJson<Record<string, unknown>>(row.full_report_enc as string | undefined, row.full_report_iv as string | undefined)
    : null;

  return {
    id: row.id,
    userId: (row.user_id as string | null) ?? undefined,
    guestSessionId: (row.guest_id as string | null) ?? undefined,
    serviceType: row.service_type,
    relationMode: (row.relation_mode as string | null) ?? undefined,
    baseSajuResultId: (row.base_saju_result_id as string | null) ?? undefined,
    reportVersion: (row.report_version as string | null) ?? undefined,
    menuVariant: (row.menu_variant as string | null) ?? undefined,
    inputSnapshot: inputSnapshot ?? ((row.input_snapshot as Record<string, unknown>) ?? {}),
    featureSet: row.feature_set,
    scoreSet: row.score_set,
    preview: row.preview_json,
    fullReport: fullReport ?? undefined,
    isUnlocked: Boolean(row.is_unlocked),
    unlockedAt: (row.unlocked_at as string | null) ?? undefined,
    nextRefreshAt: row.next_refresh_at,
    createdAt: row.created_at,
  };
};

const findExistingReportByFingerprint = async ({
  client,
  ownership,
  serviceType,
  inputFingerprint,
}: {
  client: ReturnType<typeof getSupabaseClient>;
  ownership: OwnershipFilter;
  serviceType: string;
  inputFingerprint: string;
}) => {
  let query = client
    .from("love_reports")
    .select("*")
    .eq("service_type", serviceType)
    .eq("report_version", COUNSEL_REPORT_VERSION)
    .eq("template_version", COUNSEL_TEMPLATE_VERSION)
    .eq("input_fingerprint", inputFingerprint)
    .order("created_at", { ascending: false })
    .limit(1);

  if (ownership.user_id) {
    query = query.eq("user_id", ownership.user_id).is("guest_id", null);
  } else {
    query = query.eq("guest_id", ownership.guest_id).is("user_id", null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as Record<string, unknown> | null) ?? null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authorization = req.headers.get("Authorization");
    const guestId = req.headers.get("x-guest-id") ?? "";
    const incomingApiKey = req.headers.get("apikey") ?? "";
    const body = (await req.json()) as ActionRequest;
    const payload = body.payload ?? {};

    const owner = await resolveOwner(authorization, guestId);
    ensureOwner(owner);
    const ownership = ownerFilter(owner);

    const client = getSupabaseClient();
    const isInternalCreate = req.headers.get("x-internal-create") === "1" && incomingApiKey === serviceRoleKey;

    if (body.action === "create") {
      if (!isInternalCreate) {
        return new Response(JSON.stringify({ ok: false, error: "create action is restricted to service routes" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const serviceType = String(payload.serviceType ?? "");
      const relationMode = (payload.relationMode as string | undefined) ?? null;
      const baseSajuResultId = (payload.baseSajuResultId as string | undefined) ?? null;
      const inputSnapshot = (payload.inputSnapshot as Record<string, unknown> | undefined) ?? {};
      const featureSet = (payload.featureSet as Record<string, unknown> | undefined) ?? {};

      if (!serviceType || !payload.inputSnapshot || !payload.featureSet) {
        return new Response(JSON.stringify({ ok: false, error: "serviceType, inputSnapshot, featureSet are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const inputFingerprint = await buildLoveInputFingerprint({
        serviceType,
        relationMode,
        inputSnapshot,
        featureSet,
      });
      const existingRow = await findExistingReportByFingerprint({
        client,
        ownership,
        serviceType,
        inputFingerprint,
      });

      if (existingRow && isRefreshWindowLocked(existingRow.next_refresh_at)) {
        const mapped = await mapReportRow(existingRow, Boolean(existingRow.is_unlocked));
        return new Response(JSON.stringify({ ok: true, data: mapped }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const scoreSet = calculateScoreSet(serviceType, featureSet, inputSnapshot);
      const story = await generateDifferentiatedStory({ serviceType, scoreSet, featureSet, inputSnapshot });

      const nextRefreshDate = new Date();
      nextRefreshDate.setDate(nextRefreshDate.getDate() + 30);
      const nextRefreshAt = nextRefreshDate.toISOString();

      const preview = buildDifferentiatedPreview({
        serviceType,
        scoreSet,
        story,
        nextRefreshAt,
      });

      const fullReport = {
        headline: story.headline,
        summary: story.summary,
        serviceType,
        reportLayout: story.reportLayout,
        scoreSet,
        sections: story.sections,
        scoreNarratives: story.scoreNarratives,
        actionRoadmap: story.actionRoadmap,
        serviceInsights: story.serviceInsights,
        avoidList: story.avoidList,
        conversationPrompts: story.conversationPrompts,
        confidenceNotes: story.confidenceNotes,
        nextRefreshAt,
      };

      const encryptedInput = await encryptJson(inputSnapshot);
      const encryptedFull = await encryptJson(fullReport);

      const writePayload = {
        user_id: ownership.user_id,
        guest_id: ownership.guest_id,
        service_type: serviceType,
        relation_mode: relationMode,
        base_saju_result_id: baseSajuResultId,
        report_version: COUNSEL_REPORT_VERSION,
        template_version: COUNSEL_TEMPLATE_VERSION,
        menu_variant: serviceType,
        input_fingerprint: inputFingerprint,
        input_snapshot: { redacted: true },
        input_snapshot_enc: encryptedInput.ciphertext,
        input_snapshot_iv: encryptedInput.iv,
        feature_set: featureSet,
        score_set: scoreSet,
        preview_json: preview,
        full_report_enc: encryptedFull.ciphertext,
        full_report_iv: encryptedFull.iv,
        next_refresh_at: nextRefreshAt,
      };

      let writtenRow: Record<string, unknown> | null = null;

      if (existingRow?.id) {
        const { data, error } = await client
          .from("love_reports")
          .update(writePayload)
          .eq("id", String(existingRow.id))
          .select("*")
          .single();
        if (error || !data) {
          throw new Error(error?.message ?? "failed to refresh love report");
        }
        writtenRow = data as Record<string, unknown>;
      } else {
        const { data, error } = await client
          .from("love_reports")
          .insert({
            ...writePayload,
            is_unlocked: false,
          })
          .select("*")
          .single();

        if (error || !data) {
          const duplicateKey = (error?.message ?? "").toLowerCase().includes("duplicate key");
          if (duplicateKey) {
            const deduplicated = await findExistingReportByFingerprint({
              client,
              ownership,
              serviceType,
              inputFingerprint,
            });
            if (deduplicated) {
              const mapped = await mapReportRow(deduplicated, Boolean(deduplicated.is_unlocked));
              return new Response(JSON.stringify({ ok: true, data: mapped }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }
          throw new Error(error?.message ?? "failed to create love report");
        }
        writtenRow = data as Record<string, unknown>;
      }

      if (!writtenRow) {
        throw new Error("failed to persist love report");
      }

      const mapped = await mapReportRow(writtenRow, Boolean(writtenRow.is_unlocked));
      return new Response(JSON.stringify({ ok: true, data: mapped }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "get_preview") {
      const id = String(payload.id ?? "");
      if (!id) {
        throw new Error("id is required");
      }

      let query = client.from("love_reports").select("*").eq("id", id).limit(1);
      if (ownership.user_id) {
        query = query.eq("user_id", ownership.user_id);
      } else {
        query = query.eq("guest_id", ownership.guest_id);
      }

      const { data, error } = await query.maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      if (!data) {
        return new Response(JSON.stringify({ ok: true, data: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const mapped = await mapReportRow(data as Record<string, unknown>, Boolean(data.is_unlocked));
      return new Response(JSON.stringify({ ok: true, data: mapped }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "unlock") {
      const id = String(payload.id ?? "");
      const productCode = String(payload.productCode ?? "");
      const amountKrw = Number(payload.amountKrw ?? 0);
      const provider = String(payload.provider ?? "mock");
      const providerOrderId = String(payload.providerOrderId ?? crypto.randomUUID());

      if (!id || !productCode || amountKrw <= 0) {
        throw new Error("id, productCode, amountKrw are required");
      }

      let reportQuery = client.from("love_reports").select("*").eq("id", id).limit(1);
      if (ownership.user_id) {
        reportQuery = reportQuery.eq("user_id", ownership.user_id);
      } else {
        reportQuery = reportQuery.eq("guest_id", ownership.guest_id);
      }
      const { data: reportData, error: reportError } = await reportQuery.maybeSingle();
      if (reportError || !reportData) {
        throw new Error(reportError?.message ?? "report not found");
      }

      const now = new Date().toISOString();

      const { error: orderError } = await client.from("love_report_orders").insert({
        report_id: id,
        user_id: ownership.user_id,
        guest_id: ownership.guest_id,
        product_code: productCode,
        amount_krw: amountKrw,
        status: "paid",
        provider,
        provider_order_id: providerOrderId,
        paid_at: now,
      });
      if (orderError) {
        throw new Error(orderError.message);
      }

      const { data, error } = await client
        .from("love_reports")
        .update({
          is_unlocked: true,
          unlocked_at: now,
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "failed to unlock report");
      }

      const mapped = await mapReportRow(data as Record<string, unknown>, true);
      return new Response(JSON.stringify({ ok: true, data: mapped }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "list") {
      const limit = Number(payload.limit ?? 30);
      let query = client.from("love_reports").select("*").order("created_at", { ascending: false }).limit(limit);
      if (ownership.user_id) {
        query = query.eq("user_id", ownership.user_id);
      } else {
        query = query.eq("guest_id", ownership.guest_id);
      }
      const { data, error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      const mapped = await Promise.all((data ?? []).map((row) => mapReportRow(row as Record<string, unknown>, false)));
      return new Response(JSON.stringify({ ok: true, data: mapped }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "delete") {
      const id = String(payload.id ?? "");
      if (!id) {
        throw new Error("id is required");
      }
      let query = client.from("love_reports").delete().eq("id", id);
      if (ownership.user_id) {
        query = query.eq("user_id", ownership.user_id);
      } else {
        query = query.eq("guest_id", ownership.guest_id);
      }
      const { error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      return new Response(JSON.stringify({ ok: true, data: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: false, error: `unknown action: ${body.action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    if (message === "upstream_timeout") {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "AI 분석 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
          code: "UPSTREAM_TIMEOUT",
        }),
        {
          status: 504,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
