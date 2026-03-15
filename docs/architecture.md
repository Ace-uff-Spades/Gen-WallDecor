# GenWallDecor — Architecture

> Last updated: 2026-02-28

---

## System Overview

GenWallDecor is a two-service web app that generates AI-powered wall decor arrangements.

```
Browser (Next.js)
      │
      │  REST API calls (with Firebase ID token)
      ▼
Express Backend (Node.js)
      ├── GPT-4o-mini  → text descriptions of decor pieces
      ├── Gemini 2.5 Flash → individual piece images + wall render
      ├── Firestore → user profiles, generation metadata
      └── GCS → generated image blobs (walldecorgen-bucket-1)
```

### Generation Pipeline (Describe-Then-Generate)

```
User Preferences
      │
      ▼
POST /api/generate/descriptions
      │  GPT-4o-mini (structured JSON output via Zod)
      ▼
4-6 Text Descriptions (user reviews/edits)
      │
      ▼
POST /api/generate/images
      │  Gemini 2.5 Flash (per piece, then wall render)
      ├── Individual piece images → GCS
      └── Composite wall render → GCS
                    │
                    ▼
            Firestore document (generation record with GCS paths)
```

---

## Key Components

### Backend (`backend/src/`)

| File | Responsibility |
|------|---------------|
| `index.ts` | Express app entry point, route mounting |
| `config/firebase.ts` | Firebase Admin SDK singleton (app, Firestore, GCS bucket) |
| `middleware/authenticate.ts` | Bearer token verification via Firebase Admin Auth |
| `middleware/rateLimit.ts` | 429 enforcement via UserService.canGenerate() |
| `services/userService.ts` | Firestore CRUD for users, daily count tracking |
| `services/storageService.ts` | GCS upload, signed URL generation, deletion |
| `services/descriptionService.ts` | GPT-4o-mini structured output via openai SDK + Zod |
| `services/imageService.ts` | Gemini image generation (piece images + wall render) |
| `services/generationService.ts` | Orchestrates full pipeline, enforces 3-generation history cap |
| `services/shoppingService.ts` | Builds Google Shopping search URLs from PieceDescription fields |
| `routes/generate.ts` | POST /descriptions, POST /images |
| `routes/history.ts` | GET / (last 3), GET /:id |
| `routes/user.ts` | GET /profile |

### Frontend (`frontend/src/`)

| File | Responsibility |
|------|---------------|
| `lib/firebase.ts` | Firebase client SDK init (auth, googleProvider) |
| `lib/api.ts` | Typed fetch wrapper with auto-auth header injection |
| `lib/styles.ts` | 20 decor styles with defaults, room types, frame materials |
| `lib/useCreationWizard.ts` | Multi-step wizard state hook |
| `lib/useAuth.ts` | Firebase Auth state wrapper (user, signIn, signOut) |
| `app/page.tsx` | Landing page (hero, how-it-works, CTA) |
| `app/create/page.tsx` | 3-step style/visuals/room wizard |
| `app/generate/page.tsx` | Description cards + generate images button |
| `app/wall/[id]/page.tsx` | Wall render display + piece gallery |
| `app/history/page.tsx` | Last 3 generations grid |
| `app/admin/usage/page.tsx` | Admin LLM cost/usage dashboard (monthly summary + Trends charts) |
| `components/Navbar.tsx` | Fixed top nav with auth button (Admin link for admin UID) |
| `components/PieceGallery.tsx` | Two-panel gallery: thumbnail grid + sticky Details panel |
| `components/DateRangeSelector.tsx` | Preset (7d/14d/30d) + custom date range picker |
| `components/charts/CallVolumeChart.tsx` | Stacked bar: GPT vs Gemini daily call volume |
| `components/charts/TokenBreakdownChart.tsx` | Stacked bar: GPT vs Gemini daily token usage |
| `components/charts/CostChart.tsx` | Area chart: daily USD cost over time |

---

## API Endpoints

### Backend (port 3001)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | None | Health check |
| POST | `/api/generate/descriptions` | Required + rate limit | GPT-4o-mini descriptions |
| POST | `/api/generate/images` | Required + rate limit | Gemini image generation |
| GET | `/api/history` | Required | Last 3 generations (with signed URLs) |
| GET | `/api/history/:id` | Required | Specific generation with all URLs |
| GET | `/api/user/profile` | Required | User profile + daily count |
| GET | `/api/admin/usage` | Required + admin UID check | LLM usage/cost dashboard data (queries Langfuse) |
| GET | `/api/admin/usage/timeseries` | Required + admin UID check | Daily-bucketed usage (from/to YYYY-MM-DD params) |
| GET | `/api/history/:id/pieces/:pieceIndex/download-url` | Required + ownership | 10-min signed URL for piece image download |

---

## Data Models

### Firestore: `users/{uid}`
```typescript
{
  email: string;
  dailyGenerationCount: number;  // resets daily
  lastResetDate: string;          // ISO date string YYYY-MM-DD
  createdAt: string;
}
```

### Firestore: `generations/{genId}`
```typescript
{
  userId: string;
  style: string;
  preferences: UserPreferences;   // style, colorScheme, frameMaterial, roomType
  descriptions: PieceDescription[];
  imageRefs: string[];             // GCS paths for piece images
  wallRenderRef: string;           // GCS path for wall render
  createdAt: string;
}
```

### Google Cloud Storage
- **Bucket:** `walldecorgen-bucket-1`
- **Piece images:** `generations/{genId}/piece-{n}.png`
- **Wall renders:** `generations/{genId}/wall-render.png`
- **Access:** Private; served via signed URLs (1hr expiry)

---

## Key Technical Decisions

1. **Describe-then-generate pipeline** — GPT-4o-mini for text, Gemini for images. Lets users review/edit descriptions before paying for image generation. Reduces wasted image API calls.

2. **Separate Express backend** — Not Next.js API routes. Long-running AI generation (potentially 30-60s) would hit serverless timeouts. Express gives full control over request lifecycle.

3. **Firebase Admin SDK singleton** — Module-level `app` variable with lazy initialization. Safe for Express (single process) but not for serverless (cold start re-initialization).

4. **Structured output via Zod** — `openai` SDK's `.beta.chat.completions.parse()` with Zod schema ensures GPT returns valid, typed `PieceDescription[]`. Eliminates JSON parsing errors.

5. **Lazy daily rate limit reset** — Instead of a cron job, `canGenerate()` resets the count on first access if `lastResetDate` is stale. Simpler for MVP.

6. **3-generation history cap** — Old generations purged (Firestore doc + GCS images) when a 4th is created. Controlled storage costs for MVP.

7. **AUTH_DISABLED bypass** — `process.env.AUTH_DISABLED=true` skips Firebase token verification, injects a test user. Enables all backend tests without Firebase credentials.

---

## Key Tradeoffs

| Decision | Pro | Con |
|----------|-----|-----|
| Separate Express backend | No serverless timeout | Extra service to deploy/manage |
| GPT-4o-mini for descriptions | Fast, cheap | Less creative than GPT-4o |
| Gemini 2.5 Flash for images | Fast generation | Less control than Imagen |
| Signed URLs (not public) | Secure | Expire after 1hr; need refresh on revisit |
| 3-generation history cap | Simple, cheap storage | Users lose old work |
| Mock-based unit tests | Fast, no credentials needed | Don't catch real API changes |

---

## Tech Debt

- `(req as any).user` pattern throughout backend — should define an extended Request type
- `generateImages` does sequential image generation (one at a time) — could parallelize per-piece calls for speed
- No retry logic on Gemini/OpenAI API failures
- Signed URLs expire after 1hr — history page will break for old generations (needs refresh endpoint)
- Frontend has no tests yet (React Testing Library not set up)

---

## External Services & Credentials

| Service | Config Location | Notes |
|---------|----------------|-------|
| Firebase Auth | `backend/.env` — `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Admin SDK service account |
| Firestore | Same as Firebase Auth | Project: `walldecorgen` |
| GCS | Same as Firebase Auth | Bucket: `walldecorgen-bucket-1` |
| OpenAI | `backend/.env` — `OPENAI_API_KEY` | Model: `gpt-4o-mini` |
| Gemini | `backend/.env` — `GEMINI_API_KEY` | Model: `gemini-2.5-flash-image` |
| Firebase Client SDK | `frontend/.env.local` — `NEXT_PUBLIC_FIREBASE_*` | Public config, safe to commit to `.env.example` |
| Langfuse | `backend/.env` — `LANGFUSE_SECRET_KEY`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_BASE_URL` | Observability; also queried by admin dashboard |
| Admin config | `backend/.env` — `ADMIN_UID`, `MONTHLY_BUDGET_USD` | Protects `/api/admin/usage`; budget for cost gauge |

---

## Output Formats

- **Descriptions:** JSON array of `PieceDescription` — `{title, description, medium, dimensions, placement, type, position, frameRecommendation?, mountingRequirements?}`
- **Images:** Base64 PNG from Gemini → decoded to `Buffer` → uploaded to GCS → signed URL returned
- **Wall render:** Same as images, aspect ratio 16:9
