# GenWallDecor Wireframe Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild all 7 wireframe frames in the GenWallDecor Figma file using the Cool Slate design system.

**Architecture:** Each task targets one Figma frame by node ID, clears its children, and rebuilds from scratch using the Figma Plugin API via `use_figma`. No app code changes — Figma only.

**Tech Stack:** Figma Plugin API (JavaScript), `mcp__figma__use_figma`, `mcp__figma__get_screenshot`

**Figma file key:** `CphSBIwuFQifjwBlS30jsM` — Page 1 (node `0:1`)

**Design spec:** `docs/superpowers/specs/2026-03-29-wireframe-redesign-design.md`

---

## Frame Map

| Frame | Node ID | Size |
|-------|---------|------|
| Landing Page | `2:2` | 1440×900 |
| Create — Step 1 | `3:2` | 1440×900 |
| Create — Step 2 | `4:2` | 1440×900 |
| Create — Step 3 | `5:2` | 1440×900 |
| Generate / Review | `6:2` | 1440×900 |
| Wall View | `7:2` | 1440×900 |
| History | `8:2` | 1440×900 |

## Color Reference (RGB 0–1, used in every task)

```javascript
const C = {
  primaryDark: {r:0.106, g:0.227, b:0.361},  // #1B3A5C — buttons, active states
  accent:      {r:0.180, g:0.427, b:0.643},  // #2E6DA4 — links, step indicators
  midBlue:     {r:0.494, g:0.706, b:0.847},  // #7EB4D8 — hero accent, decorative
  tint:        {r:0.784, g:0.875, b:0.933},  // #C8DFEE — borders, avatar bg
  pageBg:      {r:0.941, g:0.957, b:0.973},  // #F0F4F8 — all page backgrounds
  white:       {r:1.0,   g:1.0,   b:1.0  },  // #FFFFFF — cards, surfaces
  textPri:     {r:0.067, g:0.094, b:0.153},  // #111827 — headings
  textSec:     {r:0.420, g:0.447, b:0.502},  // #6B7280 — subtext, captions
  border:      {r:0.847, g:0.894, b:0.929},  // #D8E4ED — card borders, dividers
  ebf2f8:      {r:0.922, g:0.949, b:0.973},  // #EBF2F8 — selected card fill
  mutedIcon:   {r:0.604, g:0.686, b:0.753},  // #9AAFC0 — inactive nav icons
  heroDark:    {r:0.059, g:0.153, b:0.267},  // #0F2744 — hero gradient start
  divider:     {r:0.867, g:0.910, b:0.941},  // #DDE8F0 — rail divider
};
```

## Helper Pattern (repeated in every task — do not extract)

Every task's Plugin API script uses these two helpers. Copy them verbatim into each script.

```javascript
function mkRect(frame, x, y, w, h, fills, opts={}) {
  const r = figma.createRectangle();
  r.x=x; r.y=y; r.resize(w, h);
  if (fills) r.fills = fills;
  if (opts.radius)   r.cornerRadius = opts.radius;
  if (opts.strokes)  { r.strokes = opts.strokes; r.strokeWeight = opts.strokeWeight||1; }
  if (opts.shadow)   r.effects = [{type:'DROP_SHADOW',color:{r:0,g:0,b:0,a:0.07},offset:{x:0,y:2},radius:8,visible:true,blendMode:'NORMAL'}];
  if (opts.opacity != null) r.opacity = opts.opacity;
  frame.appendChild(r);
  return r;
}

async function mkText(frame, str, x, y, size, style, color, opts={}) {
  await figma.loadFontAsync({family:'Inter', style});
  const t = figma.createText();
  t.fontName = {family:'Inter', style};
  t.fontSize = size;
  t.characters = str;
  t.fills = [{type:'SOLID', color}];
  t.x=x; t.y=y;
  if (opts.width)  { t.textAutoResize='HEIGHT'; t.resize(opts.width, 40); }
  if (opts.align)  t.textAlignHorizontal = opts.align;
  if (opts.opacity != null) t.opacity = opts.opacity;
  if (opts.spacing) t.letterSpacing = {unit:'PERCENT', value:opts.spacing};
  frame.appendChild(t);
  return t;
}
```

---

## Task 1: Landing Page (frame `2:2`)

**Files:** Figma frame `2:2` (Landing Page)

- [ ] **Step 1: Screenshot before state**

  ```
  Call mcp__figma__get_screenshot with fileKey=CphSBIwuFQifjwBlS30jsM, nodeId=2:2
  ```
  Save the image to verify against after rebuilding.

- [ ] **Step 2: Rebuild the frame**

  Call `mcp__figma__use_figma` with `fileKey=CphSBIwuFQifjwBlS30jsM` and the following code:

  ```javascript
  (async () => {
    await figma.loadFontAsync({family:'Inter',style:'Regular'});
    await figma.loadFontAsync({family:'Inter',style:'Bold'});
    await figma.loadFontAsync({family:'Inter',style:'Extra Bold'});
    await figma.loadFontAsync({family:'Inter',style:'Semi Bold'});

    const C = {
      primaryDark:{r:0.106,g:0.227,b:0.361}, accent:{r:0.180,g:0.427,b:0.643},
      midBlue:{r:0.494,g:0.706,b:0.847},     tint:{r:0.784,g:0.875,b:0.933},
      pageBg:{r:0.941,g:0.957,b:0.973},      white:{r:1,g:1,b:1},
      textPri:{r:0.067,g:0.094,b:0.153},     textSec:{r:0.420,g:0.447,b:0.502},
      border:{r:0.847,g:0.894,b:0.929},      heroDark:{r:0.059,g:0.153,b:0.267},
    };

    const frame = figma.getNodeById('2:2');
    for (const c of [...frame.children]) c.remove();
    frame.fills = [{type:'SOLID',color:C.pageBg}];

    function mkRect(x,y,w,h,fills,opts={}) {
      const r=figma.createRectangle(); r.x=x;r.y=y;r.resize(w,h);
      if(fills)r.fills=fills;
      if(opts.radius)r.cornerRadius=opts.radius;
      if(opts.strokes){r.strokes=opts.strokes;r.strokeWeight=opts.strokeWeight||1;}
      if(opts.shadow)r.effects=[{type:'DROP_SHADOW',color:{r:0,g:0,b:0,a:0.07},offset:{x:0,y:2},radius:8,visible:true,blendMode:'NORMAL'}];
      frame.appendChild(r); return r;
    }
    async function mkText(str,x,y,size,style,color,opts={}) {
      await figma.loadFontAsync({family:'Inter',style});
      const t=figma.createText(); t.fontName={family:'Inter',style};
      t.fontSize=size; t.characters=str;
      t.fills=[{type:'SOLID',color}]; t.x=x;t.y=y;
      if(opts.width){t.textAutoResize='HEIGHT';t.resize(opts.width,40);}
      if(opts.align)t.textAlignHorizontal=opts.align;
      if(opts.opacity!=null)t.opacity=opts.opacity;
      if(opts.spacing)t.letterSpacing={unit:'PERCENT',value:opts.spacing};
      frame.appendChild(t); return t;
    }

    // ── HERO (0–620) ──────────────────────────────────────────────────────────

    // Full-bleed gradient background: top-left dark → bottom-right light
    mkRect(0,0,1440,620,[{
      type:'GRADIENT_LINEAR',
      gradientTransform:[[1,0,0],[1,0,0]],
      gradientStops:[
        {position:0,   color:{...C.heroDark,   a:1}},
        {position:0.35,color:{...C.primaryDark,a:1}},
        {position:0.7, color:{...C.accent,     a:1}},
        {position:1,   color:{...C.midBlue,    a:1}},
      ]
    }]);

    // Gradient fade: hero bottom bleeds into pageBg
    mkRect(0,560,1440,60,[{
      type:'GRADIENT_LINEAR',
      gradientTransform:[[0,0,0.5],[1,0,0]],
      gradientStops:[
        {position:0,color:{r:0,g:0,b:0,a:0}},
        {position:1,color:{...C.pageBg,a:1}},
      ]
    }]);

    // Nav: logo
    await mkText('GENWALLDECOR',48,18,13,'Bold',C.white,{spacing:8});

    // Nav: History link
    await mkText('History',1254,20,13,'Regular',C.white,{opacity:0.75});

    // Nav: Sign In pill
    mkRect(1332,12,90,32,
      [{type:'SOLID',color:{r:1,g:1,b:1},opacity:0}],
      {radius:16,strokes:[{type:'SOLID',color:C.white}],strokeWeight:1});
    await mkText('Sign In',1352,20,12,'Semi Bold',C.white);

    // Room widget (top-right, translucent glass card)
    mkRect(1200,62,184,124,
      [{type:'SOLID',color:C.white,opacity:0.12}],
      {radius:10,strokes:[{type:'SOLID',color:C.white,opacity:0.2}],strokeWeight:1});
    await mkText('YOUR ROOM',1218,74,8,'Bold',C.white,{opacity:0.7,spacing:10});

    // Room outline: back wall
    mkRect(1212,90,156,72,[{type:'SOLID',color:C.white,opacity:0.08}],{radius:4});
    // Left wall shading
    mkRect(1212,90,28,72,[{type:'SOLID',color:C.white,opacity:0.05}]);
    // Wall art highlight (the rendered piece)
    mkRect(1254,98,56,36,[{type:'SOLID',color:C.midBlue,opacity:0.85}],{radius:3});
    // Floor
    mkRect(1212,162,156,20,[{type:'SOLID',color:C.white,opacity:0.18}],{radius:2});
    await mkText('↑ visualized here',1216,173,8,'Regular',C.midBlue);

    // Hero title bottom-left
    await mkText('Design Your',80,476,68,'Extra Bold',C.white);
    await mkText('Perfect Wall',80,558,68,'Extra Bold',C.midBlue);

    // CTA button (below title, still in hero)
    mkRect(80,632,176,48,[{type:'SOLID',color:C.white}],{radius:8});
    await mkText('Start Creating',108,648,14,'Semi Bold',C.primaryDark);

    // ── BELOW FOLD (pageBg) ───────────────────────────────────────────────────

    mkRect(0,620,1440,280,[{type:'SOLID',color:C.pageBg}]);

    // How It Works heading
    await mkText('How It Works',0,640,24,'Bold',C.textPri,{width:1440,align:'CENTER'});

    // 3 step cards
    const cards = [
      {x:252,emoji:'🎨',step:'Step 1',title:'Choose Your Style',   body:'Pick from 20 curated decor styles.'},
      {x:590,emoji:'✏️',step:'Step 2',title:'Review AI Descriptions',body:'AI creates tailored art descriptions.'},
      {x:920,emoji:'🖼️',step:'Step 3',title:'See Your Wall',        body:'Get a complete wall visualization.'},
    ];
    for (const d of cards) {
      mkRect(d.x,674,260,148,[{type:'SOLID',color:C.white}],
        {radius:8,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1,shadow:true});
      await mkText(d.emoji,  d.x+16,686,20,'Regular',C.textPri);
      await mkText(d.step,   d.x+16,714,11,'Semi Bold',C.accent);
      await mkText(d.title,  d.x+16,730,14,'Bold',C.textPri,{width:228});
      await mkText(d.body,   d.x+16,752,12,'Regular',C.textSec,{width:228});
    }

    // CTA banner
    mkRect(420,836,600,48,[{type:'SOLID',color:C.white}],
      {radius:8,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1,shadow:true});
    await mkText('Ready to transform your space?',540,848,14,'Bold',C.textPri,{width:360,align:'CENTER'});
    mkRect(908,828,144,48,[{type:'SOLID',color:C.primaryDark}],{radius:8});
    await mkText('Get Started',932,844,13,'Semi Bold',C.white);

    figma.closePlugin('Landing page rebuilt ✓');
  })();
  ```

- [ ] **Step 3: Screenshot after state**

  Call `mcp__figma__get_screenshot` with `fileKey=CphSBIwuFQifjwBlS30jsM`, `nodeId=2:2`. Confirm:
  - Dark-to-light gradient hero fills top 620px
  - "Design Your / Perfect Wall" title is large, bottom-left
  - Room widget is top-right (semi-transparent card with room outline and art highlight)
  - "How It Works" 3 cards are on light background below
  - No old content remains

---

## Task 2: Create — Step 1 (frame `3:2`)

**Files:** Figma frame `3:2`

- [ ] **Step 1: Screenshot before state**

  ```
  Call mcp__figma__get_screenshot with fileKey=CphSBIwuFQifjwBlS30jsM, nodeId=3:2
  ```

- [ ] **Step 2: Rebuild the frame**

  ```javascript
  (async () => {
    await figma.loadFontAsync({family:'Inter',style:'Regular'});
    await figma.loadFontAsync({family:'Inter',style:'Bold'});
    await figma.loadFontAsync({family:'Inter',style:'Semi Bold'});

    const C = {
      primaryDark:{r:0.106,g:0.227,b:0.361}, accent:{r:0.180,g:0.427,b:0.643},
      midBlue:{r:0.494,g:0.706,b:0.847},     tint:{r:0.784,g:0.875,b:0.933},
      pageBg:{r:0.941,g:0.957,b:0.973},      white:{r:1,g:1,b:1},
      textPri:{r:0.067,g:0.094,b:0.153},     textSec:{r:0.420,g:0.447,b:0.502},
      border:{r:0.847,g:0.894,b:0.929},      ebf2f8:{r:0.922,g:0.949,b:0.973},
    };

    const frame = figma.getNodeById('3:2');
    for (const c of [...frame.children]) c.remove();
    frame.fills = [{type:'SOLID',color:C.pageBg}];

    function mkRect(x,y,w,h,fills,opts={}) {
      const r=figma.createRectangle(); r.x=x;r.y=y;r.resize(w,h);
      if(fills)r.fills=fills;
      if(opts.radius)r.cornerRadius=opts.radius;
      if(opts.strokes){r.strokes=opts.strokes;r.strokeWeight=opts.strokeWeight||1;}
      if(opts.shadow)r.effects=[{type:'DROP_SHADOW',color:{r:0,g:0,b:0,a:0.07},offset:{x:0,y:2},radius:8,visible:true,blendMode:'NORMAL'}];
      frame.appendChild(r); return r;
    }
    async function mkText(str,x,y,size,style,color,opts={}) {
      await figma.loadFontAsync({family:'Inter',style});
      const t=figma.createText(); t.fontName={family:'Inter',style};
      t.fontSize=size; t.characters=str;
      t.fills=[{type:'SOLID',color}]; t.x=x;t.y=y;
      if(opts.width){t.textAutoResize='HEIGHT';t.resize(opts.width,40);}
      if(opts.align)t.textAlignHorizontal=opts.align;
      if(opts.opacity!=null)t.opacity=opts.opacity;
      frame.appendChild(t); return t;
    }

    // ── NAV ───────────────────────────────────────────────────────────────────
    mkRect(0,0,1440,56,[{type:'SOLID',color:C.white}],
      {strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    await mkText('GENWALLDECOR',48,18,13,'Bold',C.primaryDark,{spacing:8});
    // No right-side nav items on Create flow

    // ── STEP INDICATOR ────────────────────────────────────────────────────────
    // Step 1 active, Steps 2–3 upcoming
    const stepCenters = [612+16, 720+16, 828+16];
    const stepLabels  = ['1','2','3'];
    for (let i=0;i<3;i++) {
      const active = i===0;
      const cx = stepCenters[i];
      // Circle
      const circ=figma.createEllipse();
      circ.x=cx-16; circ.y=72; circ.resize(32,32);
      circ.fills=[{type:'SOLID',color: active?C.primaryDark:C.pageBg}];
      if(!active){circ.strokes=[{type:'SOLID',color:C.tint}];circ.strokeWeight=2;}
      frame.appendChild(circ);
      await mkText(stepLabels[i],cx-4,80,13,'Bold', active?C.white:C.textSec);
      // Connector line (between circles)
      if(i<2){
        mkRect(cx+16,87,76,2,[{type:'SOLID',color:C.border}]);
      }
    }
    await mkText('Step 1 of 3',0,116,13,'Regular',C.textSec,{width:1440,align:'CENTER'});

    // ── PAGE HEADING ──────────────────────────────────────────────────────────
    await mkText('Choose Your Style',0,148,32,'Bold',C.textPri,{width:1440,align:'CENTER'});
    await mkText('Select a decor style to get started.',0,192,15,'Regular',C.textSec,{width:1440,align:'CENTER'});

    // ── STYLE GRID (3 columns × 4 rows) ───────────────────────────────────────
    const styles = [
      'Minimalist','Bohemian','Scandinavian',
      'Industrial','Mid-Century Modern','Japandi',
      'Contemporary','Art Deco','Rustic',
      'Coastal','Maximalist','Nordic',
    ];
    const cols=[160,494,828]; let row=0, col=0;
    for (let i=0;i<styles.length;i++) {
      const x=cols[col]; const y=232+(row*128);
      const selected=i===0;
      mkRect(x,y,260,110,
        [{type:'SOLID',color: selected?C.ebf2f8:C.white}],
        {radius:8,
         strokes:[{type:'SOLID',color: selected?C.primaryDark:C.border}],
         strokeWeight: selected?2:1,
         shadow:true});
      await mkText(styles[i],x+14,y+14,14,'Bold',C.textPri,{width:232});
      if(selected){
        // Checkmark badge top-right
        const badge=figma.createEllipse();
        badge.x=x+228;badge.y=y+8;badge.resize(20,20);
        badge.fills=[{type:'SOLID',color:C.primaryDark}];
        frame.appendChild(badge);
        await mkText('✓',x+233,y+11,10,'Bold',C.white);
        await mkText('✓ Selected',x+14,y+36,11,'Regular',C.accent);
      }
      col++; if(col===3){col=0;row++;}
    }

    // ── BOTTOM ACTION BAR ─────────────────────────────────────────────────────
    mkRect(0,836,1440,64,[{type:'SOLID',color:C.white}],
      {strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    await mkText('Select a style to continue',596,856,13,'Regular',C.textSec);
    // Next button
    mkRect(1292,848,120,40,[{type:'SOLID',color:C.primaryDark}],{radius:8});
    await mkText('Next →',1322,860,13,'Semi Bold',C.white);

    figma.closePlugin('Create Step 1 rebuilt ✓');
  })();
  ```

- [ ] **Step 3: Screenshot after state**

  Call `mcp__figma__get_screenshot`, `nodeId=3:2`. Confirm:
  - White top nav bar, "GENWALLDECOR" in dark text
  - Step 1 circle filled #1B3A5C, Steps 2–3 outlined
  - "Minimalist" card selected (blue border + ebf2f8 fill + checkmark)
  - Bottom action bar with "Next →" button

---

## Task 3: Create — Step 2 (frame `4:2`)

**Files:** Figma frame `4:2`

- [ ] **Step 1: Screenshot before state**

  ```
  Call mcp__figma__get_screenshot with fileKey=CphSBIwuFQifjwBlS30jsM, nodeId=4:2
  ```

- [ ] **Step 2: Rebuild the frame**

  ```javascript
  (async () => {
    await figma.loadFontAsync({family:'Inter',style:'Regular'});
    await figma.loadFontAsync({family:'Inter',style:'Bold'});
    await figma.loadFontAsync({family:'Inter',style:'Semi Bold'});

    const C = {
      primaryDark:{r:0.106,g:0.227,b:0.361}, accent:{r:0.180,g:0.427,b:0.643},
      tint:{r:0.784,g:0.875,b:0.933},        pageBg:{r:0.941,g:0.957,b:0.973},
      white:{r:1,g:1,b:1},                   textPri:{r:0.067,g:0.094,b:0.153},
      textSec:{r:0.420,g:0.447,b:0.502},     border:{r:0.847,g:0.894,b:0.929},
      ebf2f8:{r:0.922,g:0.949,b:0.973},
    };

    const frame = figma.getNodeById('4:2');
    for (const c of [...frame.children]) c.remove();
    frame.fills = [{type:'SOLID',color:C.pageBg}];

    function mkRect(x,y,w,h,fills,opts={}) {
      const r=figma.createRectangle(); r.x=x;r.y=y;r.resize(w,h);
      if(fills)r.fills=fills;
      if(opts.radius)r.cornerRadius=opts.radius;
      if(opts.strokes){r.strokes=opts.strokes;r.strokeWeight=opts.strokeWeight||1;}
      frame.appendChild(r); return r;
    }
    async function mkText(str,x,y,size,style,color,opts={}) {
      await figma.loadFontAsync({family:'Inter',style});
      const t=figma.createText(); t.fontName={family:'Inter',style};
      t.fontSize=size; t.characters=str;
      t.fills=[{type:'SOLID',color}]; t.x=x;t.y=y;
      if(opts.width){t.textAutoResize='HEIGHT';t.resize(opts.width,40);}
      if(opts.align)t.textAlignHorizontal=opts.align;
      frame.appendChild(t); return t;
    }

    // Nav
    mkRect(0,0,1440,56,[{type:'SOLID',color:C.white}],
      {strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    await mkText('GENWALLDECOR',48,18,13,'Bold',C.primaryDark,{spacing:8});

    // Step indicator: step 1 complete (accent), step 2 active (primaryDark), step 3 upcoming
    const stepCx = [628,720,828+16];
    const stepFills = [C.accent, C.primaryDark, C.pageBg];
    const stepStrokes = [null, null, C.tint];
    const stepNums = ['✓','2','3'];
    for(let i=0;i<3;i++){
      const circ=figma.createEllipse();
      circ.x=stepCx[i]-16;circ.y=72;circ.resize(32,32);
      circ.fills=[{type:'SOLID',color:stepFills[i]}];
      if(stepStrokes[i]){circ.strokes=[{type:'SOLID',color:stepStrokes[i]}];circ.strokeWeight=2;}
      frame.appendChild(circ);
      await mkText(stepNums[i],stepCx[i]-5,80,13,'Bold',stepFills[i]===C.pageBg?C.textSec:C.white);
      if(i<2) mkRect(stepCx[i]+16,87,76,2,[{type:'SOLID',color:C.border}]);
    }
    await mkText('Step 2 of 3',0,116,13,'Regular',C.textSec,{width:1440,align:'CENTER'});
    await mkText('Visual Preferences',0,148,32,'Bold',C.textPri,{width:1440,align:'CENTER'});
    await mkText('Choose your color scheme and frame material.',0,192,15,'Regular',C.textSec,{width:1440,align:'CENTER'});

    // Color scheme section
    await mkText('Color Scheme',200,250,16,'Bold',C.textPri);
    await mkText('Select all that apply',200,274,13,'Regular',C.textSec);

    const chips = ['Warm Neutrals','Cool Blues','Earthy Tones','Monochrome','Bold Accents','Pastels'];
    let cx=200;
    for(const chip of chips){
      const w=chip.length*8+24;
      mkRect(cx,308,w,36,[{type:'SOLID',color:C.white}],
        {radius:18,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
      await mkText(chip,cx+12,320,13,'Regular',C.textPri);
      cx+=w+8;
    }

    // Frame material section
    await mkText('Frame Material',200,390,16,'Bold',C.textPri);
    const materials=['Wood','Metal','No Frame','Floating'];
    let mx=200;
    for(let i=0;i<materials.length;i++){
      const selected=i===0;
      mkRect(mx,428,160,52,
        [{type:'SOLID',color:selected?C.ebf2f8:C.white}],
        {radius:8,strokes:[{type:'SOLID',color:selected?C.primaryDark:C.border}],strokeWeight:selected?2:1});
      await mkText(materials[i],mx+(160/2)-20,448,14,'Bold',selected?C.primaryDark:C.textPri);
      mx+=176;
    }

    // Bottom action bar
    mkRect(0,836,1440,64,[{type:'SOLID',color:C.white}],
      {strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    mkRect(1180,848,100,40,[{type:'SOLID',color:C.pageBg}],
      {radius:8,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    await mkText('← Back',1198,860,13,'Semi Bold',C.textSec);
    mkRect(1292,848,120,40,[{type:'SOLID',color:C.primaryDark}],{radius:8});
    await mkText('Next →',1322,860,13,'Semi Bold',C.white);

    figma.closePlugin('Create Step 2 rebuilt ✓');
  })();
  ```

- [ ] **Step 3: Screenshot after state**

  Call `mcp__figma__get_screenshot`, `nodeId=4:2`. Confirm:
  - Step 1 circle is accent blue (complete), Step 2 is primaryDark (active), Step 3 outlined
  - Color chip pills in a row with border
  - "Wood" frame material card selected (blue border + ebf2f8)

---

## Task 4: Create — Step 3 (frame `5:2`)

**Files:** Figma frame `5:2`

- [ ] **Step 1: Screenshot before state**

  ```
  Call mcp__figma__get_screenshot with fileKey=CphSBIwuFQifjwBlS30jsM, nodeId=5:2
  ```

- [ ] **Step 2: Rebuild the frame**

  ```javascript
  (async () => {
    await figma.loadFontAsync({family:'Inter',style:'Regular'});
    await figma.loadFontAsync({family:'Inter',style:'Bold'});
    await figma.loadFontAsync({family:'Inter',style:'Semi Bold'});

    const C = {
      primaryDark:{r:0.106,g:0.227,b:0.361}, accent:{r:0.180,g:0.427,b:0.643},
      tint:{r:0.784,g:0.875,b:0.933},        pageBg:{r:0.941,g:0.957,b:0.973},
      white:{r:1,g:1,b:1},                   textPri:{r:0.067,g:0.094,b:0.153},
      textSec:{r:0.420,g:0.447,b:0.502},     border:{r:0.847,g:0.894,b:0.929},
      placeholder:{r:0.612,g:0.639,b:0.675}, // #9CA3AF
    };

    const frame = figma.getNodeById('5:2');
    for (const c of [...frame.children]) c.remove();
    frame.fills = [{type:'SOLID',color:C.pageBg}];

    function mkRect(x,y,w,h,fills,opts={}) {
      const r=figma.createRectangle(); r.x=x;r.y=y;r.resize(w,h);
      if(fills)r.fills=fills;
      if(opts.radius)r.cornerRadius=opts.radius;
      if(opts.strokes){r.strokes=opts.strokes;r.strokeWeight=opts.strokeWeight||1;}
      frame.appendChild(r); return r;
    }
    async function mkText(str,x,y,size,style,color,opts={}) {
      await figma.loadFontAsync({family:'Inter',style});
      const t=figma.createText(); t.fontName={family:'Inter',style};
      t.fontSize=size; t.characters=str;
      t.fills=[{type:'SOLID',color}]; t.x=x;t.y=y;
      if(opts.width){t.textAutoResize='HEIGHT';t.resize(opts.width,40);}
      if(opts.align)t.textAlignHorizontal=opts.align;
      frame.appendChild(t); return t;
    }

    // Nav
    mkRect(0,0,1440,56,[{type:'SOLID',color:C.white}],
      {strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    await mkText('GENWALLDECOR',48,18,13,'Bold',C.primaryDark,{spacing:8});

    // Step indicator: steps 1+2 complete, step 3 active
    const stepCx=[628,720,844];
    const stepFills=[C.accent,C.accent,C.primaryDark];
    const stepNums=['✓','✓','3'];
    for(let i=0;i<3;i++){
      const circ=figma.createEllipse();
      circ.x=stepCx[i]-16;circ.y=72;circ.resize(32,32);
      circ.fills=[{type:'SOLID',color:stepFills[i]}];
      frame.appendChild(circ);
      await mkText(stepNums[i],stepCx[i]-5,80,13,'Bold',C.white);
      if(i<2) mkRect(stepCx[i]+16,87,76,2,[{type:'SOLID',color:C.border}]);
    }
    await mkText('Step 3 of 3',0,116,13,'Regular',C.textSec,{width:1440,align:'CENTER'});
    await mkText('Room Context',0,148,32,'Bold',C.textPri,{width:1440,align:'CENTER'});
    await mkText('Tell us about your room so we can tailor the arrangement.',0,192,15,'Regular',C.textSec,{width:1440,align:'CENTER'});

    // Room Type label
    await mkText('Room Type',360,258,16,'Bold',C.textPri);

    // Dropdown
    mkRect(360,292,720,48,[{type:'SOLID',color:C.white}],
      {radius:8,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    await mkText('Living Room',380,308,14,'Regular',C.textPri);
    await mkText('▼',1056,310,12,'Regular',C.textSec);

    // Wall Dimensions label
    await mkText('Wall Dimensions (optional)',360,376,16,'Bold',C.textPri);
    await mkText('Helps AI proportion the arrangement correctly.',360,404,13,'Regular',C.textSec);

    // Two dimension inputs
    mkRect(360,434,300,48,[{type:'SOLID',color:C.white}],
      {radius:8,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    await mkText('Width (inches)',380,450,13,'Regular',C.placeholder);

    await mkText('×',694,450,18,'Regular',C.textSec);

    mkRect(720,434,300,48,[{type:'SOLID',color:C.white}],
      {radius:8,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    await mkText('Height (inches)',740,450,13,'Regular',C.placeholder);

    // Bottom action bar
    mkRect(0,836,1440,64,[{type:'SOLID',color:C.white}],
      {strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    mkRect(1180,848,100,40,[{type:'SOLID',color:C.pageBg}],
      {radius:8,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    await mkText('← Back',1198,860,13,'Semi Bold',C.textSec);
    mkRect(1284,848,148,40,[{type:'SOLID',color:C.primaryDark}],{radius:8});
    await mkText('Generate →',1300,860,13,'Semi Bold',C.white);

    figma.closePlugin('Create Step 3 rebuilt ✓');
  })();
  ```

- [ ] **Step 3: Screenshot after state**

  Call `mcp__figma__get_screenshot`, `nodeId=5:2`. Confirm:
  - Steps 1 and 2 circles are accent (complete ✓), Step 3 is primaryDark (active)
  - Styled dropdown and two dimension inputs visible
  - "Generate →" primary button in bottom bar

---

## Task 5: Generate / Review Descriptions (frame `6:2`)

**Files:** Figma frame `6:2`

- [ ] **Step 1: Screenshot before state**

  ```
  Call mcp__figma__get_screenshot with fileKey=CphSBIwuFQifjwBlS30jsM, nodeId=6:2
  ```

- [ ] **Step 2: Rebuild the frame**

  ```javascript
  (async () => {
    await figma.loadFontAsync({family:'Inter',style:'Regular'});
    await figma.loadFontAsync({family:'Inter',style:'Bold'});
    await figma.loadFontAsync({family:'Inter',style:'Semi Bold'});

    const C = {
      primaryDark:{r:0.106,g:0.227,b:0.361}, accent:{r:0.180,g:0.427,b:0.643},
      pageBg:{r:0.941,g:0.957,b:0.973},      white:{r:1,g:1,b:1},
      textPri:{r:0.067,g:0.094,b:0.153},     textSec:{r:0.420,g:0.447,b:0.502},
      border:{r:0.847,g:0.894,b:0.929},      placeholder:{r:0.612,g:0.639,b:0.675},
    };

    const frame = figma.getNodeById('6:2');
    for (const c of [...frame.children]) c.remove();
    frame.fills = [{type:'SOLID',color:C.pageBg}];

    function mkRect(x,y,w,h,fills,opts={}) {
      const r=figma.createRectangle(); r.x=x;r.y=y;r.resize(w,h);
      if(fills)r.fills=fills;
      if(opts.radius)r.cornerRadius=opts.radius;
      if(opts.strokes){r.strokes=opts.strokes;r.strokeWeight=opts.strokeWeight||1;}
      if(opts.shadow)r.effects=[{type:'DROP_SHADOW',color:{r:0,g:0,b:0,a:0.06},offset:{x:0,y:2},radius:8,visible:true,blendMode:'NORMAL'}];
      frame.appendChild(r); return r;
    }
    async function mkText(str,x,y,size,style,color,opts={}) {
      await figma.loadFontAsync({family:'Inter',style});
      const t=figma.createText(); t.fontName={family:'Inter',style};
      t.fontSize=size; t.characters=str;
      t.fills=[{type:'SOLID',color}]; t.x=x;t.y=y;
      if(opts.width){t.textAutoResize='HEIGHT';t.resize(opts.width,40);}
      if(opts.align)t.textAlignHorizontal=opts.align;
      frame.appendChild(t); return t;
    }

    // Nav
    mkRect(0,0,1440,56,[{type:'SOLID',color:C.white}],
      {strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    await mkText('GENWALLDECOR',48,18,13,'Bold',C.primaryDark,{spacing:8});

    // Page heading
    await mkText('Review Your Descriptions',360,76,28,'Bold',C.textPri,{width:720});
    await mkText('Style: Minimalist  ·  Edit any description before generating images.',360,116,14,'Regular',C.textSec,{width:720});

    // 5 description cards
    const pieces = [
      {n:'1',title:'Abstract Geometric Canvas',      body:'Large-format canvas featuring interlocking geometric shapes in muted grays.'},
      {n:'2',title:'Monochrome Photography Print',   body:'Black and white architectural photo, 24×36", fine grain texture.'},
      {n:'3',title:'Minimalist Line Drawing',         body:'Simple line illustration of a botanical form, unframed on white paper.'},
      {n:'4',title:'Textured Linen Wall Hanging',    body:'Hand-woven natural linen wall hanging, 18×24", earth tones.'},
      {n:'5',title:'Sculptural Ceramic Wall Panel',  body:'Set of three ceramic wall tiles in matte white with subtle relief.'},
    ];
    for(let i=0;i<pieces.length;i++){
      const p=pieces[i]; const y=148+(i*100);
      mkRect(360,y,720,88,[{type:'SOLID',color:C.white}],
        {radius:8,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1,shadow:true});
      await mkText(`${p.n}. ${p.title}`,376,y+14,14,'Bold',C.textPri,{width:680});
      await mkText(p.body,376,y+36,13,'Regular',C.textSec,{width:680});
      await mkText('Regenerate this piece →',376,y+62,12,'Regular',C.accent);
    }

    // Refinement box
    mkRect(360,656,720,100,[{type:'SOLID',color:C.white}],
      {radius:8,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1,shadow:true});
    await mkText('Want different descriptions?',376,668,14,'Bold',C.textPri);
    mkRect(376,692,580,36,[{type:'SOLID',color:C.pageBg}],
      {radius:6,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    await mkText('e.g. Make them more colorful, add abstract pieces...',388,704,12,'Regular',C.placeholder);
    mkRect(376,730,144,32,[{type:'SOLID',color:C.pageBg}],
      {radius:6,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    await mkText('Regenerate All',390,740,12,'Semi Bold',C.textPri);

    // Generate Images CTA (prominent full-width button at bottom)
    mkRect(360,772,720,60,[{type:'SOLID',color:C.primaryDark}],{radius:8});
    await mkText('Generate Images',0,793,16,'Bold',C.white,{width:1440,align:'CENTER'});

    figma.closePlugin('Generate/Review rebuilt ✓');
  })();
  ```

- [ ] **Step 3: Screenshot after state**

  Call `mcp__figma__get_screenshot`, `nodeId=6:2`. Confirm:
  - 5 description cards stacked vertically with piece titles and "Regenerate this piece →" links in accent blue
  - Refinement text input + "Regenerate All" secondary button
  - "Generate Images" full-width primaryDark CTA at bottom

---

## Task 6: Wall View (frame `7:2`)

**Files:** Figma frame `7:2`

- [ ] **Step 1: Screenshot before state**

  ```
  Call mcp__figma__get_screenshot with fileKey=CphSBIwuFQifjwBlS30jsM, nodeId=7:2
  ```

- [ ] **Step 2: Rebuild the frame**

  ```javascript
  (async () => {
    await figma.loadFontAsync({family:'Inter',style:'Regular'});
    await figma.loadFontAsync({family:'Inter',style:'Bold'});
    await figma.loadFontAsync({family:'Inter',style:'Semi Bold'});

    const C = {
      primaryDark:{r:0.106,g:0.227,b:0.361}, accent:{r:0.180,g:0.427,b:0.643},
      midBlue:{r:0.494,g:0.706,b:0.847},     tint:{r:0.784,g:0.875,b:0.933},
      pageBg:{r:0.941,g:0.957,b:0.973},      white:{r:1,g:1,b:1},
      textPri:{r:0.067,g:0.094,b:0.153},     textSec:{r:0.420,g:0.447,b:0.502},
      border:{r:0.847,g:0.894,b:0.929},      ebf2f8:{r:0.922,g:0.949,b:0.973},
      mutedIcon:{r:0.604,g:0.686,b:0.753},   divider:{r:0.867,g:0.910,b:0.941},
    };

    const frame = figma.getNodeById('7:2');
    for (const c of [...frame.children]) c.remove();
    frame.fills = [{type:'SOLID',color:C.pageBg}];

    function mkRect(x,y,w,h,fills,opts={}) {
      const r=figma.createRectangle(); r.x=x;r.y=y;r.resize(w,h);
      if(fills)r.fills=fills;
      if(opts.radius)r.cornerRadius=opts.radius;
      if(opts.strokes){r.strokes=opts.strokes;r.strokeWeight=opts.strokeWeight||1;}
      if(opts.shadow)r.effects=[{type:'DROP_SHADOW',color:{r:0,g:0,b:0,a:0.06},offset:{x:0,y:2},radius:8,visible:true,blendMode:'NORMAL'}];
      frame.appendChild(r); return r;
    }
    async function mkText(str,x,y,size,style,color,opts={}) {
      await figma.loadFontAsync({family:'Inter',style});
      const t=figma.createText(); t.fontName={family:'Inter',style};
      t.fontSize=size; t.characters=str;
      t.fills=[{type:'SOLID',color}]; t.x=x;t.y=y;
      if(opts.width){t.textAutoResize='HEIGHT';t.resize(opts.width,40);}
      if(opts.align)t.textAlignHorizontal=opts.align;
      frame.appendChild(t); return t;
    }

    // ── FLOATING ICON RAIL (0–59) — same pageBg, no border ───────────────────
    // Rail background (invisible — same as page)
    mkRect(0,0,60,900,[{type:'SOLID',color:C.pageBg}]);

    // Logo mark
    mkRect(13,16,34,34,[{type:'SOLID',color:C.primaryDark}],{radius:8});
    await mkText('G',22,23,14,'Bold',C.white);

    // Wall View icon (active) — dark pill
    mkRect(10,68,40,40,[{type:'SOLID',color:C.primaryDark}],{radius:10});
    await mkText('⊞',18,78,18,'Regular',C.white); // wall/grid icon

    // History icon (inactive)
    await mkText('⏱',18,122,18,'Regular',C.mutedIcon); // clock icon

    // New Wall icon (inactive)
    await mkText('✦',18,170,16,'Regular',C.mutedIcon); // star/new icon

    // Avatar at bottom
    const avatar=figma.createEllipse();
    avatar.x=14;avatar.y=850;avatar.resize(32,32);
    avatar.fills=[{type:'SOLID',color:C.tint}];
    frame.appendChild(avatar);
    await mkText('A',23,858,12,'Bold',C.primaryDark);

    // Subtle divider line between rail and content
    mkRect(60,0,1,900,[{type:'SOLID',color:C.divider}]);

    // ── MAIN CONTENT (x=72+) ─────────────────────────────────────────────────
    // Page title
    await mkText('Your Wall — Minimalist',80,20,22,'Bold',C.textPri);
    await mkText('Style: Minimalist  ·  5 pieces  ·  Mar 25, 2026',80,50,13,'Regular',C.textSec);

    // Wall render (16:9 aspect = 855×481 within content area)
    mkRect(80,78,855,481,[{type:'SOLID',color:C.tint}],
      {radius:8,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    await mkText('[Wall Render — 16:9]',420,318,16,'Regular',C.accent,{width:200,align:'CENTER'});

    // Dot overlays (5 interactive dots on wall render)
    const dots=[{x:230,y:270},{x:390,y:330},{x:560,y:240},{x:690,y:370},{x:490,y:450}];
    for(const d of dots){
      const dot=figma.createEllipse();
      dot.x=d.x;dot.y=d.y;dot.resize(12,12);
      dot.fills=[{type:'SOLID',color:C.accent}];
      dot.strokes=[{type:'SOLID',color:C.white}];
      dot.strokeWeight=2;
      frame.appendChild(dot);
    }

    // Tooltip on first dot
    mkRect(186,238,164,48,[{type:'SOLID',color:C.textPri}],{radius:6});
    await mkText('Abstract Canvas',196,248,11,'Bold',C.white);
    await mkText('Buy a frame  ·  Print this',196,264,10,'Regular',C.midBlue);

    // Action bar below render
    mkRect(80,571,855,44,[{type:'SOLID',color:C.white}],
      {radius:8,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    mkRect(88,579,210,28,[{type:'SOLID',color:C.pageBg}],
      {radius:6,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    await mkText('Regenerate Selected (2)',96,587,11,'Semi Bold',C.textPri);
    mkRect(306,579,168,28,[{type:'SOLID',color:C.pageBg}],
      {radius:6,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    await mkText('Update Wall Render',314,587,11,'Semi Bold',C.textPri);
    mkRect(482,579,120,28,[{type:'SOLID',color:C.primaryDark}],{radius:6});
    await mkText('Finalize Wall',494,587,11,'Semi Bold',C.white);
    await mkText('3 regenerations used',614,587,11,'Regular',C.textSec);

    // Individual Pieces section
    await mkText('Individual Pieces',80,628,17,'Bold',C.textPri);
    const pieceNames=['Abstract Canvas','Photo Print','Line Drawing','Linen Hanging'];
    for(let i=0;i<pieceNames.length;i++){
      const px=80+(i*136); const py=654;
      const selected=i<2;
      mkRect(px,py,120,120,[{type:'SOLID',color:C.white}],
        {radius:8,strokes:[{type:'SOLID',color:selected?C.primaryDark:C.border}],strokeWeight:selected?2:1,shadow:true});
      // Checkbox
      mkRect(px+4,py+4,16,16,[{type:'SOLID',color:selected?C.primaryDark:C.white}],
        {radius:3,strokes:[{type:'SOLID',color:selected?C.primaryDark:C.border}],strokeWeight:1});
      if(selected) await mkText('✓',px+7,py+6,9,'Bold',C.white);
      // Version nav arrows
      await mkText('‹',px+4,py+56,14,'Bold',C.textSec);
      await mkText('›',px+100,py+56,14,'Bold',C.textSec);
      await mkText(pieceNames[i],px,py+126,10,'Regular',C.textSec,{width:120,align:'CENTER'});
    }

    // Detail panel (right side)
    mkRect(956,78,420,530,[{type:'SOLID',color:C.white}],
      {radius:8,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1,shadow:true});
    await mkText('DETAILS',972,94,10,'Bold',C.textSec,{spacing:8});
    await mkText('Abstract Canvas',972,114,18,'Bold',C.textPri,{width:380});
    await mkText('Large-format geometric canvas in muted grays.',972,140,13,'Regular',C.textSec,{width:380});
    mkRect(972,168,380,1,[{type:'SOLID',color:C.border}]);
    await mkText('Medium: Oil on Canvas',972,182,12,'Regular',C.textSec);
    await mkText('Dimensions: 36×48"',972,202,12,'Regular',C.textSec);
    await mkText('Placement: Center above sofa',972,222,12,'Regular',C.textSec);
    mkRect(972,248,380,1,[{type:'SOLID',color:C.border}]);
    await mkText('Buy a frame →',972,264,13,'Regular',C.accent);
    await mkText('Print this poster →',972,284,13,'Regular',C.accent);
    await mkText('Download artwork →',972,304,13,'Regular',C.accent);

    figma.closePlugin('Wall View rebuilt ✓');
  })();
  ```

- [ ] **Step 3: Screenshot after state**

  Call `mcp__figma__get_screenshot`, `nodeId=7:2`. Confirm:
  - Floating icon rail (60px wide, same background as page, no visible border/shadow)
  - Wall View icon active (dark pill), History + New icons muted
  - Full-width 16:9 wall render placeholder
  - Action bar with Regenerate / Update / Finalize buttons
  - Piece thumbnails strip with checkboxes
  - Detail panel on the right

---

## Task 7: History (frame `8:2`)

**Files:** Figma frame `8:2`

- [ ] **Step 1: Screenshot before state**

  ```
  Call mcp__figma__get_screenshot with fileKey=CphSBIwuFQifjwBlS30jsM, nodeId=8:2
  ```

- [ ] **Step 2: Rebuild the frame**

  ```javascript
  (async () => {
    await figma.loadFontAsync({family:'Inter',style:'Regular'});
    await figma.loadFontAsync({family:'Inter',style:'Bold'});
    await figma.loadFontAsync({family:'Inter',style:'Semi Bold'});

    const C = {
      primaryDark:{r:0.106,g:0.227,b:0.361}, accent:{r:0.180,g:0.427,b:0.643},
      tint:{r:0.784,g:0.875,b:0.933},        pageBg:{r:0.941,g:0.957,b:0.973},
      white:{r:1,g:1,b:1},                   textPri:{r:0.067,g:0.094,b:0.153},
      textSec:{r:0.420,g:0.447,b:0.502},     border:{r:0.847,g:0.894,b:0.929},
      mutedIcon:{r:0.604,g:0.686,b:0.753},   divider:{r:0.867,g:0.910,b:0.941},
    };

    const frame = figma.getNodeById('8:2');
    for (const c of [...frame.children]) c.remove();
    frame.fills = [{type:'SOLID',color:C.pageBg}];

    function mkRect(x,y,w,h,fills,opts={}) {
      const r=figma.createRectangle(); r.x=x;r.y=y;r.resize(w,h);
      if(fills)r.fills=fills;
      if(opts.radius)r.cornerRadius=opts.radius;
      if(opts.strokes){r.strokes=opts.strokes;r.strokeWeight=opts.strokeWeight||1;}
      if(opts.shadow)r.effects=[{type:'DROP_SHADOW',color:{r:0,g:0,b:0,a:0.06},offset:{x:0,y:2},radius:8,visible:true,blendMode:'NORMAL'}];
      frame.appendChild(r); return r;
    }
    async function mkText(str,x,y,size,style,color,opts={}) {
      await figma.loadFontAsync({family:'Inter',style});
      const t=figma.createText(); t.fontName={family:'Inter',style};
      t.fontSize=size; t.characters=str;
      t.fills=[{type:'SOLID',color}]; t.x=x;t.y=y;
      if(opts.width){t.textAutoResize='HEIGHT';t.resize(opts.width,40);}
      if(opts.align)t.textAlignHorizontal=opts.align;
      frame.appendChild(t); return t;
    }

    // ── FLOATING ICON RAIL (same as Wall View, History icon active) ───────────
    mkRect(0,0,60,900,[{type:'SOLID',color:C.pageBg}]);

    // Logo
    mkRect(13,16,34,34,[{type:'SOLID',color:C.primaryDark}],{radius:8});
    await mkText('G',22,23,14,'Bold',C.white);

    // Wall View icon (inactive)
    await mkText('⊞',18,78,18,'Regular',C.mutedIcon);

    // History icon (active) — dark pill
    mkRect(10,114,40,40,[{type:'SOLID',color:C.primaryDark}],{radius:10});
    await mkText('⏱',18,124,18,'Regular',C.white);

    // New Wall icon (inactive)
    await mkText('✦',18,170,16,'Regular',C.mutedIcon);

    // Avatar
    const avatar=figma.createEllipse();
    avatar.x=14;avatar.y=850;avatar.resize(32,32);
    avatar.fills=[{type:'SOLID',color:C.tint}];
    frame.appendChild(avatar);
    await mkText('A',23,858,12,'Bold',C.primaryDark);

    // Divider
    mkRect(60,0,1,900,[{type:'SOLID',color:C.divider}]);

    // ── MAIN CONTENT ──────────────────────────────────────────────────────────
    await mkText('Your Generations',80,24,24,'Bold',C.textPri);
    await mkText('Your most recent wall designs',80,58,14,'Regular',C.textSec);

    // 3 generation cards (3-column grid)
    const gens=[
      {style:'Minimalist',  date:'Mar 25, 2026'},
      {style:'Bohemian',    date:'Mar 22, 2026'},
      {style:'Scandinavian',date:'Mar 18, 2026'},
    ];
    for(let i=0;i<gens.length;i++){
      const gx=80+(i*400); const g=gens[i];
      // Card
      mkRect(gx,86,360,290,[{type:'SOLID',color:C.white}],
        {radius:10,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1,shadow:true});
      // Thumbnail (16:9) — top of card, rounded top corners only (use radius:10, same as card)
      mkRect(gx,86,360,203,[{type:'SOLID',color:C.tint}],{radius:10});
      await mkText('[Wall Render]',gx+130,182,13,'Regular',C.accent);
      // Style + date
      await mkText(g.style,gx+16,302,16,'Bold',C.textPri);
      await mkText(g.date, gx+16,326,13,'Regular',C.textSec);
      // View Wall button (shown on hover — wireframe shows it statically)
      mkRect(gx+200,298,144,36,[{type:'SOLID',color:C.primaryDark}],{radius:6});
      await mkText('View Wall →',gx+220,310,12,'Semi Bold',C.white);
    }

    // Empty state (shown below as annotation)
    await mkText('↓ Empty state (no generations yet):',80,410,12,'Regular',C.textSec);
    mkRect(80,436,440,112,[{type:'SOLID',color:C.white}],
      {radius:8,strokes:[{type:'SOLID',color:C.border}],strokeWeight:1});
    await mkText('No generations yet',80,458,20,'Bold',C.textPri,{width:440,align:'CENTER'});
    await mkText('Create your first wall to see it here.',80,486,13,'Regular',C.textSec,{width:440,align:'CENTER'});
    mkRect(160,510,280,36,[{type:'SOLID',color:C.primaryDark}],{radius:6});
    await mkText('Create Your First Wall',175,520,13,'Semi Bold',C.white);

    figma.closePlugin('History rebuilt ✓');
  })();
  ```

- [ ] **Step 3: Screenshot after state**

  Call `mcp__figma__get_screenshot`, `nodeId=8:2`. Confirm:
  - Floating icon rail with History icon active (dark pill), Wall View + New icons muted
  - 3 generation cards in a row, each with a tint-colored thumbnail area, style name, date, and "View Wall →" button
  - Empty state card below

---

## Task 8: Update Project State

**Files:** `docs/project_state.md`

- [ ] **Step 1: Update project state doc**

  Update `docs/project_state.md`: add a new session entry dated 2026-03-29, mark the wireframe redesign as complete under a new Phase 12 heading, and update "Current Focus" to reflect that redesigned wireframes are ready for frontend implementation.

  The session entry should read:
  ```
  ### Session (2026-03-29)
  - Wireframe redesign: all 7 frames updated to Cool Slate design system
    - Spec: docs/superpowers/specs/2026-03-29-wireframe-redesign-design.md
    - Plan: docs/superpowers/plans/2026-03-29-wireframe-redesign.md
    - Figma file: https://www.figma.com/design/CphSBIwuFQifjwBlS30jsM
    - Changes: new color palette, full-bleed hero, floating icon rail on logged-in pages
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add docs/project_state.md
  git commit -m "docs: update project state after wireframe redesign"
  ```
