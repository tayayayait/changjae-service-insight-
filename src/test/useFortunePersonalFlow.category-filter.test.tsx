import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFortunePersonalFlow } from "@/hooks/fortune/useFortunePersonalFlow";
import { SajuResult } from "@/types/result";

interface CreateParamsOptions {
  baseResult?: SajuResult | null;
  fetchFortune?: ReturnType<typeof vi.fn>;
  initialCategory: string | null;
}

const createParams = ({ baseResult = null, fetchFortune, initialCategory }: CreateParamsOptions) => ({
  baseResult,
  cache: { today: {} },
  fetchFortune: fetchFortune ?? vi.fn(async () => undefined),
  initialCategory,
});

describe("useFortunePersonalFlow category filter", () => {
  it("defaults to total category when categoryId is not provided", async () => {
    const { result } = renderHook(() => useFortunePersonalFlow(createParams({ initialCategory: null })));

    await waitFor(() => {
      expect(result.current.selectedCategory).toBe("total");
    });

    expect(result.current.filteredCategories).toHaveLength(1);
    expect(result.current.filteredCategories[0].id).toBe("total");
  });

  it("shows only the selected category when a valid categoryId is provided", async () => {
    const { result } = renderHook(() => useFortunePersonalFlow(createParams({ initialCategory: "career" })));

    await waitFor(() => {
      expect(result.current.selectedCategory).toBe("career");
    });

    expect(result.current.filteredCategories).toHaveLength(1);
    expect(result.current.filteredCategories[0].id).toBe("career");
  });

  it("requests only selected category from store fetch", async () => {
    const fetchFortune = vi.fn(async () => undefined);
    const baseResult = {
      id: "base-1",
      palja: {},
      oheng: [],
    } as unknown as SajuResult;

    renderHook(() =>
      useFortunePersonalFlow(
        createParams({
          baseResult,
          fetchFortune,
          initialCategory: "love",
        }),
      ),
    );

    await waitFor(() => {
      expect(fetchFortune).toHaveBeenCalledWith(baseResult, "today", "love", false);
    });
  });

  it("syncs selectedCategory when categoryId query value changes", async () => {
    const { result, rerender } = renderHook(
      ({ initialCategory }) => useFortunePersonalFlow(createParams({ initialCategory })),
      { initialProps: { initialCategory: "love" as string | null } },
    );

    await waitFor(() => {
      expect(result.current.selectedCategory).toBe("love");
    });

    rerender({ initialCategory: "health" });

    await waitFor(() => {
      expect(result.current.selectedCategory).toBe("health");
    });

    expect(result.current.filteredCategories).toHaveLength(1);
    expect(result.current.filteredCategories[0].id).toBe("health");
  });

  it("falls back to default category when categoryId is invalid", async () => {
    const { result } = renderHook(
      () => useFortunePersonalFlow(createParams({ initialCategory: "invalid-category" })),
    );

    await waitFor(() => {
      expect(result.current.selectedCategory).toBe("total");
    });

    expect(result.current.filteredCategories).toHaveLength(1);
    expect(result.current.filteredCategories[0].id).toBe("total");
  });
});
