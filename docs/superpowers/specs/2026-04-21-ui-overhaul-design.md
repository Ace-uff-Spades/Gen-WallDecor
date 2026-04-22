# UI Overhaul — Design Spec

> Created: 2026-04-21
> Status: Approved

---

## Overview

Complete frontend visual overhaul to match the Pencil wireframes (`landing-design.pen`). Backend, API contracts, and routing remain unchanged. The three existing routes (`/`, `/create`, `/generate`, `/wall/[id]`) keep their URLs and logic; only their presentation changes.

Implementation approach: **Component-first (bottom-up)**
1. Design system (globals.css, layout.tsx, fonts)
2. Shared components (Navbar, WizardSplitLayout, button styles)
3. Pages in order: Landing → Create → Generate → Wall

---

## Design System

### Color Tokens (globals.css)

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#E55722` | Orange — CTAs, active states, accents |
| `--color-primary-hover` | `#CC4A1A` | Darker orange for hover |
| `--color-bg` | `#FAF8F5` | Off-white page background |
| `--color-surface` | `#FFFFFF` | Card/panel surfaces |
| `--color-dark` | `#1A2535` | Dark slate — navbar, hero bg, dark panels |
| `--color-dark-secondary` | `#243044` | Slightly lighter dark for hover states on dark bg |
| `--color-text` | `#1A2535` | Primary body text |
| `--color-text-muted` | `#6B7280` | Secondary/muted text |
| `--color-text-light` | `#F5F4F2` | Text on dark backgrounds |
| `--color-border` | `#E8E5E0` | Subtle borders |
| `--color-step-inactive` | `#D1CEC9` | Progress bar inactive segments |

Remove old tokens: `--color-primary` (teal), `--color-background`, `--color-secondary`, `--color-text-dark`, `--color-text-darker`.

### Typography

- **Sans**: `DM Sans` — loaded from Google Fonts (weights: 400, 500, 600, 700)
- **Mono**: `DM Mono` — loaded from Google Fonts (weights: 400, 500) — used for step labels, tags, metadata

Load via `next/font/google` in `layout.tsx`, apply via CSS variables `--font-sans` and `--font-mono`.

### Spacing & Radius

- Panel border-radius: `16px` (`rounded-2xl`)
- Button border-radius: `10px` (`rounded-xl`) for primary; `8px` (`rounded-lg`) for secondary
- Card border-radius: `12px` (`rounded-xl`)

### Elevation

- Cards: `shadow-sm` (subtle)
- Modals/popovers: `shadow-lg`
- No heavy box shadows on the split-screen panels (flat design)

---

## Shared Components

### Navbar

**Design:**
- Background: `--color-dark` (`#1A2535`), full-width, `h-14`
- Logo: `GENWALLDECKOR` in DM Sans, small-caps style, `text-text-light`, left-aligned
- Right side: `History` link (ghost, `text-text-light/70`, hover `text-text-light`) + `Sign In` button (outlined, white border, `text-text-light`) or user avatar/name when signed in
- Admin link: same ghost style as History, only visible to admin
- Fixed at top, `z-50`
- No bottom border (dark bar stands on its own)

**Responsive:** On mobile, collapse History/Admin into a hamburger or simply show as icon links.

### Primary Button

```
bg-[--color-primary] text-white font-semibold rounded-xl px-6 py-3
hover:bg-[--color-primary-hover] transition-colors
disabled:opacity-40 disabled:cursor-not-allowed
```

### Secondary Button

```
border border-[--color-border] text-[--color-text] font-medium rounded-lg px-5 py-2.5
hover:bg-[--color-bg] transition-colors
```

### Ghost Button (on dark bg)

```
text-[--color-text-light]/70 font-medium
hover:text-[--color-text-light] transition-colors
```

---

## Room Photos Strategy

The creation flow right panel shows a high-fidelity room photo that updates based on the selected style. Photos are sourced from Unsplash (free, no attribution required in production with appropriate license).

- Map one Unsplash photo URL per decor style in `frontend/src/lib/stylePhotos.ts`
- Export: `Record<string, string>` keyed by style name (matching `DECOR_STYLES[n].name`)
- Default/fallback photo shown before a style is selected (neutral living room)
- Photo URLs use Unsplash's sizing params: `?auto=format&fit=crop&w=1400&q=85`
- Images are displayed with `object-cover` and the panel takes full height of the viewport

Styles needing photos (20 total): Transitional, Traditional, Modern, Eclectic, Contemporary, Minimalist, Mid Century Modern, Bohemian, Modern Farmhouse, Shabby Chic, Coastal, Hollywood Glam, Southwestern, Rustic, Industrial, French Country, Scandinavian, Mediterranean, Art Deco, Asian Zen.

Photos are selected and committed during implementation phase. Do not use placeholder/Lorem Picsum — use real curated Unsplash photos appropriate to each style.

---

## Page: Landing (`/`)

**Reference:** Pencil wireframe node `OR06L`

### Structure (top to bottom)

1. **Navbar** (fixed, dark slate — see Navbar spec above)

2. **Hero section** — full-viewport-height (`min-h-screen`), relative
   - Background: full-bleed room photo (`object-cover`, darkened with `bg-black/30` overlay)
   - Photo: a curated aspirational living room with wall art
   - Content: centered frosted-glass card (`bg-white/10 backdrop-blur-sm`, `rounded-2xl`, `p-10`)
     - Eyebrow: `GENWALLDECKOR` in DM Mono, small caps, muted
     - H1: "Design Your Perfect Wall" — DM Sans Bold, ~52px on desktop
     - Subtitle: "AI-powered wall decor that matches your style." — DM Sans 400, 18px, `text-text-light/80`
     - CTA button: "Start Creating" — Primary orange button
   - No second CTA or sub-buttons in the hero card

3. **How It Works section** — white/off-white background, `py-24`
   - Section label: "HOW IT WORKS" — DM Mono, small-caps, muted, centered
   - H2: "Three steps to your perfect wall" — DM Sans Bold, 32px, centered
   - Three cards in a row (or stacked on mobile) — each card has:
     - Step number: "STEP 1" in DM Mono small-caps, orange
     - Step title: DM Sans 600, 18px
     - Step description: DM Sans 400, 14px, muted
     - Cards: white bg, `rounded-2xl`, `shadow-sm`, `p-8`

4. **Bottom CTA strip** — dark slate background (`bg-[--color-dark]`), `py-16`
   - Left: "Ready to transform your space?" — DM Sans Bold, white
   - Sub: "It only takes a few minutes to create something beautiful." — muted white
   - Right: "Get Started →" — Primary orange button
   - Full-width, horizontal layout on desktop, stacked on mobile

---

## Page: Create (`/create`)

**Reference:** Pencil wireframe node `BrbH5` (Steps 1–4)

### Split-Screen Layout (`WizardSplitLayout`)

Replace `WizardLayout` with a new `WizardSplitLayout` component:

```
<div class="min-h-screen flex">
  <!-- Left panel: 42% width, white bg, scrollable -->
  <div class="w-[42%] flex flex-col bg-surface px-10 py-8 overflow-y-auto">
    <!-- Step indicator (top) -->
    <!-- Title -->
    <!-- Form content (children) -->
    <!-- Navigation buttons (bottom, sticky) -->
  </div>

  <!-- Right panel: 58% width, photo, fixed -->
  <div class="w-[58%] sticky top-0 h-screen">
    <img src={photoUrl} class="w-full h-full object-cover" />
  </div>
</div>
```

**Step indicator (left panel top):**
- "STEP X OF 4" — DM Mono, small-caps, `text-text-muted`, 12px
- Row of 4 thin progress bars below (`h-1`, orange for completed, `--color-step-inactive` for pending)

**Navigation (left panel bottom, sticky):**
- Back: ghost/secondary button, left-aligned
- Next/Generate: Primary orange button, right-aligned
- Both in a `flex justify-between` row, `border-t border-[--color-border]`, `pt-4 mt-auto`

### Step 1 — Choose Your Style

Left panel content:
- H2: "Choose Your Style" — DM Sans Bold, 22px
- Subtitle: "Pick a look that matches your space." — muted, 14px
- Style cards grid: `grid-cols-2 gap-3` (not 3-col — cleaner with larger cards)
- **StyleCard redesign:**
  - White card, `rounded-xl`, `border border-[--color-border]`, `p-4`
  - Style name: DM Sans 600, 15px
  - Description: DM Sans 400, 12px, muted
  - Selected state: `border-[--color-primary]`, `bg-primary/5`, orange checkmark top-right
  - Hover: subtle shadow lift

Right panel photo: default neutral room photo until a style is selected; updates to style-specific photo on selection (smooth crossfade via CSS transition on `opacity`).

### Step 2 — Visual Preferences

Left panel content:
- H2: "Visual Preferences" — DM Sans Bold, 22px
- Color scheme section and frame material section (existing selectors, redesigned)
- **ColorSchemeSelector redesign:** pill chips, selected = orange bg + white text
- **FrameMaterialSelector redesign:** same pill chip pattern

Right panel photo: style-specific photo (same as selected style, persists through steps).

### Step 3 — Room Details

Left panel content:
- H2: "Your Room" — DM Sans Bold, 22px
- **RoomContextForm redesign:** 
  - Room type: pill chips (same as color/frame)
  - Wall dimensions: clean inline inputs with labels, optional badge `(optional)`

Right panel photo: persists — style-specific photo.

---

## Page: Generate / Descriptions (`/generate`)

**Reference:** Pencil wireframe node `YaTp4` (left screen)

### Layout

Same split-screen shell as creation flow:
- Left panel (42%): descriptions accordion + feedback + CTA
- Right panel (58%): aesthetic room photo (same style-matched photo from the creation flow — read from URL params to pick the right one)

### Left Panel Content

**Header:**
- "STEP 3 OF 3" — DM Mono step indicator + progress bars (same as creation flow)
- H2: "Here's what we'll make" — DM Sans Bold, 22px
- Subtitle: style name in a small pill badge (e.g., `Mid Century Modern`)

**Loading state:**
- Center the spinner in the left panel (not full-screen)
- Text: "Generating descriptions…" — DM Sans, muted

**Auth gate:**
- Show inline in left panel (not full-screen takeover)
- Compact: "Sign in to continue" + Google sign-in button

**Description accordion** (when loaded):
- Each piece is a card: `rounded-xl border border-[--color-border] bg-white p-4`
- Collapsed: shows piece title + one-line truncated description, chevron right
- Expanded (first one by default): shows full description, editable textarea inline, `Save` link below textarea
- Click anywhere on collapsed card to expand; click expanded header to collapse
- Only one card expanded at a time

**Feedback section** (below accordion):
- Label: "Want something different?" — DM Sans 500, 14px
- Textarea: same styling as current but tighter
- "Regenerate All" — secondary button

**CTA:**
- "Generate Images →" — Full-width primary orange button, `py-3.5`, `mt-6`
- Disabled + spinner overlay when generating

### Error state

Small red banner below the step indicator, not full-width replacement.

---

## Page: Wall Result (`/wall/[id]`)

**Reference:** Pencil wireframe node `YaTp4` (right screen)

### Layout

Full-bleed, dark, two-zone:

```
<div class="min-h-screen bg-[--color-dark]">
  <!-- Zone 1: Hero wall render + controls bar -->
  <!-- Zone 2: Pieces strip + detail panel -->
</div>
```

**Zone 1 — Hero render:**
- Navbar (dark, same as everywhere — already fixed)
- Wall render image: `max-h-[520px]` centered, `object-cover`, `rounded-2xl mx-auto` with `mt-20` to clear navbar
- Interactive piece dots overlay (existing logic, same behavior — redesign the dots/popover)
- **Dot redesign:** `w-3 h-3 rounded-full bg-primary border-2 border-white shadow-md`
- **Popover redesign:** white card, `rounded-xl shadow-lg p-4 w-52`, piece title bold + links as orange text underlines

**Controls bar** (below wall render, above pieces strip):
- `flex gap-3 justify-end` row with `py-3`
- "Regenerate Selected" — secondary button, shows count badge if >0 selected
- "Update Wall Render" — secondary button
- "Finalize Wall" — primary orange button (or green if already finalized — show ✓ Finalized badge instead)
- Regeneration count: small muted label `N regenerations used`

**Zone 2 — Pieces strip:**
- Horizontal scroll row: `flex gap-4 overflow-x-auto pb-4`
- Each piece thumbnail: `w-40 h-40 rounded-xl object-cover cursor-pointer`
- Selected: orange ring `ring-2 ring-[--color-primary]`
- Below thumbnail: piece title (truncated, 12px, light text)
- Version nav arrows (`←` / `→`) if `pieceVersions[i].length > 1`
- Clicking a piece opens the **Detail panel**

**Detail panel** (right side, fixed column — always visible when a piece is selected):
- Fixed right column `w-80`, shown when a piece is clicked; hidden when none selected
- Dark card: `bg-[--color-dark-secondary] rounded-2xl p-6 text-text-light`
- Piece title: DM Sans Bold, 18px
- Description: DM Sans 400, 13px, muted
- Medium + dimensions: DM Mono, 12px, label-value pairs
- Shopping links section: "Get This Piece" heading, then links as orange buttons/text links

**Retry section:**
- Below the pieces strip, full-width
- "Not what you wanted?" text + "Start Over" ghost button (white outlined)
- Clicking shows feedback textarea + Regenerate button (existing `handleRetry` logic)

**Finalized state:**
- Replace controls bar with `✓ Your wall is finalized` badge, green
- Pieces remain viewable/clickable for shopping links

---

## Files Changed

| File | Change |
|---|---|
| `frontend/src/app/globals.css` | New color tokens, fonts, base styles |
| `frontend/src/app/layout.tsx` | Load DM Sans + DM Mono via `next/font/google` |
| `frontend/src/components/Navbar.tsx` | Full redesign — dark slate |
| `frontend/src/components/WizardSplitLayout.tsx` | New component — split-screen shell replacing WizardLayout in create + generate |
| `frontend/src/components/WizardLayout.tsx` | Deleted — superseded by WizardSplitLayout |
| `frontend/src/lib/stylePhotos.ts` | New file — Unsplash photo map per style |
| `frontend/src/app/page.tsx` | Landing page redesign |
| `frontend/src/app/create/page.tsx` | Wire `WizardSplitLayout`, pass photo per step |
| `frontend/src/components/StyleCard.tsx` | Redesign |
| `frontend/src/components/ColorSchemeSelector.tsx` | Pill chip redesign |
| `frontend/src/components/FrameMaterialSelector.tsx` | Pill chip redesign |
| `frontend/src/components/RoomContextForm.tsx` | Pill chip + clean input redesign |
| `frontend/src/app/generate/page.tsx` | Split-screen + accordion descriptions |
| `frontend/src/components/DescriptionCard.tsx` | Accordion pattern |
| `frontend/src/app/wall/[id]/page.tsx` | Full-bleed dark redesign |
| `frontend/src/components/PieceGallery.tsx` | Horizontal strip + detail panel |

---

## What Does NOT Change

- All backend API calls and data flow
- Route structure (`/`, `/create`, `/generate`, `/wall/[id]`)
- Auth logic (`useAuth`, `AuthButton` behavior)
- All state management hooks (`useCreationWizard`)
- Admin pages (`/admin/usage`, `/history`) — styled separately in a follow-up
- Error boundaries and loading states (logic unchanged, only visual treatment updated)

---

## Testing

- `npm run build` must pass with 0 errors after each phase
- Visual review via `npm run dev` after each page is complete
- Backend tests (`cd backend && npm test`) must remain green — no backend changes
- No new frontend unit tests added (existing policy: build validation only for frontend)
