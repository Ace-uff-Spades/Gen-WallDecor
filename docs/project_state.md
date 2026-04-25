# GenWallDecor — Project State

> Last updated: 2026-04-23
> Branch: `main` (all work committed on main)

---

## Current Focus

**Phase 16: UI Polish** — complete ✅
All 6 tasks shipped: landing page rebuild, WizardSplitLayout polish, DescriptionCard accordion, shadow upgrades, photo curation.

Admin pages (`/admin/usage`, `/history`, admin charts) intentionally deferred.

---

## Implementation Progress

- **Phases 1–6** ✅ App live on Cloud Run + Vercel (2026-03-05)
- **Phase 7** ✅ E2E Bug Fixes — on `feature/retry-auth-ux`, awaiting merge
- **Phases 8–11** ✅ Post-MVP, Admin Charts, Shopping Links, Regenerate
- **Phase 12** ✅ Wireframe Redesign — Cool Slate design system, 7 Figma frames
- **Phase 13** ✅ Landing Page Visual Refinement (2026-04-09)
- **Phase 14** ✅ Creation Flow Mockups in Pencil — 6 screens (2026-04-21)
- **Phase 15** ✅ UI Overhaul — orange/slate design system, split-screen creation flow, full-bleed wall result (2026-04-22)
- **Phase 16** ✅ UI Polish — complete (2026-04-25)

---

## Test Status

- **Backend:** 97 tests passing, 16 suites, 0 failures
- **Frontend:** Build validation only — all 8 static pages generate cleanly

---

## Design Artifacts (`landing-design.pen`)

- **Landing page** (Phase 13): `landing-v7.html` (serve: `python3 -m http.server 8765`), Figma: https://www.figma.com/design/CphSBIwuFQifjwBlS30jsM
- **Creation Flow** (Phase 14): 6 screens in Pencil, design system: `#E55722` orange, DM Sans/DM Mono, Slick Studio split-screen
  - Steps 1–4: Style → Room → Details → Generate (existing)
  - Step 5: Descriptions — accordion review (1 expanded, 2 collapsed), feedback section, aesthetic room right panel
  - Step 6: Wall Result — full-bleed; hero render (520px) + pieces strip + detail panel + actions bar
- Spec: `docs/superpowers/specs/2026-04-21-descriptions-wall-screens-design.md`
- **Pencil MCP note:** `batch_design` writes to app memory only — always `Cmd+S` in Pencil before committing

---

## Recent Sessions

### 2026-04-25 (Phase 16 — UI Polish, complete)
- Landing page: full rewrite — single-viewport navy hero, full-bleed photo, gradient overlay, step pills
- WizardSplitLayout: 3px top progress bar, optional `styleName?` style tag pill, typography polish
- DescriptionCard: `border-primary/60` expanded, `opacity-75` collapsed, pencil edit affordance, chip DRY
- Shadow upgrades: StyleCard `hover:shadow-md`, ColorSchemeSelector chips `shadow-sm`/`hover:shadow-sm`
- stylePhotos.ts: all 21 IDs replaced — original slugs were invalid CDN URLs (all 404), now verified numeric format

### 2026-04-23 (Phase 16 — UI Polish, spec approved)
- Brainstormed 3 open work items → approved single-viewport full-bleed landing (navy, photo C: `photo-1724582586529-62622e50c0b3`)
- Landing: full rewrite of `page.tsx` — no scroll, hero photo fills viewport, step pills, navy CTA
- Creation flow: progress bar (full-width 3px top), style tag pill on right panel, typography polish
- Photos: curation pass for 20 styles in `stylePhotos.ts`
- Spec: `docs/superpowers/specs/2026-04-23-ui-polish-design.md` ✅

### 2026-04-22 (Phase 15 — UI Overhaul, complete)
All 15 tasks done — design system, split-screen wizard, full-bleed wall result, 97 tests passing.

---

## Known Issues

- API clients init eagerly — container crashes on startup if keys missing (fine in prod)
- Wall page shows raw auth error for unauthenticated users (post-MVP)
- `data!.preferences` non-null assertion in `wall/[id]/page.tsx:handleRetry`

---

## Open Work Items

- [x] **Phase 16** Complete ✅
- [ ] Merge `feature/retry-auth-ux` → main
- [ ] Add `ADMIN_UID` + `MONTHLY_BUDGET_USD` + Langfuse keys to Cloud Run env vars
- [ ] Set OpenAI spend limit + GCP budget alert

---

## Future Enhancements

- Real product catalog integration
- Per-piece swap/replacement without full regeneration
- Eval pipeline for model quality comparison
- Interactive 3D rendering / dark mode / frontend unit tests
