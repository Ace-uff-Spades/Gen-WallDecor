# Hosting & Productization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy GenWallDecor to production (Cloud Run backend + Vercel frontend) with full CI/CD, cost monitoring, error tracking, and secrets hygiene for a private beta launch.

**Architecture:** Express backend containerized in Docker and deployed to Google Cloud Run; Next.js frontend auto-deployed to Vercel on push to `main`. GitHub Actions gates every PR with backend tests + frontend build + secrets scanning, then triggers a backend deploy on merge. LangFuse tracks LLM token usage across OpenAI and Gemini; Sentry tracks runtime errors.

**Tech Stack:** Docker, Google Cloud Run, GCP Artifact Registry, GCP Secret Manager, Vercel, GitHub Actions, LangFuse, Sentry (`@sentry/node`, `@sentry/nextjs`), gitleaks, Firebase CLI

**Note on Gemini model name:** `gemini-2.5-flash-image` is confirmed valid — it appears explicitly in the `@google/genai` v1.43.0 type definitions. No change needed.

---

## Task 1: Restore .env.example files

**Files:**
- Create: `backend/.env.example`
- Create: `frontend/.env.example`

**Step 1: Create backend .env.example**

```bash
cat > backend/.env.example << 'EOF'
PORT=3001
# Set to true for local dev without Firebase credentials (tests mock auth directly)
AUTH_DISABLED=false

# Firebase Admin SDK — download service account JSON from Firebase Console
# NEVER commit the JSON file or the real values of these vars
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Google AI (Gemini)
GEMINI_API_KEY=AIza...

# CORS — in production, set to your Vercel URL (e.g. https://genwalldecor.vercel.app)
CORS_ORIGIN=http://localhost:3000

# Sentry — get DSN from sentry.io after creating a Node.js project
SENTRY_DSN=https://...@sentry.io/...

# LangFuse — get keys from cloud.langfuse.com after creating a project
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
EOF
```

**Step 2: Create frontend .env.example**

```bash
cat > frontend/.env.example << 'EOF'
# Backend API URL — in production, set to your Cloud Run URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Firebase Client SDK — safe to commit (public config, not secret)
# Get these from Firebase Console > Project Settings > Your apps
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...

# Sentry — get DSN from sentry.io after creating a Next.js project
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
EOF
```

**Step 3: Verify .env files are still gitignored**

```bash
git check-ignore -v backend/.env backend/.env.example frontend/.env frontend/.env.example
```

Expected output:
```
.gitignore:31:.env    backend/.env
# backend/.env.example and frontend/.env.example should NOT appear (not ignored — they should be committed)
```

**Step 4: Commit**

```bash
git add backend/.env.example frontend/.env.example
git commit -m "chore: restore .env.example files with all required variables"
```

---

## Task 2: Make CORS configurable

Currently `app.use(cors())` allows all origins. In production it must be restricted to the Vercel URL.

**Files:**
- Modify: `backend/src/index.ts:15`

**Step 1: Verify the existing test suite still passes as baseline**

```bash
cd backend && npm test
```

Expected: 39 tests passing.

**Step 2: Update CORS config in index.ts**

Replace line 15 in `backend/src/index.ts`:

```typescript
// Before
app.use(cors());

// After
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
}));
```

**Step 3: Run tests to confirm nothing broke**

```bash
cd backend && npm test
```

Expected: 39 tests still passing. (Supertest bypasses CORS, so existing tests are unaffected.)

**Step 4: Commit**

```bash
git add backend/src/index.ts
git commit -m "feat: make CORS origin configurable via CORS_ORIGIN env var"
```

---

## Task 3: Firestore indexes and security rules

**Files:**
- Create: `firestore.indexes.json` (repo root)
- Create: `firestore.rules` (repo root)
- Create: `firebase.json` (repo root)

**Step 1: Create firestore.indexes.json**

This codifies the composite index needed for `getUserGenerations()` — the query that filters by `userId` and orders by `createdAt`.

```json
{
  "indexes": [
    {
      "collectionGroup": "generations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

**Step 2: Create firestore.rules**

Deny all by default. Authenticated users can only read/write their own data.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /generations/{generationId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

**Step 3: Create firebase.json**

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

**Step 4: Add firebase.json to .gitignore exclusions (verify it's not accidentally ignored)**

```bash
git check-ignore -v firebase.json firestore.indexes.json firestore.rules
```

Expected: no output (none of these are gitignored).

**Step 5: Deploy indexes and rules to Firebase**

Requires Firebase CLI: `npm install -g firebase-tools` and `firebase login` first.

```bash
firebase deploy --only firestore:indexes,firestore:rules --project walldecorgen
```

Expected output:
```
✔  Deployed Firestore indexes
✔  Deployed Firestore rules
```

**Step 6: Commit**

```bash
git add firestore.indexes.json firestore.rules firebase.json
git commit -m "feat: add Firestore composite index and security rules"
```

---

## Task 4: Backend Dockerfile

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.dockerignore`

**Step 1: Create .dockerignore**

```
node_modules
dist
.env
.env.*
*.md
coverage
```

**Step 2: Create Dockerfile**

Multi-stage build — compiles TypeScript in a builder stage, then copies only the compiled output and production deps into the final image.

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Run
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

**Step 3: Verify the backend has a build script**

```bash
cat backend/package.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('scripts', {}))"
```

If there is no `build` script, add `"build": "tsc"` to the scripts section of `backend/package.json`.

**Step 4: Build the Docker image locally**

```bash
cd backend
docker build -t genwalldecor-backend:test .
```

Expected: `Successfully built <image-id>` with no errors.

**Step 5: Run it and verify the health endpoint responds**

```bash
docker run --rm -d -p 3002:3001 \
  -e AUTH_DISABLED=true \
  -e PORT=3001 \
  --name gwd-test \
  genwalldecor-backend:test

sleep 2
curl http://localhost:3002/api/health
docker stop gwd-test
```

Expected: `{"status":"ok"}`

**Step 6: Commit**

```bash
git add backend/Dockerfile backend/.dockerignore
git commit -m "feat: add multi-stage Dockerfile for Cloud Run deployment"
```

---

## Task 5: LangFuse integration

LangFuse provides a unified token usage + cost dashboard across OpenAI and Gemini.

**Files:**
- Modify: `backend/src/services/descriptionService.ts`
- Modify: `backend/src/services/imageService.ts`

**Step 1: Install langfuse**

```bash
cd backend && npm install langfuse
```

**Step 2: Verify tests still pass**

```bash
cd backend && npm test
```

Expected: 39 tests passing.

**Step 3: Update DescriptionService to log token usage**

LangFuse is initialized with env vars at startup — if the keys aren't set it's a no-op (the SDK handles missing config gracefully). Add tracing around the OpenAI call:

In `backend/src/services/descriptionService.ts`:

```typescript
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { Langfuse } from 'langfuse';
import { PieceDescription, UserPreferences } from '../types';

const PieceDescriptionSchema = z.object({
  title: z.string(),
  description: z.string(),
  medium: z.string(),
  dimensions: z.string(),
  placement: z.string(),
});

const DescriptionsResponseSchema = z.object({
  pieces: z.array(PieceDescriptionSchema),
});

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
  flushAt: 1, // send immediately in a long-running server
});

export class DescriptionService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  buildPrompt(preferences: UserPreferences, feedback?: string): string {
    let prompt = `You are an expert interior designer specializing in wall decor curation.

Generate 4-6 wall decor piece descriptions for a ${preferences.roomType} in the ${preferences.style} style.

Color scheme: ${preferences.colorScheme.join(', ')}
Frame material: ${preferences.frameMaterial}
${preferences.wallDimensions ? `Wall dimensions: ${preferences.wallDimensions.width}ft x ${preferences.wallDimensions.height}ft` : ''}

Each piece should:
- Be cohesive with the overall style and color scheme
- Vary in size and type (mix of prints, paintings, photographs, decorative objects)
- Include specific placement suggestions for visual balance
- Use the specified frame material where applicable

Provide exactly 4-6 pieces that work together as a curated collection.`;

    if (feedback) {
      prompt += `\n\nUser feedback on previous generation: ${feedback}`;
    }

    return prompt;
  }

  async generateDescriptions(preferences: UserPreferences, feedback?: string): Promise<PieceDescription[]> {
    const prompt = this.buildPrompt(preferences, feedback);
    const trace = langfuse.trace({ name: 'generate-descriptions' });
    const generation = trace.generation({
      name: 'gpt-4o-mini-descriptions',
      model: 'gpt-4o-mini',
      input: prompt,
    });

    const response = await this.client.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert interior designer. Return structured JSON descriptions of wall decor pieces.' },
        { role: 'user', content: prompt },
      ],
      response_format: zodResponseFormat(DescriptionsResponseSchema, 'descriptions'),
    });

    generation.end({
      usage: {
        input: response.usage?.prompt_tokens,
        output: response.usage?.completion_tokens,
        total: response.usage?.total_tokens,
      },
    });

    const parsed = response.choices[0].message.parsed;
    if (!parsed) {
      throw new Error('Failed to parse description response');
    }

    return parsed.pieces;
  }
}
```

**Step 4: Run tests to confirm nothing broke**

```bash
cd backend && npm test
```

Expected: 39 tests passing. (Tests mock the OpenAI client so LangFuse calls will be no-ops in test.)

**Step 5: Update ImageService to log token usage**

In `backend/src/services/imageService.ts`, add LangFuse tracing around both Gemini calls:

```typescript
import { GoogleGenAI } from '@google/genai';
import { Langfuse } from 'langfuse';
import { PieceDescription } from '../types';

export interface GeneratedImage {
  data: string; // base64
  mimeType: string;
}

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
  flushAt: 1,
});

export class ImageService {
  private ai: InstanceType<typeof GoogleGenAI>;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }

  buildPiecePrompt(piece: PieceDescription, style: string): string {
    return `Create a high-quality wall art piece in the ${style} interior design style.

Title: ${piece.title}
Description: ${piece.description}
Medium: ${piece.medium}
Dimensions: ${piece.dimensions}

The artwork should be photorealistic and suitable for framing. Show only the artwork itself against a clean background, as if photographed for a catalog.`;
  }

  async generatePieceImage(piece: PieceDescription, style: string): Promise<GeneratedImage> {
    const prompt = this.buildPiecePrompt(piece, style);
    const trace = langfuse.trace({ name: 'generate-piece-image' });
    const generation = trace.generation({
      name: 'gemini-piece-image',
      model: 'gemini-2.5-flash-image',
      input: prompt,
    });

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: ['Image'],
        imageConfig: { aspectRatio: '4:5' },
      },
    });

    generation.end({
      usage: {
        input: response.usageMetadata?.promptTokenCount,
        output: response.usageMetadata?.candidatesTokenCount,
        total: response.usageMetadata?.totalTokenCount,
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error('No response from image model');

    for (const part of parts) {
      if (part.inlineData) {
        return {
          data: part.inlineData.data!,
          mimeType: part.inlineData.mimeType!,
        };
      }
    }

    throw new Error('No image in response');
  }

  async generateWallRender(
    pieces: PieceDescription[],
    style: string,
    roomType: string,
  ): Promise<GeneratedImage> {
    const pieceList = pieces.map((p, i) =>
      `${i + 1}. "${p.title}" - ${p.description} (${p.medium}, ${p.dimensions}, ${p.placement})`
    ).join('\n');

    const prompt = `Create a photorealistic 3D rendering of a ${roomType} wall decorated in the ${style} interior design style.

The wall features these pieces of decor:
${pieceList}

Show the wall from a slightly angled perspective to give depth. The room should feel lived-in and cohesive. Lighting should be warm and natural. The decor pieces should be arranged according to their placement descriptions.`;

    const trace = langfuse.trace({ name: 'generate-wall-render' });
    const generation = trace.generation({
      name: 'gemini-wall-render',
      model: 'gemini-2.5-flash-image',
      input: prompt,
    });

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: ['Image'],
        imageConfig: { aspectRatio: '16:9' },
      },
    });

    generation.end({
      usage: {
        input: response.usageMetadata?.promptTokenCount,
        output: response.usageMetadata?.candidatesTokenCount,
        total: response.usageMetadata?.totalTokenCount,
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error('No response from image model');

    for (const part of parts) {
      if (part.inlineData) {
        return {
          data: part.inlineData.data!,
          mimeType: part.inlineData.mimeType!,
        };
      }
    }

    throw new Error('No image in response');
  }
}
```

**Step 6: Run tests to confirm nothing broke**

```bash
cd backend && npm test
```

Expected: 39 tests passing.

**Step 7: Commit**

```bash
git add backend/src/services/descriptionService.ts backend/src/services/imageService.ts backend/package.json backend/package-lock.json
git commit -m "feat: add LangFuse tracing for OpenAI and Gemini token usage monitoring"
```

---

## Task 6: Sentry — backend

**Files:**
- Modify: `backend/src/index.ts`

**Step 1: Install @sentry/node**

```bash
cd backend && npm install @sentry/node
```

**Step 2: Run tests to confirm baseline**

```bash
cd backend && npm test
```

Expected: 39 tests passing.

**Step 3: Initialize Sentry at the top of index.ts**

Sentry must be initialized before any other imports to capture all errors. Add to the top of `backend/src/index.ts`:

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
});

import dotenv from 'dotenv';
dotenv.config();
// ... rest of file unchanged ...
```

Then add Sentry's error handler middleware after all routes (before `app.listen`):

```typescript
// After all route registrations, before app.listen
Sentry.setupExpressErrorHandler(app);
```

Final `index.ts` should look like:

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
});

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { authenticate } from './middleware/authenticate';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { generateRouter } from './routes/generate';
import { historyRouter } from './routes/history';
import { userRouter } from './routes/user';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
}));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/generate', authenticate, rateLimitMiddleware, generateRouter);
app.use('/api/history', authenticate, historyRouter);
app.use('/api/user', authenticate, userRouter);

Sentry.setupExpressErrorHandler(app);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
```

**Step 4: Run tests to confirm nothing broke**

```bash
cd backend && npm test
```

Expected: 39 tests passing.

**Step 5: Commit**

```bash
git add backend/src/index.ts backend/package.json backend/package-lock.json
git commit -m "feat: add Sentry error tracking to backend"
```

---

## Task 7: Sentry — frontend

**Files:**
- Create: `frontend/sentry.client.config.ts`
- Create: `frontend/sentry.server.config.ts`
- Modify: `frontend/next.config.ts` (or `next.config.js`)

**Step 1: Install @sentry/nextjs**

```bash
cd frontend && npm install @sentry/nextjs
```

**Step 2: Create sentry.client.config.ts**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

**Step 3: Create sentry.server.config.ts**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

**Step 4: Update next.config to wrap with Sentry**

First check if next.config exists:

```bash
ls frontend/next.config.*
```

Then wrap the existing config. If `frontend/next.config.ts` exists:

```typescript
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // existing config options stay here
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
```

**Step 5: Verify frontend still builds**

```bash
cd frontend && npm run build
```

Expected: build completes without errors.

**Step 6: Commit**

```bash
git add frontend/sentry.client.config.ts frontend/sentry.server.config.ts frontend/next.config.ts frontend/package.json frontend/package-lock.json
git commit -m "feat: add Sentry error tracking to frontend"
```

---

## Task 8: GitHub Actions — CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create .github/workflows directory**

```bash
mkdir -p .github/workflows
```

**Step 2: Create ci.yml**

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  backend-test:
    name: Backend tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
      - run: npm test
      - run: npx tsc --noEmit

  frontend-build:
    name: Frontend build
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: http://localhost:3001
          NEXT_PUBLIC_FIREBASE_API_KEY: placeholder
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: placeholder.firebaseapp.com
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: placeholder
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: placeholder.appspot.com
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789'
          NEXT_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:placeholder'

  secrets-scan:
    name: Secrets scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions CI workflow (tests, build, secrets scan)"
```

**Step 4: Verify by creating a test PR**

Push this branch to GitHub and open a PR targeting `main`. Verify all three jobs (backend-test, frontend-build, secrets-scan) show green in the GitHub Actions tab.

---

## Task 9: GitHub Actions — Deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Prerequisites (one-time manual GCP setup — do this before running the workflow):**

```
1. Create Artifact Registry repository:
   gcloud artifacts repositories create genwalldecor \
     --repository-format=docker \
     --location=us-central1 \
     --project=walldecorgen

2. Create deploy service account:
   gcloud iam service-accounts create github-deploy \
     --display-name="GitHub Actions deploy" \
     --project=walldecorgen

3. Grant required roles:
   gcloud projects add-iam-policy-binding walldecorgen \
     --member="serviceAccount:github-deploy@walldecorgen.iam.gserviceaccount.com" \
     --role="roles/run.admin"
   gcloud projects add-iam-policy-binding walldecorgen \
     --member="serviceAccount:github-deploy@walldecorgen.iam.gserviceaccount.com" \
     --role="roles/artifactregistry.writer"
   gcloud projects add-iam-policy-binding walldecorgen \
     --member="serviceAccount:github-deploy@walldecorgen.iam.gserviceaccount.com" \
     --role="roles/iam.serviceAccountUser"
   gcloud projects add-iam-policy-binding walldecorgen \
     --member="serviceAccount:github-deploy@walldecorgen.iam.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"

4. Create and download key:
   gcloud iam service-accounts keys create /tmp/github-deploy-key.json \
     --iam-account=github-deploy@walldecorgen.iam.gserviceaccount.com

5. Add to GitHub repo secrets:
   - GCP_SA_KEY = contents of /tmp/github-deploy-key.json
   - Delete the local key file after: rm /tmp/github-deploy-key.json

6. Add to GitHub repo variables (Settings > Variables):
   - GCP_PROJECT_ID = walldecorgen

7. Add all backend secrets to GCP Secret Manager:
   echo -n "your-value" | gcloud secrets create OPENAI_API_KEY --data-file=- --project=walldecorgen
   echo -n "your-value" | gcloud secrets create GEMINI_API_KEY --data-file=- --project=walldecorgen
   echo -n "your-value" | gcloud secrets create FIREBASE_PROJECT_ID --data-file=- --project=walldecorgen
   echo -n "your-value" | gcloud secrets create FIREBASE_CLIENT_EMAIL --data-file=- --project=walldecorgen
   # For FIREBASE_PRIVATE_KEY, use a file to avoid shell escaping issues:
   gcloud secrets create FIREBASE_PRIVATE_KEY --data-file=<(python3 -c "import json; print(json.load(open('walldecorgen-firebase-adminsdk-fbsvc-d06239a4c2.json'))['private_key'], end='')") --project=walldecorgen
   echo -n "https://your-vercel-url.vercel.app" | gcloud secrets create CORS_ORIGIN --data-file=- --project=walldecorgen
   echo -n "https://...@sentry.io/..." | gcloud secrets create SENTRY_DSN --data-file=- --project=walldecorgen
   echo -n "sk-lf-..." | gcloud secrets create LANGFUSE_SECRET_KEY --data-file=- --project=walldecorgen
   echo -n "pk-lf-..." | gcloud secrets create LANGFUSE_PUBLIC_KEY --data-file=- --project=walldecorgen
   echo -n "https://cloud.langfuse.com" | gcloud secrets create LANGFUSE_BASE_URL --data-file=- --project=walldecorgen
```

**Step 1: Create deploy.yml**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  backend-test:
    name: Backend tests (gate)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
      - run: npm test
      - run: npx tsc --noEmit

  deploy-backend:
    name: Deploy backend to Cloud Run
    runs-on: ubuntu-latest
    needs: backend-test
    steps:
      - uses: actions/checkout@v4

      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker us-central1-docker.pkg.dev

      - name: Build and push Docker image
        run: |
          IMAGE=us-central1-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/genwalldecor/backend:${{ github.sha }}
          docker build -t $IMAGE ./backend
          docker push $IMAGE

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy genwalldecor-backend \
            --image us-central1-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/genwalldecor/backend:${{ github.sha }} \
            --region us-central1 \
            --platform managed \
            --timeout 300 \
            --min-instances 0 \
            --max-instances 5 \
            --set-secrets="OPENAI_API_KEY=OPENAI_API_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,CORS_ORIGIN=CORS_ORIGIN:latest,SENTRY_DSN=SENTRY_DSN:latest,LANGFUSE_SECRET_KEY=LANGFUSE_SECRET_KEY:latest,LANGFUSE_PUBLIC_KEY=LANGFUSE_PUBLIC_KEY:latest,LANGFUSE_BASE_URL=LANGFUSE_BASE_URL:latest" \
            --allow-unauthenticated \
            --project ${{ vars.GCP_PROJECT_ID }}
```

**Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deploy workflow for Cloud Run"
```

---

## Task 10: Vercel setup (manual)

No code changes — one-time configuration in the Vercel dashboard.

**Steps:**

```
1. Go to vercel.com → Add New Project → Import from GitHub
2. Select the GenWallDecor repo, set root directory to: frontend
3. Framework: Next.js (auto-detected)
4. Add environment variables:
   - NEXT_PUBLIC_API_URL = <Cloud Run URL from Task 9 deploy output>
   - NEXT_PUBLIC_FIREBASE_API_KEY = <from Firebase Console > Project Settings>
   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = walldecorgen.firebaseapp.com
   - NEXT_PUBLIC_FIREBASE_PROJECT_ID = walldecorgen
   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = walldecorgen.appspot.com
   - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = <from Firebase Console>
   - NEXT_PUBLIC_FIREBASE_APP_ID = <from Firebase Console>
   - NEXT_PUBLIC_SENTRY_DSN = <from Sentry after creating Next.js project>
5. Deploy
6. Copy the production URL (e.g. https://genwalldecor.vercel.app)
7. Add it to Firebase Console > Authentication > Settings > Authorized domains
8. Update CORS_ORIGIN secret in GCP Secret Manager to this URL
```

---

## Task 11: Pre-launch verification

**Step 1: Merge feature/implementation to main**

```bash
git checkout main
git merge feature/implementation
git push origin main
```

Verify the GitHub Actions deploy workflow runs and turns green.

**Step 2: Set OpenAI spend limit**

Go to `platform.openai.com` > Settings > Limits. Set a monthly hard limit appropriate for the beta (e.g. $50).

**Step 3: Set GCP budget alert**

Go to GCP Console > Billing > Budgets & alerts. Create a budget alert at (e.g.) $50/month for the `walldecorgen` project. Add your email to notifications.

**Step 4: Create LangFuse project**

Go to `cloud.langfuse.com` > New Project > "GenWallDecor". Copy the Secret Key and Public Key into GCP Secret Manager (see Task 9 prerequisites).

**Step 5: Full E2E test on production**

Navigate to the Vercel URL. Sign in with Google. Complete the full creation flow:
- Select a style
- Set visual preferences
- Set room context
- Generate descriptions
- Generate images
- Verify wall view renders correctly
- Verify history page shows the generation

Check LangFuse dashboard — should show traces for the description generation and image generation calls with token counts.

Check Sentry — should show no new errors.

---

## Summary of files created/modified

| File | Action |
|------|--------|
| `backend/.env.example` | Create |
| `frontend/.env.example` | Create |
| `backend/src/index.ts` | Update CORS + add Sentry |
| `backend/src/services/descriptionService.ts` | Add LangFuse tracing |
| `backend/src/services/imageService.ts` | Add LangFuse tracing |
| `backend/Dockerfile` | Create |
| `backend/.dockerignore` | Create |
| `frontend/sentry.client.config.ts` | Create |
| `frontend/sentry.server.config.ts` | Create |
| `frontend/next.config.ts` | Update with withSentryConfig |
| `firestore.indexes.json` | Create |
| `firestore.rules` | Create |
| `firebase.json` | Create |
| `.github/workflows/ci.yml` | Create |
| `.github/workflows/deploy.yml` | Create |
| `.gitignore` | Already updated ✓ |
