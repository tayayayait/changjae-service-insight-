# Branding Metadata Changes (2026-03-19)

## Scope
- Hide default builder-origin visual traces in browser tab UI.
- Remove heart-shaped favicon impression from tab icon.

## Changes
- Added explicit favicon link in `index.html`:
  - `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`
- Added `public/favicon.svg` as a project-specific icon.
  - Neutral moon/star motif
  - No heart emoji or heart shape

## Notes
- Browser favicon cache may delay immediate icon replacement.
- Hard refresh (`Ctrl+F5`) reflects the new icon instantly in most browsers.
