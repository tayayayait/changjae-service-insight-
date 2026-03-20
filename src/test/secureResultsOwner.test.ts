import { describe, expect, it } from "vitest";
import {
  buildAdminClientOptions,
  extractBearerToken,
  extractJwtSubClaim,
  toOwnerContext,
  toOwnerFilter,
} from "../../supabase/functions/_shared/secure-results-owner";

describe("secureResultsOwner", () => {
  const encodeBase64Url = (value: string) =>
    btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

  const createJwt = (payload: Record<string, unknown>) => {
    const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = encodeBase64Url(JSON.stringify(payload));
    return `${header}.${body}.signature`;
  };

  it("extracts bearer tokens without preserving the prefix", () => {
    expect(extractBearerToken("Bearer sample-token")).toBe("sample-token");
    expect(extractBearerToken(" sample-token ")).toBe("sample-token");
  });

  it("extracts sub claim only when the jwt payload contains it", () => {
    expect(extractJwtSubClaim(createJwt({ sub: "user-123", role: "authenticated" }))).toBe("user-123");
    expect(extractJwtSubClaim(createJwt({ role: "anon" }))).toBeNull();
    expect(extractJwtSubClaim("opaque-token")).toBeNull();
    expect(extractJwtSubClaim(null)).toBeNull();
  });

  it("keeps guest ownership when there is no resolved user", () => {
    const owner = toOwnerContext(null, "guest-123");

    expect(owner).toEqual({
      userId: null,
      guestId: "guest-123",
    });
    expect(toOwnerFilter(owner)).toEqual({
      user_id: null,
      guest_id: "guest-123",
    });
  });

  it("uses user ownership over guest ownership when a user exists", () => {
    const owner = toOwnerContext("user-123", "guest-123");

    expect(toOwnerFilter(owner)).toEqual({
      user_id: "user-123",
      guest_id: null,
    });
  });

  it("does not forward authorization headers to the admin client", () => {
    expect(buildAdminClientOptions()).toEqual({
      global: {
        headers: {},
      },
    });
  });
});
