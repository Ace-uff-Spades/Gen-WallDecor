# GenWallDecor — Hosting & Productization Design

> Date: 2026-03-03
> Scope: Private beta launch with full CI/CD

---

## Context

The app is fully built (all 22 tasks complete, 39 backend tests passing) and has been validated locally. The goal is to deploy it so real beta users can use it, with a CI/CD pipeline that prevents bad deploys, basic cost monitoring, and proper secrets hygiene.

**Target:** Private beta — small group of invited users, no monetization yet.

---

## Architecture

```
GitHub (monorepo, main branch)
         │
         ├─ PR opened → CI: tests + build gate
         │
         └─ Merge to main → two parallel deploys:
                │                        │
         Cloud Run                    Vercel
       (Express backend)         (Next.js frontend)
              │
     GCP ecosystem:
     Firestore, GCS,
     Secret Manager,
     Artifact Registry
```

---

## 1. Backend — Docker + Cloud Run

**Dockerfile** (`backend/Dockerfile`):
- Multi-stage build: install deps → compile TypeScript → serve `dist/` on Node 20 Alpine
- No secrets baked in — all injected at runtime via GCP Secret Manager

**Cloud Run config:**
- Request timeout: 300s (AI generation can take 30–60s)
- Min instances: 0 (scale to zero — cost-efficient for beta)
- Max instances: 5 (prevent runaway costs)
- CORS: restricted to Vercel production URL only

**Secrets (GCP Secret Manager):**
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `LANGFUSE_SECRET_KEY`, `LANGFUSE_PUBLIC_KEY`
- `SENTRY_DSN`
- `AUTH_DISABLED` must be **absent** in production

**One-time GCP setup (manual):**
- Create Artifact Registry repository for Docker images
- Create GCP service account with roles: `roles/run.admin`, `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser`
- Download service account key → add as GitHub secret `GCP_SA_KEY`

---

## 2. Frontend — Vercel

- Connect GitHub repo to Vercel (one-time, in Vercel dashboard)
- PRs → automatic preview deployments
- Push to `main` → automatic production deployment (Vercel handles natively, no GitHub Actions needed)

**Env vars in Vercel dashboard:**
- `NEXT_PUBLIC_API_URL` = Cloud Run production URL
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_SENTRY_DSN`

---

## 3. CI/CD — GitHub Actions

**`.github/workflows/ci.yml`** — runs on every PR:
```
- Backend: npm ci && npm test && npx tsc --noEmit
- Frontend: npm ci && npm run build
- Security: gitleaks scan for accidentally committed secrets
```

**`.github/workflows/deploy.yml`** — runs on push to `main` (after CI passes):
```
- Run CI checks (same as above)
- Build Docker image
- Push to GCP Artifact Registry
- Deploy to Cloud Run
```

Frontend deploy is handled by Vercel automatically on push to `main`.

---

## 4. Secrets Hygiene

- **`.gitignore`**: `*-firebase-adminsdk-*.json` already added; `.env` already covered ✓
- **`.env.example` files**: restore in both `backend/` and `frontend/` with placeholder values — documents required vars without leaking real ones
- **gitleaks in CI**: scans every PR for known secret patterns (OpenAI keys, GCP credentials, Firebase keys, etc.) — fails the build if detected
- **GitHub secret scanning**: enable in repo settings as a second line of defense
- **GCP Secret Manager**: backend secrets injected at Cloud Run runtime — never in the Docker image

---

## 5. Monitoring & Observability

| Tool | Purpose | Setup cost |
|------|---------|------------|
| **LangFuse** | Unified token usage + cost dashboard for OpenAI and Gemini | ~10 lines of backend code |
| **Sentry** | Error tracking in backend (`@sentry/node`) and frontend (`@sentry/nextjs`) | Install + DSN env var |
| **OpenAI spend limit** | Hard cap on OpenAI spend | 1 minute in OpenAI dashboard |
| **GCP budget alert** | Email alert when Gemini spend crosses threshold | GCP Billing console |
| **Cloud Run metrics** | Request count, latency, error rate | Built-in, no setup needed |

---

## 6. Firebase/GCP Config (one-time)

- **Firebase Auth authorized domains**: add Vercel production URL
- **Firestore composite index**: `userId` ASC + `createdAt` DESC on `generations` collection — defined in `firestore.indexes.json`, deployed via `firebase deploy --only firestore:indexes`
- **Firestore security rules**: deny by default; authenticated users can only read/write their own documents (`users/{uid}`, `generations` where `userId == request.auth.uid`)
- **GCS bucket**: already private — signed URLs are the only access path ✓

---

## 7. Pre-launch Checklist

- [ ] Verify Gemini model name against actual `@google/genai` SDK docs (currently unconfirmed — mocked in tests)
- [ ] Merge `feature/implementation` → `main`
- [ ] Set OpenAI hard spend limit in OpenAI dashboard
- [ ] Set GCP budget alert for Gemini
- [ ] Manual E2E test on production after first deploy

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `backend/Dockerfile` | Create |
| `.github/workflows/ci.yml` | Create |
| `.github/workflows/deploy.yml` | Create |
| `firestore.indexes.json` | Create |
| `firebase.json` | Create |
| `backend/src/index.ts` | Update CORS config |
| `backend/src/services/descriptionService.ts` | Add LangFuse instrumentation |
| `backend/src/services/imageService.ts` | Add LangFuse instrumentation |
| `backend/.env.example` | Restore with placeholders |
| `frontend/.env.example` | Restore with placeholders |
| `.gitignore` | Already updated ✓ |
