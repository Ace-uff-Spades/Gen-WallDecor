# GenWallDecor — Project State

> Last updated: 2026-03-04
> Branch: `feature/hosting` (branched from `main` after implementation merge)

---

## Current Focus

Phase 6 code work is **complete** (all 9 coded tasks done on `feature/hosting`). Remaining work is all **manual one-time ops**: GCP infra setup, Vercel wiring, then first deploy + verification.

---

## Implementation Progress

### Phase 1–5: App Implementation ✅ DONE (merged to main 2026-02-28)

All 22 original tasks complete. 39 backend tests passing.

### Phase 6: Hosting & Productization (feature/hosting branch)

| Task | Description | Status |
|------|-------------|--------|
| 1 | Restore .env.example files | ✅ Done |
| 2 | CORS configurable via CORS_ORIGIN env var | ✅ Done |
| 3 | Firestore indexes + security rules + firebase.json | ✅ Done |
| 4 | Backend Dockerfile (multi-stage, Cloud Run ready) | ✅ Done |
| 5 | LangFuse token tracking (OpenAI + Gemini) | ✅ Done |
| 6 | ~~Sentry backend~~ → Cloud Error Reporting (Cloud Run logs) | ✅ Done |
| 7 | ~~Sentry frontend~~ → removed (private beta) | ✅ Done |
| 8 | GitHub Actions CI workflow | ✅ Done |
| 9 | GitHub Actions Deploy workflow | ✅ Done |
| 10 | Vercel setup (manual) | ⬜ Pending |
| 11 | Pre-launch verification | ⬜ Pending |

---

## Test Status

- **Backend:** 39 tests passing, 11 suites, 0 failures
- **Frontend:** No test framework (build validation only in CI)

---

## Recent Session (2026-03-04)

- Added CI workflow (`.github/workflows/ci.yml`): backend tests + TS check + frontend build + gitleaks scan
- Added Deploy workflow (`.github/workflows/deploy.yml`): Workload Identity Federation → Artifact Registry → Cloud Run
- Deploy workflow injects all secrets from Secret Manager at deploy time; CORS_ORIGIN and GCP_PROJECT_ID from GitHub vars

---

## Known Issues

- API clients (OpenAI, Gemini) init eagerly in constructors — container crashes on startup if keys missing (fine in prod since Cloud Run injects secrets before startup)

---

## Open Work Items

- [ ] One-time GCP setup: Artifact Registry repo (`walldecorgen-backend`), deploy service account, secrets in Secret Manager
- [ ] Vercel: connect repo, set env vars, add Vercel URL to Firebase Auth authorized domains
- [ ] Deploy Firestore rules + index: `firebase deploy --only firestore:indexes,firestore:rules`
- [ ] Set OpenAI spend limit + GCP budget alert
- [ ] Create LangFuse project + add keys to Secret Manager
- [ ] Manual E2E test on production after first deploy
- [ ] Merge feature/hosting → main

---

## Future Enhancements (Post-MVP)

- Real product catalog integration
- Per-piece swap/replacement without full regeneration
- Eval pipeline for model quality comparison
- Interactive 3D rendering
- Dark mode support
- Frontend unit tests (Vitest + RTL for useCreationWizard)
