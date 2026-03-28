# Fortune Personal Category Filter (2026-03-26)

## Problem
- In `today` flow, users select one category (for example `career`) but the personal fortune detail section could still render all six categories.

## Expected Behavior
- Only one category card is rendered at a time.
- If `categoryId` is selected, only that one category card is rendered.
- If `categoryId` is missing or invalid, default category is `total`.
- Other five categories are hidden.
- The selected state must survive route/search updates on `/fortune/personal`.

## Implementation
- `src/hooks/fortune/useFortunePersonalFlow.ts`
  - Added `resolvedInitialCategory` with validation against `DAILY_CATEGORIES`.
  - Added default fallback category `total` for missing/invalid query.
  - Synced `selectedCategory` when `initialCategory` changes.
  - Removed multi-card fallback so detail section never renders all six at once.
- `src/pages/fortune/FortunePersonalPage.tsx`
  - Synced category selection with `categoryId` query string.
  - Removed additional category selector UI from personal detail screen.
  - Kept detail rendering to one selected item only.
  - Updated nav item path to keep current `categoryId`.
- `src/components/fortune/FortuneSubNav.tsx`
  - Active path check now ignores query string for stable active-state behavior.

## Verification
- Added unit test: `src/test/useFortunePersonalFlow.category-filter.test.tsx`
  - no `categoryId` => defaults to `total` only
  - valid `categoryId` => one category rendered
  - query value change => selected category re-sync
  - invalid `categoryId` => fallback to `total` only

## 2026-03-27 Update: Single-Category Generation
- Previous behavior still generated all six categories from Gemini and only filtered on UI.
- Updated to generate only the selected category end-to-end.

### Scope
- `src/store/useFortuneStore.ts`
  - `fetchFortune` now requires `categoryId`.
  - Cache is now category-aware (`cache.today[categoryId]`) so each selected category stores and reuses only its own response.
- `src/hooks/fortune/useFortunePersonalFlow.ts`
  - Requests daily fortune with selected `categoryId`.
  - Reads only `cache.today[selectedCategory]`.
  - Added category validation/type guard for query input.
- `src/lib/geminiClient.ts`
  - `FortuneRequest` contract now includes mandatory `categoryId`.
- `supabase/functions/saju-daily-api/index.ts`
  - Added `categoryId` validation (400 on invalid/missing).
  - Prompt changed from "6 categories" to "single selected category only".
  - Enforced response rule: `categories` object must contain only the requested key.

### Result
- User clicks one category -> request includes that one `categoryId` -> Gemini generates that one category block only -> personal page renders only that category.

## 2026-03-27 Update: Remove Double Loading After Today Analysis
- Symptom: In `mode=today`, the app showed a second loading screen on `/fortune/personal` even after analysis/save had finished.
- Cause: `SajuInput` finished the first loading phase, navigated to `/fortune/personal`, and then `useFortunePersonalFlow` started a new network fetch.

### Scope
- `src/hooks/saju/useSajuAnalysisFlow.ts`
  - Added category validation for today mode (`total|love|wealth|career|study|health`).
  - In `requestedMode === "today"` path, preloads `fetchFortune(saved, "today", categoryId)` before navigation.
  - Moved `분석 완료` toast timing to after `loadResultById` and today preloading, so it does not appear while loading is still active.
  - Keeps navigation target `/fortune/personal` (with valid `categoryId` query when provided).

### Result
- Transition is now single-path: first loading screen -> immediate personal result screen.
- The extra intermediate loading state on `/fortune/personal` no longer appears for the initial selected category.
