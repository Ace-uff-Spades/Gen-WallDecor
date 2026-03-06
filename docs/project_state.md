# GenWallDecor — Project State

> Last updated: 2026-03-05
> Branch: `feature/retry-auth-ux` (active), `main` (production-deployed)

---

## Current Focus

Production deployed and E2E tested. Bug fixes from E2E testing in progress on `feature/retry-auth-ux` — awaiting merge decision.

---

## Implementation Progress

### Phase 1–5: App Implementation ✅ DONE (merged to main 2026-02-28)

All 22 original tasks complete. 39 backend tests passing.

### Phase 6: Hosting & Productization ✅ DONE (merged to main 2026-03-05)

All tasks complete. App live on Cloud Run + Vercel.

### Phase 7: E2E Bug Fixes (`feature/retry-auth-ux`)

| Task | Description | Status |
|------|-------------|--------|
| 1 | Friendly auth error message in api.ts | ✅ Done |
| 2 | Fix retry flow — pass full preferences in URL params | ✅ Done |
| 3 | Pass initial feedback from URL to first description fetch | ✅ Done |
| 4 | Sign-in gate on /generate page (replaces loading state) | ✅ Done |

Awaiting merge to main.

---

## Test Status

- **Backend:** 39 tests passing, 11 suites, 0 failures
- **Frontend:** No test framework (build validation only in CI)

---

## Recent Session (2026-03-05)

- Completed full GCP + Vercel setup and first production deploy
- E2E tested — main flow works; found 3 bugs + 1 UX issue
- Fixed: retry flow missing preferences, auth error message, sign-in gate on /generate, initial feedback from URL
- Known design smell: `data.style` and `data.preferences.style` are redundant in `wall/[id]/page.tsx` (post-MVP cleanup)

---

## Known Issues

- API clients (OpenAI, Gemini) init eagerly — container crashes on startup if keys missing (fine in prod)
- Wall page shows raw auth error for unauthenticated users (no sign-in prompt, unlike /generate) — post-MVP

---

## Open Work Items

- [ ] Merge `feature/retry-auth-ux` → main (deploy will auto-trigger)
- [ ] Set OpenAI spend limit + GCP budget alert
- [ ] Manual E2E re-test after merge

---

## Future Enhancements (Post-MVP)

- Real product catalog integration
- Per-piece swap/replacement without full regeneration
- Eval pipeline for model quality comparison
- Interactive 3D rendering
- Dark mode support
- Frontend unit tests (Vitest + RTL for useCreationWizard)
