# Design System: Light Observatory + Premium Wellness Editorial

## 1. Visual Theme & Atmosphere
- Tone: bright premium editorial, calm wellness mood, trustworthy guided report experience.
- UX intent: decorative effects are minimized; readability and information hierarchy are prioritized.
- Hard constraints:
  - No heavy purple gradients
  - No dark/deep space backgrounds
  - No strong glow effects

## 2. Color Palette & Roles
- Warm Ivory `#FAF7F2`: global background
- Cloud White `#FFFFFF`: cards and elevated surfaces
- Ink Navy `#24303F`: primary text and key icons
- Champagne Gold `#C9A86A`: primary CTA and highlighted actions
- Soft Sage `#BFD0C7`: secondary accents and supportive emphasis
- Mist Blue `#EAF1F7`: subtle section backgrounds and separators

## 3. Typography Rules
- Sans: Plus Jakarta Sans + Noto Sans KR
- Editorial Serif: Fraunces (headlines/section intros only)
- Body size: 16-18px
- Body line-height: 1.65-1.85
- Report layout should favor comfortable long-form reading on desktop

## 4. Component Styling Rules
- Buttons:
  - Primary: `#C9A86A` background with dark ink text
  - Secondary: white surface with subtle border and text emphasis
- Cards:
  - Rounded corners (18-26px)
  - White or Mist Blue surface
  - Soft shadow only
- Inputs:
  - High-contrast labels and helper text
  - Focus treatment with Gold/Sage accent ring

## 5. Layout Principles
- Mobile-first for entry, navigation, and input funnels
- Desktop expansion for report/detail pages
- Report reading flow:
  - Summary -> Insight -> Detail Data
- Shared layout shell:
  - `SidebarLayout`, `FunnelLayout`, `AnalysisPageShell`, `AppLayout`, `GNB`, `BottomTab`

## 6. Motion Principles
- Transition tokens: 140ms / 220ms / 320ms
- Use subtle opacity + translateY entry transitions
- Avoid flashy background/particle animations in core report flows

## 7. Accessibility Constraints
- Text contrast meets WCAG AA or higher
- Minimum interactive target: 44x44
- Do not rely on color alone for state signaling

## 8. Non-Functional Constraints
- This document defines presentation only.
- Business logic, API contract, routing contract, and store contract must remain unchanged.
