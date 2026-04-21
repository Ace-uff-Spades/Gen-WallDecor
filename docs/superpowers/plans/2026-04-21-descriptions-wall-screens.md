# Descriptions & Wall Result Screens — Pencil Mockup Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new screens — "Step 5 - Descriptions" and "Step 6 - Wall Result" — to the Creation Flow in `landing-design.pen`.

**Architecture:** Both screens are added as child frames of the existing `Creation Flow` frame (`BrbH5`) inside `Frame 1` (`Z4Dus`). Screen 5 follows the established 520/920 left/right split-screen pattern. Screen 6 breaks the pattern with a full-bleed three-zone layout. Parent frames are widened to accommodate the new screens.

**Tech Stack:** Pencil MCP (`batch_design`, `batch_get`, `get_screenshot`). No code changes.

---

## Key IDs and Constants

| Symbol | Value | Notes |
|--------|-------|-------|
| `BrbH5` | Creation Flow frame | Parent for new screens — needs width update |
| `Z4Dus` | Frame 1 | Top-level frame — needs width update |
| `4mCAS` | Step 1 - Style | Source for logo copy + room image reference |
| `QqIyL` | Step 1 left-panel | Source for top-bar structure copy |
| `KPQik` | Step 1 right-panel | Source for right-panel image node copy |
| `zHJo0` | Step 1 logo frame | Copy into new top bars |
| `3ANv0` | Step 1 top-bar | Copy as base for Step 5 top bar |
| Step 5 x | `6240` | 4700 + 1440 + 100 |
| Step 6 x | `7780` | 6240 + 1440 + 100 |
| Progress 5/6 | `1200` | Math.round(5/6 × 1440) |
| Room image | `./images/generated-1776132010883.png` | Same as Step 1 right panel |
| Wall render placeholder | `./images/generated-1776132236094.png` | Placeholder; matches Step 4 mood |
| Piece images | `./images/generated-1776132092539.png`, `./images/generated-1776132169888.png`, `./images/generated-1776132268039.png` | 3 placeholder piece thumbnails |

---

## File Structure

**Modified:** `landing-design.pen`
- `BrbH5` (Creation Flow): width 6500 → 9400
- `Z4Dus` (Frame 1): width 8278 → 10700
- New frame `Step 5 - Descriptions` (1440×900, child of BrbH5, x=6240)
- New frame `Step 6 - Wall Result` (1440×900, child of BrbH5, x=7780)

---

## Task 1: Expand parent frames + scaffold both screen frames

**Files:** `landing-design.pen`

- [ ] **Step 1: Widen the Creation Flow and Frame 1 containers**

```
U("BrbH5", { width: 9400 })
U("Z4Dus", { width: 10700 })
```

- [ ] **Step 2: Verify widths updated**

Call `batch_get` with nodeIds `["BrbH5", "Z4Dus"]`, readDepth 1. Confirm `BrbH5.width === 9400` and `Z4Dus.width === 10700`.

- [ ] **Step 3: Create the Step 5 frame**

```
step5=I("BrbH5", { type: "frame", name: "Step 5 - Descriptions", x: 6240, y: 120, width: 1440, height: 900, fill: "#FAFAF9", clip: true, layout: "none" })
```

- [ ] **Step 4: Create the Step 6 frame**

```
step6=I("BrbH5", { type: "frame", name: "Step 6 - Wall Result", x: 7780, y: 120, width: 1440, height: 900, fill: "#FFFFFF", clip: true, layout: "none" })
```

- [ ] **Step 5: Take a screenshot to verify both frames appear in the canvas**

Call `get_screenshot`. Confirm Step 5 and Step 6 frames are visible to the right of Step 4.

- [ ] **Step 6: Read back new frame IDs for use in later tasks**

Call `batch_get` with patterns `[{ name: "Step 5 - Descriptions" }, { name: "Step 6 - Wall Result" }]`, searchDepth 2. Record the IDs — you'll need them as parent IDs in Tasks 2–7. Call these `STEP5_ID` and `STEP6_ID`.

- [ ] **Step 7: Commit**

```bash
git add landing-design.pen
git commit -m "design: scaffold Step 5 and Step 6 frames in Creation Flow"
```

---

## Task 2: Step 5 — left panel structure (progress bar, top bar, content frame, bottom bar)

**Files:** `landing-design.pen` — inside `STEP5_ID`

> Use STEP5_ID from Task 1 Step 6 as the parent for all inserts in this task.

- [ ] **Step 1: Create the left panel container**

```
s5left=I("STEP5_ID", { type: "frame", name: "s5-left", x: 0, y: 3, width: 520, height: 897, fill: "#FFFFFF", clip: true, layout: "none" })
```

- [ ] **Step 2: Add progress bar track and fill**

```
I(s5left, { type: "rectangle", name: "s5-pb-bg", x: 0, y: 0, width: 1440, height: 3, fill: "#E8E3DD" })
I(s5left, { type: "rectangle", name: "s5-pb-fill", x: 0, y: 0, width: 1200, height: 3, fill: "#E55722" })
```

Note: progress bar is 1440px wide (bleeds to full screen width) even though it lives inside the 520px left panel — same pattern as Steps 1–4.

- [ ] **Step 3: Copy Step 1 top-bar as the Step 5 top bar base**

```
s5topbar=C("3ANv0", s5left, { name: "s5-top-bar", y: 0 })
```

- [ ] **Step 4: Update the step label text inside the copied top bar**

Call `batch_get` with nodeIds `[s5topbar]`, readDepth 2 to find the step label text node (it will be the `text` node with content "STEP 4 OF 4" or "STEP 1 OF 4"). Update it:

```
U("FOUND_STEP_LABEL_ID", { content: "STEP 5 OF 6" })
```

- [ ] **Step 5: Create the content area frame**

```
s5content=I(s5left, { type: "frame", name: "s5-content", x: 0, y: 64, width: 520, height: 716, layout: "vertical", gap: 20, padding: [48, 40, 24, 40], clip: true })
```

- [ ] **Step 6: Add heading and subtitle to content area**

```
I(s5content, { type: "text", name: "s5-heading", content: "Here's what we'll make", fontFamily: "DM Sans", fontSize: 32, fontWeight: "700", fill: "#0C0C0C", lineHeight: 1.2, textGrowth: "fixed-width", width: "fill_container" })
I(s5content, { type: "text", name: "s5-subtitle", content: "Review each piece. Tap to expand and edit.", fontFamily: "DM Sans", fontSize: 15, fontWeight: "normal", fill: "#7A746C", lineHeight: 1.6, textGrowth: "fixed-width", width: "fill_container" })
```

- [ ] **Step 7: Create the bottom bar**

```
s5btm=I(s5left, { type: "frame", name: "s5-btm", x: 0, y: 780, width: 520, height: 117, fill: "#FFFFFF", layout: "vertical", gap: 12, padding: [16, 40, 24, 40] })
```

- [ ] **Step 8: Add CTA button and hint text to bottom bar**

```
s5btn=I(s5btm, { type: "frame", name: "s5-cta-btn", layout: "horizontal", alignItems: "center", justifyContent: "center", cornerRadius: 10, fill: "#E55722", padding: [16, 0], width: "fill_container", gap: 8 })
I(s5btn, { type: "text", content: "Generate Images →", fontFamily: "DM Sans", fontSize: 16, fontWeight: "700", fill: "#FFFFFF" })
I(s5btm, { type: "text", name: "s5-enter-hint", content: "Takes about 60 seconds · Powered by AI", fontFamily: "DM Sans", fontSize: 12, fontWeight: "normal", fill: "#9B958D", textAlign: "center", textGrowth: "fixed-width", width: "fill_container" })
```

- [ ] **Step 9: Screenshot to verify left panel shell**

Call `get_screenshot`. Confirm: white left panel, orange progress bar (~83% filled), top bar with "STEP 5 OF 6", heading, orange CTA at bottom.

---

## Task 3: Step 5 — accordion piece list + feedback section

**Files:** `landing-design.pen` — inside `s5content` (from Task 2)

> Get `s5content`'s ID via `batch_get` with pattern `{ name: "s5-content" }` inside STEP5_ID before starting.

- [ ] **Step 1: Create accordion container frame**

```
s5accordion=I("S5CONTENT_ID", { type: "frame", name: "s5-accordion", layout: "vertical", gap: 8, width: "fill_container" })
```

- [ ] **Step 2: Add Piece 1 — expanded state**

```
p1=I(s5accordion, { type: "frame", name: "piece-1-expanded", layout: "vertical", gap: 12, cornerRadius: 8, fill: "#FFFFFF", stroke: { fill: "#E55722", thickness: 2, align: "outside" }, padding: [16, 16], width: "fill_container" })
p1header=I(p1, { type: "frame", name: "p1-header", layout: "horizontal", alignItems: "center", justifyContent: "space_between", width: "fill_container" })
p1headerLeft=I(p1header, { type: "frame", layout: "horizontal", alignItems: "center", gap: 8 })
I(p1headerLeft, { type: "ellipse", fill: "#E55722", width: 8, height: 8 })
I(p1headerLeft, { type: "text", content: "PIECE 1", fontFamily: "DM Mono", fontSize: 11, fontWeight: "500", fill: "#E55722", letterSpacing: 1.5 })
I(p1header, { type: "text", content: "∧ Collapse", fontFamily: "DM Sans", fontSize: 12, fontWeight: "normal", fill: "#9B958D" })
I(p1, { type: "text", name: "p1-title", content: "Abstract Flow", fontFamily: "DM Sans", fontSize: 18, fontWeight: "700", fill: "#0C0C0C", textGrowth: "fixed-width", width: "fill_container" })
I(p1, { type: "text", name: "p1-desc", content: "A sweeping composition of layered translucent forms in muted terracotta and warm ivory, evoking slow movement and organic balance.", fontFamily: "DM Sans", fontSize: 13, fontWeight: "normal", fill: "#7A746C", lineHeight: 1.6, textGrowth: "fixed-width", width: "fill_container" })
p1pills=I(p1, { type: "frame", layout: "horizontal", gap: 8, width: "fill_container" })
p1pill1=I(p1pills, { type: "frame", layout: "horizontal", cornerRadius: 100, fill: "#F0EDE8", padding: [4, 10] })
I(p1pill1, { type: "text", content: "Oil on canvas", fontFamily: "DM Sans", fontSize: 12, fill: "#7A746C" })
p1pill2=I(p1pills, { type: "frame", layout: "horizontal", cornerRadius: 100, fill: "#F0EDE8", padding: [4, 10] })
I(p1pill2, { type: "text", content: "24 × 36 in", fontFamily: "DM Sans", fontSize: 12, fill: "#7A746C" })
p1pill3=I(p1pills, { type: "frame", layout: "horizontal", cornerRadius: 100, fill: "#F0EDE8", padding: [4, 10] })
I(p1pill3, { type: "text", content: "Center wall", fontFamily: "DM Sans", fontSize: 12, fill: "#7A746C" })
p1editRow=I(p1, { type: "frame", layout: "horizontal", justifyContent: "flex_end", width: "fill_container" })
p1saveBtn=I(p1editRow, { type: "frame", layout: "horizontal", cornerRadius: 8, fill: "#E55722", padding: [8, 16] })
I(p1saveBtn, { type: "text", content: "Save", fontFamily: "DM Sans", fontSize: 13, fontWeight: "600", fill: "#FFFFFF" })
p1cancelBtn=I(p1editRow, { type: "frame", layout: "horizontal", cornerRadius: 8, padding: [8, 12] })
I(p1cancelBtn, { type: "text", content: "Cancel", fontFamily: "DM Sans", fontSize: 13, fill: "#9B958D" })
```

- [ ] **Step 3: Add Piece 2 — collapsed state**

```
p2=I(s5accordion, { type: "frame", name: "piece-2-collapsed", layout: "horizontal", alignItems: "center", justifyContent: "space_between", cornerRadius: 8, fill: "#FFFFFF", stroke: { fill: "#E5E0D8", thickness: 1, align: "outside" }, padding: [14, 16], width: "fill_container", gap: 12 })
p2left=I(p2, { type: "frame", layout: "horizontal", alignItems: "center", gap: 10 })
I(p2left, { type: "ellipse", fill: "#E55722", width: 8, height: 8 })
I(p2left, { type: "text", content: "Urban Geometry", fontFamily: "DM Sans", fontSize: 14, fontWeight: "700", fill: "#0C0C0C" })
p2pills=I(p2, { type: "frame", layout: "horizontal", gap: 6 })
p2p1=I(p2pills, { type: "frame", layout: "horizontal", cornerRadius: 100, fill: "#F0EDE8", padding: [3, 8] })
I(p2p1, { type: "text", content: "Photography", fontFamily: "DM Sans", fontSize: 11, fill: "#7A746C" })
p2p2=I(p2pills, { type: "frame", layout: "horizontal", cornerRadius: 100, fill: "#F0EDE8", padding: [3, 8] })
I(p2p2, { type: "text", content: "18 × 24 in", fontFamily: "DM Sans", fontSize: 11, fill: "#7A746C" })
p2p3=I(p2pills, { type: "frame", layout: "horizontal", cornerRadius: 100, fill: "#F0EDE8", padding: [3, 8] })
I(p2p3, { type: "text", content: "Left accent", fontFamily: "DM Sans", fontSize: 11, fill: "#7A746C" })
I(p2, { type: "text", content: "›", fontFamily: "DM Sans", fontSize: 18, fill: "#9B958D" })
```

- [ ] **Step 4: Add Piece 3 — collapsed state**

```
p3=I(s5accordion, { type: "frame", name: "piece-3-collapsed", layout: "horizontal", alignItems: "center", justifyContent: "space_between", cornerRadius: 8, fill: "#FFFFFF", stroke: { fill: "#E5E0D8", thickness: 1, align: "outside" }, padding: [14, 16], width: "fill_container", gap: 12 })
p3left=I(p3, { type: "frame", layout: "horizontal", alignItems: "center", gap: 10 })
I(p3left, { type: "ellipse", fill: "#E55722", width: 8, height: 8 })
I(p3left, { type: "text", content: "Botanical Dreams", fontFamily: "DM Sans", fontSize: 14, fontWeight: "700", fill: "#0C0C0C" })
p3pills=I(p3, { type: "frame", layout: "horizontal", gap: 6 })
p3p1=I(p3pills, { type: "frame", layout: "horizontal", cornerRadius: 100, fill: "#F0EDE8", padding: [3, 8] })
I(p3p1, { type: "text", content: "Watercolour", fontFamily: "DM Sans", fontSize: 11, fill: "#7A746C" })
p3p2=I(p3pills, { type: "frame", layout: "horizontal", cornerRadius: 100, fill: "#F0EDE8", padding: [3, 8] })
I(p3p2, { type: "text", content: "12 × 16 in", fontFamily: "DM Sans", fontSize: 11, fill: "#7A746C" })
p3p3=I(p3pills, { type: "frame", layout: "horizontal", cornerRadius: 100, fill: "#F0EDE8", padding: [3, 8] })
I(p3p3, { type: "text", content: "Right corner", fontFamily: "DM Sans", fontSize: 11, fill: "#7A746C" })
I(p3, { type: "text", content: "›", fontFamily: "DM Sans", fontSize: 18, fill: "#9B958D" })
```

- [ ] **Step 5: Add "Not feeling it?" feedback section below accordion**

```
s5feedback=I("S5CONTENT_ID", { type: "frame", name: "s5-feedback", layout: "vertical", gap: 10, cornerRadius: 12, fill: "#F5F2EE", stroke: { fill: "#E5E0D8", thickness: 1, align: "outside" }, padding: [16, 16], width: "fill_container" })
I(s5feedback, { type: "text", content: "Not feeling it?", fontFamily: "DM Sans", fontSize: 13, fontWeight: "600", fill: "#0C0C0C" })
s5ta=I(s5feedback, { type: "frame", name: "s5-textarea", cornerRadius: 8, fill: "#FFFFFF", stroke: { fill: "#E5E0D8", thickness: 1, align: "outside" }, padding: [10, 12], width: "fill_container", height: 56 })
I(s5ta, { type: "text", content: "e.g. Make them more colourful, add abstract pieces...", fontFamily: "DM Sans", fontSize: 13, fill: "#9B958D" })
s5regenBtn=I(s5feedback, { type: "frame", layout: "horizontal", cornerRadius: 8, fill: "#E8E3DD", padding: [8, 14] })
I(s5regenBtn, { type: "text", content: "Regenerate All", fontFamily: "DM Sans", fontSize: 13, fontWeight: "500", fill: "#0C0C0C" })
```

- [ ] **Step 6: Screenshot to verify accordion + feedback section**

Call `get_screenshot`. Confirm: Piece 1 expanded with orange border and description text, Pieces 2–3 collapsed with pills and "›" chevron, feedback section at bottom.

---

## Task 4: Step 5 — right panel

**Files:** `landing-design.pen` — inside STEP5_ID

- [ ] **Step 1: Create right panel container**

```
s5right=I("STEP5_ID", { type: "frame", name: "s5-right", x: 520, y: 3, width: 920, height: 897, fill: "#EDE8E2", clip: true, layout: "none" })
```

- [ ] **Step 2: Add room image**

```
I(s5right, { type: "frame", name: "s5-room-img", x: 0, y: 0, width: 920, height: 897, fill: { enabled: true, mode: "fill", type: "image", url: "./images/generated-1776132010883.png" }, clip: true, layout: "none" })
```

- [ ] **Step 3: Add style tag (top-left frosted pill)**

```
s5tag=I(s5right, { type: "frame", name: "s5-style-tag", x: 40, y: 40, layout: "horizontal", alignItems: "center", gap: 8, cornerRadius: 100, fill: "#FFFFFFCC", padding: [10, 16] })
I(s5tag, { type: "ellipse", fill: "#E55722", width: 8, height: 8 })
I(s5tag, { type: "text", content: "Modern", fontFamily: "DM Sans", fontSize: 13, fontWeight: "600", fill: "#0C0C0C" })
```

- [ ] **Step 4: Add bottom hint label**

```
s5hint=I(s5right, { type: "frame", name: "s5-hint", x: 40, y: 825, layout: "horizontal", cornerRadius: 12, fill: "#00000066", padding: [12, 16] })
I(s5hint, { type: "text", content: "✦ Your aesthetic, your pieces", fontFamily: "DM Sans", fontSize: 12, fontWeight: "500", fill: "#FFFFFF" })
```

- [ ] **Step 5: Add vertical divider between panels**

```
I("STEP5_ID", { type: "rectangle", name: "s5-divider", x: 520, y: 3, width: 1, height: 897, fill: "#E5E0D8" })
```

- [ ] **Step 6: Screenshot to verify full Step 5 screen**

Call `get_screenshot`. Confirm: complete split-screen — left panel with accordion, right panel with room photo, style tag, and hint label.

- [ ] **Step 7: Commit**

```bash
git add landing-design.pen
git commit -m "design: add Step 5 Descriptions screen to Creation Flow mockup"
```

---

## Task 5: Step 6 — Zone 1 (hero wall render + overlaid top bar)

**Files:** `landing-design.pen` — inside STEP6_ID

> Use STEP6_ID from Task 1 Step 6.

- [ ] **Step 1: Create Zone 1 frame (wall render container)**

```
z1=I("STEP6_ID", { type: "frame", name: "s6-zone1", x: 0, y: 0, width: 1440, height: 520, fill: "#0C0C0C", clip: true, layout: "none" })
```

- [ ] **Step 2: Add wall render image**

```
I(z1, { type: "frame", name: "s6-wall-render", x: 0, y: 0, width: 1440, height: 520, fill: { enabled: true, mode: "fill", type: "image", url: "./images/generated-1776132236094.png" }, clip: true, layout: "none" })
```

- [ ] **Step 3: Add gradient overlay at bottom of Zone 1**

```
s6overlay=I(z1, { type: "frame", name: "s6-overlay", x: 0, y: 360, width: 1440, height: 160, fill: { enabled: true, type: "gradient", gradientType: "linear", rotation: 180, colors: [{ color: "#00000000", position: 0 }, { color: "#000000AA", position: 1 }], size: { height: 1 } }, layout: "none" })
```

- [ ] **Step 4: Add overlaid top bar on Zone 1**

```
s6topbar=I(z1, { type: "frame", name: "s6-topbar", x: 0, y: 0, width: 1440, height: 64, fill: "#00000033", layout: "horizontal", alignItems: "center", justifyContent: "space_between", padding: [0, 40] })
s6logoArea=I(s6topbar, { type: "frame", layout: "horizontal", alignItems: "center", gap: 8 })
I(s6logoArea, { type: "text", content: "✦", fontFamily: "DM Sans", fontSize: 18, fontWeight: "700", fill: "#E55722" })
I(s6logoArea, { type: "text", content: "GenWallDecor", fontFamily: "DM Sans", fontSize: 14, fontWeight: "700", fill: "#FFFFFF" })
I(s6topbar, { type: "text", content: "✦  Your Wall · Modern", fontFamily: "DM Mono", fontSize: 11, fontWeight: "500", fill: "#FFFFFFCC", letterSpacing: 1.5 })
s6topRight=I(s6topbar, { type: "frame", layout: "horizontal", alignItems: "center", gap: 12 })
s6finalizeBtn=I(s6topRight, { type: "frame", layout: "horizontal", cornerRadius: 8, fill: "#FFFFFF", padding: [8, 16] })
I(s6finalizeBtn, { type: "text", content: "Finalize Wall", fontFamily: "DM Sans", fontSize: 13, fontWeight: "600", fill: "#0C0C0C" })
```

- [ ] **Step 5: Add "Click any piece" hint pill at bottom-left of Zone 1**

```
s6explorehint=I(z1, { type: "frame", name: "s6-explore-hint", x: 40, y: 460, layout: "horizontal", cornerRadius: 12, fill: "#00000066", padding: [12, 16] })
I(s6explorehint, { type: "text", content: "✦  Click any piece to explore", fontFamily: "DM Sans", fontSize: 12, fontWeight: "500", fill: "#FFFFFF" })
```

- [ ] **Step 6: Screenshot to verify Zone 1**

Call `get_screenshot`. Confirm: dark-tinted wall render image edge-to-edge, top bar with logo + title + Finalize button, gradient at base, hint pill bottom-left.

---

## Task 6: Step 6 — Zone 2 (pieces strip)

**Files:** `landing-design.pen` — inside STEP6_ID

- [ ] **Step 1: Create Zone 2 frame**

```
z2=I("STEP6_ID", { type: "frame", name: "s6-zone2", x: 0, y: 520, width: 1440, height: 240, fill: "#FAFAF9", layout: "none", clip: true })
```

- [ ] **Step 2: Add section label**

```
I(z2, { type: "text", name: "s6-pieces-label", content: "Individual Pieces", x: 48, y: 28, fontFamily: "DM Sans", fontSize: 16, fontWeight: "700", fill: "#0C0C0C" })
```

- [ ] **Step 3: Add Piece 1 thumbnail card — selected state (orange ring)**

```
pc1=I(z2, { type: "frame", name: "pc1-selected", x: 48, y: 64, width: 160, height: 160, layout: "none", cornerRadius: 8, stroke: { fill: "#E55722", thickness: 2, align: "outside" }, clip: true })
I(pc1, { type: "frame", x: 0, y: 0, width: 160, height: 130, fill: { enabled: true, mode: "fill", type: "image", url: "./images/generated-1776132092539.png" }, clip: true, layout: "none" })
pc1label=I(pc1, { type: "frame", x: 0, y: 130, width: 160, height: 30, fill: "#FFFFFF", layout: "vertical", padding: [4, 8] })
I(pc1label, { type: "text", content: "Abstract Flow", fontFamily: "DM Sans", fontSize: 11, fontWeight: "600", fill: "#0C0C0C" })
```

- [ ] **Step 4: Add Piece 2 thumbnail card — default state**

```
pc2=I(z2, { type: "frame", name: "pc2-default", x: 224, y: 64, width: 160, height: 160, layout: "none", cornerRadius: 8, stroke: { fill: "#E5E0D8", thickness: 1, align: "outside" }, clip: true })
I(pc2, { type: "frame", x: 0, y: 0, width: 160, height: 130, fill: { enabled: true, mode: "fill", type: "image", url: "./images/generated-1776132169888.png" }, clip: true, layout: "none" })
pc2label=I(pc2, { type: "frame", x: 0, y: 130, width: 160, height: 30, fill: "#FFFFFF", layout: "vertical", padding: [4, 8] })
I(pc2label, { type: "text", content: "Urban Geometry", fontFamily: "DM Sans", fontSize: 11, fontWeight: "600", fill: "#0C0C0C" })
```

- [ ] **Step 5: Add Piece 3 thumbnail card — default state**

```
pc3=I(z2, { type: "frame", name: "pc3-default", x: 400, y: 64, width: 160, height: 160, layout: "none", cornerRadius: 8, stroke: { fill: "#E5E0D8", thickness: 1, align: "outside" }, clip: true })
I(pc3, { type: "frame", x: 0, y: 0, width: 160, height: 130, fill: { enabled: true, mode: "fill", type: "image", url: "./images/generated-1776132268039.png" }, clip: true, layout: "none" })
pc3label=I(pc3, { type: "frame", x: 0, y: 130, width: 160, height: 30, fill: "#FFFFFF", layout: "vertical", padding: [4, 8] })
I(pc3label, { type: "text", content: "Botanical Dreams", fontFamily: "DM Sans", fontSize: 11, fontWeight: "600", fill: "#0C0C0C" })
```

- [ ] **Step 6: Add placement pill below Piece 1 card (selected piece detail)**

Zone 2 also shows the shopping links for the selected piece to the right of the thumbnails.

```
s6detail=I(z2, { type: "frame", name: "s6-detail-panel", x: 620, y: 48, width: 760, height: 180, layout: "vertical", gap: 12, padding: [20, 24] })
I(s6detail, { type: "text", content: "Abstract Flow", fontFamily: "DM Sans", fontSize: 20, fontWeight: "700", fill: "#0C0C0C" })
I(s6detail, { type: "text", content: "Center wall · Oil on canvas · 24 × 36 in", fontFamily: "DM Sans", fontSize: 13, fill: "#7A746C" })
s6links=I(s6detail, { type: "frame", layout: "horizontal", gap: 10, width: "fill_container" })
s6link1=I(s6links, { type: "frame", layout: "horizontal", cornerRadius: 100, stroke: { fill: "#E5E0D8", thickness: 1, align: "outside" }, fill: "#FFFFFF", padding: [8, 16] })
I(s6link1, { type: "text", content: "🖼  Buy a frame", fontFamily: "DM Sans", fontSize: 13, fill: "#0C0C0C" })
s6link2=I(s6links, { type: "frame", layout: "horizontal", cornerRadius: 100, stroke: { fill: "#E5E0D8", thickness: 1, align: "outside" }, fill: "#FFFFFF", padding: [8, 16] })
I(s6link2, { type: "text", content: "🖨  Print this poster", fontFamily: "DM Sans", fontSize: 13, fill: "#0C0C0C" })
```

- [ ] **Step 7: Screenshot to verify Zone 2**

Call `get_screenshot`. Confirm: horizontal piece strip with 3 thumbnails, Piece 1 has orange border ring, detail panel to the right with title + links.

---

## Task 7: Step 6 — Zone 3 (actions bar) + commit

**Files:** `landing-design.pen` — inside STEP6_ID

- [ ] **Step 1: Create Zone 3 frame**

```
z3=I("STEP6_ID", { type: "frame", name: "s6-zone3", x: 0, y: 760, width: 1440, height: 140, fill: "#FFFFFF", layout: "horizontal", alignItems: "center", justifyContent: "space_between", padding: [0, 48], stroke: { fill: "#E5E0D8", thickness: 1, align: "inside" }, clip: true })
```

- [ ] **Step 2: Add "Regenerate Selected" button (left)**

```
s6regenBtn=I(z3, { type: "frame", layout: "horizontal", cornerRadius: 10, fill: "#E55722", padding: [14, 24], gap: 8, alignItems: "center" })
I(s6regenBtn, { type: "text", content: "Regenerate Selected (1)", fontFamily: "DM Sans", fontSize: 14, fontWeight: "600", fill: "#FFFFFF" })
```

- [ ] **Step 3: Add "Update Wall Render" ghost button (center)**

```
s6updateBtn=I(z3, { type: "frame", layout: "horizontal", cornerRadius: 10, fill: "#F0EDE8", padding: [14, 24] })
I(s6updateBtn, { type: "text", content: "Update Wall Render", fontFamily: "DM Sans", fontSize: 14, fontWeight: "500", fill: "#0C0C0C" })
```

- [ ] **Step 4: Add "Retry with Changes" text link (right)**

```
s6retryArea=I(z3, { type: "frame", layout: "vertical", alignItems: "flex_end", gap: 4 })
I(s6retryArea, { type: "text", content: "Retry with Changes", fontFamily: "DM Sans", fontSize: 14, fontWeight: "500", fill: "#7A746C" })
I(s6retryArea, { type: "text", content: "Start the flow over with different choices", fontFamily: "DM Sans", fontSize: 11, fill: "#9B958D" })
```

- [ ] **Step 5: Final full-screen screenshot of both new screens**

Call `get_screenshot`. Confirm: Step 5 split-screen is complete, Step 6 full-bleed layout with three zones is complete.

- [ ] **Step 6: Update project_state.md**

In `docs/project_state.md`, update Phase 14 to:
```
- **Phase 14** ✅ Creation Flow Mockups — 6 screens complete (2026-04-21)
```

Also update the Phase 14 design artifacts section:
```
- 6 screens in "Creation Flow" frame at canvas x≈4792:
  - Step 1–4: (existing)
  - Step 5 (Descriptions): accordion review, aesthetic room right panel
  - Step 6 (Wall Result): full-bleed zones — hero render, pieces strip, actions bar
```

- [ ] **Step 7: Commit everything**

```bash
git add landing-design.pen docs/project_state.md
git commit -m "design: add Step 6 Wall Result screen + complete Creation Flow mockup

6-screen Creation Flow now complete in landing-design.pen:
- Step 5: split-screen accordion description review
- Step 6: full-bleed wall result with hero render, pieces strip, actions bar"
```

---

## Self-Review Notes

- **Spec coverage:** All spec sections covered — progress bar (5/6), accordion (expanded + collapsed states), room image carry-forward, feedback section, CTA, Zone 1 hero + overlay + top bar, Zone 2 pieces strip + detail panel, Zone 3 actions. ✓
- **No placeholders:** All node properties, coordinates, colors, fonts, and content strings are concrete. ✓
- **Type consistency:** `s5accordion`, `s5content`, `s5left`, `s5right`, `z1`, `z2`, `z3` — all referenced consistently across tasks. ✓
- **Parent frame widths:** `BrbH5` and `Z4Dus` widened in Task 1 before inserting new screens. ✓
- **Shopping links:** Correctly shows both "Buy a frame" and "Print this poster" (poster-type piece). ✓
