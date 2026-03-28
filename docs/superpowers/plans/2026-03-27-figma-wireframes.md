# GenWallDecor Figma Wireframes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 7 mid-fidelity wireframe frames in a new Figma file covering all GenWallDecor pages, organized into 4 labeled sections on a single canvas, using the app's actual color scheme.

**Architecture:** Each frame is created using `mcp__figma__use_figma` (Figma Plugin API via JavaScript). Frames are placed at fixed canvas coordinates on a single Figma page. Elements within frames use absolute positioning. Each `use_figma` call loads fonts, builds its frame, and returns the frame's node ID for the screenshot step.

**Tech Stack:** Figma MCP — `mcp__figma__whoami`, `mcp__figma__create_new_file`, `mcp__figma__use_figma`, `mcp__figma__get_screenshot`

---

## Color Constants

All Figma Plugin API colors are 0–1 normalized RGB. Every task redefines `C` locally — copy-paste safe.

| Token | Hex | r | g | b |
|-------|-----|---|---|---|
| Primary | `#1b998b` | 0.106 | 0.600 | 0.545 |
| Background | `#f8f1ff` | 0.973 | 0.945 | 1.0 |
| Secondary | `#decdf5` | 0.871 | 0.804 | 0.961 |
| Text Darker | `#534d56` | 0.325 | 0.302 | 0.337 |
| Text Dark | `#656176` | 0.396 | 0.380 | 0.463 |
| White | `#ffffff` | 1.0 | 1.0 | 1.0 |
| Placeholder | `#e0e0e0` | 0.878 | 0.878 | 0.878 |
| Green | `#36a036` | 0.212 | 0.627 | 0.212 |
| Blue (links) | `#3b7df7` | 0.231 | 0.490 | 0.969 |

## Canvas Layout

All frames are **1440×900px**. Sections are labeled with text placed directly on the canvas above each row.

| Element | x | y |
|---------|---|---|
| Section 1 label | 0 | 0 |
| Landing page | 0 | 40 |
| Section 2 label | 0 | 1060 |
| Create — Step 1 | 0 | 1100 |
| Create — Step 2 | 1560 | 1100 |
| Create — Step 3 | 3120 | 1100 |
| Generate / Review | 4680 | 1100 |
| Section 3 label | 0 | 2120 |
| Wall View | 0 | 2160 |
| Section 4 label | 0 | 3180 |
| History | 0 | 3220 |

---

### Task 1: Get planKey and create the Figma file

**Files:** Figma MCP only — no local files changed.

- [ ] **Step 1: Get the planKey**

Call `mcp__figma__whoami` (no parameters). Note the `key` field from the returned plan(s). If there are multiple plans, ask Abhi which team to use. Save the key as `<PLAN_KEY>`.

- [ ] **Step 2: Create the Figma design file**

Call `mcp__figma__create_new_file`:
```json
{
  "fileName": "GenWallDecor Wireframes",
  "planKey": "<PLAN_KEY>",
  "editorType": "design"
}
```
Save the returned `fileKey` as `<FILE_KEY>`. Every subsequent `mcp__figma__use_figma` call needs it.

---

### Task 2: Add section labels to the canvas

- [ ] **Step 1: Create 4 section labels**

Call `mcp__figma__use_figma` with `fileKey: <FILE_KEY>` and:

```js
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

const PRIMARY = { r: 0.106, g: 0.600, b: 0.545 };

const sections = [
  { label: 'SECTION 1 — ONBOARDING', x: 0, y: 0 },
  { label: 'SECTION 2 — CREATION FLOW', x: 0, y: 1060 },
  { label: 'SECTION 3 — RESULT', x: 0, y: 2120 },
  { label: 'SECTION 4 — DISCOVERY', x: 0, y: 3180 },
];

const nodes = [];
for (const s of sections) {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: 'Bold' };
  t.fontSize = 18;
  t.characters = s.label;
  t.fills = [{ type: 'SOLID', color: PRIMARY }];
  t.x = s.x;
  t.y = s.y;
  figma.currentPage.appendChild(t);
  nodes.push(t);
}

figma.viewport.scrollAndZoomIntoView(nodes);
return 'Section labels created. Page ID: ' + figma.currentPage.id;
```

Save the returned page ID (e.g. `0:1`) as `<PAGE_ID>`.

- [ ] **Step 2: Verify**

Call `mcp__figma__get_screenshot` with `fileKey: <FILE_KEY>`, `nodeId: <PAGE_ID>`. Confirm 4 teal section labels are visible.

---

### Task 3: Landing page frame

Canvas position: x=0, y=40

- [ ] **Step 1: Create the frame**

Call `mcp__figma__use_figma` with `fileKey: <FILE_KEY>` and:

```js
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

const C = {
  primary:     { r: 0.106, g: 0.600, b: 0.545 },
  bg:          { r: 0.973, g: 0.945, b: 1.0   },
  secondary:   { r: 0.871, g: 0.804, b: 0.961 },
  textDark:    { r: 0.396, g: 0.380, b: 0.463 },
  textDarker:  { r: 0.325, g: 0.302, b: 0.337 },
  white:       { r: 1.0,   g: 1.0,   b: 1.0   },
};

function solid(color) { return [{ type: 'SOLID', color }]; }

function mkText(chars, size, color, bold, x, y) {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
  t.fontSize = size;
  t.characters = String(chars);
  t.fills = solid(color);
  t.x = x; t.y = y;
  return t;
}

function mkRect(w, h, color, radius, x, y) {
  const r = figma.createRectangle();
  r.resize(w, h);
  r.fills = solid(color);
  r.cornerRadius = radius || 0;
  r.x = x; r.y = y;
  return r;
}

const frame = figma.createFrame();
frame.name = 'Landing Page';
frame.resize(1440, 900);
frame.x = 0;
frame.y = 40;
frame.fills = solid(C.bg);
figma.currentPage.appendChild(frame);

// Navbar
frame.appendChild(mkRect(1440, 56, C.white, 0, 0, 0));
frame.appendChild(mkText('GenWallDecor', 16, C.textDarker, true, 48, 18));
frame.appendChild(mkText('History', 14, C.textDark, false, 1240, 20));
const signInBg = mkRect(90, 32, C.primary, 8, 1332, 12);
frame.appendChild(signInBg);
frame.appendChild(mkText('Sign In', 13, C.white, true, 1350, 19));

// Hero
frame.appendChild(mkText('Design Your Perfect Wall', 52, C.textDarker, true, 380, 120));
frame.appendChild(mkText('AI-powered wall decor that matches your style.\nChoose a look, and let AI bring your vision to life.', 18, C.textDark, false, 430, 205));
const heroCta = mkRect(180, 52, C.primary, 16, 630, 290);
frame.appendChild(heroCta);
frame.appendChild(mkText('Start Creating', 17, C.white, true, 657, 306));

// How It Works heading
frame.appendChild(mkText('How It Works', 28, C.textDarker, true, 610, 390));

// Step cards
const cards = [
  { icon: '🎨', step: 'Step 1', title: 'Choose Your Style',       desc: 'Pick from 20 curated decor styles.', x: 160 },
  { icon: '✏️',  step: 'Step 2', title: 'Review AI Descriptions',  desc: 'AI creates tailored art descriptions.',  x: 590 },
  { icon: '🖼️', step: 'Step 3', title: 'See Your Wall',            desc: 'Get a complete wall visualization.',     x: 1020 },
];
for (const cd of cards) {
  frame.appendChild(mkRect(260, 185, C.secondary, 16, cd.x, 440));
  frame.appendChild(mkText(cd.icon, 28, C.textDarker, false, cd.x + 106, 458));
  frame.appendChild(mkText(cd.step, 12, C.primary, true, cd.x + 110, 500));
  frame.appendChild(mkText(cd.title, 16, C.textDarker, true, cd.x + 28, 524));
  frame.appendChild(mkText(cd.desc, 13, C.textDark, false, cd.x + 18, 552));
}

// Bottom CTA
frame.appendChild(mkRect(640, 180, C.secondary, 16, 400, 672));
frame.appendChild(mkText('Ready to transform your space?', 24, C.textDarker, true, 458, 696));
frame.appendChild(mkText('It only takes a few minutes to create something beautiful.', 14, C.textDark, false, 442, 736));
const ctaBtn2 = mkRect(160, 44, C.primary, 12, 600, 772);
frame.appendChild(ctaBtn2);
frame.appendChild(mkText('Get Started', 15, C.white, true, 636, 784));

figma.viewport.scrollAndZoomIntoView([frame]);
return 'Landing frame ID: ' + frame.id;
```

Save the returned frame ID as `<LANDING_ID>`.

- [ ] **Step 2: Verify**

Call `mcp__figma__get_screenshot` with `fileKey: <FILE_KEY>`, `nodeId: <LANDING_ID>`. Confirm: navbar, large hero heading, 3 secondary-purple step cards, bottom CTA card with teal button.

- [ ] **Step 3: Commit progress note**

```bash
echo "Task 3 done — Landing page frame. fileKey: <FILE_KEY>" >> /tmp/wireframe-session.txt
```

---

### Task 4: Create — Step 1 frame (Choose Your Style)

Canvas position: x=0, y=1100

- [ ] **Step 1: Create the frame**

Call `mcp__figma__use_figma` with `fileKey: <FILE_KEY>` and:

```js
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

const C = {
  primary:     { r: 0.106, g: 0.600, b: 0.545 },
  bg:          { r: 0.973, g: 0.945, b: 1.0   },
  secondary:   { r: 0.871, g: 0.804, b: 0.961 },
  textDark:    { r: 0.396, g: 0.380, b: 0.463 },
  textDarker:  { r: 0.325, g: 0.302, b: 0.337 },
  white:       { r: 1.0,   g: 1.0,   b: 1.0   },
  gray:        { r: 0.878, g: 0.878, b: 0.878 },
};

function solid(color) { return [{ type: 'SOLID', color }]; }

function mkText(chars, size, color, bold, x, y) {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
  t.fontSize = size;
  t.characters = String(chars);
  t.fills = solid(color);
  t.x = x; t.y = y;
  return t;
}

function mkRect(w, h, color, radius, x, y) {
  const r = figma.createRectangle();
  r.resize(w, h);
  r.fills = solid(color);
  r.cornerRadius = radius || 0;
  r.x = x; r.y = y;
  return r;
}

const frame = figma.createFrame();
frame.name = 'Create — Step 1';
frame.resize(1440, 900);
frame.x = 0;
frame.y = 1100;
frame.fills = solid(C.bg);
figma.currentPage.appendChild(frame);

// Navbar
frame.appendChild(mkRect(1440, 56, C.white, 0, 0, 0));
frame.appendChild(mkText('GenWallDecor', 16, C.textDarker, true, 48, 18));

// Step indicator: 3 circles connected by lines, step 1 active (teal)
const stepXs = [612, 720, 828];
for (let i = 0; i < 3; i++) {
  const active = i === 0;
  const dot = figma.createEllipse();
  dot.resize(32, 32);
  dot.fills = solid(active ? C.primary : C.gray);
  dot.x = stepXs[i]; dot.y = 72;
  frame.appendChild(dot);
  frame.appendChild(mkText(String(i + 1), 14, active ? C.white : C.textDark, true, stepXs[i] + 11, 80));
  if (i < 2) {
    frame.appendChild(mkRect(76, 2, C.gray, 0, stepXs[i] + 32, 87));
  }
}
frame.appendChild(mkText('Step 1 of 3', 12, C.textDark, false, 698, 116));

// Heading
frame.appendChild(mkText('Choose Your Style', 32, C.textDarker, true, 536, 148));
frame.appendChild(mkText('Select a decor style to get started.', 16, C.textDark, false, 577, 195));

// Style card grid: 3 cols × 4 rows (12 sample styles)
const styleNames = [
  'Minimalist', 'Bohemian', 'Scandinavian',
  'Industrial', 'Mid-Century Modern', 'Japandi',
  'Contemporary', 'Art Deco', 'Rustic',
  'Coastal', 'Maximalist', 'Nordic',
];
const cardW = 260, cardH = 110, colGap = 74, rowGap = 16;
const gridX = 160, gridY = 232;

for (let i = 0; i < 12; i++) {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const cx = gridX + col * (cardW + colGap);
  const cy = gridY + row * (cardH + rowGap);
  const isSelected = i === 0;

  const card = figma.createFrame();
  card.resize(cardW, cardH);
  card.x = cx; card.y = cy;
  card.fills = solid(C.white);
  card.cornerRadius = 12;
  card.strokes = solid(isSelected ? C.primary : C.secondary);
  card.strokeWeight = isSelected ? 2 : 1;
  frame.appendChild(card);

  const lbl = figma.createText();
  lbl.fontName = { family: 'Inter', style: 'Bold' };
  lbl.fontSize = 14;
  lbl.characters = styleNames[i];
  lbl.fills = solid(C.textDarker);
  lbl.x = 14; lbl.y = 14;
  card.appendChild(lbl);

  if (isSelected) {
    const selBadge = figma.createText();
    selBadge.fontName = { family: 'Inter', style: 'Regular' };
    selBadge.fontSize = 11;
    selBadge.characters = '✓ Selected';
    selBadge.fills = solid(C.primary);
    selBadge.x = 14; selBadge.y = 38;
    card.appendChild(selBadge);
  }
}

// Footer
frame.appendChild(mkRect(1440, 64, C.white, 0, 0, 836));
frame.appendChild(mkText('Select a style to continue', 12, C.textDark, false, 596, 857));
const nextBtn = mkRect(120, 40, C.primary, 8, 1292, 848);
frame.appendChild(nextBtn);
frame.appendChild(mkText('Next →', 14, C.white, true, 1322, 860));

figma.viewport.scrollAndZoomIntoView([frame]);
return 'Create Step 1 frame ID: ' + frame.id;
```

Save the returned frame ID as `<STEP1_ID>`.

- [ ] **Step 2: Verify**

Call `mcp__figma__get_screenshot` with `fileKey: <FILE_KEY>`, `nodeId: <STEP1_ID>`. Confirm: step 1 circle filled teal, 12 style cards in 3-col grid, first card with teal border and "✓ Selected", disabled hint text, Next button.

- [ ] **Step 3: Commit progress note**

```bash
echo "Task 4 done — Create Step 1 frame" >> /tmp/wireframe-session.txt
```

---

### Task 5: Create — Step 2 frame (Visual Preferences)

Canvas position: x=1560, y=1100

- [ ] **Step 1: Create the frame**

Call `mcp__figma__use_figma` with `fileKey: <FILE_KEY>` and:

```js
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

const C = {
  primary:    { r: 0.106, g: 0.600, b: 0.545 },
  bg:         { r: 0.973, g: 0.945, b: 1.0   },
  secondary:  { r: 0.871, g: 0.804, b: 0.961 },
  textDark:   { r: 0.396, g: 0.380, b: 0.463 },
  textDarker: { r: 0.325, g: 0.302, b: 0.337 },
  white:      { r: 1.0,   g: 1.0,   b: 1.0   },
  gray:       { r: 0.878, g: 0.878, b: 0.878 },
};

function solid(color) { return [{ type: 'SOLID', color }]; }

function mkText(chars, size, color, bold, x, y) {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
  t.fontSize = size;
  t.characters = String(chars);
  t.fills = solid(color);
  t.x = x; t.y = y;
  return t;
}

function mkRect(w, h, color, radius, x, y) {
  const r = figma.createRectangle();
  r.resize(w, h);
  r.fills = solid(color);
  r.cornerRadius = radius || 0;
  r.x = x; r.y = y;
  return r;
}

const frame = figma.createFrame();
frame.name = 'Create — Step 2';
frame.resize(1440, 900);
frame.x = 1560;
frame.y = 1100;
frame.fills = solid(C.bg);
figma.currentPage.appendChild(frame);

// Navbar
frame.appendChild(mkRect(1440, 56, C.white, 0, 0, 0));
frame.appendChild(mkText('GenWallDecor', 16, C.textDarker, true, 48, 18));

// Step indicator: steps 1 (past) and 2 (active) teal, step 3 gray
const stepXs = [612, 720, 828];
for (let i = 0; i < 3; i++) {
  const filled = i <= 1;
  const dot = figma.createEllipse();
  dot.resize(32, 32);
  dot.fills = solid(filled ? C.primary : C.gray);
  dot.x = stepXs[i]; dot.y = 72;
  frame.appendChild(dot);
  frame.appendChild(mkText(String(i + 1), 14, filled ? C.white : C.textDark, true, stepXs[i] + 11, 80));
  if (i < 2) {
    frame.appendChild(mkRect(76, 2, i === 0 ? C.primary : C.gray, 0, stepXs[i] + 32, 87));
  }
}
frame.appendChild(mkText('Step 2 of 3', 12, C.textDark, false, 698, 116));

// Heading
frame.appendChild(mkText('Visual Preferences', 32, C.textDarker, true, 536, 148));
frame.appendChild(mkText('Choose your color scheme and frame material.', 16, C.textDark, false, 536, 195));

// Color scheme
frame.appendChild(mkText('Color Scheme', 18, C.textDarker, true, 200, 250));
frame.appendChild(mkText('Select all that apply', 13, C.textDark, false, 200, 278));

const colorChips = ['Warm Neutrals', 'Cool Blues', 'Earthy Tones', 'Monochrome', 'Bold Accents', 'Pastels'];
let chipX = 200;
for (let i = 0; i < colorChips.length; i++) {
  const selected = i < 2;
  const chipW = colorChips[i].length * 8 + 28;
  const chip = mkRect(chipW, 36, selected ? C.secondary : C.white, 18, chipX, 308);
  chip.strokes = solid(selected ? C.primary : C.secondary);
  chip.strokeWeight = selected ? 1.5 : 1;
  frame.appendChild(chip);
  frame.appendChild(mkText(colorChips[i], 13, selected ? C.textDarker : C.textDark, selected, chipX + 14, 320));
  chipX += chipW + 12;
}

// Frame material
frame.appendChild(mkText('Frame Material', 18, C.textDarker, true, 200, 390));

const materials = ['Wood', 'Metal', 'No Frame', 'Floating'];
for (let i = 0; i < materials.length; i++) {
  const selected = i === 0;
  const btn = mkRect(160, 52, selected ? C.secondary : C.white, 10, 200 + i * 184, 428);
  btn.strokes = solid(selected ? C.primary : C.secondary);
  btn.strokeWeight = selected ? 2 : 1;
  frame.appendChild(btn);
  frame.appendChild(mkText(materials[i], 15, C.textDarker, selected, 200 + i * 184 + 54, 446));
}

// Footer
frame.appendChild(mkRect(1440, 64, C.white, 0, 0, 836));
const backBtn = mkRect(100, 40, C.secondary, 8, 1180, 848);
frame.appendChild(backBtn);
frame.appendChild(mkText('← Back', 14, C.textDarker, false, 1198, 860));
const nextBtn = mkRect(120, 40, C.primary, 8, 1292, 848);
frame.appendChild(nextBtn);
frame.appendChild(mkText('Next →', 14, C.white, true, 1322, 860));

figma.viewport.scrollAndZoomIntoView([frame]);
return 'Create Step 2 frame ID: ' + frame.id;
```

Save the returned frame ID as `<STEP2_ID>`.

- [ ] **Step 2: Verify**

Call `mcp__figma__get_screenshot` with `fileKey: <FILE_KEY>`, `nodeId: <STEP2_ID>`. Confirm: step 2 circle teal, color chips (first two selected with teal stroke + secondary fill), material buttons (Wood selected), Back + Next buttons.

- [ ] **Step 3: Commit progress note**

```bash
echo "Task 5 done — Create Step 2 frame" >> /tmp/wireframe-session.txt
```

---

### Task 6: Create — Step 3 frame (Room Context)

Canvas position: x=3120, y=1100

- [ ] **Step 1: Create the frame**

Call `mcp__figma__use_figma` with `fileKey: <FILE_KEY>` and:

```js
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

const C = {
  primary:    { r: 0.106, g: 0.600, b: 0.545 },
  bg:         { r: 0.973, g: 0.945, b: 1.0   },
  secondary:  { r: 0.871, g: 0.804, b: 0.961 },
  textDark:   { r: 0.396, g: 0.380, b: 0.463 },
  textDarker: { r: 0.325, g: 0.302, b: 0.337 },
  white:      { r: 1.0,   g: 1.0,   b: 1.0   },
  gray:       { r: 0.878, g: 0.878, b: 0.878 },
};

function solid(color) { return [{ type: 'SOLID', color }]; }

function mkText(chars, size, color, bold, x, y) {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
  t.fontSize = size;
  t.characters = String(chars);
  t.fills = solid(color);
  t.x = x; t.y = y;
  return t;
}

function mkRect(w, h, color, radius, x, y) {
  const r = figma.createRectangle();
  r.resize(w, h);
  r.fills = solid(color);
  r.cornerRadius = radius || 0;
  r.x = x; r.y = y;
  return r;
}

const frame = figma.createFrame();
frame.name = 'Create — Step 3';
frame.resize(1440, 900);
frame.x = 3120;
frame.y = 1100;
frame.fills = solid(C.bg);
figma.currentPage.appendChild(frame);

// Navbar
frame.appendChild(mkRect(1440, 56, C.white, 0, 0, 0));
frame.appendChild(mkText('GenWallDecor', 16, C.textDarker, true, 48, 18));

// Step indicator: all 3 teal (step 3 active)
const stepXs = [612, 720, 828];
for (let i = 0; i < 3; i++) {
  const dot = figma.createEllipse();
  dot.resize(32, 32);
  dot.fills = solid(C.primary);
  dot.x = stepXs[i]; dot.y = 72;
  frame.appendChild(dot);
  frame.appendChild(mkText(String(i + 1), 14, C.white, true, stepXs[i] + 11, 80));
  if (i < 2) frame.appendChild(mkRect(76, 2, C.primary, 0, stepXs[i] + 32, 87));
}
frame.appendChild(mkText('Step 3 of 3', 12, C.textDark, false, 698, 116));

// Heading
frame.appendChild(mkText('Room Context', 32, C.textDarker, true, 570, 148));
frame.appendChild(mkText('Tell us about your room so we can tailor the arrangement.', 16, C.textDark, false, 490, 195));

// Room type
frame.appendChild(mkText('Room Type', 18, C.textDarker, true, 360, 258));

const dropdown = mkRect(720, 48, C.white, 8, 360, 292);
dropdown.strokes = solid(C.secondary);
dropdown.strokeWeight = 1;
frame.appendChild(dropdown);
frame.appendChild(mkText('Living Room', 15, C.textDarker, false, 380, 308));
frame.appendChild(mkText('▼', 12, C.textDark, false, 1056, 310));

// Wall dimensions
frame.appendChild(mkText('Wall Dimensions (optional)', 18, C.textDarker, true, 360, 376));
frame.appendChild(mkText('Helps AI proportion the arrangement correctly.', 13, C.textDark, false, 360, 404));

const widthInput = mkRect(300, 48, C.white, 8, 360, 434);
widthInput.strokes = solid(C.secondary);
widthInput.strokeWeight = 1;
frame.appendChild(widthInput);
frame.appendChild(mkText('Width (inches)', 13, { r: 0.65, g: 0.65, b: 0.65 }, false, 380, 450));

frame.appendChild(mkText('×', 20, C.textDark, false, 692, 448));

const heightInput = mkRect(300, 48, C.white, 8, 720, 434);
heightInput.strokes = solid(C.secondary);
heightInput.strokeWeight = 1;
frame.appendChild(heightInput);
frame.appendChild(mkText('Height (inches)', 13, { r: 0.65, g: 0.65, b: 0.65 }, false, 740, 450));

// Footer
frame.appendChild(mkRect(1440, 64, C.white, 0, 0, 836));
const backBtn = mkRect(100, 40, C.secondary, 8, 1180, 848);
frame.appendChild(backBtn);
frame.appendChild(mkText('← Back', 14, C.textDarker, false, 1198, 860));
const genBtn = mkRect(140, 40, C.primary, 8, 1292, 848);
frame.appendChild(genBtn);
frame.appendChild(mkText('Generate →', 14, C.white, true, 1308, 860));

figma.viewport.scrollAndZoomIntoView([frame]);
return 'Create Step 3 frame ID: ' + frame.id;
```

Save the returned frame ID as `<STEP3_ID>`.

- [ ] **Step 2: Verify**

Call `mcp__figma__get_screenshot` with `fileKey: <FILE_KEY>`, `nodeId: <STEP3_ID>`. Confirm: all 3 step circles teal, room type dropdown, two width/height inputs with × separator, teal Generate button.

- [ ] **Step 3: Commit progress note**

```bash
echo "Task 6 done — Create Step 3 frame" >> /tmp/wireframe-session.txt
```

---

### Task 7: Generate / Review Descriptions frame

Canvas position: x=4680, y=1100

- [ ] **Step 1: Create the frame**

Call `mcp__figma__use_figma` with `fileKey: <FILE_KEY>` and:

```js
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

const C = {
  primary:    { r: 0.106, g: 0.600, b: 0.545 },
  bg:         { r: 0.973, g: 0.945, b: 1.0   },
  secondary:  { r: 0.871, g: 0.804, b: 0.961 },
  textDark:   { r: 0.396, g: 0.380, b: 0.463 },
  textDarker: { r: 0.325, g: 0.302, b: 0.337 },
  white:      { r: 1.0,   g: 1.0,   b: 1.0   },
  blue:       { r: 0.231, g: 0.490, b: 0.969 },
  inputGray:  { r: 0.65,  g: 0.65,  b: 0.65  },
};

function solid(color) { return [{ type: 'SOLID', color }]; }

function mkText(chars, size, color, bold, x, y) {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
  t.fontSize = size;
  t.characters = String(chars);
  t.fills = solid(color);
  t.x = x; t.y = y;
  return t;
}

function mkRect(w, h, color, radius, x, y) {
  const r = figma.createRectangle();
  r.resize(w, h);
  r.fills = solid(color);
  r.cornerRadius = radius || 0;
  r.x = x; r.y = y;
  return r;
}

const frame = figma.createFrame();
frame.name = 'Generate — Review Descriptions';
frame.resize(1440, 900);
frame.x = 4680;
frame.y = 1100;
frame.fills = solid(C.bg);
figma.currentPage.appendChild(frame);

// Navbar
frame.appendChild(mkRect(1440, 56, C.white, 0, 0, 0));
frame.appendChild(mkText('GenWallDecor', 16, C.textDarker, true, 48, 18));

// Heading
frame.appendChild(mkText('Review Your Descriptions', 28, C.textDarker, true, 360, 76));
frame.appendChild(mkText('Style: Minimalist  •  Edit any description before generating images.', 14, C.textDark, false, 360, 116));

// 5 description cards
const cardTitles = [
  'Abstract Geometric Canvas',
  'Monochrome Photography Print',
  'Minimalist Line Drawing',
  'Textured Linen Wall Hanging',
  'Sculptural Ceramic Wall Panel',
];
const cardDescs = [
  'Large-format canvas featuring interlocking geometric shapes in muted grays.',
  'Black and white architectural photo, 24×36", fine grain texture.',
  'Simple line illustration of a botanical form, unframed on white paper.',
  'Hand-woven natural linen wall hanging, 18×24", earth tones.',
  'Set of three ceramic wall tiles in matte white with subtle relief.',
];

for (let i = 0; i < 5; i++) {
  const cy = 148 + i * 108;
  const card = mkRect(720, 96, C.white, 12, 360, cy);
  card.strokes = solid(C.secondary);
  card.strokeWeight = 1;
  frame.appendChild(card);
  frame.appendChild(mkText(`${i + 1}. ${cardTitles[i]}`, 15, C.textDarker, true, 376, cy + 14));
  frame.appendChild(mkText(cardDescs[i], 12, C.textDark, false, 376, cy + 38));
  frame.appendChild(mkText('Regenerate this piece', 11, C.blue, false, 376, cy + 70));
}

// Feedback panel
const fbPanel = mkRect(720, 112, C.white, 12, 360, 698);
fbPanel.strokes = solid(C.secondary);
fbPanel.strokeWeight = 1;
frame.appendChild(fbPanel);
frame.appendChild(mkText('Want different descriptions?', 13, C.textDarker, true, 376, 714));
const fbInput = mkRect(580, 38, C.bg, 6, 376, 738);
fbInput.strokes = solid(C.secondary);
fbInput.strokeWeight = 1;
frame.appendChild(fbInput);
frame.appendChild(mkText('e.g. Make them more colorful, add abstract pieces...', 12, C.inputGray, false, 388, 752));
const regenAllBtn = mkRect(140, 32, C.secondary, 6, 376, 782);
frame.appendChild(regenAllBtn);
frame.appendChild(mkText('Regenerate All', 12, C.textDarker, false, 394, 792));

// Generate Images CTA
const genBtn = mkRect(220, 52, C.primary, 16, 610, 830);
frame.appendChild(genBtn);
frame.appendChild(mkText('Generate Images', 16, C.white, true, 636, 842));

figma.viewport.scrollAndZoomIntoView([frame]);
return 'Generate/Review frame ID: ' + frame.id;
```

Save the returned frame ID as `<GENERATE_ID>`.

- [ ] **Step 2: Verify**

Call `mcp__figma__get_screenshot` with `fileKey: <FILE_KEY>`, `nodeId: <GENERATE_ID>`. Confirm: 5 description cards with titles, desc text, and blue "Regenerate this piece" link; feedback panel with textarea and "Regenerate All"; large teal "Generate Images" button.

- [ ] **Step 3: Commit progress note**

```bash
echo "Task 7 done — Generate/Review frame" >> /tmp/wireframe-session.txt
```

---

### Task 8: Wall View frame

Canvas position: x=0, y=2160

- [ ] **Step 1: Create the frame**

Call `mcp__figma__use_figma` with `fileKey: <FILE_KEY>` and:

```js
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

const C = {
  primary:     { r: 0.106, g: 0.600, b: 0.545 },
  bg:          { r: 0.973, g: 0.945, b: 1.0   },
  secondary:   { r: 0.871, g: 0.804, b: 0.961 },
  textDark:    { r: 0.396, g: 0.380, b: 0.463 },
  textDarker:  { r: 0.325, g: 0.302, b: 0.337 },
  white:       { r: 1.0,   g: 1.0,   b: 1.0   },
  placeholder: { r: 0.878, g: 0.878, b: 0.878 },
  green:       { r: 0.212, g: 0.627, b: 0.212 },
  blue:        { r: 0.231, g: 0.490, b: 0.969 },
};

function solid(color) { return [{ type: 'SOLID', color }]; }

function mkText(chars, size, color, bold, x, y) {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
  t.fontSize = size;
  t.characters = String(chars);
  t.fills = solid(color);
  t.x = x; t.y = y;
  return t;
}

function mkRect(w, h, color, radius, x, y) {
  const r = figma.createRectangle();
  r.resize(w, h);
  r.fills = solid(color);
  r.cornerRadius = radius || 0;
  r.x = x; r.y = y;
  return r;
}

const frame = figma.createFrame();
frame.name = 'Wall View';
frame.resize(1440, 900);
frame.x = 0;
frame.y = 2160;
frame.fills = solid(C.bg);
figma.currentPage.appendChild(frame);

// Navbar
frame.appendChild(mkRect(1440, 56, C.white, 0, 0, 0));
frame.appendChild(mkText('GenWallDecor', 16, C.textDarker, true, 48, 18));

// Heading
frame.appendChild(mkText('Your Wall — Minimalist', 28, C.textDarker, true, 80, 72));

// Wall render placeholder (16:9 = 880×495)
const wallBg = mkRect(880, 495, C.placeholder, 16, 80, 108);
wallBg.strokes = solid(C.secondary);
wallBg.strokeWeight = 1;
frame.appendChild(wallBg);
frame.appendChild(mkText('[Wall Render — 16:9]', 16, C.textDark, false, 420, 345));

// Interactive dots
const dotPositions = [{x:195, y:220}, {x:380, y:270}, {x:570, y:195}, {x:720, y:320}, {x:490, y:410}];
for (let i = 0; i < dotPositions.length; i++) {
  const dot = figma.createEllipse();
  dot.resize(14, 14);
  dot.fills = solid(C.white);
  dot.strokes = solid({ r: 0.4, g: 0.4, b: 0.4 });
  dot.strokeWeight = 2;
  dot.x = 80 + dotPositions[i].x;
  dot.y = 108 + dotPositions[i].y;
  frame.appendChild(dot);
}

// Open popover on first dot
const popX = 80 + dotPositions[0].x - 55;
const popY = 108 + dotPositions[0].y + 18;
const popover = mkRect(164, 72, C.white, 8, popX, popY);
popover.strokes = solid({ r: 0.8, g: 0.8, b: 0.8 });
popover.strokeWeight = 1;
frame.appendChild(popover);
frame.appendChild(mkText('Abstract Canvas', 12, C.textDarker, true, popX + 10, popY + 8));
frame.appendChild(mkText('Buy a frame', 11, C.blue, false, popX + 10, popY + 28));
frame.appendChild(mkText('Print this poster', 11, C.blue, false, popX + 10, popY + 46));

// Regeneration controls bar
frame.appendChild(mkRect(880, 48, C.white, 0, 80, 616));
const regenBtn = mkRect(210, 32, C.primary, 8, 88, 624);
frame.appendChild(regenBtn);
frame.appendChild(mkText('Regenerate Selected (2)', 12, C.white, true, 98, 634));
const updateBtn = mkRect(168, 32, C.secondary, 8, 310, 624);
frame.appendChild(updateBtn);
frame.appendChild(mkText('Update Wall Render', 11, C.textDarker, false, 320, 634));
const finalBtn = mkRect(120, 32, C.green, 8, 490, 624);
frame.appendChild(finalBtn);
frame.appendChild(mkText('Finalize Wall', 12, C.white, true, 506, 634));
frame.appendChild(mkText('3 regenerations used', 11, C.textDark, false, 625, 634));

// Individual pieces heading
frame.appendChild(mkText('Individual Pieces', 20, C.textDarker, true, 80, 676));

// Piece thumbnail grid (4 thumbnails)
const thumbW = 120, thumbH = 120;
const thumbNames = ['Abstract Canvas', 'Photo Print', 'Line Drawing', 'Linen Hanging'];
for (let i = 0; i < 4; i++) {
  const tx = 80 + i * (thumbW + 12);
  frame.appendChild(mkRect(thumbW, thumbH, C.placeholder, 8, tx, 706));

  // Checkbox
  const chkSelected = i < 2;
  const chk = mkRect(16, 16, chkSelected ? C.primary : C.white, 4, tx + 4, 710);
  chk.strokes = solid(chkSelected ? C.primary : { r: 0.6, g: 0.6, b: 0.6 });
  chk.strokeWeight = 1.5;
  frame.appendChild(chk);
  if (chkSelected) frame.appendChild(mkText('✓', 9, C.white, true, tx + 5, 712));

  frame.appendChild(mkText(thumbNames[i], 9, C.textDarker, false, tx + 2, 832));
}

// Detail panel (sticky sidebar)
const detailPanel = mkRect(284, 185, C.white, 12, 700, 702);
detailPanel.strokes = solid(C.secondary);
detailPanel.strokeWeight = 1;
frame.appendChild(detailPanel);
frame.appendChild(mkText('DETAILS', 10, C.textDark, true, 716, 718));
frame.appendChild(mkText('Abstract Canvas', 14, C.textDarker, true, 716, 736));
frame.appendChild(mkText('Large-format geometric canvas in muted grays.', 11, C.textDark, false, 716, 758));
frame.appendChild(mkText('Medium: Oil on Canvas', 10, C.textDark, false, 716, 790));
frame.appendChild(mkText('Dimensions: 36×48"', 10, C.textDark, false, 716, 806));
frame.appendChild(mkText('Placement: Center above sofa', 10, C.textDark, false, 716, 822));
frame.appendChild(mkText('Buy a frame', 11, C.blue, false, 716, 846));
frame.appendChild(mkText('Print this poster', 11, C.blue, false, 716, 862));
frame.appendChild(mkText('Download artwork', 11, C.blue, false, 716, 878));

figma.viewport.scrollAndZoomIntoView([frame]);
return 'Wall View frame ID: ' + frame.id;
```

Save the returned frame ID as `<WALL_ID>`.

- [ ] **Step 2: Verify**

Call `mcp__figma__get_screenshot` with `fileKey: <FILE_KEY>`, `nodeId: <WALL_ID>`. Confirm: 16:9 wall render placeholder with 5 dots + open popover, 3-button regen controls bar (teal / secondary / green), 4-col thumbnail grid with checkboxes, detail panel on right with blue shopping links.

- [ ] **Step 3: Commit progress note**

```bash
echo "Task 8 done — Wall View frame" >> /tmp/wireframe-session.txt
```

---

### Task 9: History frame

Canvas position: x=0, y=3220

- [ ] **Step 1: Create the frame**

Call `mcp__figma__use_figma` with `fileKey: <FILE_KEY>` and:

```js
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

const C = {
  primary:     { r: 0.106, g: 0.600, b: 0.545 },
  bg:          { r: 0.973, g: 0.945, b: 1.0   },
  secondary:   { r: 0.871, g: 0.804, b: 0.961 },
  textDark:    { r: 0.396, g: 0.380, b: 0.463 },
  textDarker:  { r: 0.325, g: 0.302, b: 0.337 },
  white:       { r: 1.0,   g: 1.0,   b: 1.0   },
  placeholder: { r: 0.878, g: 0.878, b: 0.878 },
};

function solid(color) { return [{ type: 'SOLID', color }]; }

function mkText(chars, size, color, bold, x, y) {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
  t.fontSize = size;
  t.characters = String(chars);
  t.fills = solid(color);
  t.x = x; t.y = y;
  return t;
}

function mkRect(w, h, color, radius, x, y) {
  const r = figma.createRectangle();
  r.resize(w, h);
  r.fills = solid(color);
  r.cornerRadius = radius || 0;
  r.x = x; r.y = y;
  return r;
}

const frame = figma.createFrame();
frame.name = 'History';
frame.resize(1440, 900);
frame.x = 0;
frame.y = 3220;
frame.fills = solid(C.bg);
figma.currentPage.appendChild(frame);

// Navbar
frame.appendChild(mkRect(1440, 56, C.white, 0, 0, 0));
frame.appendChild(mkText('GenWallDecor', 16, C.textDarker, true, 48, 18));
frame.appendChild(mkText('History', 14, C.textDark, false, 1316, 20));

// Heading
frame.appendChild(mkText('Your Generations', 28, C.textDarker, true, 160, 76));
frame.appendChild(mkText('Your most recent wall designs', 15, C.textDark, false, 160, 114));

// 3-col card grid
const genStyles = ['Minimalist', 'Bohemian', 'Scandinavian'];
const genDates = ['Mar 25, 2026', 'Mar 22, 2026', 'Mar 18, 2026'];
const cardW = 360;

for (let i = 0; i < 3; i++) {
  const cx = 160 + i * (cardW + 40);
  // Card container
  const card = mkRect(cardW, 310, C.white, 16, cx, 155);
  card.strokes = solid(C.secondary);
  card.strokeWeight = 1;
  frame.appendChild(card);
  // 16:9 thumbnail area
  frame.appendChild(mkRect(cardW, 203, C.placeholder, 0, cx, 155));
  // Style + date
  frame.appendChild(mkText(genStyles[i], 16, C.textDarker, true, cx + 16, 375));
  frame.appendChild(mkText(genDates[i], 12, C.textDark, false, cx + 16, 400));
}

// Empty state variant (annotated)
frame.appendChild(mkText('↓ Empty state (no generations yet):', 12, C.textDark, false, 160, 510));
const emptyCard = mkRect(440, 120, { r: 0.96, g: 0.96, b: 0.96 }, 12, 160, 536);
emptyCard.strokes = solid({ r: 0.8, g: 0.8, b: 0.8 });
emptyCard.strokeWeight = 1;
frame.appendChild(emptyCard);
frame.appendChild(mkText('No generations yet', 18, C.textDarker, true, 248, 558));
const emptyBtn = mkRect(200, 40, C.primary, 12, 270, 590);
frame.appendChild(emptyBtn);
frame.appendChild(mkText('Create Your First Wall', 13, C.white, true, 284, 602));

figma.viewport.scrollAndZoomIntoView([frame]);
return 'History frame ID: ' + frame.id;
```

Save the returned frame ID as `<HISTORY_ID>`.

- [ ] **Step 2: Verify**

Call `mcp__figma__get_screenshot` with `fileKey: <FILE_KEY>`, `nodeId: <HISTORY_ID>`. Confirm: 3 generation cards in a grid (each with placeholder thumbnail + style name + date), annotated empty state below with teal CTA button.

- [ ] **Step 3: Commit progress note**

```bash
echo "Task 9 done — History frame" >> /tmp/wireframe-session.txt
```

---

### Task 10: Final zoom-out and share

- [ ] **Step 1: Zoom canvas to show all 7 frames**

Call `mcp__figma__use_figma` with `fileKey: <FILE_KEY>` and:

```js
const frames = figma.currentPage.children.filter(n => n.type === 'FRAME');
figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
return `Done. ${frames.length} frames on canvas. Page ID: ${figma.currentPage.id}`;
```

Expected output: `Done. 7 frames on canvas. Page ID: 0:1`

- [ ] **Step 2: Full-canvas screenshot**

Call `mcp__figma__get_screenshot` with `fileKey: <FILE_KEY>`, `nodeId: <PAGE_ID>`. Confirm all 4 section labels and all 7 frames are visible in correct order.

- [ ] **Step 3: Share the link**

The Figma file URL is: `https://figma.com/design/<FILE_KEY>/GenWallDecor-Wireframes`

Share this with Abhi for review.
