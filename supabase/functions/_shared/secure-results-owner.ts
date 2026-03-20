export interface OwnerContext {
  userId: string | null;
  guestId: string;
}

export const buildAdminClientOptions = () => ({
  global: {
    headers: {} as Record<string, string>,
  },
});

export const extractBearerToken = (authorization: string | null) => {
  const raw = authorization?.trim() ?? "";
  if (!raw) {
    return null;
  }

  if (raw.toLowerCase().startsWith("bearer ")) {
    const token = raw.slice(7).trim();
    return token || null;
  }

  return raw;
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(`${normalized}${padding}`);
};

export const extractJwtSubClaim = (token: string | null) => {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payloadRaw = decodeBase64Url(parts[1]);
    const payload = JSON.parse(payloadRaw) as Record<string, unknown>;
    if (typeof payload.sub === "string" && payload.sub.trim().length > 0) {
      return payload.sub;
    }
    return null;
  } catch {
    return null;
  }
};

export const toOwnerContext = (userId: string | null, guestId: string | null | undefined): OwnerContext => ({
  userId,
  guestId: guestId?.trim() ?? "",
});

export const ensureOwnerContext = (owner: OwnerContext) => {
  if (!owner.userId && !owner.guestId) {
    throw new Error("guest id or authenticated user is required");
  }
};

export const toOwnerFilter = (owner: OwnerContext) => {
  if (owner.userId) {
    return { user_id: owner.userId, guest_id: null };
  }

  return { user_id: null, guest_id: owner.guestId };
};
