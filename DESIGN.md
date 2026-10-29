# DESIGN.md: NodataGPT Brand & Responsive Interface Direction

## 1. Product Identity
- **Name:** NodataGPT
- **Format:** Responsive Mobile & Desktop Web App + Standalone Android/iOS PWA (WebAPK)
- **Structural Reference:** Google Gemini 2025/2026 Mobile & Web Architecture (progressive disclosure, bottom sheet model picker on mobile, minimal top bar, compact single-capsule prompt composer, collapsible desktop rail)
- **Logo Mark:** Geometric hexagonal knot split diagonally into Electric Cyan (`#0ECDEC` / `#22D3EE`) on the left half and Blaze Orange (`#F97316` / `#FB923C`) on the right half over pure `#000000` (`/logo.png` and `/logo-transparent.png`)

## 2. Color System (3 Core Colors: Obsidian + Cyan + Orange, R-29)
- **Obsidian Base:**
  - `#000000` (`--bg-void`): Splash screen and PWA icon ground
  - `#080A0F` (`--bg-canvas`): Main reading stage (`18.97:1` contrast with `#FAFAFA`)
  - `#05070B` (`--bg-sidebar`): Left navigation rail and mobile drawer
  - `#10141D` (`--bg-surface`): Composer capsule, cards, bottom sheets (`17.65:1` contrast with `#FAFAFA`)
  - `#121C26` (`--bg-user-bubble`): Subtle cyan-tinted slate surface for user bubbles (`16.49:1` contrast)
- **Electric Cyan Accent:**
  - `#22D3EE` (`--brand-cyan`): Primary interactive text/icon accent (`10.96:1` contrast on `#080A0F`)
  - `#0E7490` (`--brand-cyan-solid`): Solid primary button fill (`5.36:1` contrast with `#FFFFFF`)
- **Blaze Orange Accent:**
  - `#FB923C` / `#F97316` (`--brand-orange`): Dual-brand highlight, fallback status badge, and wordmark pair (`8.75:1` contrast on `#080A0F`)

## 3. Mobile vs Desktop Reflow Strategy
- **Mobile (`< 640px`):**
  - Single-row `56px` header (`[Menu] [NodataGPT · Model] [+ Baru]`) with zero horizontal overflow even at `320px`.
  - Slide-up **Bottom Sheet** for the 24-model AI selector and Auto-Fallback control.
  - Compact 2x2 quick-action starter chips that fit above the composer without vertical scrolling.
  - Streamlined single-capsule composer (`~84px` idle height) without multi-line toolbar wrapping.
- **Tablet & Desktop (`>= 640px` / `>= 1024px`):**
  - Persistent toggleable left navigation rail (`72px` collapsed / `276px` expanded).
  - Centered `48rem` reading column, 4-column structured starter cards, and modal model picker with search & health status.
