import { create } from "zustand";
import { FortuneResult, AnalysisPeriod, SajuResult } from "@/types/result";
import { getDailyFortune } from "@/lib/geminiClient";
import { buildFortuneResult, ensureGuestSessionId } from "@/lib/resultStore";

interface FortuneCache {
  today: FortuneResult | null;
  week: FortuneResult | null;
  month: FortuneResult | null;
}

interface FortuneState {
  cache: FortuneCache;
  isLoading: boolean;
  error: string | null;

  fetchFortune: (baseResult: SajuResult, period: AnalysisPeriod, forceRefresh?: boolean) => Promise<void>;
  clearCache: () => void;
}

export const useFortuneStore = create<FortuneState>((set, get) => ({
  cache: { today: null, week: null, month: null },
  isLoading: false,
  error: null,

  fetchFortune: async (baseResult, period, forceRefresh = false) => {
    const state = get();
    // 이미 메모리에 캐싱된 데일리 운세가 있다면 재요청하지 않음
    if (!forceRefresh && state.cache[period]) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await getDailyFortune({
        sajuData: {
          palja: baseResult.palja,
          oheng: baseResult.oheng,
        },
        dateContext: {
          type: period,
          date: new Date().toISOString().slice(0, 10),
        },
      });

      const nextFortune = buildFortuneResult(baseResult.id ?? "", ensureGuestSessionId(), response);
      set((prev) => ({
        cache: { ...prev.cache, [period]: nextFortune }
      }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "운세를 가져오지 못했습니다." });
    } finally {
      set({ isLoading: false });
    }
  },

  clearCache: () => set({ cache: { today: null, week: null, month: null }, error: null })
}));
