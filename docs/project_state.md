# GenWallDecor — Project State

> Last updated: 2026-02-28
> Branch: `feature/implementation` (worktree at `.worktrees/implementation`)

---

## Current Focus

Executing the 22-task implementation plan (`docs/plans/2026-02-14-genwalldecor-implementation.md`).
Currently completing Phase 2 — Backend Services.

---

## Implementation Progress

### Phase 1: Project Scaffolding ✅ DONE

| Task | Description | Status |
|------|-------------|--------|
| 1 | Initialize backend (Express, TypeScript, health endpoint) | ✅ Done |
| 2 | Initialize frontend (Next.js, Tailwind v4, custom theme) | ✅ Done |
| 3 | Firebase Admin SDK initialization (singleton pattern) | ✅ Done |
| 4 | Auth middleware (Bearer token verification, AUTH_DISABLED bypass) | ✅ Done |

### Phase 2: Backend Services (In Progress)

| Task | Description | Status |
|------|-------------|--------|
| 5 | UserService (Firestore CRUD, daily rate limit, reset) | ✅ Done |
| 6 | StorageService (GCS upload, signed URL, delete) | ✅ Done |
| 7 | DescriptionService (GPT-4o-mini structured output) | ⏳ Pending |
| 8 | ImageService (Gemini 2.5 Flash piece + wall render) | ⏳ Pending |
| 9 | GenerationService (orchestrator: descriptions → images → GCS → Firestore) | ⏳ Pending |

### Phase 3: Backend API Routes

| Task | Description | Status |
|------|-------------|--------|
| 10 | Rate limiting middleware (429 when daily limit hit) | ⏳ Pending |
| 11 | API routes: generate, history, user + mount to index.ts | ⏳ Pending |

### Phase 4: Frontend Implementation

| Task | Description | Status |
|------|-------------|--------|
| 12 | API client + Firebase client config | ⏳ Pending |
| 13 | Decor styles data (20 styles) + useCreationWizard hook | ⏳ Pending |
| 14 | Landing page (hero, how-it-works, CTA) | ⏳ Pending |
| 15 | Style selection page + StyleCard + WizardLayout | ⏳ Pending |
| 16 | Visual preferences + room context (wizard steps 2-3) | ⏳ Pending |
| 17 | Description review page + DescriptionCard | ⏳ Pending |
| 18 | Wall view page + PieceGallery | ⏳ Pending |
| 19 | History page | ⏳ Pending |
| 20 | Navigation + AuthButton + useAuth hook | ⏳ Pending |

### Phase 5: Docs & Integration

| Task | Description | Status |
|------|-------------|--------|
| 21 | Project documentation | ⏳ Pending |
| 22 | Integration test — full generation flow | ⏳ Pending |

---

## Test Status

- **Backend:** 19 tests passing, 5 suites, 0 failures
- **Frontend:** Not yet tested (Next.js app scaffolded, no test files yet)

---

## Recent Sessions

### 2026-02-28 (current)
- Invoked executing-plans skill on the implementation plan
- Discovered Tasks 1-3 were already completed in a previous session
- Completed Tasks 4, 5, 6 (auth middleware, UserService, StorageService)
- Created this docs set (Task 21 partially addressed)

### 2026-02-14 (prior session)
- Scaffolded backend (Task 1) — Express, TypeScript, Jest, health endpoint
- Scaffolded frontend (Task 2) — Next.js App Router, Tailwind v4 with custom theme
- Implemented Firebase Admin SDK singleton (Task 3)
- Set up git worktree at `.worktrees/implementation` on `feature/implementation` branch

---

## Known Issues

- **TypeScript strict mode in tests:** `mockResolvedValueOnce` with partial mock objects requires `as any` casts. Applied fix in `userService.test.ts`. Watch for same pattern in future test files.
- **Gemini model name:** Plan specifies `gemini-2.5-flash-image`. This is mocked in tests. If model name is wrong at runtime, it will fail on live API calls — verify before E2E testing.
- **Tailwind v4:** Frontend was scaffolded with Tailwind v4 (not v3). The `tailwind.config.ts` approach may differ — verify custom theme is applied correctly when building landing page (Task 14).

---

## Open Work Items (Todos)

- [ ] Tasks 7-22 from implementation plan (see table above)
- [ ] Verify Gemini model name against actual @google/genai SDK docs before running live
- [ ] Set up `.env` files locally (backend and frontend) with real API keys before E2E testing
- [ ] Decide if frontend tests (React Testing Library) will be added before or after component build

---

## Future Enhancements (Post-MVP)

- Real product catalog integration (buy the decor pieces)
- Per-piece swap/replacement without full regeneration
- Eval pipeline for model quality comparison
- Interactive 3D rendering (Three.js or similar)
- Dark mode support
