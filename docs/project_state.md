# GenWallDecor — Project State

> Last updated: 2026-04-13
> Branch: `main` (all work committed on main)

---

## Current Focus

All phases complete. No active work item.

---

## Implementation Progress

- **Phases 1–6** ✅ App live on Cloud Run + Vercel (2026-03-05)
- **Phase 7** ✅ E2E Bug Fixes — on `feature/retry-auth-ux`, awaiting merge
- **Phase 8** ✅ Post-MVP Improvements
- **Phase 9** ✅ Admin Time-Series Charts (2026-03-11)
- **Phase 10** ✅ Shopping Links, Download, Piece Classification (2026-03-15)
- **Phase 11** ✅ Regenerate Individual Pictures (2026-03-18)
- **Phase 12** ✅ Wireframe Redesign — Cool Slate design system, 7 Figma frames (2026-03-29)
- **Phase 13** ✅ Landing Page Visual Refinement (2026-04-09)
- **Phase 14** ✅ Creation Flow Mockups in Pencil — 6 screens complete (2026-04-21)

---

## Test Status

- **Backend:** 97 tests passing, 16 suites, 0 failures
- **Frontend:** Build validation only — all 8 static pages generate cleanly

---

## Phase 13 Design Artifacts

- HTML mockup: `landing-v7.html` — serve via `python3 -m http.server 8765`
- Pencil design: `landing-design.pen` (project root)
- Figma wireframes: https://www.figma.com/design/CphSBIwuFQifjwBlS30jsM
- Key decisions:
  - Hero: Unsplash photo `photo-1764010533326`, frosted glass card bottom-left
  - Room widget: `Assets/room_3D_illustration.png` + CSS mask fade + canvas grain halo
  - Arrow: `Assets/hand_drawn_arrow.png` (ffmpeg colorkey bg removal), `rotate(-45deg)`
  - Below-fold: `#1B3A5C → #2E6DA4 → #C8DFEE → #F0F4F8` gradient
- Pencil mockup note: arrow uses AI-generated image with white bg — swap with actual asset if needed

---

## Phase 14 Design Artifacts

- Pencil file: `landing-design.pen` (project root) — "Creation Flow" frame, 6 screens
- 6 screens in "Creation Flow" frame:
  - Step 1 (Style): style pills for all 20 DECOR_STYLES, modern living room right panel
  - Step 2 (Room): 8 room type cards w/ emojis, gallery wall right panel
  - Step 3 (Details): colour palette chips + frame material pills, wall art right panel
  - Step 4 (Generate): selections summary card + dimension inputs + CTA, moody dark right panel
  - Step 5 (Descriptions): split-screen accordion review — Piece 1 expanded, 2–3 collapsed, feedback section; aesthetic room right panel
  - Step 6 (Wall Result): full-bleed 3-zone layout — hero wall render (520px) + pieces strip with selected detail (240px) + actions bar (140px)
- Design system: Firecrawl aesthetic (white bg, `#E55722` orange, DM Sans/DM Mono, dot step counter) + Slick Studio split-screen flow
- Inspiration frame: `yZtvG` in `landing-design.pen` — Firecrawl + Slick Studio screenshots
- Spec: `docs/superpowers/specs/2026-04-21-descriptions-wall-screens-design.md`

---

## Recent Sessions

### 2026-04-21

- Added Step 5 (Descriptions) and Step 6 (Wall Result) screens to Creation Flow in `landing-design.pen`
- Step 5: split-screen accordion — 1 expanded piece card, 2 collapsed, feedback + Regenerate All, "Generate Images" CTA; right panel carries Step 1 aesthetic room image
- Step 6: full-bleed result page — hero wall render with overlaid top bar, pieces strip (3 thumbnails, 1 selected + detail panel), actions bar (Regenerate / Update / Retry)
- Creation Flow now 6 screens complete

### 2026-04-13

- Built Creation Flow mockup (4 screens) in `landing-design.pen` Pencil file
- Split-screen layout: left = form/options, right = dynamic room illustration
- Inspiration: "Onboarding Inspo" frame (Firecrawl screenshots for color/fonts, Slick Studio for flow/layout)

### 2026-04-09

- Built `landing-v7.html`: room widget redesign (3D illustration, mask fade, grain halo, hand-drawn arrow)
- Built `landing-design.pen` (Pencil): full mockup replicating v7 design
- Figma push attempted but blocked: `figma.createImageAsync` unsupported + 50K code limit

### 2026-03-29–30

- Wireframe redesign: Cool Slate palette, 7 Figma frames
- Landing hero iteration v1–v6 → approved: bright room photo + frosted glass card

---

## Known Issues

- API clients init eagerly — container crashes on startup if keys missing (fine in prod)
- Wall page shows raw auth error for unauthenticated users (post-MVP)
- `data!.preferences` non-null assertion in `wall/[id]/page.tsx:handleRetry`

---

## Open Work Items

- [ ] Merge `feature/retry-auth-ux` → main
- [ ] Add `ADMIN_UID` + `MONTHLY_BUDGET_USD` + Langfuse keys to Cloud Run env vars
- [ ] Set OpenAI spend limit + GCP budget alert

---

## Future Enhancements

- Real product catalog integration
- Per-piece swap/replacement without full regeneration
- Eval pipeline for model quality comparison
- Interactive 3D rendering / dark mode / frontend unit tests
