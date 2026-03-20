import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.14.0";
import { corsHeaders } from "../_shared/cors.ts";

type JsonObject = Record<string, unknown>;

interface ActionRequest {
  action: "create" | "get_preview" | "unlock" | "list" | "delete";
  payload?: JsonObject;
}

interface OwnerContext {
  userId: string | null;
  guestId: string;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const encryptionSeed = Deno.env.get("DATA_ENCRYPTION_KEY") ?? "";
const geminiApiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
const genAI = new GoogleGenerativeAI(geminiApiKey);

const encoder = new TextEncoder();
const decoder = new TextDecoder();

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

const getSupabaseClient = (authorization: string | null) => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const headers: Record<string, string> = {};
  if (authorization) {
    headers.Authorization = authorization;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    global: {
      headers,
    },
  });
};

const resolveOwner = async (authorization: string | null, guestId: string): Promise<OwnerContext> => {
  const client = getSupabaseClient(authorization);
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

const ownerFilter = (owner: OwnerContext) => {
  if (owner.userId) {
    return { user_id: owner.userId, guest_id: null };
  }
  return { user_id: null, guest_id: owner.guestId };
};

type CounselBlueprintSection = {
  type: "opening" | "self-pattern" | "dynamic" | "scenario" | "prescription" | "evidence";
  title: string;
  question: string;
  benefit: string;
};

const COUNSEL_BLUEPRINT: Record<string, { tone: string; strictRule: string; sections: CounselBlueprintSection[] }> = {
  "future-partner": {
    tone: "탐색형 상담. 미래 배우자상을 찾되 현재 상대를 전제하지 않는다.",
    strictRule: "현재 특정 상대와 비교하는 문장 금지. 사용자가 반복하는 연애 패턴과 인연의 질에 집중한다.",
    sections: [
      {
        type: "opening",
        title: "어떤 사람에게 안정적으로 끌리는가",
        question: "내가 편안함을 느끼는 배우자 결은 무엇인가",
        benefit: "한 줄 진단과 관계 온도, 지금 필요한 조정 포인트를 바로 확인할 수 있습니다.",
      },
      {
        type: "self-pattern",
        title: "반복되는 연애 패턴은 무엇인가",
        question: "내가 관계에서 자주 기대하고 불안해하는 지점은 무엇인가",
        benefit: "연애가 꼬일 때 반복되는 기대와 불안을 파악할 수 있습니다.",
      },
      {
        type: "dynamic",
        title: "잘 맞는 배우자와 어긋나는 상대는 어떻게 갈리나",
        question: "끌림과 생활 합의력이 갈리는 기준은 무엇인가",
        benefit: "맞는 사람과 피해야 할 사람을 구분하는 기준을 확인할 수 있습니다.",
      },
      {
        type: "scenario",
        title: "인연이 열리는 장면은 언제인가",
        question: "가까운 시기 안에 어떤 환경과 타이밍에서 인연운이 움직이나",
        benefit: "만남이 열리는 시기와 장면을 행동 기준으로 정리해 줍니다.",
      },
      {
        type: "prescription",
        title: "연애 습관을 어떻게 바꿔야 하나",
        question: "결혼을 생각할수록 지금 바꿔야 할 태도는 무엇인가",
        benefit: "지금 당장 바꿔야 할 말투, 속도, 선택 기준을 제안합니다.",
      },
      {
        type: "evidence",
        title: "이 판단은 무엇을 근거로 했나",
        question: "오행과 합충, 배우자성, 시간 신뢰도가 어떻게 읽혔나",
        benefit: "왜 이런 판단이 나왔는지 근거 노트와 신뢰도 메모를 확인할 수 있습니다.",
      },
    ],
  },
  "couple-report": {
    tone: "중립적 상담. 감정적 판정보다 관계 운영과 합의 구조를 설명한다.",
    strictRule: "잘 맞는다/안 맞는다의 단순 판정 금지. 생활, 대화, 회복 구조를 구체적으로 말한다.",
    sections: [
      {
        type: "opening",
        title: "우리 관계의 핵심은 무엇인가",
        question: "지금 이 관계에서 가장 먼저 봐야 할 온도와 균형은 무엇인가",
        benefit: "한 줄 진단과 즉시 확인해야 할 리스크를 빠르게 볼 수 있습니다.",
      },
      {
        type: "self-pattern",
        title: "각자 어떤 기대를 끌고 들어오나",
        question: "두 사람이 관계에서 당연하게 여기는 기대치는 무엇이 다른가",
        benefit: "서로 다른 기대치와 감정 속도를 먼저 정리할 수 있습니다.",
      },
      {
        type: "dynamic",
        title: "왜 잘 맞고 왜 부딪히나",
        question: "끌림 포인트와 갈등 트리거가 동시에 생기는 이유는 무엇인가",
        benefit: "싸움이 커지는 이유와 회복이 빨라지는 포인트를 확인할 수 있습니다.",
      },
      {
        type: "scenario",
        title: "앞으로 어디서 갈리나",
        question: "생활, 돈, 결혼 이야기가 시작될 때 어떤 분기점이 오나",
        benefit: "앞으로 30~90일 안에 조심해야 할 분기점을 볼 수 있습니다.",
      },
      {
        type: "prescription",
        title: "지금 관계를 지키려면 무엇을 해야 하나",
        question: "이 관계를 유지하고 싶다면 지금 어떤 행동이 가장 효과적인가",
        benefit: "대화 문장 예시와 바로 실행할 행동 루틴을 이어서 확인할 수 있습니다.",
      },
      {
        type: "evidence",
        title: "이 판단은 무엇을 근거로 했나",
        question: "오행과 합충, 배우자성, 시간 신뢰도가 어떤 의미를 가졌나",
        benefit: "근거 노트와 신뢰도 메모를 통해 해석의 배경을 확인할 수 있습니다.",
      },
    ],
  },
  "crush-reunion": {
    tone: "냉정한 시나리오형 상담. 희망고문을 피하고 현실적 선택지를 제시한다.",
    strictRule: "단정적 재회 유도 금지. 반드시 가능성 있음 / 제한적 / 확실한 정보 없음 중 하나의 판단 언어를 사용한다.",
    sections: [
      {
        type: "opening",
        title: "지금 보이는 신호는 현실적인가",
        question: "이 관계가 실제로 움직일 가능성이 있는지 먼저 판단해야 한다면",
        benefit: "가능성 판단과 지금 섣불리 움직이면 안 되는 이유를 먼저 확인할 수 있습니다.",
      },
      {
        type: "self-pattern",
        title: "내가 이 관계에 기대하는 것은 무엇인가",
        question: "내가 놓지 못하는 이유와 감정 과열 지점은 어디인가",
        benefit: "집착과 진짜 가능성을 구분하는 기준을 볼 수 있습니다.",
      },
      {
        type: "dynamic",
        title: "왜 자꾸 막히는가",
        question: "신호는 있었는데 연결이 이어지지 않는 이유는 무엇인가",
        benefit: "막히는 이유와 상대가 부담을 느끼는 지점을 파악할 수 있습니다.",
      },
      {
        type: "scenario",
        title: "언제 시도하고 언제 멈춰야 하나",
        question: "재접촉이 통할 시기와 멈춰야 하는 선은 어디인가",
        benefit: "재접촉 타이밍과 멈춰야 하는 기준을 이어서 확인할 수 있습니다.",
      },
      {
        type: "prescription",
        title: "지금의 최선은 무엇인가",
        question: "연락, 거리두기, 정리 중 어떤 행동이 지금 가장 손실이 적은가",
        benefit: "실제로 써볼 수 있는 연락 문장과 멈춰야 할 행동을 정리해 줍니다.",
      },
      {
        type: "evidence",
        title: "이 판단은 무엇을 근거로 했나",
        question: "합충, 오행 흐름, 배우자성, 시간 신뢰도를 어떻게 읽었나",
        benefit: "근거 노트와 낮은 신뢰도 경고를 함께 확인할 수 있습니다.",
      },
    ],
  },
};

const getServiceBlueprint = (serviceType: string) => COUNSEL_BLUEPRINT[serviceType] ?? COUNSEL_BLUEPRINT["couple-report"];

const calculateScoreSet = (serviceType: string, featureSet: Record<string, unknown>) => {
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

  const boundedOverall = clamp(overall, 15, 99);
  return {
    overall: boundedOverall,
    pull: clamp(boundedOverall + (hasDohwa ? 6 : 0) + (branchRelation === "합" ? 4 : 0) - (branchRelation === "충" ? 7 : 0), 10, 99),
    pace: clamp(
      boundedOverall + (stemRelation === "same" ? 5 : 0) + (stemRelation === "controlled" ? -7 : 0) + (timeConfidence >= 80 ? 4 : timeConfidence <= 50 ? -4 : 0),
      10,
      99,
    ),
    alignment: clamp(
      boundedOverall + (complementarity >= 75 ? 8 : complementarity <= 45 ? -8 : 0) + (branchRelation === "합" ? 5 : 0) - (branchRelation === "파" ? 6 : 0),
      10,
      99,
    ),
    repair: clamp(boundedOverall + (hasCheoneul ? 5 : 0) + (stemRelation === "generating" ? 4 : 0) - (hasCollisionRisk ? 10 : 0), 10, 99),
    timing: clamp(Math.round(timeConfidence * 0.7) + (serviceType === "future-partner" ? 15 : 0) + (branchRelation === "합" ? 5 : 0) - (branchRelation === "충" ? 6 : 0), 20, 99),
  };
};

const toStringArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value.map((item) => String(item)).filter(Boolean).slice(0, 5);
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

  return {
    contextSummary,
    contextAnswers,
    legacyContext,
  };
};

const fillCounselSections = (rawSections: Array<Record<string, unknown>>, serviceType: string) => {
  const blueprint = getServiceBlueprint(serviceType);

  return blueprint.sections.map((template, index) => {
    const section = rawSections[index] ?? {};
    const title = typeof section.title === "string" && section.title.trim() ? section.title : template.title;
    const question = typeof section.question === "string" && section.question.trim() ? section.question : template.question;
    const summary = typeof section.summary === "string" ? section.summary : `${title}에 대한 핵심 판단을 간단히 정리했습니다.`;
    const conclusion = typeof section.conclusion === "string" ? section.conclusion : `${title}에서는 한 템포 늦춘 판단이 필요합니다.`;
    const reason = typeof section.reason === "string" ? section.reason : "강한 단정보다 지금 보이는 흐름과 반복 신호를 기준으로 해석했습니다.";
    const actionLabel = typeof section.actionLabel === "string" ? section.actionLabel : "지금 해볼 행동";
    const actionItems = toStringArray(section.actionItems, ["감정 반응보다 대화 목적을 먼저 정리하세요.", "한 번에 결론을 내리기보다 신호를 기록하며 보세요."]);
    const counselorNote = typeof section.counselorNote === "string"
      ? section.counselorNote
      : "지금 필요한 것은 해석의 화려함보다 관계를 다루는 순서를 바로잡는 일입니다.";

    return {
      type: template.type,
      title,
      question,
      summary,
      conclusion,
      reason,
      actionLabel,
      actionItems,
      counselorNote,
    };
  });
};

const generateCounselStory = async ({
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

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const blueprint = getServiceBlueprint(serviceType);
  const sectionsText = blueprint.sections
    .map((section, index) => `${index + 1}. type=${section.type}, title=${section.title}, question=${section.question}`)
    .join("\n");
  const promptContext = extractPromptContext(inputSnapshot);

  const prompt = `
당신은 한국어 사주 기반 관계 상담 리포트 생성기입니다.
절대 백과사전식 궁합 나열을 하지 마세요.
서비스 타입: ${serviceType}
메뉴 톤: ${blueprint.tone}
추가 규칙: ${blueprint.strictRule}
점수 세트: ${JSON.stringify(scoreSet)}
특징 세트: ${JSON.stringify(featureSet)}
관계 맥락 요약: ${promptContext.contextSummary}
관계 선택 응답(라벨 포함): ${JSON.stringify(promptContext.contextAnswers)}
레거시 맥락 필드: ${JSON.stringify(promptContext.legacyContext)}
입력 스냅샷(원문): ${JSON.stringify(inputSnapshot)}

섹션 순서와 질문은 아래 고정입니다:
${sectionsText}

아래 JSON으로만 답변하세요:
{
  "headline": "강한 한 줄 진단",
  "summary": "요약 2~3문장",
  "relationshipTemperature": "현재 관계 온도 한 문장",
  "immediateAction": "지금 가장 먼저 할 행동 1문장",
  "scenarioHint": "가까운 30일 분기점 1~2문장",
  "ctaReason": "왜 전체 리포트를 열어야 하는지 효용 1문장",
  "confidenceSummary": "출생시간/상대정보에 따른 신뢰도 요약 1문장",
  "sections": [
    {
      "type": "opening",
      "title": "섹션 제목",
      "question": "질문형 소제목",
      "summary": "미리보기 1문장",
      "conclusion": "결론 1~2문장",
      "reason": "이유 2~4문장",
      "actionLabel": "행동 블록 제목",
      "actionItems": ["행동 1", "행동 2"],
      "counselorNote": "핵심 경고 또는 상담 메모 1문장"
    }
  ],
  "actionPlan": ["1주 행동 1", "1주 행동 2", "1주 행동 3"],
  "avoidList": ["하지 말아야 할 행동 1", "하지 말아야 할 행동 2", "하지 말아야 할 행동 3"],
  "conversationPrompts": ["실제로 써볼 문장 1", "실제로 써볼 문장 2", "실제로 써볼 문장 3"],
  "confidenceNotes": ["신뢰도 메모 1", "신뢰도 메모 2", "신뢰도 메모 3"]
}

조건:
- 모든 섹션은 결론 -> 이유 -> 행동이 드러나야 합니다.
- 명리 용어는 쉬운 한국어로 번역하고 필요할 때만 보조 설명합니다.
- 자극적 문장, 희망고문, 절대적 단정 금지.
- 미래를 확정하지 말고 가능성, 경향, 조건으로 표현합니다.
- 짝사랑·재회는 반드시 가능성 있음 / 제한적 / 확실한 정보 없음 중 하나의 판단 언어를 사용합니다.
- evidence 섹션은 오행, 합충, 배우자성, 시간 신뢰도를 근거 노트처럼 짧게 정리합니다.
- sections는 정확히 6개가 되게 작성합니다.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text) as Record<string, unknown>;

  const sections = Array.isArray(parsed.sections) ? fillCounselSections(parsed.sections as Array<Record<string, unknown>>, serviceType) : fillCounselSections([], serviceType);
  return {
    headline: typeof parsed.headline === "string" ? parsed.headline : "지금은 감정보다 관계를 다루는 순서가 더 중요한 구간입니다.",
    summary: typeof parsed.summary === "string" ? parsed.summary : "현재 관계는 강한 해석보다 속도와 기대치를 먼저 정리해야 흐름이 무너지지 않습니다.",
    relationshipTemperature: typeof parsed.relationshipTemperature === "string" ? parsed.relationshipTemperature : "감정은 살아 있지만 속도 차이를 바로잡아야 하는 구간입니다.",
    immediateAction: typeof parsed.immediateAction === "string" ? parsed.immediateAction : "지금은 답을 재촉하기보다 관계의 목적을 한 문장으로 정리해 보세요.",
    scenarioHint: typeof parsed.scenarioHint === "string" ? parsed.scenarioHint : "가까운 시기에는 관계의 속도를 맞추는 대화가 가장 큰 분기점이 됩니다.",
    ctaReason: typeof parsed.ctaReason === "string" ? parsed.ctaReason : "전체를 열면 관계를 다루는 순서와 실제 행동 문장을 이어서 확인할 수 있습니다.",
    confidenceSummary: typeof parsed.confidenceSummary === "string" ? parsed.confidenceSummary : "출생시간이나 상대 정보가 부족하면 해석 신뢰도는 보수적으로 읽어야 합니다.",
    sections,
    actionPlan: toStringArray(parsed.actionPlan, ["연락이나 대화의 목적을 먼저 정리하세요.", "상대 반응보다 내 기대치를 먼저 점검하세요.", "일주일 동안 신호를 기록하며 속도를 조정하세요."]),
    avoidList: toStringArray(parsed.avoidList, ["확답을 강요하지 마세요.", "한 번의 반응으로 관계 전체를 단정하지 마세요.", "불안할수록 메시지 빈도를 올리지 마세요."]),
    conversationPrompts: toStringArray(parsed.conversationPrompts, ["지금 내 마음보다 우리 대화의 방향을 먼저 맞춰보고 싶어.", "답을 재촉하려는 건 아니고, 서로 기대치만 확인하고 싶어.", "잠깐 거리를 두더라도 오해는 남기고 싶지 않아."]),
    confidenceNotes: toStringArray(parsed.confidenceNotes, ["출생 시간이 없으면 타이밍 판단은 보수적으로 해석해야 합니다.", "상대 정보가 제한적이면 내 패턴 중심 해석 비중이 커집니다.", "강한 합충 신호가 없어도 일상적 조율이 관계의 질을 결정할 수 있습니다."]),
  };
};

const buildPreview = ({
  serviceType,
  scoreSet,
  story,
  nextRefreshAt,
}: {
  serviceType: string;
  scoreSet: Record<string, number>;
  story: {
    headline: string;
    summary: string;
    relationshipTemperature: string;
    immediateAction: string;
    scenarioHint: string;
    ctaReason: string;
    confidenceSummary: string;
    sections: Array<Record<string, unknown>>;
  };
  nextRefreshAt: string;
}) => {
  const blueprint = getServiceBlueprint(serviceType);
  const first = story.sections[0] as Record<string, unknown>;
  const openSection = {
    type: String(first.type ?? "opening"),
    title: String(first.title ?? blueprint.sections[0].title),
    question: String(first.question ?? blueprint.sections[0].question),
    summary: String(first.summary ?? ""),
    conclusion: String(first.conclusion ?? ""),
    reason: String(first.reason ?? ""),
    actionLabel: String(first.actionLabel ?? "지금 할 행동"),
    actionItems: toStringArray(first.actionItems, ["감정 반응보다 목적을 먼저 정리하세요."]),
    counselorNote: String(first.counselorNote ?? ""),
  };

  const lockedSectionSummaries = story.sections.slice(1).map((section, index) => ({
    type: String(section.type ?? blueprint.sections[index + 1]?.type ?? "dynamic"),
    title: String(section.title ?? blueprint.sections[index + 1]?.title ?? "이어지는 상담"),
    teaser: String(section.summary ?? section.conclusion ?? ""),
    benefit: blueprint.sections[index + 1]?.benefit ?? "이어지는 상담 포인트를 확인할 수 있습니다.",
  }));

  return {
    headline: story.headline,
    summary: story.summary,
    serviceType,
    scoreSet,
    relationshipTemperature: story.relationshipTemperature,
    immediateAction: story.immediateAction,
    scenarioHint: story.scenarioHint,
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authorization = req.headers.get("Authorization");
    const guestId = req.headers.get("x-guest-id") ?? "";
    const body = (await req.json()) as ActionRequest;
    const payload = body.payload ?? {};

    const owner = await resolveOwner(authorization, guestId);
    ensureOwner(owner);
    const ownership = ownerFilter(owner);

    const client = getSupabaseClient(authorization);

    if (body.action === "create") {
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

      const scoreSet = calculateScoreSet(serviceType, featureSet);
      const story = await generateCounselStory({ serviceType, scoreSet, featureSet, inputSnapshot });

      const nextRefreshDate = new Date();
      nextRefreshDate.setDate(nextRefreshDate.getDate() + 30);
      const nextRefreshAt = nextRefreshDate.toISOString();

      const preview = buildPreview({
        serviceType,
        scoreSet,
        story,
        nextRefreshAt,
      });

      const fullReport = {
        headline: story.headline,
        summary: story.summary,
        serviceType,
        scoreSet,
        sections: story.sections,
        actionPlan: story.actionPlan,
        avoidList: story.avoidList,
        conversationPrompts: story.conversationPrompts,
        confidenceNotes: story.confidenceNotes,
        nextRefreshAt,
      };

      const encryptedInput = await encryptJson(inputSnapshot);
      const encryptedFull = await encryptJson(fullReport);

      const { data, error } = await client
        .from("love_reports")
        .insert({
          user_id: ownership.user_id,
          guest_id: ownership.guest_id,
          service_type: serviceType,
          relation_mode: relationMode,
          base_saju_result_id: baseSajuResultId,
          report_version: "v2-counsel",
          menu_variant: serviceType,
          input_snapshot: { redacted: true },
          input_snapshot_enc: encryptedInput.ciphertext,
          input_snapshot_iv: encryptedInput.iv,
          feature_set: featureSet,
          score_set: scoreSet,
          preview_json: preview,
          full_report_enc: encryptedFull.ciphertext,
          full_report_iv: encryptedFull.iv,
          is_unlocked: false,
          next_refresh_at: nextRefreshAt,
        })
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "failed to create love report");
      }

      const mapped = await mapReportRow(data as Record<string, unknown>, false);
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
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
