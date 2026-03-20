import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  initialized: boolean;
  profile: any | null;
  hasProfile: boolean;
  isPremium: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<boolean>;
}

const resolvePremiumFromMetadata = (user: User | null): boolean => {
  if (!user) {
    return false;
  }

  const metadata = user.app_metadata as Record<string, unknown> | undefined;
  if (!metadata || typeof metadata !== "object") {
    return false;
  }

  if (metadata.is_premium === true) {
    return true;
  }

  const tier = typeof metadata.tier === "string" ? metadata.tier.toLowerCase() : "";
  const plan = typeof metadata.plan === "string" ? metadata.plan.toLowerCase() : "";
  return ["premium", "pro", "vip", "paid"].some((keyword) => tier.includes(keyword) || plan.includes(keyword));
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  initialized: false,
  profile: null,
  hasProfile: false,
  isPremium: false,

  setUser: (user) => set({ user, isPremium: resolvePremiumFromMetadata(user) }),
  setSession: (session) => set({ session, user: session?.user ?? null, isPremium: resolvePremiumFromMetadata(session?.user ?? null) }),
  setLoading: (loading) => set({ isLoading: loading }),

  initialize: async () => {
    try {
      set({ isLoading: true });

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", session.user.id).maybeSingle();
        set({
          session,
          user: session.user,
          profile,
          hasProfile: !!profile,
          initialized: true,
          isPremium: resolvePremiumFromMetadata(session.user),
        });
      } else {
        set({ session: null, user: null, profile: null, hasProfile: false, initialized: true, isPremium: false });
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        const user = session?.user ?? null;
        set({ session, user, isPremium: resolvePremiumFromMetadata(user) });
        if (user) {
          const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).maybeSingle();
          set({ profile, hasProfile: !!profile });
        } else {
          set({ profile: null, hasProfile: false, isPremium: false });
        }
      });
    } catch (error) {
      console.error("Auth initialization failed:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, hasProfile: false, isPremium: false });
  },

  refreshProfile: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return false;

    const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();

    set({ profile, hasProfile: !!profile });
    return !!profile;
  },
}));
