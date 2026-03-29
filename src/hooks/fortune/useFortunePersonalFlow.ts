import { useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { saveFortuneResult } from "@/lib/resultStore";
import { DAILY_CATEGORIES } from "@/components/fortune/DailyFortuneGrid";
import { FortuneCategoryId, FortuneResult, SajuResult } from "@/types/result";

interface FortuneCache {
  today: Partial<Record<FortuneCategoryId, FortuneResult>>;
}

interface UseFortunePersonalFlowParams {
  baseResult: SajuResult | null;
  cache: FortuneCache;
  fetchFortune: (
    result: SajuResult,
    period: "today",
    categoryId: FortuneCategoryId,
    force?: boolean,
  ) => Promise<void>;
  initialCategory: string | null;
}

const DEFAULT_CATEGORY_ID: FortuneCategoryId = "total";

const isFortuneCategoryId = (value: string | null): value is FortuneCategoryId =>
  value === "total" ||
  value === "love" ||
  value === "wealth" ||
  value === "career" ||
  value === "study" ||
  value === "health";

const resolveCategoryId = (initialCategory: string | null): FortuneCategoryId => {
  if (!isFortuneCategoryId(initialCategory)) {
    return DEFAULT_CATEGORY_ID;
  }

  return DAILY_CATEGORIES.some((category) => category.id === initialCategory)
    ? initialCategory
    : DEFAULT_CATEGORY_ID;
};

export function useFortunePersonalFlow({
  baseResult,
  cache,
  fetchFortune,
  initialCategory,
}: UseFortunePersonalFlowParams) {
  const [isSaving, setIsSaving] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const resolvedInitialCategory = useMemo(() => resolveCategoryId(initialCategory), [initialCategory]);
  const [selectedCategory, setSelectedCategory] = useState<FortuneCategoryId>(resolvedInitialCategory);

  const fortune = cache.today[selectedCategory] ?? null;

  useEffect(() => {
    if (!baseResult) {
      return;
    }

    // 이미 캐시에 결과가 있으면 중복 호출 방지
    const cached = cache.today[selectedCategory];
    if (cached && retryToken === 0) {
      return;
    }

    void fetchFortune(baseResult, "today", selectedCategory, retryToken > 0);
  }, [baseResult, cache.today, fetchFortune, retryToken, selectedCategory]);

  useEffect(() => {
    setSelectedCategory((prev) => (prev === resolvedInitialCategory ? prev : resolvedInitialCategory));
  }, [resolvedInitialCategory]);

  const handleSave = async () => {
    if (!fortune || !baseResult) {
      return;
    }

    setIsSaving(true);
    try {
      await saveFortuneResult({
        ...fortune,
        baseResultId: baseResult.id,
        sourceKind: "personal",
      });

      toast({
        title: "Saved",
        description: "Selected fortune has been saved.",
      });
    } catch (saveError) {
      toast({
        title: "Save failed",
        description: saveError instanceof Error ? saveError.message : "Failed to save the selected fortune.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCategories = useMemo(() => {
    return DAILY_CATEGORIES.filter((category) => category.id === selectedCategory);
  }, [selectedCategory]);

  return {
    fortune,
    isSaving,
    retryToken,
    setRetryToken,
    selectedCategory,
    setSelectedCategory,
    filteredCategories,
    handleSave,
  };
}
