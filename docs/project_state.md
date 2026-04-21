# GenWallDecor — Project State

> Last updated: 2026-04-21
> Branch: `main` (all work committed on main)

---

## Current Focus

All phases complete. No active work item.

---

## Implementation Progress

- **Phases 1–6** ✅ App live on Cloud Run + Vercel (2026-03-05)
- **Phase 7** ✅ E2E Bug Fixes — on `feature/retry-auth-ux`, awaiting merge
- **Phases 8–11** ✅ Post-MVP, Admin Charts, Shopping Links, Regenerate
- **Phase 12** ✅ Wireframe Redesign — Cool Slate design system, 7 Figma frames
- **Phase 13** ✅ Landing Page Visual Refinement (2026-04-09)
- **Phase 14** ✅ Creation Flow Mockups in Pencil — 6 screens (2026-04-21)

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

### 2026-04-21
- Added Steps 5 & 6 to Creation Flow in `landing-design.pen` (subagent-driven, 7 tasks)
- Step 5: split-screen accordion description review; Step 6: full-bleed wall result page

### 2026-04-09–13
- Built `landing-v7.html` room widget redesign; replicated in Pencil
- Built Creation Flow Steps 1–4 in Pencil

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
