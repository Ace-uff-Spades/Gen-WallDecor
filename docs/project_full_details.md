# GenWallDecor — Full Project Details Archive

> This file is a cumulative archive. Append new sections rather than replacing old ones.
> Last updated: 2026-02-28

---

## Project Brief

**Name:** GenWallDecor
**Goal:** AI-powered wall decor generation app. Users pick a style, review AI-generated descriptions, then get Gemini-generated images of individual pieces and a composite wall render.

**Elevator pitch:** Like an interior designer in your pocket. Pick your vibe, we'll curate and visualize your wall.

---

## Key Decisions Made

### Architecture Decisions

**Decision: Separate Express backend (not Next.js API routes)**
*Date: 2026-02-14*
*Reason:* AI generation calls (Gemini image generation) can take 30-60s. Next.js API routes on serverless platforms (Vercel) have ~10s limits. Express gives us control over the request lifecycle. Also, the backend is a natural place to enforce auth and rate limiting centrally.

**Decision: Describe-then-generate pipeline**
*Date: 2026-02-14*
*Reason:* Image generation is expensive (~$0.03-0.10/image). Letting users review and edit text descriptions before generating images reduces wasted calls. GPT-4o-mini for text (cheap, fast) + Gemini for images (dedicated image model).

**Decision: 20 preset decor styles with sensible defaults**
*Date: 2026-02-14*
*Reason:* Open-ended style input would produce inconsistent results. Curated styles give the model clear anchors and give users a clear starting point. Defaults for color scheme and frame material per style reduce decision fatigue.

**Decision: 3-generation history cap with auto-deletion**
*Date: 2026-02-14*
*Reason:* Unlimited storage would be costly with generated images. 3 generations is enough for the core workflow (generate → tweak → regenerate). Users are warned before oldest is purged.

**Decision: AUTH_DISABLED bypass for testing**
*Date: 2026-02-14*
*Reason:* Firebase Auth requires real credentials. Backend tests must run without them. A simple env var bypass lets all tests run in CI without any Firebase setup.

**Decision: Lazy daily rate limit reset**
*Date: 2026-02-14*
*Reason:* A cron job/Firebase Function to reset counts at midnight adds operational complexity. Checking `lastResetDate` on the first `canGenerate` call of the day is simpler and has the same effect for users.

---

## Work Completed

### Session: 2026-02-14 (Initial Setup)

**Commits:**
- `9381ab5` Initial commit
- `d11ed7d` Add PRD and approved design document
- `70fcb67` Add detailed implementation plan (22 tasks, 5 phases)
- `3482962` Merge remote initial commit with local plan docs
- `414592e` Fix plan filename typos, update .gitignore
- `4734311` Initialize backend with Express, TypeScript, health endpoint
- `5d7d1c3` Initialize frontend with Next.js, Tailwind v4, custom theme
- `92f5dd5` Add Firebase Admin SDK initialization with singleton pattern

**What was done:**
- Created PRD and design document
- Created 22-task TDD implementation plan
- Scaffolded backend: Express, TypeScript, Jest/Supertest, health endpoint
- Scaffolded frontend: Next.js App Router, Tailwind CSS v4, custom color theme
- Firebase Admin SDK: `getFirebaseApp()`, `getDb()`, `getBucket()` singletons with full test coverage

**Backend test baseline:** 5 tests passing

---

### Session: 2026-02-28

**Commits:**
- `fbc5796` Add auth middleware with Firebase token verification and test bypass
- `2c498f8` Add UserService with rate limiting and daily reset
- `ff457f9` Add StorageService for GCS uploads, signed URLs, and deletion

**What was done:**
- Implemented and tested auth middleware (Task 4): 5 tests
- Implemented and tested UserService (Task 5): 6 tests — getOrCreateUser, canGenerate (with daily reset), incrementGenerationCount, getProfile
- Implemented and tested StorageService (Task 6): 3 tests — uploadBuffer, getSignedUrl, deleteFile
- Created full project docs set (project_state.md, architecture.md, context-management.md, project_full_details.md)

**Fix applied:** `userService.test.ts` — added `as any` casts to `mockResolvedValueOnce()` calls with partial data to satisfy TypeScript strict mode (TS2345, TS2741 errors)

**Backend test baseline after session:** 19 tests passing, 5 suites

---

### Session: 2026-02-28 (continued)

**Commits:**
- `38de589` Add DescriptionService with GPT-4o-mini structured output
- `4531110` Add ImageService with Gemini 2.5 Flash
- `3dff6d2` Add GenerationService orchestrator
- `e8ce847` Add rate limiting middleware
- `2c61d83` Add API routes (generate, history, user)
- `9ee949e` Add API client and Firebase client config
- `635f656` Add decor styles data and creation wizard hook
- `ec8c3a5` Build landing page
- `6c8da9c` Add navigation bar with auth
- `e03fceb` Build style selection wizard
- `7484608` Add visual preferences and room context wizard steps
- `b8d2034` Build description review page
- `50a209c` Build wall view page with piece gallery
- `bf29a93` Build history page
- `8fbe170` Add integration test (5 tests, full flow)

**What was done:**
- Completed all remaining tasks (7-22)
- Backend: All 5 services, rate limiting middleware, 3 API route modules
- Frontend: All 6 pages, 9 components, 4 lib modules
- Integration test: full HTTP flow with in-memory Firestore mock

**Backend test baseline after session:** 39 tests passing, 11 suites

---

## Todos (Current)

All 22 implementation tasks are complete. Remaining work:

- [ ] Verify Gemini model name (`gemini-2.5-flash-image`) against actual SDK docs
- [ ] Set up `.env` files with real API keys for E2E testing
- [ ] Set up frontend test framework (Vitest or Jest + React Testing Library)
- [ ] Add frontend component tests (useCreationWizard, wizard flow)
- [ ] Manual E2E testing with real APIs
- [ ] Merge `feature/implementation` to `main`

---

## Firebase Project Config

```
Project ID: walldecorgen
Auth Domain: walldecorgen.firebaseapp.com
Storage Bucket (client): walldecorgen.firebasestorage.app
Storage Bucket (GCS): walldecorgen-bucket-1
Messaging Sender ID: 838129573192
App ID: 1:838129573192:web:bd602ecc2daf15e095277d
Admin service account: firebase-adminsdk-fbsvc@walldecorgen.iam.gserviceaccount.com
```

**Firebase API Key** (public, safe in .env.example): `AIzaSyDL-F_1uZKu8XLTGMRGFPJzoRYlD7sAUPc`

---

## Frontend Color System

| Token | Value | Use |
|-------|-------|-----|
| `primary` | `#1b998b` | Buttons, active states, brand |
| `background` | `#f8f1ff` | Page background |
| `secondary` | `#decdf5` | Cards, secondary surfaces |
| `text-dark` | `#656176` | Body text |
| `text-darker` | `#534d56` | Headings, emphasis |

---

## Tech Stack Reference

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | Next.js (App Router) | Latest |
| Styling | Tailwind CSS | v4 |
| Backend framework | Express | 4.x |
| Language | TypeScript | 5.x |
| Testing (backend) | Jest + Supertest + ts-jest | Latest |
| Auth | Firebase Auth (Google provider) | Admin SDK |
| Database | Firestore | Firebase Admin SDK |
| Storage | Google Cloud Storage | Firebase Admin SDK |
| Text AI | OpenAI GPT-4o-mini | openai SDK |
| Image AI | Gemini 2.5 Flash | @google/genai SDK |
| Schema validation | Zod | Latest |
