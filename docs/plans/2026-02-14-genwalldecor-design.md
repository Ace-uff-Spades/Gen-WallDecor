# GenWallDecor — Design Document

**Date:** 2026-02-14
**Status:** Approved

## Problem

Decorating walls with cohesive, intentional style is hard. People want beautiful homes but lack the expertise to curate wall decor that fits together. GenWallDecor helps users visualize and generate wall decor arrangements that match their style preferences.

## User Flow

1. **Login** — Gmail via Firebase Auth (disabled initially for testing)
2. **Style Selection** — Pick from 20 pre-set decor styles (Bohemian, Modern, Scandinavian, etc.)
3. **Visual Preferences** — Pick color scheme, frame material, and other visual options (defaults per style)
4. **Room Context** — Specify room type (bedroom, living room, etc.) and optionally wall dimensions
5. **Description Generation** — GPT-4o-mini generates text descriptions of 4-6 wall decor pieces
6. **Description Review** — User reviews descriptions, can edit text or regenerate individual descriptions
7. **Image Generation** — Gemini 2.5 Flash generates individual piece images + composite wall render
8. **Wall View** — Static 3D-ish wall render with all pieces arranged
9. **Gallery View** — View/save individual pieces to account
10. **Retry** — Go back to step 5 with feedback for full wall re-generation

## Architecture

### Frontend (Next.js App Router)

- **Pages:** `/` (landing/login), `/create` (style selection wizard), `/generate` (description review + generation), `/wall/:id` (wall view + gallery), `/history` (past generations)
- **State:** React Context or Zustand for multi-step creation flow
- **Styling:** Tailwind CSS with custom theme
- **Communication:** REST API to backend

### Backend (Node.js/Express — separate service)

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate/descriptions` | Takes user preferences, calls GPT-4o-mini, returns piece descriptions |
| POST | `/api/generate/images` | Takes approved descriptions, calls Gemini 2.5 Flash, returns image URLs |
| POST | `/api/generate/wall` | Takes piece images + room context, calls Gemini for composite wall render |
| GET | `/api/history` | List past generations for user |
| GET | `/api/history/:id` | Get specific generation |
| GET | `/api/user/profile` | User profile + generation count |

**Middleware:**
- Firebase Admin SDK for auth verification (validates Firebase ID tokens)
- Rate limiting enforcement
- `AUTH_DISABLED=true` env var for testing bypass

### Generation Pipeline (Describe-Then-Generate)

```
User Preferences → GPT-4o-mini → Text Descriptions
                                      ↓ (user reviews/edits)
                              Approved Descriptions → Gemini 2.5 Flash → Individual Images
                                                                              ↓
                                                   Room Context + Images → Gemini → Wall Render
```

### Data Layer

**Firestore Collections:**

- `users/{uid}` — profile, dailyGenerationCount, lastResetDate
- `generations/{genId}` — style, preferences, descriptions, imageRefs (GCS paths), wallRenderRef, timestamp, userId

**Google Cloud Storage:**

- Bucket: `walldecorgen-bucket-1`
- Stores generated images (individual pieces + wall renders)
- Firebase admin service account has access: `firebase-adminsdk-fbsvc@walldecorgen.iam.gserviceaccount.com`

## Project Structure

```
GenWallDecor/
├── frontend/          # Next.js app
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/
│   │   ├── lib/       # API client, Firebase client SDK
│   │   └── styles/
│   └── package.json
├── backend/           # Node.js/Express server
│   ├── src/
│   │   ├── routes/
│   │   ├── services/  # Generation pipeline, Firestore, GCS
│   │   ├── middleware/ # Auth, rate limiting
│   │   └── config/
│   └── package.json
├── docs/
│   ├── project_state.md
│   ├── architecture.md
│   ├── context_management.md
│   └── plans/
└── package.json       # Workspace root (optional)
```

## History Management

- Each generation stored as a Firestore document with GCS image references
- Users see their last 3 generations on `/history`
- On new generation: if user has 3+ generations, delete the oldest (including GCS images)
- Show warning before oldest generation gets purged

## Rate Limiting

- 10 generations per day per user
- Tracked in `users/{uid}`: `dailyGenerationCount` + `lastResetDate`
- Reset count when `lastResetDate` is before today
- Backend middleware enforces before processing
- Frontend shows remaining generation count

## Frontend Design

**Color Scheme:**
- Primary: `#1b998b` (teal green)
- Background: `#f8f1ff` (soft lavender white)
- Secondary: `#decdf5` (light purple)
- Text dark: `#656176` (muted purple-gray)
- Text darker: `#534d56` (dark plum)

**Design Language:** Soft edges, modern, minimalist, no dark mode

**Key Pages:**

1. **Landing** — Hero with tagline, Gmail login button, example wall renders
2. **Create (wizard)** — Multi-step form: Style -> Visuals -> Room -> Generate. Cards with style thumbnails, color palette pickers, frame material selectors, room type dropdown
3. **Generate** — Editable description cards, approve/regenerate per description, "Generate Images" button
4. **Wall View** — Large wall render, scrollable gallery of individual pieces below, save buttons, retry with feedback
5. **History** — Grid of past 3 generations with thumbnails

## Decor Styles

Transitional, Traditional, Modern, Eclectic, Contemporary, Minimalist, Mid Century Modern, Bohemian, Modern Farmhouse, Shabby Chic, Coastal, Hollywood Glam, Southwestern, Rustic, Industrial, French Country, Scandinavian, Mediterranean, Art Deco, Asian Zen

## Testing Strategy

- **TDD throughout** — tests written before implementation
- **Backend:** Jest + Supertest for unit and integration tests
- **Frontend:** Jest + React Testing Library for component tests
- **Key test areas:** Prompt construction, description validation, rate limiting, history management, GCS operations
- **Eval pipeline:** Deferred to post-MVP phase

## External Services

| Service | Purpose | Model/Product |
|---------|---------|---------------|
| OpenAI | Text generation (prompts, descriptions) | GPT-4o-mini |
| Google AI | Image generation | Gemini 2.5 Flash |
| Firebase Auth | Authentication | Google provider |
| Firestore | Data persistence | Users, generations |
| Google Cloud Storage | Image storage | walldecorgen-bucket-1 |

## Scope Boundaries (YAGNI)

**In scope (MVP):**
- AI-generated wall decor with describe-then-generate pipeline
- 20 decor styles with sensible visual preference defaults
- Full wall re-generation retry with feedback
- History (last 3), rate limiting (10/day), Gmail auth

**Out of scope (future):**
- Real product catalog integration
- Per-piece swap/replacement
- Interactive 3D rendering
- Eval pipeline for model comparison
- Dark mode
