# GenWallDecor — Project State

> Last updated: 2026-03-29
> Branch: `main` (all work committed on main)

---

## Current Focus

Phase 12 complete. All 7 Figma wireframes redesigned with Cool Slate palette. Ready for frontend implementation.

---

## Implementation Progress

### Phase 1–6: ✅ DONE (merged to main 2026-03-05)

App live on Cloud Run + Vercel.

### Phase 7: E2E Bug Fixes ✅ DONE (on `feature/retry-auth-ux`, awaiting merge)

### Phase 8: Post-MVP Improvements ✅ DONE (committed to main)

### Phase 9: Admin Time-Series Charts ✅ DONE (committed to main 2026-03-11)

### Phase 10: Shopping Links, Download, Piece Classification ✅ DONE (merged to main 2026-03-15)

---

## Test Status

- **Backend:** 97 tests passing, 16 suites, 0 failures
- **Frontend:** No test framework (build validation only — all 8 static pages generate cleanly)

---

### Phase 11: Regenerate Individual Pictures ✅ DONE (committed to main 2026-03-18)

### Phase 12: Wireframe Redesign ✅ DONE (2026-03-29)

- All 7 Figma frames rebuilt with Cool Slate design system
- Spec: `docs/superpowers/specs/2026-03-29-wireframe-redesign-design.md`
- Plan: `docs/superpowers/plans/2026-03-29-wireframe-redesign.md`
- Figma file: https://www.figma.com/design/CphSBIwuFQifjwBlS30jsM

## Recent Sessions

### Session (2026-03-29)

- Wireframe redesign brainstorm + design decisions:
  - Color palette: Cool Slate (#1B3A5C primary, #2E6DA4 accent, #F0F4F8 page bg)
  - Landing hero: full-bleed dark gradient, bold title bottom-left, 3D room widget top-right
  - Logged-in nav (Wall View + History): floating icon rail, same bg as page, active = dark pill
  - Design spec: `docs/superpowers/specs/2026-03-29-wireframe-redesign-design.md`
  - Plan: `docs/superpowers/plans/2026-03-29-wireframe-redesign.md`

### Session (2026-03-28)

- Figma wireframes: mid-fi wireframes of all 5 pages (7 frames) as redesign foundation
  - Spec: `docs/superpowers/specs/2026-03-27-figma-wireframes-design.md`
  - Plan: `docs/superpowers/plans/2026-03-27-figma-wireframes.md`
  - Figma file: https://www.figma.com/design/CphSBIwuFQifjwBlS30jsM (4 sections, app color scheme)
  - Frames: Landing, Create ×3, Generate/Review, Wall View, History

### Session (2026-03-18)

- Regenerate individual pictures with versioning
  1. Extended `GenerationDocument` schema: `pieceVersions: string[][]`, `wallRenderVersions: string[]`, `finalizedAt`, `pieceRegenerationCount`
  2. `GenerationService` updated to store versioned GCS paths (`piece-${i}-v0.png`, `wall-render-v0.png`)
  3. `enforceHistoryLimit` now only evicts finalized generations (not drafts), controlled by `MAX_FINALIZED_GENERATIONS` env var
  4. Added `regeneratePieces`, `regenerateWallRender`, `finalizeGeneration` to GenerationService
  5. Created `routes/regenerate.ts` (POST /api/generate/pieces + POST /api/generate/wall-render)
  6. Created `routes/generations.ts` (POST /api/generations/:id/finalize)
  7. Created `backend/scripts/migrate-generation-schema.ts` migration script
  8. Wall page: multi-select checkboxes, version navigation (prev/next), regenerate selected, update wall render, finalize controls
  9. PieceGallery: checkbox overlay and version nav arrows per piece

### Session (2026-03-15)

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
