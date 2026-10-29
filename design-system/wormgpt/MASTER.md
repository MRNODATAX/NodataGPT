# WormGPT Design System Specification

## 1. Visual Direction
- **Architecture:** Conversational AI workspace modeled on `gemini.google.com`
- **Palette:** Obsidian Black + Crimson Red + Blaze Orange
- **Assets:** `/logo.png` (solid black ground) and `/logo-transparent.png` (alpha-extracted crimson knot)
- **Targets:** Responsive Web (phone, tablet, desktop) + Standalone PWA / WebAPK

## 2. Verified Contrast Ratios (`antislop-human/contrast-check.py`)
| Foreground | Background | Ratio | WCAG AA Normal (4.5:1) |
|---|---|---|---|
| `#FAFAFA` | `#000000` | `20.12:1` | PASS |
| `#FAFAFA` | `#09090B` | `19.06:1` | PASS |
| `#FAFAFA` | `#121216` | `17.90:1` | PASS |
| `#FAFAFA` | `#1D1412` | `17.33:1` | PASS |
| `#B4B4BE` | `#09090B` | `9.68:1` | PASS |
| `#9E9EA8` | `#121216` | `7.04:1` | PASS |
| `#FB923C` | `#09090B` | `8.79:1` | PASS |
| `#F97316` | `#09090B` | `7.10:1` | PASS |
| `#F87171` | `#09090B` | `7.19:1` | PASS |
| `#FFFFFF` | `#B91C1C` | `6.47:1` | PASS |
| `#FFFFFF` | `#C2410C` | `5.18:1` | PASS |

## 3. Responsive Reflow States (`antislop-layoutmobile`)
1. **Compact Phone (`< 640px`):** Off-canvas navigation drawer with scrim, single-column starter cards, compact fluid greeting, touch-safe `44x44px` minimum controls, `100dvh` safe-area layout.
2. **Tablet / Medium (`640px` to `1023px`):** Collapsible slim icon rail or overlay drawer, 2-column starter card grid (`2x2`), generous horizontal gutters.
3. **Desktop (`>= 1024px`):** Persistent toggleable rail (`72px` collapsed / `280px` expanded), 4-column starter row or asymmetric 2x2 composer-aligned grid, centered `48rem` reading measure.
