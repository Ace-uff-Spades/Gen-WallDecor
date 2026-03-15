# GenWallDecor

AI-powered wall decor curator. Pick a style, describe your vibe, and get a generated wall arrangement — complete with individual piece images and a composite wall render.

**Live app:** [walldecorgen-zeta.vercel.app](https://walldecorgen-zeta.vercel.app)

---

## How It Works

1. **Choose your style** — Pick from 20 decor styles (e.g. Japandi, Maximalist, Art Deco), color scheme, frame material, and room type
2. **Review descriptions** — GPT-4o-mini generates 4–6 text descriptions of individual pieces; edit them before committing
3. **Generate images** — Gemini 2.5 Flash renders each piece + a composite wall arrangement
4. **Browse history** — Last 3 generations saved per user

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 (App Router), Tailwind v4, Firebase Auth |
| Backend | Express + TypeScript, Node.js |
| AI — Text | OpenAI GPT-4o-mini (structured output via Zod) |
| AI — Images | Google Gemini 2.5 Flash |
| Storage | Google Cloud Storage (private bucket, signed URLs) |
| Database | Firestore |
| Hosting | Cloud Run (backend), Vercel (frontend) |

---

## Architecture

```
Browser (Next.js)
      │
      │  REST API (Firebase ID token auth)
      ▼
Express Backend
      ├── GPT-4o-mini  → text descriptions of decor pieces
      ├── Gemini 2.5 Flash → piece images + wall render
      ├── Firestore → user profiles, generation metadata
      └── GCS → image blobs (walldecorgen-bucket-1)
```

The pipeline is **describe-then-generate**: users review and edit GPT descriptions before triggering (more expensive) image generation. This reduces wasted API calls and gives users creative control.

---

## Local Development

### Prerequisites

- Node.js 20+
- Firebase project with Auth + Firestore enabled
- GCS bucket
- OpenAI API key
- Gemini API key

### Backend

```bash
cd backend
cp .env.example .env   # fill in credentials
npm install
npm run dev            # starts on :3001
```

**`backend/.env` variables:**

```
PORT=3001
AUTH_DISABLED=true     # skip Firebase auth for local dev (tests mock directly)

# Firebase Admin SDK — download service account from Firebase Console
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# AI APIs
OPENAI_API_KEY=
GEMINI_API_KEY=

# CORS — set to your Vercel URL in production
CORS_ORIGIN=http://localhost:3000

# LangFuse (optional observability)
LANGFUSE_SECRET_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

### Frontend

```bash
cd frontend
cp .env.example .env   # fill in Firebase client config
npm install
npm run dev            # starts on :3000
```

**`frontend/.env` variables:**

```
# Backend API URL — set to your Cloud Run URL in production
NEXT_PUBLIC_API_URL=http://localhost:3001

# Firebase Client SDK — get from Firebase Console > Project Settings
# These are public config values, not secrets
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Running Tests

```bash
cd backend && npm test
```

39 tests across 11 suites. Tests mock Firebase and AI clients — no real credentials needed.

---

## Project Structure

```
backend/
  src/
    config/        # Firebase Admin SDK singleton
    middleware/    # Auth verification, rate limiting
    routes/        # generate, history, user endpoints
    services/      # userService, storageService, descriptionService, imageService, generationService
    types.ts       # Shared TypeScript interfaces

frontend/
  src/
    app/           # Next.js pages (/, /create, /generate, /wall/[id], /history)
    components/    # Navbar
    lib/           # api.ts, useAuth.ts, useCreationWizard.ts, styles.ts
```
