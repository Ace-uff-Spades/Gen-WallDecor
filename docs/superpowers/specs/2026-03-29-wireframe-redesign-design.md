# GenWallDecor Wireframe Redesign — Design Spec

> Created: 2026-03-29
> Status: Approved

---

## Overview

Redesign all 7 Figma wireframe frames (Page 1 of the GenWallDecor Wireframes file) to reflect a premium, light, airy aesthetic inspired by high-end real estate and property investment sites. All frames are updated in-place on the existing Figma page.

Figma file: `https://www.figma.com/design/CphSBIwuFQifjwBlS30jsM/GenWallDecor-Wireframes`

---

## Design Decisions

### Mood
Light, premium, airy. Not dark or moody. Reference: the real estate/property investment inspiration screenshots on the Inspiration page (node 16:2).

### Color Palette — Cool Slate

| Token | Hex | Usage |
|-------|-----|-------|
| Primary Dark | `#1B3A5C` | Nav bg (hero only), buttons, active states, icon rail active pill |
| Accent Blue | `#2E6DA4` | Links, highlights, italic hero text, step indicators |
| Mid Blue | `#7EB4D8` | Hero title accent color, decorative elements |
| Tint | `#C8DFEE` | Card borders, input borders, avatar bg, wall render placeholder |
| Page BG | `#F0F4F8` | All page backgrounds (logged-in and public) |
| Surface | `#FFFFFF` | Cards, input fields, modals |
| Text Primary | `#111827` | Headings, labels |
| Text Secondary | `#6B7280` | Subtext, captions, metadata |
| Border | `#D8E4ED` | Card borders, dividers |

### Typography
- **Font**: Inter / System UI sans-serif
- **Hero title**: Extra-bold (900), very tight tracking (-1px), mixed-case Title Case (e.g. "Design Your / Perfect Wall"), anchored bottom-left on the landing hero
- **Headings**: Bold (700), normal tracking
- **Body**: Regular (400), 14–16px, `#374151`
- **Labels / metadata**: 12px, `#6B7280`

### Component Patterns
- **Primary button**: `#1B3A5C` bg, white text, 6px border-radius
- **Secondary button**: White bg, `1.5px #C8DFEE` border, `#1B3A5C` text
- **Text link**: `#2E6DA4`, no underline, arrow suffix (`→`)
- **Cards**: White bg, `8px` radius, `1px #D8E4ED` border, subtle box-shadow on hover
- **Selection state**: `#1B3A5C` border, `#EBF2F8` fill, checkmark or filled dot indicator
- **Step indicator**: Filled circle for completed, outlined for upcoming, connecting line

---

## Pages

### 1. Landing Page (frame `2:2`)

**Hero section** (full viewport height):
- Full-bleed gradient background: `#0F2744` → `#1B3A5C` → `#2E6DA4` → `#7EB4D8` (135deg)
- Top nav bar: logo left (`GENWALLDECOR`, white, letter-spaced), History link + outlined pill Sign In button right
- **Title**: Extra-bold, white, bottom-left anchored. Two lines: `Design Your` / `Perfect Wall`. `#7EB4D8` accent on second line.
- **Room widget**: Top-right corner. Frosted glass card (`rgba(255,255,255,0.12)`, backdrop-blur, `1px rgba(255,255,255,0.2)` border). Contains a simple 3D room outline (walls + floor perspective lines), with a highlighted wall area showing a rendered art piece placeholder. Label: "YOUR ROOM ↑ visualized here"
- **CTA button**: `Start Creating` — white bg, `#1B3A5C` text, placed bottom-left below title
- **Gradient fade**: Bottom of hero fades into `#F0F4F8` page background

**Below-fold content** (on `#F0F4F8`):
- "How It Works" — 3 cards in a row (white bg, border, subtle shadow). Each: emoji icon, Step N label, title, one-line description.
- **CTA banner**: Centered card with "Ready to transform your space?" heading, subtitle, and `Get Started` button.

---

### 2. Create — Step 1 (frame `3:2`)

**Nav**: Same top bar as landing (logged-out state).

**Step indicator**: 3 circles connected by lines. Active circle filled `#1B3A5C`, completed filled `#2E6DA4` with checkmark, upcoming outlined `#C8DFEE`. "Step 1 of 3" label below.

**Style grid**: 3-column grid of style cards (white bg, `#D8E4ED` border, 8px radius). Selected card: `#1B3A5C` border, `#EBF2F8` fill, checkmark badge top-right.

**Bottom action bar**: Full-width `#F0F4F8` bar. Helper text left. `Next →` primary button right.

---

### 3. Create — Step 2 (frame `4:2`)

**Visual Preferences**:
- Color scheme: pill-shaped toggle chips (`#D8E4ED` border, white bg). Selected: `#1B3A5C` bg, white text.
- Frame material: larger cards (same selection pattern as style cards).

**Bottom action bar**: `← Back` secondary button + `Next →` primary button.

---

### 4. Create — Step 3 (frame `5:2`)

**Room Context**:
- Room type: styled dropdown (`#D8E4ED` border, white bg, chevron right).
- Wall dimensions: two inputs side by side, `×` separator. Placeholder text in `#9CA3AF`. Optional label in `#6B7280`.

**Bottom action bar**: `← Back` + `Generate →` (primary, slightly larger).

---

### 5. Generate — Review Descriptions (frame `6:2`)

**Nav**: Top bar (logged-out state).

**Description cards**: White bg, `#D8E4ED` border, 8px radius. Each card: piece number + title (bold), one-line description, `Regenerate this piece` text link (`#2E6DA4`).

**Refinement box**: Card at bottom with "Want different descriptions?" heading, free-text input, `Regenerate All` secondary button.

**Generate Images CTA**: Full-width primary button, centered, prominent.

---

### 6. Wall View (frame `7:2`) — Logged In

**Navigation**: Floating icon rail (left side, 60px wide). Same `#F0F4F8` background as page — no border, no shadow. Contents:
- Logo mark (`G`, `#1B3A5C` rounded square)
- Active icon (Wall View): dark pill bg (`#1B3A5C`), white SVG icon
- Inactive icons (History, New Wall): muted SVG icons (`#9AAFC0`), no bg
- Avatar circle at bottom

**Layout**: Rail + subtle 1px `#DDE8F0` divider + main content area.

**Main content**:
- Page title: "Your Wall — [Style]" + metadata subtitle
- Full-width wall render placeholder (`#C8DFEE` bg, 16:9 ratio)
- Action bar below render: `Regenerate Selected (N)` secondary, `Update Wall Render` secondary, `Finalize Wall` primary, regeneration count label
- "Individual Pieces" section: thumbnail strip with checkbox overlay per piece, version nav arrows, piece name label
- Detail panel (right side, on piece click): piece title, description, metadata (medium, dimensions, placement), shopping/download links

---

### 7. History (frame `8:2`) — Logged In

**Navigation**: Same floating icon rail as Wall View (History icon active).

**Generation cards grid**: 3-column grid. Each card: wall render thumbnail (top, 16:9), style name (bold), date (secondary), hover state reveals "View Wall" button overlay.

**Empty state**: Centered card — "No generations yet" heading, `Create Your First Wall` primary button.

---

## What Is Not Changing

- Page structure and information architecture (same sections, same data)
- All existing functionality (regenerate, version nav, finalize, shopping links, etc.)
- Figma frame sizes (1440×900)
- Number of frames (7 total)
