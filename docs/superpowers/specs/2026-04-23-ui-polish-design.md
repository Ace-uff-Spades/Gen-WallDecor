# UI Polish — Design Spec

> Date: 2026-04-23
> Status: Approved

---

## Scope

Three work items from the open backlog:

1. **Landing page rebuild** — full-bleed single-viewport, navy design system, wireframe-faithful
2. **Creation flow visual polish** — no layout restructuring; style tag overlay, progress bar, typography/spacing
3. **Right panel photos** — Unsplash curation pass for hero + 20 style photos

---

## 1. Landing Page Rebuild

### Constraints
- **Single viewport, no scrolling** — all content fits in `100vh - 3.5rem` (below existing Navbar)
- **Navy design system** — `#1B3A5C` primary, `#2E6DA4` / `#7BB8E0` accent. Does not affect the rest of the app (creation flow stays orange from Phase 15)
- Existing `Navbar` component is unchanged and sits above the hero

### Layout
Full-bleed hero photo fills the entire viewport below the navbar. All content is overlaid via absolute positioning.

```
┌─────────────────────────────────┐
│  Navbar (existing, 3.5rem)       │
├─────────────────────────────────┤
│                                 │
│  [room photo — full bleed]      │
│  [gradient overlay top→bottom]  │
│                                 │
│  Eyebrow + H1 + Subtitle + CTA  │  ← top half, left-aligned
│                                 │
│                                 │
│  01 Style · 02 Describe · 03 Wall│  ← bottom, left-aligned step pills
└─────────────────────────────────┘
```

### Hero Photo
- **URL**: `https://images.unsplash.com/photo-1724582586529-62622e50c0b3`
- Params: `?auto=format&fit=crop&w=1800&q=85`
- Credit: Prydumano Design / Unsplash (free license)

### Gradient Overlay
```css
background: linear-gradient(
  to bottom,
  rgba(8,18,32,0.30) 0%,
  rgba(8,18,32,0.20) 30%,
  rgba(8,18,32,0.45) 70%,
  rgba(8,18,32,0.75) 100%
);
```

### Content
**Eyebrow** — `"AI Wall Decor"` — `font-mono`, `10px`, `tracking-widest`, `uppercase`, `text-white/50`

**Headline** — two lines:
- Line 1: `"Design Your"` — `white`, `font-bold`, `~52px`, `tracking-tight`
- Line 2: `"Perfect Wall"` — `#7BB8E0` (light blue accent)

**Subtitle** — `"AI-powered wall decor that matches your style."` — `text-white/60`, `15px`, max-width `380px`

**CTA Button** — `"Start Creating →"` — `bg-[#1B3A5C]`, `text-white`, `rounded-full`, `px-7 py-3`, `font-bold`, box-shadow for depth. Links to `/create`.

### Step Pills (bottom of hero)
Three frosted glass pills, left-aligned, pinned to bottom of hero:
```
[ 01  Style ]  ·  [ 02  Describe ]  ·  [ 03  Your Wall ]
```
- Background: `rgba(255,255,255,0.10)`
- Border: `1px solid rgba(255,255,255,0.18)`
- Number: `font-mono`, muted white
- Label: `font-semibold`, white
- Pills are non-interactive (display only)

### Removed
- The current "How It Works" section (white bg, 3-card grid) — replaced by the step pills
- The current dark CTA strip at the bottom — replaced by the CTA button inline in the hero

---

## 2. Creation Flow Visual Polish

Applies to: `create/page.tsx` (wizard steps 1–3), `generate/page.tsx` (step 4/5). No layout restructuring — `WizardSplitLayout.tsx` structure is unchanged.

### 2a. Top Progress Bar
- Replace the current step dots (`h-0.5` segments inside left panel) with a **3px full-width progress bar** at the very top of the page
- Rendered as the first child in `WizardSplitLayout`, **above** the `<div className="flex">` split container so it spans both left and right panels
- Color: `bg-primary` (orange, keeps Phase 15 tokens) for completed portion; `bg-border` for remainder
- Exact wireframe spec: `height: 3px`, `width: 100%`

### 2b. Right Panel Style Tag
- Add an optional `styleName?: string` prop to `WizardSplitLayout`
- When provided and non-empty, overlay a frosted glass pill in the **top-left of the photo panel**
- Only `create/page.tsx` passes this prop — `generate/page.tsx` omits it
- Style: `bg-white/80 backdrop-blur-sm`, `rounded-full`, `px-4 py-2`, `text-sm font-medium text-text`
- Positioned: `absolute top-6 left-6` within the right panel div
- Content: active style name from wizard state (e.g. `"Minimalist"`)

### 2c. Typography + Spacing
- Step heading (`text-[22px] font-bold`) → increase to `text-2xl` with `tracking-tight`
- Step indicator monospace label: add `font-semibold` for slightly more weight
- Left panel padding: keep `px-10 py-8`, but add `gap-8` between title and form content for breathing room
- Card shadows on `StyleCard`, `ColorSchemeSelector` chips: slightly heavier (`shadow-md` → `shadow-lg` or a custom shadow token)

### 2d. DescriptionCard Accordion (generate page)
- Expanded state border: increase contrast — `border-primary/40` → `border-primary/60`
- Collapsed state: improve visual hierarchy — use `bg-surface` with `opacity-75` to visually recede
- Inline edit affordance: add a subtle pencil icon on hover for editable text fields

---

## 3. Right Panel Photos — Unsplash Curation

### Hero Photo
Already decided: `photo-1724582586529-62622e50c0b3` (see Section 1).

### Style Photos (`stylePhotos.ts`)
Each of the 20 style keys needs a real Unsplash photo ID. Requirements per photo:
- Matches the aesthetic of the style name (e.g. Bohemian = layered textiles, eclectic decor)
- Shows a full room (not just a detail or product shot)
- Bright enough to read the style tag overlay on top
- Free license (not `plus.unsplash.com/premium_photo-*`)

Styles to cover: `Transitional`, `Traditional`, `Modern`, `Eclectic`, `Contemporary`, `Minimalist`, `Mid Century Modern`, `Bohemian`, `Modern Farmhouse`, `Shabby Chic`, `Coastal`, `Hollywood Glam`, `Southwestern`, `Rustic`, `Industrial`, `French Country`, `Scandinavian`, `Mediterranean`, `Art Deco`, `Asian Zen`, plus `default`.

Curation process: search Unsplash for each style, verify the photo loads and matches, record the numeric CDN photo ID (format: `photo-XXXXXXXXXXXXXXXXXX`).

---

## What's Not In Scope

- Admin pages (`/admin/usage`, `/history`) — still deferred
- Navbar changes
- Generation pipeline changes
- Wall result page (`wall/[id]/page.tsx`) — already done in Phase 15
- Any backend changes

---

## Files Affected

| File | Change |
|------|--------|
| `frontend/src/app/page.tsx` | Full rewrite — new single-viewport hero |
| `frontend/src/lib/stylePhotos.ts` | All 20 + default photo IDs replaced |
| `frontend/src/components/WizardSplitLayout.tsx` | Add top progress bar + style tag prop |
| `frontend/src/app/create/page.tsx` | Pass style name to WizardSplitLayout |
| `frontend/src/app/generate/page.tsx` | Typography/spacing polish, accordion tweaks |
| `frontend/src/components/DescriptionCard.tsx` | Expanded/collapsed state refinements |
