# Initial Load Performance Update (2026-03-19)

## Scope
- Reduce first-open latency of the app.
- Apply high-impact bundle and route loading optimizations.

## Changes Applied
1. Route-level lazy loading in `src/App.tsx`
- Converted most page imports to `React.lazy()`.
- Wrapped router with `Suspense` fallback.
- Kept `CategoryPage` eager-loaded for the primary landing flow.

2. Removed artificial open delay in `src/pages/CategoryPage.tsx`
- Deleted the fixed `800ms` loading timer.
- Category screen now renders immediately.

3. Vendor chunk splitting in `vite.config.ts`
- Added `build.rollupOptions.output.manualChunks` for:
  - `vendor-react`
  - `vendor-radix`
  - `vendor-motion`
  - `vendor-supabase`
  - `vendor-manseryeok`
  - `vendor-recharts`

## Build Size Impact
Before:
- Single main JS chunk: `1,682.62 kB` (gzip `594.55 kB`)

After:
- Main app chunks: `117.68 kB` + `118.95 kB`
- Largest vendor chunk: `vendor-recharts 359.41 kB` (gzip `99.07 kB`)
- Other major vendor chunks:
  - `vendor-manseryeok 244.17 kB`
  - `vendor-react 190.83 kB`
  - `vendor-supabase 175.28 kB`

Result:
- First route payload is significantly smaller.
- Heavy pages/libraries load on demand instead of blocking first open.

## Validation
- `npm run build`: pass
- `npm test`: pass (`15 files`, `35 tests`)

---

## Incremental Update (2026-03-24)

### Scope
- Continue applying `bundle-dynamic-imports` from Vercel React best practices.
- Reduce main-route startup payload by removing remaining eager imports.

### Changes Applied
1. Additional route-level lazy loading in `src/App.tsx`
- Converted remaining eager route imports to `React.lazy()`:
  - `SidebarLayout`
  - `FunnelLayout`
  - `CategoryPage`
  - `SajuInput`
  - `ServiceLandingPage`
- This prevents those modules from being bundled into the first route by default.

2. Deferred Unicorn WebGL module loading in `src/components/layout/SidebarLayout.tsx`
- Replaced static import of `UnicornVisual` with `React.lazy()` + `Suspense`.
- `unicornstudio-react` is now requested only when `unicornProjectId` is present.
- Added a lightweight fallback layer while the 3D module is loading.

### Validation
- `npx eslint src/App.tsx src/components/layout/SidebarLayout.tsx`: pass
- `npm run lint`: fail due to pre-existing repository-wide lint errors unrelated to this change set.
- `npm run build`: blocked in this environment (`spawn EPERM` from `esbuild` process spawn).
- `npm test`: blocked in this environment (`spawn EPERM` from `esbuild` process spawn).

---

## Incremental Update (2026-03-26)

### Scope
- Improve first-screen rendering speed and reduce perceived loading delays.
- Improve route transition responsiveness across the app.
- Reduce unnecessary work on initial category entry.

### Changes Applied
1. Initial route hot-path simplification in `src/App.tsx`
- Kept first-route modules (`SidebarLayout`, `CategoryPage`) on the direct render path.
- Removed global `TooltipProvider` and `Sonner` mount from app bootstrap.
- Deferred `Toaster` mount with a short timer.
- Added route warm-up (`warmCoreRoutes`) for likely next navigations.
- Updated React Query defaults for lower refetch churn:
  - `staleTime: 30s`
  - `gcTime: 5m`
  - `retry: 1`

2. Sidebar/transition overhead reduction
- Replaced Radix `Sheet` mobile drawer with lightweight local drawer logic in `src/components/layout/SidebarLayout.tsx`.
- Removed `AnimatePresence` route-transition blocking wrapper from `SidebarLayout`.
- Replaced Radix `Accordion` + `ScrollArea` usage in `src/components/layout/Sidebar.tsx` with lightweight local expand/collapse rendering.

3. Navigation prefetch for faster page transitions
- Added `src/lib/routePrefetch.ts`.
- Wired hover/focus prefetch into:
  - `src/components/layout/Sidebar.tsx`
  - `src/components/layout/GNB.tsx`
  - `src/components/layout/BottomTab.tsx`

4. Category entry rendering optimization (`src/pages/CategoryPage.tsx`)
- Render only one hero branch (mobile or desktop) using a `matchMedia` layout signal.
- Memoized category product and fallback derivations.
- Kept main content rendering synchronous for routing stability.
- Deferred only `SuggestionModal` via `React.lazy` + `Suspense`.

5. Media and animation cost reduction on first-screen components
- `src/components/fortune/CategoryHero.tsx`
- `src/components/fortune/CategorySideHero.tsx`
  - Added poster-first strategy and delayed video start (`setTimeout`) to prioritize first paint.
  - Added `preload="none"` for background video tags.
- Removed framer-motion dependency from first-route-heavy components:
  - `src/components/fortune/CategoryHeroWidget.tsx`
  - `src/components/fortune/ProductGrid.tsx`
  - `src/components/fortune/FortuneSpecialGrid.tsx`
  - `src/components/fortune/DailyFortuneGrid.tsx`
- Updated `src/hooks/use-mobile.tsx` to initialize from current viewport synchronously.

### Validation
- `npm run build`: pass.
- Focused tests:
  - `npx vitest run src/test/category.new-year-routing.test.tsx`: pass
  - `npx vitest run src/test/fortune.special-grid.test.tsx`: pass
  - `npx vitest run src/test/index.page.test.tsx`: pass
- `npm test`: fails due existing repository-wide test issues unrelated to this change set (encoding-corrupted test fixtures/syntax and pre-existing domain assertions).

---

## Incremental Update (2026-03-27)

### Scope
- Reduce repeated "new version deployed" fallback state after lazy route preload errors.
- Ensure the auto-reload guard actually limits repeated reload attempts.

### Changes Applied
1. `vite:preloadError` reload guard fix in `src/main.tsx`
- Replaced boolean-style guard (`saju:chunk-reload`) with timestamp-based guard (`saju:chunk-reload-at`).
- Added `RELOAD_COOLDOWN_MS = 60_000` and only auto-reload when the last attempt is older than the cooldown.
- Removed unconditional startup reset of the reload marker (`sessionStorage.removeItem(...)`) because it nullified the intended one-time protection.

### Expected Behavior
- On first chunk/preload failure, the app attempts one automatic reload.
- If the same failure persists immediately, it no longer keeps retriggering automatic reload logic and falls back to the existing error boundary UI.

---

## Incremental Update (2026-03-28)

### Scope
- Apply additional Vercel React best-practice items for startup cost, async waterfall reduction, and re-render scope control.
- Keep external route/API contracts unchanged.

### Changes Applied
1. Startup warm-up gating and overlay loading split in `src/App.tsx`
- Route warm-up no longer runs on a fixed timer immediately after app start.
- Warm-up now runs only when network conditions are acceptable (`saveData` off, not `2g/slow-2g`) and uses `requestIdleCallback` (with timeout fallback).
- Global overlays are split:
  - `Toaster` is still deferred.
  - `LoginModal` is lazily loaded only on `/chat` and only when auth is initialized and unauthenticated.

2. Category route bundle reduction in `src/pages/CategoryPage.tsx`
- Heavy tab-specific grids are now lazy-loaded:
  - `DailyFortuneGrid`
  - `FortuneSpecialGrid`
  - `ProductGrid`
- Added per-section suspense fallback skeleton for these grids.

3. Category tab animation dependency reduction in `src/components/common/CategoryTabs.tsx`
- Removed `framer-motion` dependency from tab indicator.
- Replaced with lightweight CSS-based indicator rendering.

4. Async waterfall removal in `src/hooks/saju/useSajuAnalysisFlow.ts`
- Removed blocking awaits before navigation:
  - `loadResultById(saved.id)` now runs in background.
  - `fetchFortune(...today...)` now runs in background after navigation.
- Navigation to result/fortune route is now immediate after save succeeds.

5. Zustand selector optimization (re-render scope tightening)
- Replaced full-store subscriptions with selector subscriptions in key surfaces:
  - App root / overlays
  - Sidebar layout
  - Input funnel (`SajuInput`)
  - Personal fortune page
  - Chat UI (`ChatInput`, `ChatMessageList`, `ChatSessionToolbar`, `SajuContextBanner`, `SuggestionChips`)
  - Result-page flow hook (`useResultPageFlow`)

6. Effect dependency cleanup
- `CategoryPage` tab query sync effect now depends on primitive `requestedTabId` instead of full `searchParams` object.

7. Test updates
- Updated `src/test/useSajuAnalysisFlow.single-service.test.tsx`:
  - Verifies navigation is not blocked by background `loadResultById`.
  - Verifies today-mode navigation is not blocked by background `fetchFortune`.

### Validation
- `npm test`: failed in this environment due `esbuild` process spawn permission (`spawn EPERM`).
- `npm run build`: failed in this environment due `esbuild` process spawn permission (`spawn EPERM`).
- Local environment re-run is required for final build/test verification.
