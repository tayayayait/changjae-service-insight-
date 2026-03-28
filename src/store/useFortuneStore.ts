import { create } from "zustand";
import { AnalysisPeriod, FortuneCategoryId, FortuneResult, SajuResult } from "@/types/result";
import { getDailyFortune } from "@/lib/geminiClient";
import { buildFortuneResult, ensureGuestSessionId } from "@/lib/resultStore";

interface FortuneCache {
  today: Partial<Record<FortuneCategoryId, FortuneResult>>;
  week: Partial<Record<FortuneCategoryId, FortuneResult>>;
  month: Partial<Record<FortuneCategoryId, FortuneResult>>;
}

interface FortuneState {
  cache: FortuneCache;
  isLoading: boolean;
  error: string | null;
  fetchFortune: (
    baseResult: SajuResult,
    period: AnalysisPeriod,
    categoryId: FortuneCategoryId,
    forceRefresh?: boolean,
  ) => Promise<void>;
  clearCache: () => void;
}

export const useFortuneStore = create<FortuneState>((set, get) => ({
  cache: {
    today: {},
    week: {},
    month: {},
  },
  isLoading: false,
  error: null,

  fetchFortune: async (baseResult, period, categoryId, forceRefresh = false) => {
    const state = get();
    const cachedFortune = state.cache[period]?.[categoryId];
    if (!forceRefresh && cachedFortune) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await getDailyFortune({
        sajuData: {
          palja: baseResult.palja,
          oheng: baseResult.oheng,
        },
        categoryId,
        dateContext: {
          type: period,
          date: new Date().toISOString().slice(0, 10),
        },
      });

      const nextFortune = buildFortuneResult(baseResult.id ?? "", ensureGuestSessionId(), response);
      set((prev) => ({
        cache: {
          ...prev.cache,
          [period]: {
            ...prev.cache[period],
            [categoryId]: nextFortune,
          },
        },
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to load fortune." });
    } finally {
      set({ isLoading: false });
    }
  },

  clearCache: () =>
    set({
      cache: {
        today: {},
        week: {},
        month: {},
      },
      error: null,
    }),
}));
