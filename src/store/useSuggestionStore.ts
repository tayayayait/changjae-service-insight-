import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface Suggestion {
  id: string;
  user_id: string | null;
  guest_id: string | null;
  category: string;
  title: string;
  description: string;
  contact: string | null;
  status: "pending" | "reviewed" | "planned" | "rejected";
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface SuggestionInput {
  category: string;
  title: string;
  description: string;
  contact?: string;
}

interface SuggestionState {
  suggestions: Suggestion[];
  isLoading: boolean;
  error: string | null;

  submitSuggestion: (input: SuggestionInput) => Promise<boolean>;
  fetchSuggestions: () => Promise<void>;
  updateSuggestionStatus: (
    id: string,
    status: Suggestion["status"],
    adminNote?: string,
  ) => Promise<boolean>;
  deleteSuggestion: (id: string) => Promise<boolean>;
}

export const useSuggestionStore = create<SuggestionState>((set, get) => ({
  suggestions: [],
  isLoading: false,
  error: null,

  submitSuggestion: async (input) => {
    if (!isSupabaseConfigured) {
      console.warn("Supabase가 설정되지 않았습니다.");
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase.from("service_suggestions").insert({
        category: input.category,
        title: input.title,
        description: input.description,
        contact: input.contact || null,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      set({ isLoading: false });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "알 수 없는 오류";
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  fetchSuggestions: async () => {
    if (!isSupabaseConfigured) return;

    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from("service_suggestions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }

      set({ suggestions: (data as Suggestion[]) ?? [], isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "알 수 없는 오류";
      set({ error: msg, isLoading: false });
    }
  },

  updateSuggestionStatus: async (id, status, adminNote) => {
    if (!isSupabaseConfigured) return false;

    set({ isLoading: true, error: null });

    try {
      const updatePayload: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (adminNote !== undefined) {
        updatePayload.admin_note = adminNote;
      }

      const { error } = await supabase
        .from("service_suggestions")
        .update(updatePayload)
        .eq("id", id);

      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      // 로컬 상태 업데이트
      const updated = get().suggestions.map((s) =>
        s.id === id
          ? {
              ...s,
              status,
              ...(adminNote !== undefined ? { admin_note: adminNote } : {}),
              updated_at: new Date().toISOString(),
            }
          : s,
      );
      set({ suggestions: updated, isLoading: false });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "알 수 없는 오류";
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  deleteSuggestion: async (id) => {
    if (!isSupabaseConfigured) return false;

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from("service_suggestions")
        .delete()
        .eq("id", id);

      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      set({
        suggestions: get().suggestions.filter((s) => s.id !== id),
        isLoading: false,
      });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "알 수 없는 오류";
      set({ error: msg, isLoading: false });
      return false;
    }
  },
}));
