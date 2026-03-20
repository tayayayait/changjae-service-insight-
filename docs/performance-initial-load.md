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
