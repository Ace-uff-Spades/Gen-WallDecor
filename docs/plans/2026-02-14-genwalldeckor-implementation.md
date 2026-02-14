# GenWallDecor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack wall decor generation app using a describe-then-generate AI pipeline.

**Architecture:** Next.js frontend communicates via REST API to a separate Express backend. The backend orchestrates GPT-4o-mini for text descriptions and Gemini 2.5 Flash for image generation, persisting data to Firestore and GCS.

**Tech Stack:** Next.js (App Router), Express, TypeScript, Tailwind CSS, Firebase Admin SDK, OpenAI SDK, @google/genai, Jest, Supertest, React Testing Library

**Design Doc:** `docs/plans/2026-02-14-genwalldeckor-design.md`

---

## Phase 1: Project Scaffolding & Backend Foundation

### Task 1: Initialize Backend Project

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/index.ts`
- Create: `backend/.env.example`
- Create: `backend/.gitignore`

**Step 1: Create backend directory and initialize**

```bash
cd /Users/abhi/Documents/Coding\ Projects/GenWallDecor
mkdir -p backend/src
cd backend
npm init -y
npm install express cors dotenv
npm install -D typescript @types/node @types/express @types/cors ts-node nodemon jest ts-jest @types/jest supertest @types/supertest
npx tsc --init
```

**Step 2: Configure tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Step 3: Create the minimal Express server**

`backend/src/index.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

**Step 4: Create .env.example**

```
PORT=3001
AUTH_DISABLED=true

# Firebase
FIREBASE_PROJECT_ID=walldecorgen
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# OpenAI
OPENAI_API_KEY=

# Google AI (Gemini)
GEMINI_API_KEY=
```

**Step 5: Create backend/.gitignore**

```
node_modules/
dist/
.env
*.local
```

**Step 6: Add scripts to package.json**

Add to `backend/package.json` scripts:
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest --config jest.config.js"
  }
}
```

**Step 7: Create jest.config.js**

`backend/jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
};
```

**Step 8: Write a test for the health endpoint**

`backend/src/index.test.ts`:
```typescript
import request from 'supertest';
import app from './index';

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
```

**Step 9: Run the test**

```bash
cd backend && npx jest --config jest.config.js
```

Expected: PASS

**Step 10: Commit**

```bash
git add backend/
git commit -m "feat: initialize backend with Express, TypeScript, health endpoint"
```

---

### Task 2: Initialize Frontend Project

**Files:**
- Create: `frontend/` (via create-next-app)

**Step 1: Scaffold Next.js app**

```bash
cd /Users/abhi/Documents/Coding\ Projects/GenWallDecor
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

Answer prompts: Yes to all defaults, use npm.

**Step 2: Configure Tailwind theme colors**

Edit `frontend/tailwind.config.ts` to add the custom color scheme:
```typescript
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1b998b',
        background: '#f8f1ff',
        secondary: '#decdf5',
        'text-dark': '#656176',
        'text-darker': '#534d56',
      },
      borderRadius: {
        'soft': '12px',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

**Step 3: Set global styles**

Replace `frontend/src/app/globals.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #f8f1ff;
  color: #534d56;
  font-family: system-ui, -apple-system, sans-serif;
}
```

**Step 4: Create a minimal landing page**

Replace `frontend/src/app/page.tsx` with:
```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold text-primary">GenWallDecor</h1>
    </main>
  );
}
```

**Step 5: Create frontend .env.example**

`frontend/.env.example`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDL-F_1uZKu8XLTGMRGFPJzoRYlD7sAUPc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=walldecorgen.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=walldecorgen
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=walldecorgen.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=838129573192
NEXT_PUBLIC_FIREBASE_APP_ID=1:838129573192:web:bd602ecc2daf15e095277d
```

**Step 6: Verify frontend runs**

```bash
cd frontend && npm run dev
```

Verify http://localhost:3000 shows "GenWallDecor" in teal.

**Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: initialize frontend with Next.js, Tailwind, custom theme"
```

---

### Task 3: Firebase Admin Initialization

**Files:**
- Create: `backend/src/config/firebase.ts`
- Create: `backend/src/config/firebase.test.ts`

**Step 1: Install firebase-admin**

```bash
cd backend && npm install firebase-admin
```

**Step 2: Write the failing test**

`backend/src/config/firebase.test.ts`:
```typescript
import { getFirebaseApp, getDb, getBucket } from './firebase';

// Mock firebase-admin to avoid needing real credentials in tests
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(() => ({ name: '[DEFAULT]' })),
  cert: jest.fn((config) => config),
  getApp: jest.fn(() => ({ name: '[DEFAULT]' })),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({ collection: jest.fn() })),
}));

jest.mock('firebase-admin/storage', () => ({
  getStorage: jest.fn(() => ({
    bucket: jest.fn(() => ({ name: 'walldecorgen-bucket-1' })),
  })),
}));

describe('Firebase config', () => {
  it('initializes the app and returns it', () => {
    const app = getFirebaseApp();
    expect(app).toBeDefined();
    expect(app.name).toBe('[DEFAULT]');
  });

  it('returns a Firestore db instance', () => {
    const db = getDb();
    expect(db).toBeDefined();
    expect(db.collection).toBeDefined();
  });

  it('returns a storage bucket', () => {
    const bucket = getBucket();
    expect(bucket).toBeDefined();
  });
});
```

**Step 3: Run test to verify it fails**

```bash
cd backend && npx jest src/config/firebase.test.ts
```

Expected: FAIL — module not found

**Step 4: Write the implementation**

`backend/src/config/firebase.ts`:
```typescript
import { initializeApp, cert, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app: App;

export function getFirebaseApp(): App {
  if (app) return app;

  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: 'walldecorgen-bucket-1',
  });

  return app;
}

export function getDb(): Firestore {
  getFirebaseApp();
  return getFirestore();
}

export function getBucket() {
  getFirebaseApp();
  return getStorage().bucket();
}
```

**Step 5: Run test to verify it passes**

```bash
cd backend && npx jest src/config/firebase.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add backend/src/config/
git commit -m "feat: add Firebase Admin SDK initialization"
```

---

### Task 4: Auth Middleware

**Files:**
- Create: `backend/src/middleware/authenticate.ts`
- Create: `backend/src/middleware/authenticate.test.ts`

**Step 1: Write the failing test**

`backend/src/middleware/authenticate.test.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { authenticate } from './authenticate';

// Mock firebase-admin/auth
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn((token: string) => {
      if (token === 'valid-token') {
        return Promise.resolve({ uid: 'user123', email: 'test@gmail.com' });
      }
      return Promise.reject(new Error('Invalid token'));
    }),
  })),
}));

// Also need to mock the firebase init since authenticate imports it
jest.mock('../config/firebase', () => ({
  getFirebaseApp: jest.fn(),
}));

function mockReqResNext(authHeader?: string) {
  const req = { headers: { authorization: authHeader } } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

describe('authenticate middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 401 if no Authorization header', async () => {
    const { req, res, next } = mockReqResNext();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if header does not start with Bearer', async () => {
    const { req, res, next } = mockReqResNext('Basic abc');
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 403 for invalid token', async () => {
    const { req, res, next } = mockReqResNext('Bearer invalid-token');
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('calls next() with user on req for valid token', async () => {
    const { req, res, next } = mockReqResNext('Bearer valid-token');
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual({ uid: 'user123', email: 'test@gmail.com' });
  });

  it('bypasses auth when AUTH_DISABLED=true', async () => {
    process.env.AUTH_DISABLED = 'true';
    const { req, res, next } = mockReqResNext();
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual({ uid: 'test-user', email: 'test@test.com' });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd backend && npx jest src/middleware/authenticate.test.ts
```

Expected: FAIL — module not found

**Step 3: Write the implementation**

`backend/src/middleware/authenticate.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseApp } from '../config/firebase';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Test bypass
  if (process.env.AUTH_DISABLED === 'true') {
    (req as any).user = { uid: 'test-user', email: 'test@test.com' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    getFirebaseApp();
    const decodedToken = await getAuth().verifyIdToken(idToken);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd backend && npx jest src/middleware/authenticate.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/middleware/
git commit -m "feat: add auth middleware with Firebase token verification and test bypass"
```

---

## Phase 2: Backend Services

### Task 5: Firestore User Service

**Files:**
- Create: `backend/src/services/userService.ts`
- Create: `backend/src/services/userService.test.ts`

**Step 1: Write the failing test**

`backend/src/services/userService.test.ts`:
```typescript
import { UserService } from './userService';

const mockDoc = {
  exists: true,
  data: jest.fn(() => ({
    email: 'test@gmail.com',
    dailyGenerationCount: 3,
    lastResetDate: '2026-02-14',
  })),
  id: 'user123',
};

const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockGet = jest.fn(() => Promise.resolve(mockDoc));

const mockDocRef = jest.fn(() => ({
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
}));

const mockDb = {
  collection: jest.fn(() => ({
    doc: mockDocRef,
  })),
};

jest.mock('../config/firebase', () => ({
  getDb: jest.fn(() => mockDb),
}));

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService();
  });

  it('getOrCreateUser returns existing user', async () => {
    const user = await service.getOrCreateUser('user123', 'test@gmail.com');
    expect(user.email).toBe('test@gmail.com');
    expect(user.dailyGenerationCount).toBe(3);
  });

  it('getOrCreateUser creates new user if not found', async () => {
    mockGet.mockResolvedValueOnce({ exists: false });
    const user = await service.getOrCreateUser('user123', 'test@gmail.com');
    expect(mockSet).toHaveBeenCalled();
    expect(user.email).toBe('test@gmail.com');
    expect(user.dailyGenerationCount).toBe(0);
  });

  it('canGenerate returns true when under limit', async () => {
    const result = await service.canGenerate('user123');
    expect(result).toBe(true);
  });

  it('canGenerate returns false when at limit', async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        dailyGenerationCount: 10,
        lastResetDate: new Date().toISOString().split('T')[0],
      }),
    });
    const result = await service.canGenerate('user123');
    expect(result).toBe(false);
  });

  it('canGenerate resets count if lastResetDate is yesterday', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        dailyGenerationCount: 10,
        lastResetDate: yesterday.toISOString().split('T')[0],
      }),
    });
    const result = await service.canGenerate('user123');
    expect(result).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('incrementGenerationCount increments the count', async () => {
    await service.incrementGenerationCount('user123');
    expect(mockUpdate).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd backend && npx jest src/services/userService.test.ts
```

Expected: FAIL

**Step 3: Write the implementation**

`backend/src/services/userService.ts`:
```typescript
import { getDb } from '../config/firebase';

const DAILY_LIMIT = 10;

export interface UserData {
  email: string;
  dailyGenerationCount: number;
  lastResetDate: string;
  createdAt: string;
}

export class UserService {
  private get usersCollection() {
    return getDb().collection('users');
  }

  async getOrCreateUser(uid: string, email: string): Promise<UserData> {
    const docRef = this.usersCollection.doc(uid);
    const doc = await docRef.get();

    if (doc.exists) {
      return doc.data() as UserData;
    }

    const newUser: UserData = {
      email,
      dailyGenerationCount: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    await docRef.set(newUser);
    return newUser;
  }

  async canGenerate(uid: string): Promise<boolean> {
    const docRef = this.usersCollection.doc(uid);
    const doc = await docRef.get();

    if (!doc.exists) return true;

    const data = doc.data() as UserData;
    const today = new Date().toISOString().split('T')[0];

    if (data.lastResetDate !== today) {
      await docRef.update({ dailyGenerationCount: 0, lastResetDate: today });
      return true;
    }

    return data.dailyGenerationCount < DAILY_LIMIT;
  }

  async incrementGenerationCount(uid: string): Promise<void> {
    const docRef = this.usersCollection.doc(uid);
    const doc = await docRef.get();
    const data = doc.data() as UserData;
    const today = new Date().toISOString().split('T')[0];

    await docRef.update({
      dailyGenerationCount: data.lastResetDate === today
        ? data.dailyGenerationCount + 1
        : 1,
      lastResetDate: today,
    });
  }

  async getProfile(uid: string): Promise<UserData | null> {
    const doc = await this.usersCollection.doc(uid).get();
    return doc.exists ? (doc.data() as UserData) : null;
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd backend && npx jest src/services/userService.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/services/userService*
git commit -m "feat: add UserService with rate limiting and daily reset"
```

---

### Task 6: Storage Service

**Files:**
- Create: `backend/src/services/storageService.ts`
- Create: `backend/src/services/storageService.test.ts`

**Step 1: Write the failing test**

`backend/src/services/storageService.test.ts`:
```typescript
import { StorageService } from './storageService';

const mockSave = jest.fn(() => Promise.resolve());
const mockDelete = jest.fn(() => Promise.resolve());
const mockGetSignedUrl = jest.fn(() => Promise.resolve(['https://signed-url.example.com']));

const mockFile = jest.fn(() => ({
  save: mockSave,
  delete: mockDelete,
  getSignedUrl: mockGetSignedUrl,
}));

jest.mock('../config/firebase', () => ({
  getBucket: jest.fn(() => ({
    file: mockFile,
  })),
}));

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StorageService();
  });

  it('uploadBuffer calls file.save with correct params', async () => {
    const buffer = Buffer.from('fake-image-data');
    const path = 'generations/gen123/piece-1.png';

    await service.uploadBuffer(buffer, path, 'image/png');

    expect(mockFile).toHaveBeenCalledWith(path);
    expect(mockSave).toHaveBeenCalledWith(buffer, {
      metadata: { contentType: 'image/png' },
    });
  });

  it('getSignedUrl returns a URL', async () => {
    const url = await service.getSignedUrl('some/path.png');
    expect(url).toBe('https://signed-url.example.com');
  });

  it('deleteFile calls file.delete', async () => {
    await service.deleteFile('some/path.png');
    expect(mockDelete).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd backend && npx jest src/services/storageService.test.ts
```

Expected: FAIL

**Step 3: Write the implementation**

`backend/src/services/storageService.ts`:
```typescript
import { getBucket } from '../config/firebase';

export class StorageService {
  async uploadBuffer(buffer: Buffer, destinationPath: string, contentType: string): Promise<void> {
    const file = getBucket().file(destinationPath);
    await file.save(buffer, {
      metadata: { contentType },
    });
  }

  async getSignedUrl(storagePath: string, expiresInMs = 60 * 60 * 1000): Promise<string> {
    const [url] = await getBucket().file(storagePath).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInMs,
    });
    return url;
  }

  async deleteFile(storagePath: string): Promise<void> {
    await getBucket().file(storagePath).delete();
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd backend && npx jest src/services/storageService.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/services/storageService*
git commit -m "feat: add StorageService for GCS uploads, signed URLs, and deletion"
```

---

### Task 7: Description Generation Service (GPT-4o-mini)

**Files:**
- Create: `backend/src/services/descriptionService.ts`
- Create: `backend/src/services/descriptionService.test.ts`
- Create: `backend/src/types.ts`

**Step 1: Install OpenAI SDK and Zod**

```bash
cd backend && npm install openai zod
```

**Step 2: Create shared types**

`backend/src/types.ts`:
```typescript
export interface UserPreferences {
  style: string;
  colorScheme: string[];
  frameMaterial: string;
  roomType: string;
  wallDimensions?: { width: number; height: number };
}

export interface PieceDescription {
  title: string;
  description: string;
  medium: string;
  dimensions: string;
  placement: string;
}

export interface GenerationRequest {
  preferences: UserPreferences;
  feedback?: string;
}
```

**Step 3: Write the failing test**

`backend/src/services/descriptionService.test.ts`:
```typescript
import { DescriptionService } from './descriptionService';
import { UserPreferences } from '../types';

// Mock OpenAI
const mockParse = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    beta: {
      chat: {
        completions: {
          parse: mockParse,
        },
      },
    },
  }));
});

describe('DescriptionService', () => {
  let service: DescriptionService;
  const preferences: UserPreferences = {
    style: 'Bohemian',
    colorScheme: ['warm earth tones', 'terracotta'],
    frameMaterial: 'natural wood',
    roomType: 'living room',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    service = new DescriptionService();
  });

  it('buildPrompt includes style, colors, material, and room type', () => {
    const prompt = service.buildPrompt(preferences);
    expect(prompt).toContain('Bohemian');
    expect(prompt).toContain('warm earth tones');
    expect(prompt).toContain('terracotta');
    expect(prompt).toContain('natural wood');
    expect(prompt).toContain('living room');
  });

  it('buildPrompt includes feedback when provided', () => {
    const prompt = service.buildPrompt(preferences, 'more blue accents');
    expect(prompt).toContain('more blue accents');
  });

  it('generateDescriptions calls OpenAI with correct model', async () => {
    mockParse.mockResolvedValue({
      choices: [{
        message: {
          parsed: {
            pieces: [
              {
                title: 'Desert Sunset',
                description: 'A warm-toned abstract painting',
                medium: 'Canvas print',
                dimensions: '24x36 inches',
                placement: 'Center wall, eye level',
              },
            ],
          },
        },
      }],
    });

    const result = await service.generateDescriptions(preferences);
    expect(mockParse).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4o-mini' })
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Desert Sunset');
  });
});
```

**Step 4: Run test to verify it fails**

```bash
cd backend && npx jest src/services/descriptionService.test.ts
```

Expected: FAIL

**Step 5: Write the implementation**

`backend/src/services/descriptionService.ts`:
```typescript
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
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

    const response = await this.client.beta.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert interior designer. Return structured JSON descriptions of wall decor pieces.' },
        { role: 'user', content: prompt },
      ],
      response_format: zodResponseFormat(DescriptionsResponseSchema, 'descriptions'),
    });

    const parsed = response.choices[0].message.parsed;
    if (!parsed) {
      throw new Error('Failed to parse description response');
    }

    return parsed.pieces;
  }
}
```

**Step 6: Run test to verify it passes**

```bash
cd backend && npx jest src/services/descriptionService.test.ts
```

Expected: PASS

**Step 7: Commit**

```bash
git add backend/src/services/descriptionService* backend/src/types.ts
git commit -m "feat: add DescriptionService with GPT-4o-mini structured output"
```

---

### Task 8: Image Generation Service (Gemini 2.5 Flash)

**Files:**
- Create: `backend/src/services/imageService.ts`
- Create: `backend/src/services/imageService.test.ts`

**Step 1: Install Google GenAI SDK**

```bash
cd backend && npm install @google/genai
```

**Step 2: Write the failing test**

`backend/src/services/imageService.test.ts`:
```typescript
import { ImageService } from './imageService';
import { PieceDescription } from '../types';

const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

describe('ImageService', () => {
  let service: ImageService;

  const description: PieceDescription = {
    title: 'Desert Sunset',
    description: 'A warm abstract painting with terracotta and burnt orange',
    medium: 'Canvas print',
    dimensions: '24x36 inches',
    placement: 'Center wall',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
    service = new ImageService();
  });

  it('buildPiecePrompt includes description details', () => {
    const prompt = service.buildPiecePrompt(description, 'Bohemian');
    expect(prompt).toContain('Desert Sunset');
    expect(prompt).toContain('warm abstract painting');
    expect(prompt).toContain('Bohemian');
    expect(prompt).toContain('Canvas print');
  });

  it('generatePieceImage returns base64 image data', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{
            inlineData: {
              data: 'base64imagedata',
              mimeType: 'image/png',
            },
          }],
        },
      }],
    });

    const result = await service.generatePieceImage(description, 'Bohemian');
    expect(result.data).toBe('base64imagedata');
    expect(result.mimeType).toBe('image/png');
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-2.5-flash-image' })
    );
  });

  it('generateWallRender includes room context in prompt', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{
            inlineData: { data: 'wallrenderdata', mimeType: 'image/png' },
          }],
        },
      }],
    });

    const pieces = [description];
    const result = await service.generateWallRender(pieces, 'Bohemian', 'living room');
    expect(result.data).toBe('wallrenderdata');
  });

  it('throws if no image in response', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{ text: 'No image generated' }],
        },
      }],
    });

    await expect(service.generatePieceImage(description, 'Bohemian'))
      .rejects.toThrow('No image in response');
  });
});
```

**Step 3: Run test to verify it fails**

```bash
cd backend && npx jest src/services/imageService.test.ts
```

Expected: FAIL

**Step 4: Write the implementation**

`backend/src/services/imageService.ts`:
```typescript
import { GoogleGenAI } from '@google/genai';
import { PieceDescription } from '../types';

export interface GeneratedImage {
  data: string; // base64
  mimeType: string;
}

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

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: ['Image'],
        imageConfig: { aspectRatio: '4:5' },
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

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: ['Image'],
        imageConfig: { aspectRatio: '16:9' },
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

**Step 5: Run test to verify it passes**

```bash
cd backend && npx jest src/services/imageService.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add backend/src/services/imageService*
git commit -m "feat: add ImageService with Gemini 2.5 Flash for piece and wall rendering"
```

---

### Task 9: Generation Service (Orchestrator)

**Files:**
- Create: `backend/src/services/generationService.ts`
- Create: `backend/src/services/generationService.test.ts`

**Step 1: Write the failing test**

`backend/src/services/generationService.test.ts`:
```typescript
import { GenerationService } from './generationService';
import { UserPreferences } from '../types';

// Mock all dependencies
jest.mock('./descriptionService');
jest.mock('./imageService');
jest.mock('./storageService');
jest.mock('../config/firebase', () => ({
  getDb: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn(() => Promise.resolve({ id: 'gen123' })),
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
        delete: jest.fn(),
      })),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      get: jest.fn(() => Promise.resolve({
        docs: [],
        size: 0,
      })),
    })),
  })),
}));

import { DescriptionService } from './descriptionService';
import { ImageService } from './imageService';
import { StorageService } from './storageService';

const mockDescriptionService = DescriptionService as jest.MockedClass<typeof DescriptionService>;
const mockImageService = ImageService as jest.MockedClass<typeof ImageService>;
const mockStorageService = StorageService as jest.MockedClass<typeof StorageService>;

describe('GenerationService', () => {
  let service: GenerationService;

  const preferences: UserPreferences = {
    style: 'Bohemian',
    colorScheme: ['warm earth tones'],
    frameMaterial: 'natural wood',
    roomType: 'living room',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockDescriptionService.prototype.generateDescriptions = jest.fn().mockResolvedValue([
      { title: 'Art 1', description: 'Desc 1', medium: 'Canvas', dimensions: '24x36', placement: 'Center' },
    ]);

    mockImageService.prototype.generatePieceImage = jest.fn().mockResolvedValue({
      data: 'base64data',
      mimeType: 'image/png',
    });

    mockImageService.prototype.generateWallRender = jest.fn().mockResolvedValue({
      data: 'walldata',
      mimeType: 'image/png',
    });

    mockStorageService.prototype.uploadBuffer = jest.fn().mockResolvedValue(undefined);
    mockStorageService.prototype.getSignedUrl = jest.fn().mockResolvedValue('https://signed.url');

    service = new GenerationService();
  });

  it('generateDescriptions delegates to DescriptionService', async () => {
    const result = await service.generateDescriptions(preferences);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Art 1');
  });

  it('generateImages creates images and uploads to GCS', async () => {
    const descriptions = [
      { title: 'Art 1', description: 'Desc 1', medium: 'Canvas', dimensions: '24x36', placement: 'Center' },
    ];

    const result = await service.generateImages('user123', preferences, descriptions);
    expect(result.generationId).toBeDefined();
    expect(mockImageService.prototype.generatePieceImage).toHaveBeenCalledTimes(1);
    expect(mockImageService.prototype.generateWallRender).toHaveBeenCalledTimes(1);
    expect(mockStorageService.prototype.uploadBuffer).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd backend && npx jest src/services/generationService.test.ts
```

Expected: FAIL

**Step 3: Write the implementation**

`backend/src/services/generationService.ts`:
```typescript
import { getDb } from '../config/firebase';
import { DescriptionService } from './descriptionService';
import { ImageService, GeneratedImage } from './imageService';
import { StorageService } from './storageService';
import { PieceDescription, UserPreferences } from '../types';

export interface GenerationResult {
  generationId: string;
  pieceUrls: string[];
  wallRenderUrl: string;
}

export class GenerationService {
  private descriptionService: DescriptionService;
  private imageService: ImageService;
  private storageService: StorageService;

  constructor() {
    this.descriptionService = new DescriptionService();
    this.imageService = new ImageService();
    this.storageService = new StorageService();
  }

  async generateDescriptions(preferences: UserPreferences, feedback?: string): Promise<PieceDescription[]> {
    return this.descriptionService.generateDescriptions(preferences, feedback);
  }

  async generateImages(
    userId: string,
    preferences: UserPreferences,
    descriptions: PieceDescription[],
  ): Promise<GenerationResult> {
    // Generate individual piece images
    const pieceImages: GeneratedImage[] = [];
    for (const desc of descriptions) {
      const image = await this.imageService.generatePieceImage(desc, preferences.style);
      pieceImages.push(image);
    }

    // Generate wall render
    const wallRender = await this.imageService.generateWallRender(
      descriptions,
      preferences.style,
      preferences.roomType,
    );

    // Create Firestore document
    const db = getDb();
    const generationRef = await db.collection('generations').add({
      userId,
      style: preferences.style,
      preferences,
      descriptions,
      imageRefs: [] as string[],
      wallRenderRef: '',
      createdAt: new Date().toISOString(),
    });

    const genId = generationRef.id;

    // Upload pieces to GCS
    const pieceRefs: string[] = [];
    const pieceUrls: string[] = [];
    for (let i = 0; i < pieceImages.length; i++) {
      const path = `generations/${genId}/piece-${i}.png`;
      const buffer = Buffer.from(pieceImages[i].data, 'base64');
      await this.storageService.uploadBuffer(buffer, path, pieceImages[i].mimeType);
      pieceRefs.push(path);
      const url = await this.storageService.getSignedUrl(path);
      pieceUrls.push(url);
    }

    // Upload wall render
    const wallPath = `generations/${genId}/wall-render.png`;
    const wallBuffer = Buffer.from(wallRender.data, 'base64');
    await this.storageService.uploadBuffer(wallBuffer, wallPath, wallRender.mimeType);
    const wallUrl = await this.storageService.getSignedUrl(wallPath);

    // Update Firestore with refs
    await db.collection('generations').doc(genId).set(
      { imageRefs: pieceRefs, wallRenderRef: wallPath },
      { merge: true }
    );

    return { generationId: genId, pieceUrls, wallRenderUrl: wallUrl };
  }

  async getGeneration(genId: string) {
    const doc = await getDb().collection('generations').doc(genId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async getUserGenerations(userId: string) {
    const snapshot = await getDb()
      .collection('generations')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async enforceHistoryLimit(userId: string): Promise<void> {
    const generations = await this.getUserGenerations(userId);
    if (generations.length <= 3) return;

    const toDelete = generations.slice(3);
    for (const gen of toDelete) {
      const data = gen as any;
      // Delete GCS images
      if (data.imageRefs) {
        for (const ref of data.imageRefs) {
          await this.storageService.deleteFile(ref);
        }
      }
      if (data.wallRenderRef) {
        await this.storageService.deleteFile(data.wallRenderRef);
      }
      // Delete Firestore doc
      await getDb().collection('generations').doc(gen.id).delete();
    }
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd backend && npx jest src/services/generationService.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/services/generationService*
git commit -m "feat: add GenerationService orchestrating descriptions, images, storage, and history"
```

---

## Phase 3: Backend API Routes

### Task 10: Rate Limiting Middleware

**Files:**
- Create: `backend/src/middleware/rateLimit.ts`
- Create: `backend/src/middleware/rateLimit.test.ts`

**Step 1: Write the failing test**

`backend/src/middleware/rateLimit.test.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { rateLimitMiddleware } from './rateLimit';

const mockCanGenerate = jest.fn();
jest.mock('../services/userService', () => ({
  UserService: jest.fn().mockImplementation(() => ({
    canGenerate: mockCanGenerate,
  })),
}));

function mockReqResNext(uid: string) {
  const req = { user: { uid } } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

describe('rateLimitMiddleware', () => {
  it('calls next when user can generate', async () => {
    mockCanGenerate.mockResolvedValue(true);
    const { req, res, next } = mockReqResNext('user123');
    await rateLimitMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 429 when user has hit limit', async () => {
    mockCanGenerate.mockResolvedValue(false);
    const { req, res, next } = mockReqResNext('user123');
    await rateLimitMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(next).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd backend && npx jest src/middleware/rateLimit.test.ts
```

Expected: FAIL

**Step 3: Write the implementation**

`backend/src/middleware/rateLimit.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';

const userService = new UserService();

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const uid = (req as any).user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const canGenerate = await userService.canGenerate(uid);
  if (!canGenerate) {
    res.status(429).json({ error: 'Daily generation limit reached (10/day)' });
    return;
  }

  next();
}
```

**Step 4: Run test to verify it passes**

```bash
cd backend && npx jest src/middleware/rateLimit.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/middleware/rateLimit*
git commit -m "feat: add rate limiting middleware checking daily generation count"
```

---

### Task 11: API Routes

**Files:**
- Create: `backend/src/routes/generate.ts`
- Create: `backend/src/routes/history.ts`
- Create: `backend/src/routes/user.ts`
- Create: `backend/src/routes/generate.test.ts`
- Create: `backend/src/routes/history.test.ts`
- Create: `backend/src/routes/user.test.ts`
- Modify: `backend/src/index.ts` — mount routes

**Step 1: Write the failing test for generate routes**

`backend/src/routes/generate.test.ts`:
```typescript
import request from 'supertest';
import express from 'express';
import { generateRouter } from './generate';

// Mock all services
jest.mock('../services/generationService');
jest.mock('../services/userService');
jest.mock('../config/firebase', () => ({
  getFirebaseApp: jest.fn(),
  getDb: jest.fn(() => ({ collection: jest.fn() })),
  getBucket: jest.fn(),
}));

import { GenerationService } from '../services/generationService';
const mockGenerationService = GenerationService as jest.MockedClass<typeof GenerationService>;

const app = express();
app.use(express.json());
// Simulate authenticated user
app.use((req, _res, next) => {
  (req as any).user = { uid: 'user123', email: 'test@gmail.com' };
  next();
});
app.use('/api/generate', generateRouter);

describe('POST /api/generate/descriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerationService.prototype.generateDescriptions = jest.fn().mockResolvedValue([
      { title: 'Art 1', description: 'Desc', medium: 'Canvas', dimensions: '24x36', placement: 'Center' },
    ]);
  });

  it('returns descriptions for valid preferences', async () => {
    const res = await request(app)
      .post('/api/generate/descriptions')
      .send({
        preferences: {
          style: 'Bohemian',
          colorScheme: ['warm tones'],
          frameMaterial: 'wood',
          roomType: 'living room',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.descriptions).toHaveLength(1);
  });

  it('returns 400 if preferences missing', async () => {
    const res = await request(app)
      .post('/api/generate/descriptions')
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /api/generate/images', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerationService.prototype.generateImages = jest.fn().mockResolvedValue({
      generationId: 'gen123',
      pieceUrls: ['https://url1.com'],
      wallRenderUrl: 'https://wall.com',
    });
    mockGenerationService.prototype.enforceHistoryLimit = jest.fn().mockResolvedValue(undefined);
  });

  it('returns generation result for valid input', async () => {
    const res = await request(app)
      .post('/api/generate/images')
      .send({
        preferences: {
          style: 'Bohemian',
          colorScheme: ['warm tones'],
          frameMaterial: 'wood',
          roomType: 'living room',
        },
        descriptions: [
          { title: 'Art 1', description: 'Desc', medium: 'Canvas', dimensions: '24x36', placement: 'Center' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.generationId).toBe('gen123');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd backend && npx jest src/routes/generate.test.ts
```

Expected: FAIL

**Step 3: Write the generate routes implementation**

`backend/src/routes/generate.ts`:
```typescript
import { Router, Request, Response } from 'express';
import { GenerationService } from '../services/generationService';
import { UserService } from '../services/userService';

export const generateRouter = Router();
const generationService = new GenerationService();
const userService = new UserService();

generateRouter.post('/descriptions', async (req: Request, res: Response) => {
  try {
    const { preferences, feedback } = req.body;

    if (!preferences || !preferences.style || !preferences.roomType) {
      res.status(400).json({ error: 'Missing required preferences (style, roomType)' });
      return;
    }

    const descriptions = await generationService.generateDescriptions(preferences, feedback);
    res.json({ descriptions });
  } catch (error: any) {
    console.error('Description generation failed:', error);
    res.status(500).json({ error: 'Failed to generate descriptions' });
  }
});

generateRouter.post('/images', async (req: Request, res: Response) => {
  try {
    const { preferences, descriptions } = req.body;
    const uid = (req as any).user.uid;

    if (!preferences || !descriptions || !descriptions.length) {
      res.status(400).json({ error: 'Missing preferences or descriptions' });
      return;
    }

    const result = await generationService.generateImages(uid, preferences, descriptions);

    // Increment generation count and enforce history limit
    await userService.incrementGenerationCount(uid);
    await generationService.enforceHistoryLimit(uid);

    res.json(result);
  } catch (error: any) {
    console.error('Image generation failed:', error);
    res.status(500).json({ error: 'Failed to generate images' });
  }
});
```

**Step 4: Write history and user route tests and implementations**

`backend/src/routes/history.ts`:
```typescript
import { Router, Request, Response } from 'express';
import { GenerationService } from '../services/generationService';
import { StorageService } from '../services/storageService';

export const historyRouter = Router();
const generationService = new GenerationService();
const storageService = new StorageService();

historyRouter.get('/', async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const generations = await generationService.getUserGenerations(uid);
    // Only return last 3
    const recent = generations.slice(0, 3);

    // Attach signed URLs
    const withUrls = await Promise.all(
      recent.map(async (gen: any) => ({
        ...gen,
        wallRenderUrl: gen.wallRenderRef
          ? await storageService.getSignedUrl(gen.wallRenderRef)
          : null,
      }))
    );

    res.json({ generations: withUrls });
  } catch (error) {
    console.error('Failed to fetch history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

historyRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const generation = await generationService.getGeneration(req.params.id);
    if (!generation) {
      res.status(404).json({ error: 'Generation not found' });
      return;
    }

    // Attach signed URLs for all images
    const data = generation as any;
    const pieceUrls = data.imageRefs
      ? await Promise.all(data.imageRefs.map((ref: string) => storageService.getSignedUrl(ref)))
      : [];
    const wallRenderUrl = data.wallRenderRef
      ? await storageService.getSignedUrl(data.wallRenderRef)
      : null;

    res.json({ ...generation, pieceUrls, wallRenderUrl });
  } catch (error) {
    console.error('Failed to fetch generation:', error);
    res.status(500).json({ error: 'Failed to fetch generation' });
  }
});
```

`backend/src/routes/user.ts`:
```typescript
import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService';

export const userRouter = Router();
const userService = new UserService();

userRouter.get('/profile', async (req: Request, res: Response) => {
  try {
    const { uid, email } = (req as any).user;
    const profile = await userService.getOrCreateUser(uid, email);
    res.json(profile);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});
```

**Step 5: Update index.ts to mount all routes**

Modify `backend/src/index.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticate } from './middleware/authenticate';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { generateRouter } from './routes/generate';
import { historyRouter } from './routes/history';
import { userRouter } from './routes/user';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Protected routes
app.use('/api/generate', authenticate, rateLimitMiddleware, generateRouter);
app.use('/api/history', authenticate, historyRouter);
app.use('/api/user', authenticate, userRouter);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
```

**Step 6: Run all backend tests**

```bash
cd backend && npx jest
```

Expected: All PASS

**Step 7: Commit**

```bash
git add backend/src/routes/ backend/src/index.ts
git commit -m "feat: add API routes for generate, history, and user with auth and rate limiting"
```

---

## Phase 4: Frontend Implementation

### Task 12: API Client & Firebase Client Setup

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/firebase.ts`

**Step 1: Install Firebase client SDK**

```bash
cd frontend && npm install firebase
```

**Step 2: Create Firebase client config**

`frontend/src/lib/firebase.ts`:
```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

**Step 3: Create API client**

`frontend/src/lib/api.ts`:
```typescript
import { auth } from './firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getAuthHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  generateDescriptions: (preferences: any, feedback?: string) =>
    apiRequest('/api/generate/descriptions', {
      method: 'POST',
      body: JSON.stringify({ preferences, feedback }),
    }),

  generateImages: (preferences: any, descriptions: any[]) =>
    apiRequest('/api/generate/images', {
      method: 'POST',
      body: JSON.stringify({ preferences, descriptions }),
    }),

  getHistory: () => apiRequest('/api/history'),

  getGeneration: (id: string) => apiRequest(`/api/history/${id}`),

  getProfile: () => apiRequest('/api/user/profile'),
};
```

**Step 4: Commit**

```bash
git add frontend/src/lib/
git commit -m "feat: add API client and Firebase client config for frontend"
```

---

### Task 13: Decor Styles Data & Creation Wizard State

**Files:**
- Create: `frontend/src/lib/styles.ts`
- Create: `frontend/src/lib/useCreationWizard.ts`

**Step 1: Create decor styles data with visual preference defaults**

`frontend/src/lib/styles.ts`:
```typescript
export interface DecorStyle {
  name: string;
  description: string;
  defaultColorScheme: string[];
  defaultFrameMaterial: string;
}

export const DECOR_STYLES: DecorStyle[] = [
  { name: 'Transitional', description: 'Blend of traditional and contemporary', defaultColorScheme: ['beige', 'gray', 'cream'], defaultFrameMaterial: 'dark wood' },
  { name: 'Traditional', description: 'Classic elegance with ornate details', defaultColorScheme: ['burgundy', 'gold', 'navy'], defaultFrameMaterial: 'ornate gold' },
  { name: 'Modern', description: 'Clean lines and bold statements', defaultColorScheme: ['black', 'white', 'red accent'], defaultFrameMaterial: 'black metal' },
  { name: 'Eclectic', description: 'Mix of patterns, textures, and eras', defaultColorScheme: ['jewel tones', 'mustard', 'teal'], defaultFrameMaterial: 'mixed materials' },
  { name: 'Contemporary', description: 'Current trends with sleek aesthetics', defaultColorScheme: ['neutral gray', 'white', 'charcoal'], defaultFrameMaterial: 'brushed silver' },
  { name: 'Minimalist', description: 'Less is more — intentional simplicity', defaultColorScheme: ['white', 'off-white', 'light gray'], defaultFrameMaterial: 'thin white' },
  { name: 'Mid Century Modern', description: 'Retro 1950s-60s inspired warmth', defaultColorScheme: ['olive', 'burnt orange', 'mustard'], defaultFrameMaterial: 'walnut' },
  { name: 'Bohemian', description: 'Free-spirited with global influences', defaultColorScheme: ['terracotta', 'warm earth tones', 'sage'], defaultFrameMaterial: 'natural wood' },
  { name: 'Modern Farmhouse', description: 'Rustic charm meets modern comfort', defaultColorScheme: ['white', 'sage green', 'natural wood tones'], defaultFrameMaterial: 'distressed wood' },
  { name: 'Shabby Chic', description: 'Vintage elegance with soft pastels', defaultColorScheme: ['blush pink', 'cream', 'soft blue'], defaultFrameMaterial: 'whitewashed wood' },
  { name: 'Coastal', description: 'Beach-inspired relaxation', defaultColorScheme: ['ocean blue', 'sandy beige', 'seafoam'], defaultFrameMaterial: 'light driftwood' },
  { name: 'Hollywood Glam', description: 'Luxurious and dramatic', defaultColorScheme: ['black', 'gold', 'deep purple'], defaultFrameMaterial: 'mirrored gold' },
  { name: 'Southwestern', description: 'Desert-inspired warmth', defaultColorScheme: ['turquoise', 'terracotta', 'sand'], defaultFrameMaterial: 'rustic wood' },
  { name: 'Rustic', description: 'Raw natural beauty', defaultColorScheme: ['brown', 'forest green', 'cream'], defaultFrameMaterial: 'reclaimed barn wood' },
  { name: 'Industrial', description: 'Urban warehouse aesthetic', defaultColorScheme: ['charcoal', 'rust', 'concrete gray'], defaultFrameMaterial: 'black iron pipe' },
  { name: 'French Country', description: 'Provincial elegance', defaultColorScheme: ['lavender', 'butter yellow', 'soft blue'], defaultFrameMaterial: 'aged gilt' },
  { name: 'Scandinavian', description: 'Nordic simplicity and warmth', defaultColorScheme: ['white', 'pale pink', 'light wood'], defaultFrameMaterial: 'light birch' },
  { name: 'Mediterranean', description: 'Sun-drenched warmth', defaultColorScheme: ['terracotta', 'cobalt blue', 'olive'], defaultFrameMaterial: 'wrought iron' },
  { name: 'Art Deco', description: 'Geometric glamour of the 1920s', defaultColorScheme: ['gold', 'black', 'emerald'], defaultFrameMaterial: 'gold geometric' },
  { name: 'Asian Zen', description: 'Peaceful minimalist harmony', defaultColorScheme: ['bamboo green', 'black', 'cream'], defaultFrameMaterial: 'bamboo' },
];

export const ROOM_TYPES = [
  'Living Room',
  'Bedroom',
  'Dining Room',
  'Home Office',
  'Hallway',
  'Bathroom',
  'Kitchen',
  'Nursery',
];

export const FRAME_MATERIALS = [
  'Natural Wood',
  'Dark Wood',
  'Walnut',
  'Light Birch',
  'Black Metal',
  'Gold Metal',
  'Brushed Silver',
  'White',
  'Distressed Wood',
  'Bamboo',
  'Frameless',
];
```

**Step 2: Create wizard state hook**

`frontend/src/lib/useCreationWizard.ts`:
```typescript
'use client';

import { useState, useCallback } from 'react';

export interface WizardState {
  step: number;
  style: string;
  colorScheme: string[];
  frameMaterial: string;
  roomType: string;
  wallWidth?: number;
  wallHeight?: number;
}

const initialState: WizardState = {
  step: 1,
  style: '',
  colorScheme: [],
  frameMaterial: '',
  roomType: '',
};

export function useCreationWizard() {
  const [state, setState] = useState<WizardState>(initialState);

  const setStyle = useCallback((style: string) => {
    setState(prev => ({ ...prev, style }));
  }, []);

  const setColorScheme = useCallback((colorScheme: string[]) => {
    setState(prev => ({ ...prev, colorScheme }));
  }, []);

  const setFrameMaterial = useCallback((frameMaterial: string) => {
    setState(prev => ({ ...prev, frameMaterial }));
  }, []);

  const setRoomType = useCallback((roomType: string) => {
    setState(prev => ({ ...prev, roomType }));
  }, []);

  const setDimensions = useCallback((width?: number, height?: number) => {
    setState(prev => ({ ...prev, wallWidth: width, wallHeight: height }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({ ...prev, step: Math.min(prev.step + 1, 4) }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({ ...prev, step: Math.max(prev.step - 1, 1) }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const getPreferences = useCallback(() => ({
    style: state.style,
    colorScheme: state.colorScheme,
    frameMaterial: state.frameMaterial,
    roomType: state.roomType,
    ...(state.wallWidth && state.wallHeight
      ? { wallDimensions: { width: state.wallWidth, height: state.wallHeight } }
      : {}),
  }), [state]);

  return {
    state,
    setStyle,
    setColorScheme,
    setFrameMaterial,
    setRoomType,
    setDimensions,
    nextStep,
    prevStep,
    reset,
    getPreferences,
  };
}
```

**Step 3: Commit**

```bash
git add frontend/src/lib/styles.ts frontend/src/lib/useCreationWizard.ts
git commit -m "feat: add decor styles data and creation wizard state hook"
```

---

### Task 14: Landing Page

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/layout.tsx` (modify existing)

**Step 1: Build the landing page**

Note: Use the `frontend-design` skill for this task to ensure high design quality. The landing page should feature:
- Hero section with tagline
- Brief explanation of how it works (3 steps)
- CTA button to start creating
- Use the custom color scheme throughout

**Step 2: Verify it renders at http://localhost:3000**

**Step 3: Commit**

```bash
git add frontend/src/app/
git commit -m "feat: build landing page with hero, how-it-works, and CTA"
```

---

### Task 15: Style Selection Page (Create Wizard Step 1)

**Files:**
- Create: `frontend/src/app/create/page.tsx`
- Create: `frontend/src/components/StyleCard.tsx`
- Create: `frontend/src/components/WizardLayout.tsx`

**Step 1: Build the WizardLayout wrapper**

A shared layout for all wizard steps with progress indicator (Step 1 of 4, Step 2 of 4, etc.) and Next/Back buttons.

**Step 2: Build StyleCard component**

A clickable card showing the decor style name and description. Selected state shows primary color border.

**Step 3: Build the create page with style grid**

Display all 20 styles in a responsive grid. User clicks to select, then proceeds to step 2.

**Step 4: Verify at http://localhost:3000/create**

**Step 5: Commit**

```bash
git add frontend/src/app/create/ frontend/src/components/
git commit -m "feat: build style selection wizard step with 20 decor style cards"
```

---

### Task 16: Visual Preferences & Room Context (Wizard Steps 2-3)

**Files:**
- Create: `frontend/src/components/ColorSchemeSelector.tsx`
- Create: `frontend/src/components/FrameMaterialSelector.tsx`
- Create: `frontend/src/components/RoomContextForm.tsx`
- Modify: `frontend/src/app/create/page.tsx` — add steps 2 and 3

**Step 1: Build ColorSchemeSelector**

Show the default color scheme for the selected style as chips. Allow user to modify (add/remove colors from a preset list).

**Step 2: Build FrameMaterialSelector**

Dropdown or pill-based selector for frame material. Default from the selected style.

**Step 3: Build RoomContextForm**

Room type dropdown + optional width/height number inputs.

**Step 4: Wire steps 2 and 3 into the wizard**

**Step 5: Verify full wizard flow (steps 1-3)**

**Step 6: Commit**

```bash
git add frontend/src/components/ frontend/src/app/create/
git commit -m "feat: add visual preferences and room context wizard steps"
```

---

### Task 17: Description Review Page (Wizard Step 4 / Generate)

**Files:**
- Create: `frontend/src/app/generate/page.tsx`
- Create: `frontend/src/components/DescriptionCard.tsx`

**Step 1: Build DescriptionCard component**

Shows a piece description with title, description, medium, dimensions, placement. Has an edit button that toggles inline editing of the text fields.

**Step 2: Build the generate page**

- On mount, call `api.generateDescriptions()` with the wizard preferences
- Show loading state while descriptions generate
- Display description cards
- "Regenerate All" button to re-call with feedback text input
- "Generate Images" button that calls `api.generateImages()` and redirects to wall view

**Step 3: Verify the flow (will need backend running)**

**Step 4: Commit**

```bash
git add frontend/src/app/generate/ frontend/src/components/DescriptionCard.tsx
git commit -m "feat: build description review page with edit and regenerate"
```

---

### Task 18: Wall View Page

**Files:**
- Create: `frontend/src/app/wall/[id]/page.tsx`
- Create: `frontend/src/components/PieceGallery.tsx`

**Step 1: Build the wall view page**

- Fetch generation data by ID from `api.getGeneration(id)`
- Display the large wall render image at the top
- Below, show a scrollable gallery of individual pieces
- Each piece card shows the image, title, and a "Save to Account" button
- "Retry with Changes" button opens a text input for feedback, then redirects back to generate page

**Step 2: Build PieceGallery component**

Grid of piece images with titles and save buttons.

**Step 3: Verify at http://localhost:3000/wall/[id]**

**Step 4: Commit**

```bash
git add frontend/src/app/wall/ frontend/src/components/PieceGallery.tsx
git commit -m "feat: build wall view page with render display and piece gallery"
```

---

### Task 19: History Page

**Files:**
- Create: `frontend/src/app/history/page.tsx`

**Step 1: Build the history page**

- Fetch user's generations from `api.getHistory()`
- Display as a grid of 1-3 cards, each showing the wall render thumbnail, style name, and date
- Click navigates to `/wall/[id]`
- Show message if no generations yet

**Step 2: Verify at http://localhost:3000/history**

**Step 3: Commit**

```bash
git add frontend/src/app/history/
git commit -m "feat: build history page showing last 3 generations"
```

---

### Task 20: Navigation & Auth UI

**Files:**
- Create: `frontend/src/components/Navbar.tsx`
- Create: `frontend/src/components/AuthButton.tsx`
- Create: `frontend/src/lib/useAuth.ts`
- Modify: `frontend/src/app/layout.tsx` — add Navbar

**Step 1: Create useAuth hook**

```typescript
// Wraps Firebase Auth state — provides user, signIn, signOut
```

**Step 2: Build AuthButton**

Shows "Sign in with Google" or user email + sign out button.

**Step 3: Build Navbar**

Logo, nav links (Create, History), auth button. Fixed top, uses the custom color scheme.

**Step 4: Add Navbar to root layout**

**Step 5: Verify navigation works across all pages**

**Step 6: Commit**

```bash
git add frontend/src/components/Navbar.tsx frontend/src/components/AuthButton.tsx frontend/src/lib/useAuth.ts frontend/src/app/layout.tsx
git commit -m "feat: add navigation bar with auth integration"
```

---

## Phase 5: Docs & Integration

### Task 21: Create Project Documentation

**Files:**
- Create: `docs/project_state.md`
- Create: `docs/architecture.md`
- Create: `docs/context_management.md`

**Step 1: Write project_state.md**

Current state of the project — what's built, what's in progress, known issues.

**Step 2: Write architecture.md**

Technical architecture based on the design doc — services, data flow, deployment.

**Step 3: Write context_management.md**

Tips for managing context window when working with Claude on this codebase.

**Step 4: Commit**

```bash
git add docs/
git commit -m "docs: add project state, architecture, and context management docs"
```

---

### Task 22: Integration Test — Full Generation Flow

**Files:**
- Create: `backend/src/integration/fullFlow.test.ts`

**Step 1: Write integration test**

Test the full flow through the Express app with mocked external services (OpenAI, Gemini, Firebase):
1. POST /api/generate/descriptions → get descriptions
2. POST /api/generate/images → get generation result
3. GET /api/history → see the generation
4. GET /api/history/:id → get full generation with URLs

**Step 2: Run integration test**

```bash
cd backend && npx jest src/integration/
```

Expected: PASS

**Step 3: Commit**

```bash
git add backend/src/integration/
git commit -m "test: add integration test for full generation flow"
```

---

## Task Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1: Scaffolding | 1-4 | Backend/frontend init, Firebase config, auth middleware |
| 2: Services | 5-9 | User, storage, description, image, generation orchestrator |
| 3: Routes | 10-11 | Rate limiting, API endpoints |
| 4: Frontend | 12-20 | API client, wizard, pages, navigation |
| 5: Docs & Integration | 21-22 | Documentation, integration tests |

**Total: 22 tasks**

Each task follows TDD: write test → verify fail → implement → verify pass → commit.
