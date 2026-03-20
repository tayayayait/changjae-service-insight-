import { create } from "zustand";
import { SajuResult } from "@/types/result";
import { getLatestSajuResultOrProfile, getSajuResultById } from "@/lib/resultStore";

interface ResultState {
  currentResult: SajuResult | null;
  isLoading: boolean;
  error: string | null;
  
  loadLatestResult: () => Promise<void>;
  loadResultById: (id: string) => Promise<void>;
  clearResult: () => void;
}

export const useResultStore = create<ResultState>((set) => ({
  currentResult: null,
  isLoading: false,
  error: null,

  loadLatestResult: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await getLatestSajuResultOrProfile();
      set({ currentResult: result });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "결과를 불러오지 못했습니다." });
    } finally {
      set({ isLoading: false });
    }
  },

  loadResultById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await getSajuResultById(id);
      set({ currentResult: result });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "결과를 불러오지 못했습니다." });
    } finally {
      set({ isLoading: false });
    }
  },
  
  clearResult: () => set({ currentResult: null, error: null })
}));
