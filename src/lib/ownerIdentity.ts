export type OwnerKeySource = "auth-user" | "verified-phone" | "verified-email" | "guest";

export interface ResolvedOwnerKey {
  ownerKey: string;
  source: OwnerKeySource;
}

const GUEST_STORAGE_KEY = "saju:guest-session-id";
const LEGACY_GUEST_STORAGE_KEY = "guest_id";
const OWNER_KEY_PREFIX = "owner";

const normalizeToken = (value: string | null | undefined) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

export const normalizePhoneNumber = (value: string | null | undefined) => {
  const digits = String(value ?? "").replace(/[^0-9]/g, "");
  return digits.length > 0 ? digits : null;
};

export const normalizeEmailAddress = (value: string | null | undefined) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
};

const fallbackHashHex = (value: string) => {
  // Fast non-crypto fallback for environments without SubtleCrypto.
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const digestSha256 = async (value: string) => {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(value);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return fallbackHashHex(value);
};

const generateClientId = () => {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
};

export const ensureGuestSessionId = () => {
  if (typeof window === "undefined") {
    return "server";
  }

  const primary = normalizeToken(window.localStorage.getItem(GUEST_STORAGE_KEY));
  const legacy = normalizeToken(window.localStorage.getItem(LEGACY_GUEST_STORAGE_KEY));
  const resolved = primary ?? legacy;

  if (resolved) {
    if (primary !== resolved) {
      window.localStorage.setItem(GUEST_STORAGE_KEY, resolved);
    }
    if (legacy !== resolved) {
      window.localStorage.setItem(LEGACY_GUEST_STORAGE_KEY, resolved);
    }
    return resolved;
  }

  const next = generateClientId();
  window.localStorage.setItem(GUEST_STORAGE_KEY, next);
  window.localStorage.setItem(LEGACY_GUEST_STORAGE_KEY, next);
  return next;
};

export const buildGuestOwnerKey = (guestId: string | null | undefined) =>
  `${OWNER_KEY_PREFIX}:guest:${normalizeToken(guestId) ?? "unknown"}`;

export const getDefaultOwnerKey = () => buildGuestOwnerKey(ensureGuestSessionId());

export const buildOwnerKeyFromUserId = (userId: string | null | undefined) => {
  const normalized = normalizeToken(userId);
  return normalized ? `${OWNER_KEY_PREFIX}:user:${normalized}` : null;
};

export const buildOwnerKeyFromPhone = async (phone: string | null | undefined) => {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) {
    return null;
  }
  const hashHex = await digestSha256(`phone:${normalized}`);
  return `${OWNER_KEY_PREFIX}:phone:${hashHex}`;
};

export const buildOwnerKeyFromEmail = async (email: string | null | undefined) => {
  const normalized = normalizeEmailAddress(email);
  if (!normalized) {
    return null;
  }
  const hashHex = await digestSha256(`email:${normalized}`);
  return `${OWNER_KEY_PREFIX}:email:${hashHex}`;
};

export const resolveOwnerKey = async (params: {
  userId?: string | null;
  verifiedPhone?: string | null;
  verifiedEmail?: string | null;
  guestId?: string | null;
}): Promise<ResolvedOwnerKey> => {
  const byUserId = buildOwnerKeyFromUserId(params.userId);
  if (byUserId) {
    return { ownerKey: byUserId, source: "auth-user" };
  }

  const byPhone = await buildOwnerKeyFromPhone(params.verifiedPhone);
  if (byPhone) {
    return { ownerKey: byPhone, source: "verified-phone" };
  }

  const byEmail = await buildOwnerKeyFromEmail(params.verifiedEmail);
  if (byEmail) {
    return { ownerKey: byEmail, source: "verified-email" };
  }

  return {
    ownerKey: buildGuestOwnerKey(params.guestId ?? ensureGuestSessionId()),
    source: "guest",
  };
};
