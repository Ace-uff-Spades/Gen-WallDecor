# Design Spec: Prompt Descriptions & Wall Result Screens
**Date:** 2026-04-21
**Status:** Approved

---

## Overview

Two new Pencil mockup screens to extend the Creation Flow in `landing-design.pen`:

- **Screen 5 — Prompt Descriptions** (`Step 5 - Descriptions`): Review & edit AI-generated piece descriptions before image generation
- **Screen 6 — Wall Result** (`Step 6 - Wall Result`): Full-bleed result page showing the generated wall render and individual pieces

Both screens follow the same design language as the existing Creation Flow (DM Sans, DM Mono, `#E55722` orange, `#FAFAF9` background, `#0C0C0C` headings, `#7A746C` subtitles).

---

## Screen 5 — Prompt Descriptions

### Layout
Split-screen, 1440×900px. Identical skeleton to Steps 1–4.

### Left Panel (520px)
- **Progress bar** (top, full width): fills to 5/6 — `#E55722` on `#E8E3DD`
- **Top bar (64px):** logo left · `STEP 5 OF 6` right (DM Mono 11px, `#9B958D`, letter-spacing 1.5)
- **Content area (scrollable, 760px):**
  - Heading: `"Here's what we'll make"` — DM Sans 32px bold, `#0C0C0C`
  - Subtitle: `"Review each piece. Tap to expand and edit."` — DM Sans 15px, `#7A746C`, line-height 1.6
  - **Accordion piece list** — one row per piece:
    - **Collapsed state:** orange `●` dot + piece number, bold title, then `medium · dimensions · placement` pills (`#E8E3DD` bg, `#7A746C` text), chevron right
    - **Expanded state:** description body text, inline edit fields for title / description / medium / dimensions / placement, "Save" button (`#E55722`) + "Cancel" text link
  - **"Not feeling it?" section** (below list): small label, 2-row textarea, ghost "Regenerate All" button (`#E8E3DD` bg)
- **Bottom bar (57px):** `"Generate Images →"` CTA (orange pill, `#E55722`) · `"↵ Or press Enter"` hint (`#9B958D`, DM Sans 13px)

### Right Panel (920px)
- Full-bleed room illustration matching the aesthetic chosen in Step 1 (same image source as Step 1 right panel)
- Top-left frosted tag: `● Modern` (or selected style) — white bg `#FFFFFFCC`, `cornerRadius: 100`, DM Sans 13px bold
- Bottom-left frosted label: `"✦ Your aesthetic, your pieces"` — dark bg `#00000066`, white text, DM Sans 12px

---

## Screen 6 — Wall Result

### Layout
**Full-bleed — breaks the split-screen pattern.** Three stacked zones, 1440×900px total.

### Zone 1 — Hero Wall Render (~500px tall)
- Wall render image: full width, edge-to-edge, object-cover
- **Overlaid top bar:** logo left · `"✦ Your Wall · Modern"` center (DM Mono 11px, white) · download icon + `"Finalize"` pill button right (white bg, dark text)
- **Bottom-left frosted hint pill:** `"✦ Click any piece to explore"` — dark bg `#00000066`, white text, DM Sans 12px

**Selected piece state** (when a thumbnail is clicked in Zone 2):
- Wall render image is replaced by the selected piece image (full-width hero, same zone height)
- Bottom frosted card overlaid: piece title (DM Sans 18px bold, white) + shopping link pills: `"Buy a frame"` · `"Print this poster"` · `"Buy this piece"` (white bg, `#0C0C0C` text, `cornerRadius: 100`)
- Top-left: `"← Back to wall"` text link (white, DM Sans 13px)

### Zone 2 — Pieces Strip (~220px tall, `#FAFAF9` bg)
- Horizontal row of square thumbnail cards (~180px each), gentle horizontal scroll if overflow
- Each card: thumbnail image (square, `cornerRadius: 8`), piece title below (DM Sans 13px bold), `placement` pill below that (`#E8E3DD` bg)
- **Selected state:** `#E55722` border ring (2px), slight scale-up (`transform: scale(1.04)`)
- Section label top-left: `"Individual Pieces"` — DM Sans 16px bold, `#0C0C0C`

### Zone 3 — Actions Bar (~80px tall, white bg, border-top `#E8E3DD`)
- **Left:** `"Regenerate Selected (N)"` — orange button (`#E55722`, white text), disabled/dimmed when N=0
- **Center:** `"Update Wall Render"` — ghost button (`#E8E3DD` bg, `#0C0C0C` text)
- **Right:** `"Retry with Changes"` — text link (`#7A746C`) → expands inline feedback textarea + `"Regenerate"` button

---

## Placement in Pencil

Both screens are added to the `Creation Flow` frame (`BrbH5`) inside `Frame 1` (`Z4Dus`) in `landing-design.pen`:

- **Step 5 - Descriptions:** x≈6240, y=120 (1540px gap after Step 4 at x=4700)
- **Step 6 - Wall Result:** x≈7780, y=120

---

## Data Notes (from codebase)

Each piece description has: `title`, `description`, `medium`, `dimensions`, `placement` — sourced from `DescriptionCard.tsx`.

The wall result data has: `wallRenderUrl`, `pieces[].imageUrl`, `pieces[].title`, `pieces[].placement`, `pieces[].type`, `pieces[].links` (frameUrl, printUrl, objectUrl, mountingUrls) — sourced from `wall/[id]/page.tsx`.
