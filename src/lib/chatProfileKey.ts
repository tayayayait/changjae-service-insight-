import { SajuChatContext } from "@/types/result";

export interface ChatProfileKeyMeta {
  name?: string;
  calendarType?: "solar" | "lunar" | "lunar-leap";
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  gender: string;
  birthPrecision?: "exact" | "time-block" | "unknown";
  timeBlock?: string;
  hour?: number;
  minute?: number;
}

const normalizeName = (name: string | undefined) =>
  (name ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const toSafeIntToken = (value: number, fallback = "unknown") =>
  Number.isFinite(value) ? String(Math.trunc(value)) : fallback;

const normalizeGender = (gender: string | undefined) =>
  (gender ?? "unknown").trim().toLowerCase() || "unknown";

export const buildChatProfileKey = (meta: ChatProfileKeyMeta) => {
  /**
   * profileKey v3 (anti-abuse simplification):
   * - same profile is recognized by name + gender + birth date only.
   * - calendarType/time precision/time block are intentionally excluded.
   * - owner boundary still applies separately via ownerKey.
   */
  const tokens = [
    "pk3",
    `name:${normalizeName(meta.name) || "unknown"}`,
    `birth:${toSafeIntToken(meta.birthYear)}-${toSafeIntToken(meta.birthMonth)}-${toSafeIntToken(meta.birthDay)}`,
    `gender:${normalizeGender(meta.gender)}`,
  ];

  return tokens.join("|");
};

export const buildChatProfileKeyFromContext = (ctx: SajuChatContext) =>
  buildChatProfileKey({
    name: ctx.profileMeta.name,
    calendarType: ctx.profileMeta.calendarType,
    birthYear: ctx.profileMeta.birthYear,
    birthMonth: ctx.profileMeta.birthMonth,
    birthDay: ctx.profileMeta.birthDay,
    gender: ctx.profileMeta.gender,
    birthPrecision: ctx.profileMeta.birthPrecision,
    timeBlock: ctx.profileMeta.timeBlock,
    hour: ctx.profileMeta.hour,
    minute: ctx.profileMeta.minute,
  });
