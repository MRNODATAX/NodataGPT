# DESIGN.md: WormGPT Brand & Interface Direction

## 1. Product Identity
- **Name:** WormGPT
- **Format:** Responsive Web App + Installable Android/iOS Progressive Web App (WebAPK)
- **Structural Reference:** `https://gemini.google.com` (collapsible left rail/drawer, minimal top bar, centered greeting empty state, floating bottom prompt capsule, full-width assistant prose column)
- **Logo Mark:** User-supplied crimson geometric knot on pure `#000000` (`/logo.png` and alpha-extracted `/logo-transparent.png`)

## 2. Color System (3 Core Colors + 1 Interactive Accent, R-29)
- **Core Neutral Base (Black):**
  - `#000000` (`--bg-void`): Splash screen backdrop and PWA maskable background, matching the exact `#000000` ground of `/logo.png`
  - `#09090B` (`--bg-canvas`): Main reading stage
  - `#050507` (`--bg-sidebar`): Left navigation rail and history drawer
  - `#121216` (`--bg-surface`): Composer capsule, prompt starter cards, code block headers
  - `#1D1412` (`--bg-user-bubble`): Warm dark ember surface distinguishing user messages from assistant prose
- **Core Brand Crimson (Red):**
  - `#AD090A` (`--brand-crimson`): Sampled directly from the user's logo mark (`rgb(173, 9, 10)`)
  - `#B91C1C` (`--brand-red-solid`): Primary solid button fill (`6.47:1` contrast with `#FFFFFF` text)
  - `#F87171` (`--brand-red-text`): Error states and inline emphasis on dark canvas (`7.19:1` contrast)
- **Interactive Accent (Orange):**
  - `#F97316` / `#FB923C` (`--brand-orange` / `--brand-amber`): Focus rings, active progress indicator, and Gemini-inspired greeting highlight (`7.10:1` and `8.79:1` contrast on `#09090B`)

## 3. Typography & Hierarchy
- **Display & Wordmark (`Space Grotesk`):** Used for the `WormGPT` splash wordmark, top model switcher, and empty-state greeting (`clamp(1.75rem, 4vw, 2.75rem)`). Chosen for crisp geometric terminals that echo the hexagonal knot logo.
- **Interface & Reading Copy (`DM Sans`):** `16px` base size, `1.65` line-height in assistant responses for comfortable long-form reading.
- **Code & Technical Output (`JetBrains Mono`):** `13.5px`–`14px` with ligatures disabled in copyable code blocks for unambiguous character reading.

## 4. Documented Purpose Tests (Anti-Slop Gate)
- **Dark Theme (`R-21`):** Explicitly requested by the owner (`hitam + oren + merah`) and anchored to the pure `#000000` background of the supplied logo.
- **Gradient Usage (`R-01`):** Restricted to two hierarchy moments: (1) the Gemini-reference greeting headline (`#EF4444` -> `#F97316` -> `#FB923C`) separating the empty-state focal point from neutral starter cards, and (2) the opening splash progress bar indicating active boot progression. All cards, sidebars, and bubbles remain solid matte surfaces.
- **Focus & Elevation (`R-10`, `R-12`, `R-13`):** Backdrop blur is used only on modal/mobile-drawer scrims (`1` layer). Ambient glow is capped strictly to the opening splash logo emblem and the `:focus-within` ring of the prompt omnibox so keyboard/typing focus is unmistakable.
- **Border Radius Scale (`R-11`):**
  - `24px`: Prompt composer omnibox (distinguishes primary input zone, matching Gemini)
  - `18px`: User message bubble (`rounded-tr-sm` directional tail)
  - `14px`: Starter cards and dialogs
  - `10px`: Code blocks, sidebar history items, action buttons
