# GenWallDecor — Project State

> Last updated: 2026-03-14
> Branch: `main` (all work committed on main)

---

## Current Focus

Phase 9 complete. No active work item.

---

## Implementation Progress

### Phase 1–6: ✅ DONE (merged to main 2026-03-05)

App live on Cloud Run + Vercel.

### Phase 7: E2E Bug Fixes ✅ DONE (on `feature/retry-auth-ux`, awaiting merge)

### Phase 8: Post-MVP Improvements ✅ DONE (committed to main)

### Phase 9: Admin Time-Series Charts ✅ DONE (committed to main 2026-03-11)

All 7 tasks complete. Backend timeseries endpoint + Recharts charts (CallVolume, TokenBreakdown, Cost) + DateRangeSelector + wired into admin dashboard.

---

## Test Status

- **Backend:** 59 tests passing, 13 suites, 0 failures
- **Frontend:** No test framework (build validation only — all 8 static pages generate cleanly)

---

## Recent Session (2026-03-14)

- Admin timeseries charts: 3 bug fixes
  1. `DateRangeSelector`: replaced `toISOString().slice(0,10)` with `localDateStr()` (UTC date ≠ local date in UTC+ timezones)
  2. Chart components: switched to `dynamic(..., { ssr: false })` — static prerender froze `getDefaultRange` at build time
  3. Backend zero-fill loop + query bound: replaced `setDate(getDate()+1)` with `setUTCDate(getUTCDate()+1)` — local timezone caused loop to exit before writing the last day's bucket

---

## Known Issues

- API clients (OpenAI, Gemini) init eagerly — container crashes on startup if keys missing (fine in prod)
- Wall page shows raw auth error for unauthenticated users — post-MVP
- Gemini cost estimates are approximate (image generation may be priced per image)
- `data!.preferences` non-null assertion in `wall/[id]/page.tsx:handleRetry` (pre-existing code smell)

---

## Open Work Items

- [ ] Merge `feature/retry-auth-ux` → main
- [ ] Add `ADMIN_UID` + `MONTHLY_BUDGET_USD` + Langfuse keys to Cloud Run env vars
- [ ] Set OpenAI spend limit + GCP budget alert

---

## Future Enhancements (Post-MVP)

- Real product catalog integration
- Per-piece swap/replacement without full regeneration
- Eval pipeline for model quality comparison
- Interactive 3D rendering
- Dark mode support
- Frontend unit tests (Vitest + RTL)
