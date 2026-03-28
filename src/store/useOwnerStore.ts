import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  buildOwnerKeyFromUserId,
  getDefaultOwnerKey,
  OwnerKeySource,
  resolveOwnerKey,
} from "@/lib/ownerIdentity";

const OWNER_STORE_STORAGE_KEY = "saju:owner-store:v1";

interface OwnerState {
  activeOwnerKey: string;
  source: OwnerKeySource;
  setOwnerKey: (ownerKey: string, source: OwnerKeySource) => void;
  resetToGuestOwner: () => void;
  setOwnerFromAuthUser: (userId: string | null) => void;
  setOwnerFromVerifiedContact: (input: {
    phone?: string | null;
    email?: string | null;
    userId?: string | null;
  }) => Promise<string>;
}

export const useOwnerStore = create<OwnerState>()(
  persist(
    (set) => ({
      activeOwnerKey: getDefaultOwnerKey(),
      source: "guest",

      setOwnerKey: (ownerKey, source) => {
        set({ activeOwnerKey: ownerKey, source });
      },

      resetToGuestOwner: () => {
        set({
          activeOwnerKey: getDefaultOwnerKey(),
          source: "guest",
        });
      },

      setOwnerFromAuthUser: (userId) => {
        const byUser = buildOwnerKeyFromUserId(userId);
        if (byUser) {
          set({ activeOwnerKey: byUser, source: "auth-user" });
          return;
        }
        set({
          activeOwnerKey: getDefaultOwnerKey(),
          source: "guest",
        });
      },

      setOwnerFromVerifiedContact: async ({ phone, email, userId }) => {
        const resolved = await resolveOwnerKey({
          userId,
          verifiedPhone: phone ?? null,
          verifiedEmail: email ?? null,
        });
        set({
          activeOwnerKey: resolved.ownerKey,
          source: resolved.source,
        });
        return resolved.ownerKey;
      },
    }),
    {
      name: OWNER_STORE_STORAGE_KEY,
      version: 1,
      merge: (persistedState, currentState) => {
        const rawPersisted = (persistedState ?? {}) as Partial<OwnerState>;
        const ownerKey =
          typeof rawPersisted.activeOwnerKey === "string" && rawPersisted.activeOwnerKey.trim()
            ? rawPersisted.activeOwnerKey.trim()
            : getDefaultOwnerKey();
        const source =
          rawPersisted.source === "auth-user" ||
          rawPersisted.source === "verified-phone" ||
          rawPersisted.source === "verified-email" ||
          rawPersisted.source === "guest"
            ? rawPersisted.source
            : "guest";

        return {
          ...currentState,
          activeOwnerKey: ownerKey,
          source,
        };
      },
    },
  ),
);
