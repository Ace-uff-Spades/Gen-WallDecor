# GenWallDecor — Project State

> Last updated: 2026-03-15
> Branch: `feature/shopping-links-download-objects` (awaiting merge to main)

---

## Current Focus

Shopping links + piece type feature complete on `feature/shopping-links-download-objects`, awaiting merge.

---

## Implementation Progress

### Phase 1–6: ✅ DONE (merged to main 2026-03-05)

App live on Cloud Run + Vercel.

### Phase 7: E2E Bug Fixes ✅ DONE (on `feature/retry-auth-ux`, awaiting merge)

### Phase 8: Post-MVP Improvements ✅ DONE (committed to main)

### Phase 9: Admin Time-Series Charts ✅ DONE (committed to main 2026-03-11)

### Phase 10: Shopping Links, Download, Piece Classification ✅ DONE (on `feature/shopping-links-download-objects`)

All 7 tasks complete. Backend timeseries endpoint + Recharts charts (CallVolume, TokenBreakdown, Cost) + DateRangeSelector + wired into admin dashboard.

---

## Test Status

- **Backend:** 71 tests passing, 14 suites, 0 failures
- **Frontend:** No test framework (build validation only — all 8 static pages generate cleanly)

---

## Recent Session (2026-03-15)

- Shopping links, piece type classification, frameless images, interactive dot overlay
  1. Extended `PieceDescription` with `type`, `position`, `frameRecommendation`, `mountingRequirements`
  2. Added `ShoppingService` — builds Google Shopping search URLs per piece type
  3. Updated `DescriptionService` Zod schema and prompt for new fields (used `.nullable()` not `.optional()` for OpenAI structured output compatibility)
  4. Updated Gemini piece image prompt to generate frameless artwork
  5. `GET /api/history/:id` now includes `links` in each piece
  6. `PieceGallery` details panel now shows shopping/download links per piece type
  7. Wall render page has interactive dot overlay at each piece's position

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
