# GenWallDecor — Project State

> Last updated: 2026-04-22
> Branch: `main` (all work committed on main)

---

## Current Focus

**Phase 15: UI Overhaul** ✅ Complete — all 15 tasks done
Plan: `docs/superpowers/plans/2026-04-21-ui-overhaul.md`
Spec: `docs/superpowers/specs/2026-04-21-ui-overhaul-design.md`

Admin pages (`/admin/usage`, `/history`, admin charts) intentionally deferred — still use old tokens, styled in a follow-up phase.

---

## Implementation Progress

- **Phases 1–6** ✅ App live on Cloud Run + Vercel (2026-03-05)
- **Phase 7** ✅ E2E Bug Fixes — on `feature/retry-auth-ux`, awaiting merge
- **Phases 8–11** ✅ Post-MVP, Admin Charts, Shopping Links, Regenerate
- **Phase 12** ✅ Wireframe Redesign — Cool Slate design system, 7 Figma frames
- **Phase 13** ✅ Landing Page Visual Refinement (2026-04-09)
- **Phase 14** ✅ Creation Flow Mockups in Pencil — 6 screens (2026-04-21)
- **Phase 15** ✅ UI Overhaul — orange/slate design system, split-screen creation flow, full-bleed wall result (2026-04-22)

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

### 2026-04-22 (Phase 15 — UI Overhaul, complete)
All 15 tasks done:
- Tasks 1–5 ✅ Design system, AuthButton, Navbar, stylePhotos.ts, WizardSplitLayout
- Task 6 ✅ Landing page: dark hero, How It Works, dark CTA strip
- Task 7 ✅ StyleCard: orange selected state with checkmark
- Task 8 ✅ ColorSchemeSelector + FrameMaterialSelector: pill chips
- Task 9 ✅ RoomContextForm: pill chips for room type, clean dimension inputs
- Task 10 ✅ create/page.tsx: WizardSplitLayout wired, WizardLayout.tsx deleted
- Task 11 ✅ DescriptionCard: accordion with expand/collapse and inline edit
- Task 12 ✅ generate/page.tsx: split-screen accordion, inline auth/loading
- Task 13 ✅ PieceGallery: horizontal scroll strip, dark detail panel
- Task 14 ✅ wall/[id]/page.tsx: full-bleed dark layout, redesigned controls
- Task 15 ✅ Visual review: no fixes needed, 97 backend tests still passing

### 2026-04-21
- Added Steps 5 & 6 to Creation Flow in `landing-design.pen`
- Brainstormed + specced + planned Phase 15 UI Overhaul

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
