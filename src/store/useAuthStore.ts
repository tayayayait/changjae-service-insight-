import { create } from "zustand";
import { Session, Subscription, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { buildOwnerKeyFromUserId, normalizeEmailAddress } from "@/lib/ownerIdentity";

type AuthProfile = {
  name?: string;
  gender?: "male" | "female";
  calendar_type?: "solar" | "lunar" | "lunar-leap";
  year?: number;
  month?: number;
  day?: number;
  hour?: number | null;
  minute?: number | null;
  time_block?: string | null;
  location?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
};

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  initialized: boolean;
  profile: AuthProfile | null;
  hasProfile: boolean;
  isPremium: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  isLoginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<boolean>;
}

const CLAIM_MARKER_PREFIX = "saju:chat:paid-claim:v1";
const claimMarkersInMemory = new Set<string>();
let authSubscription: Subscription | null = null;

const readClaimMarker = (key: string) => {
  if (claimMarkersInMemory.has(key)) {
    return true;
  }
  if (typeof window === "undefined") {
    return false;
  }
  const marked = window.sessionStorage.getItem(key) === "1";
  if (marked) {
    claimMarkersInMemory.add(key);
  }
  return marked;
};

const writeClaimMarker = (key: string) => {
  claimMarkersInMemory.add(key);
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(key, "1");
  }
};

const fetchProfile = async (userId: string): Promise<AuthProfile | null> => {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "name, gender, calendar_type, year, month, day, hour, minute, time_block, location, lat, lng, timezone",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch auth profile:", error);
    return null;
  }

  return (data as AuthProfile | null) ?? null;
};

const claimPaidCreditsByEmail = async (user: User | null) => {
  if (!user?.id) {
    return;
  }

  const normalizedEmail = normalizeEmailAddress(user.email);
  if (!normalizedEmail) {
    return;
  }

  const authOwnerKey = buildOwnerKeyFromUserId(user.id);
  if (!authOwnerKey) {
    return;
  }

  const markerKey = `${CLAIM_MARKER_PREFIX}:${user.id}:${normalizedEmail}`;
  if (readClaimMarker(markerKey)) {
    return;
  }

  const { error } = await supabase.rpc("chat_credit_claim_paid_email", {
    p_auth_owner_key: authOwnerKey,
    p_auth_user_id: user.id,
    p_email: normalizedEmail,
    p_source: "auth-login",
  });

  if (error) {
    console.warn("chat_credit_claim_paid_email rpc failed:", error.message);
    return;
  }

  writeClaimMarker(markerKey);
};

export const useAuthStore = create<AuthState>((set, get) => {
  const syncFromSession = async (session: Session | null) => {
    const user = session?.user ?? null;

    if (!user) {
      set({
        user: null,
        session: null,
        profile: null,
        hasProfile: false,
        isPremium: false,
        isLoading: false,
        initialized: true,
      });
      return;
    }

    const profile = await fetchProfile(user.id);
    set({
      user,
      session,
      profile,
      hasProfile: Boolean(profile),
      isPremium: false,
      isLoading: false,
      initialized: true,
    });

    void claimPaidCreditsByEmail(user);
  };

  return {
    user: null,
    session: null,
    isLoading: false,
    initialized: false,
    profile: null,
    hasProfile: false,
    isPremium: false,
    isLoginModalOpen: false,
    setLoginModalOpen: (open) => set({ isLoginModalOpen: open }),
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setLoading: (loading) => set({ isLoading: loading }),
    initialize: async () => {
      set({ isLoading: true });

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }

        await syncFromSession(data.session ?? null);
      } catch (error) {
        console.error("Auth initialize failed:", error);
        set({
          session: null,
          user: null,
          profile: null,
          hasProfile: false,
          initialized: true,
          isLoading: false,
          isPremium: false,
        });
      }

      if (!authSubscription) {
        const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          set({ isLoading: true });
          void syncFromSession(nextSession ?? null);
        });
        authSubscription = data.subscription;
      }
    },
    signOut: async () => {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Sign out failed:", error);
      }
      set({
        user: null,
        session: null,
        profile: null,
        hasProfile: false,
        isPremium: false,
        isLoading: false,
        initialized: true,
        isLoginModalOpen: false,
      });
    },
    refreshProfile: async () => {
      let userId = get().user?.id ?? null;
      if (!userId) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            throw error;
          }

          const sessionUser = data.session?.user ?? null;
          if (sessionUser?.id) {
            userId = sessionUser.id;
            set({ user: sessionUser, session: data.session ?? null });
          }
        } catch (error) {
          console.warn("Auth session lookup failed in refreshProfile:", error);
        }
      }

      if (!userId) {
        return false;
      }

      const profile = await fetchProfile(userId);
      const hasProfile = Boolean(profile);
      set({
        profile,
        hasProfile,
        isPremium: false,
      });
      return hasProfile;
    },
  };
});

