# Regenerate Individual Pictures — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to re-roll individual wall decor pieces after initial generation, browse version history, and finalize walls against a configurable quota.

**Architecture:** Extend the `generations` Firestore document to store version arrays (`pieceVersions`, `wallRenderVersions`) instead of single refs, add a `finalizedAt` field so quota is tracked on finalization not creation, and expose three new backend endpoints. Frontend gains per-card regenerate buttons on `generate/page.tsx` and multi-select + version navigation + finalize controls on `wall/[id]/page.tsx`.

**Tech Stack:** Express + TypeScript, Firebase Admin SDK (Firestore + GCS), Gemini 2.5 Flash (imageService), Jest + supertest for tests, Next.js App Router for frontend.

**⚠️ Wall render limitation:** `imageService.generateWallRender` is text-only (takes descriptions, not images). When a user triggers "Update Wall Render", the backend re-generates from text descriptions. The `pieceImageRefs` body param is validated (all refs must belong to this generation) but not passed to Gemini. Multimodal compositing is a future improvement.

---

### Task 1: Add `GenerationDocument` to types.ts and env vars to .env.example

**Files:**
- Modify: `backend/src/types.ts`
- Modify: `backend/.env.example`

**Step 1: Add the interface to types.ts**

Add after the existing `GenerationRequest` interface:

```typescript
export interface GenerationDocument {
  userId: string;
  style: string;
  preferences: UserPreferences;
  descriptions: PieceDescription[];
  pieceVersions: string[][];       // pieceVersions[i] = GCS paths for piece i, oldest→newest
  wallRenderVersions: string[];    // GCS paths for wall renders, oldest→newest
  finalizedAt: string | null;      // null = draft; ISO date string = finalized
  pieceRegenerationCount: number;  // incremented per regeneration call
  createdAt: string;
}
```

**Step 2: Add env vars to .env.example**

Add after the `MONTHLY_BUDGET_USD` line:

```
# Generation limits
MAX_FINALIZED_GENERATIONS=3
MAX_PIECE_REGENERATIONS_PER_DRAFT=20
```

**Step 3: Commit**

```bash
git add backend/src/types.ts backend/.env.example
git commit -m "feat: add GenerationDocument type and generation limit env vars"
```

---

### Task 2: Update generationService.ts to use new Firestore schema

**Files:**
- Modify: `backend/src/services/generationService.ts`
- Modify: `backend/src/services/generationService.test.ts`

**Step 1: Write failing tests**

In `generationService.test.ts`, add these two tests inside the `describe('GenerationService')` block, after the existing `generateImages` tests:

```typescript
it('generateImages stores pieceVersions and wallRenderVersions (not imageRefs/wallRenderRef)', async () => {
  const mockSet = jest.fn().mockResolvedValue(undefined);
  const mockAdd = jest.fn().mockResolvedValue({ id: 'gen123' });
  const { getDb } = require('../config/firebase');
  getDb.mockReturnValue({
    collection: jest.fn().mockReturnValue({
      add: mockAdd,
      doc: jest.fn().mockReturnValue({ set: mockSet, get: jest.fn(), delete: jest.fn() }),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ docs: [] }),
    }),
  });

  service = new GenerationService();
  const descriptions = [
    { title: 'Art 1', description: 'Desc 1', medium: 'Canvas', dimensions: '24x36', placement: 'Center' },
  ];
  await service.generateImages('user123', preferences, descriptions);

  expect(mockSet).toHaveBeenCalledWith(
    expect.objectContaining({
      pieceVersions: [['generations/gen123/piece-0-v0.png']],
      wallRenderVersions: ['generations/gen123/wall-render-v0.png'],
      finalizedAt: null,
      pieceRegenerationCount: 0,
    }),
    { merge: true }
  );
});

it('enforceHistoryLimit only evicts finalized generations and uses MAX_FINALIZED_GENERATIONS env var', async () => {
  process.env.MAX_FINALIZED_GENERATIONS = '2';

  const finalizedGen = (id: string) => ({
    id,
    data: () => ({
      userId: 'user123',
      finalizedAt: '2026-01-01T00:00:00.000Z',
      pieceVersions: [['generations/' + id + '/piece-0-v0.png']],
      wallRenderVersions: ['generations/' + id + '/wall-render-v0.png'],
    }),
  });
  const draftGen = {
    id: 'draft1',
    data: () => ({ userId: 'user123', finalizedAt: null, pieceVersions: [], wallRenderVersions: [] }),
  };

  const mockDelete = jest.fn().mockResolvedValue(undefined);
  const { getDb } = require('../config/firebase');
  getDb.mockReturnValue({
    collection: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        docs: [finalizedGen('gen1'), finalizedGen('gen2'), finalizedGen('gen3'), draftGen],
      }),
      doc: jest.fn().mockReturnValue({ delete: mockDelete }),
    }),
  });

  mockStorageService.prototype.deleteFile = jest.fn().mockResolvedValue(undefined);
  service = new GenerationService();
  await service.enforceHistoryLimit('user123');

  // gen3 is the oldest finalized beyond limit=2; gen1 and gen2 are kept; draft is never evicted
  expect(mockDelete).toHaveBeenCalledTimes(1);
  expect(mockStorageService.prototype.deleteFile).toHaveBeenCalledWith('generations/gen3/piece-0-v0.png');

  delete process.env.MAX_FINALIZED_GENERATIONS;
});
```

**Step 2: Run tests to verify they fail**

```bash
cd backend && npm test -- --testPathPattern=generationService
```

Expected: both new tests FAIL (pieceVersions not in schema yet).

**Step 3: Update generateImages in generationService.ts**

Replace the GCS path and Firestore sections in `generateImages`:

```typescript
// Upload pieces to GCS — versioned paths
const pieceRefs: string[] = [];
const pieceUrls: string[] = [];
for (let i = 0; i < pieceImages.length; i++) {
  const path = `generations/${genId}/piece-${i}-v0.png`;   // <-- changed
  const buffer = Buffer.from(pieceImages[i].data, 'base64');
  await this.storageService.uploadBuffer(buffer, path, pieceImages[i].mimeType);
  pieceRefs.push(path);
  const url = await this.storageService.getSignedUrl(path);
  pieceUrls.push(url);
}

// Upload wall render — versioned path
const wallPath = `generations/${genId}/wall-render-v0.png`;  // <-- changed
```

Replace the final Firestore update in `generateImages`:

```typescript
await db.collection('generations').doc(genId).set(
  {
    pieceVersions: pieceRefs.map(ref => [ref]),  // <-- changed
    wallRenderVersions: [wallPath],              // <-- changed
    finalizedAt: null,                           // <-- new
    pieceRegenerationCount: 0,                   // <-- new
  },
  { merge: true }
);
```

Also update the initial `db.collection('generations').add(...)` call — replace `imageRefs: [] as string[]` and `wallRenderRef: ''` with the new fields:

```typescript
const generationRef = await db.collection('generations').add({
  userId,
  style: preferences.style,
  preferences,
  descriptions,
  pieceVersions: [] as string[][],
  wallRenderVersions: [] as string[],
  finalizedAt: null,
  pieceRegenerationCount: 0,
  createdAt: new Date().toISOString(),
});
```

**Step 4: Update enforceHistoryLimit**

Replace the entire `enforceHistoryLimit` method:

```typescript
async enforceHistoryLimit(userId: string): Promise<void> {
  const generations = await this.getUserGenerations(userId);
  const finalized = (generations as any[]).filter(g => g.finalizedAt != null);
  const maxFinalized = parseInt(process.env.MAX_FINALIZED_GENERATIONS ?? '3');
  if (finalized.length <= maxFinalized) return;

  const toDelete = finalized.slice(maxFinalized);
  for (const gen of toDelete) {
    const data = gen as any;
    if (data.pieceVersions) {
      for (const versions of data.pieceVersions as string[][]) {
        for (const ref of versions) {
          await this.storageService.deleteFile(ref);
        }
      }
    }
    if (data.wallRenderVersions) {
      for (const ref of data.wallRenderVersions as string[]) {
        await this.storageService.deleteFile(ref);
      }
    }
    await getDb().collection('generations').doc(gen.id).delete();
  }
}
```

**Step 5: Run tests to verify they pass**

```bash
cd backend && npm test -- --testPathPattern=generationService
```

Expected: all tests PASS.

**Step 6: Commit**

```bash
git add backend/src/services/generationService.ts backend/src/services/generationService.test.ts
git commit -m "feat: update generationService to store pieceVersions/wallRenderVersions and enforce finalized quota"
```

---

### Task 3: Update history.ts to use new schema

**Files:**
- Modify: `backend/src/routes/history.ts`

No new tests needed (existing history tests cover the contract; this is an internal schema update).

**Step 1: Update `GET /` — wallRenderRef → wallRenderVersions**

Replace:
```typescript
wallRenderUrl: gen.wallRenderRef ? await storageService.getSignedUrl(gen.wallRenderRef) : null,
```
With:
```typescript
wallRenderUrl: gen.wallRenderVersions?.length
  ? await storageService.getSignedUrl(gen.wallRenderVersions.at(-1)!)
  : null,
```

**Step 2: Update `GET /:id` — imageRefs → pieceVersions, wallRenderRef → wallRenderVersions**

Replace:
```typescript
const pieceUrls = data.imageRefs
  ? await Promise.all(data.imageRefs.map((ref: string) => storageService.getSignedUrl(ref)))
  : [];
const wallRenderUrl = data.wallRenderRef ? await storageService.getSignedUrl(data.wallRenderRef) : null;
```
With:
```typescript
const currentPieceRefs: string[] = data.pieceVersions
  ? (data.pieceVersions as string[][]).map(versions => versions.at(-1)!)
  : [];
const pieceUrls = await Promise.all(currentPieceRefs.map(ref => storageService.getSignedUrl(ref)));
const wallRenderUrl = data.wallRenderVersions?.length
  ? await storageService.getSignedUrl((data.wallRenderVersions as string[]).at(-1)!)
  : null;
```

**Step 3: Update `GET /:id/pieces/:pieceIndex/download-url` — imageRefs → pieceVersions**

Replace:
```typescript
const imageRef = (generation as any).imageRefs?.[pieceIndex];
```
With:
```typescript
const pieceVersions = (generation as any).pieceVersions as string[][] | undefined;
const imageRef = pieceVersions?.[pieceIndex]?.at(-1);
```

**Step 4: Run all tests**

```bash
cd backend && npm test
```

Expected: all 59 tests PASS.

**Step 5: Commit**

```bash
git add backend/src/routes/history.ts
git commit -m "fix: update history routes to read pieceVersions/wallRenderVersions instead of imageRefs/wallRenderRef"
```

---

### Task 4: Add regeneratePieces to GenerationService

**Files:**
- Modify: `backend/src/services/generationService.ts`
- Modify: `backend/src/services/generationService.test.ts`

**Step 1: Write failing tests**

Add inside `describe('GenerationService')`:

```typescript
describe('regeneratePieces', () => {
  const baseGenData = {
    userId: 'user123',
    style: 'Bohemian',
    preferences: {
      style: 'Bohemian',
      colorScheme: ['warm tones'],
      frameMaterial: 'wood',
      roomType: 'living room',
    },
    descriptions: [
      { title: 'Art 1', description: 'Original', medium: 'Canvas', dimensions: '24x36', placement: 'Center' },
      { title: 'Art 2', description: 'Original 2', medium: 'Print', dimensions: '12x16', placement: 'Left' },
    ],
    pieceVersions: [
      ['generations/gen1/piece-0-v0.png'],
      ['generations/gen1/piece-1-v0.png'],
    ],
    wallRenderVersions: ['generations/gen1/wall-render-v0.png'],
    finalizedAt: null,
    pieceRegenerationCount: 0,
  };

  function setupDocMock(data: object, mockSet?: jest.Mock) {
    const set = mockSet ?? jest.fn().mockResolvedValue(undefined);
    const { getDb } = require('../config/firebase');
    getDb.mockReturnValue({
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ exists: true, data: () => data }),
          set,
          delete: jest.fn(),
        }),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: [] }),
      }),
    });
    return set;
  }

  it('generates new piece image, appends to pieceVersions, increments count', async () => {
    const mockSet = setupDocMock(baseGenData);
    service = new GenerationService();

    await service.regeneratePieces('user123', 'gen1', [
      { pieceIndex: 0, description: 'New description' },
    ]);

    expect(mockImageService.prototype.generatePieceImage).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'New description' }),
      'Bohemian',
      'user123'
    );
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        pieceVersions: [
          ['generations/gen1/piece-0-v0.png', 'generations/gen1/piece-0-v1.png'],
          ['generations/gen1/piece-1-v0.png'],
        ],
        pieceRegenerationCount: 1,
      }),
      { merge: true }
    );
  });

  it('passes original style and preferences to Gemini (style consistency)', async () => {
    setupDocMock(baseGenData);
    service = new GenerationService();

    await service.regeneratePieces('user123', 'gen1', [
      { pieceIndex: 1, description: 'Updated art' },
    ]);

    expect(mockImageService.prototype.generatePieceImage).toHaveBeenCalledWith(
      expect.any(Object),
      'Bohemian',   // original style, not overrideable
      'user123'
    );
  });

  it('throws if generation is finalized', async () => {
    setupDocMock({ ...baseGenData, finalizedAt: '2026-01-01T00:00:00.000Z' });
    service = new GenerationService();

    await expect(
      service.regeneratePieces('user123', 'gen1', [{ pieceIndex: 0, description: 'New' }])
    ).rejects.toThrow('Generation is finalized');
  });

  it('throws if regeneration limit exceeded', async () => {
    process.env.MAX_PIECE_REGENERATIONS_PER_DRAFT = '2';
    setupDocMock({ ...baseGenData, pieceRegenerationCount: 2 });
    service = new GenerationService();

    await expect(
      service.regeneratePieces('user123', 'gen1', [{ pieceIndex: 0, description: 'New' }])
    ).rejects.toThrow('Piece regeneration limit reached');

    delete process.env.MAX_PIECE_REGENERATIONS_PER_DRAFT;
  });

  it('throws if caller does not own the generation', async () => {
    setupDocMock(baseGenData);
    service = new GenerationService();

    await expect(
      service.regeneratePieces('other-user', 'gen1', [{ pieceIndex: 0, description: 'New' }])
    ).rejects.toThrow('Unauthorized');
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd backend && npm test -- --testPathPattern=generationService
```

Expected: all 5 new tests FAIL (`regeneratePieces is not a function`).

**Step 3: Implement regeneratePieces**

Add this method to `GenerationService` (before the closing `}`):

```typescript
async regeneratePieces(
  userId: string,
  generationId: string,
  pieces: { pieceIndex: number; description: string }[],
): Promise<{ pieceVersions: string[][]; pieceRegenerationCount: number }> {
  const db = getDb();
  const doc = await db.collection('generations').doc(generationId).get();
  if (!doc.exists) throw new Error('Generation not found');
  const data = doc.data() as GenerationDocument;

  if (data.userId !== userId) throw new Error('Unauthorized');
  if (data.finalizedAt !== null) throw new Error('Generation is finalized');

  const maxRegen = parseInt(process.env.MAX_PIECE_REGENERATIONS_PER_DRAFT ?? '20');
  if (data.pieceRegenerationCount + pieces.length > maxRegen) {
    throw new Error('Piece regeneration limit reached');
  }

  const updatedPieceVersions = data.pieceVersions.map(v => [...v]);
  const updatedDescriptions = [...data.descriptions];

  for (const { pieceIndex, description } of pieces) {
    const pieceDesc: PieceDescription = { ...data.descriptions[pieceIndex], description };
    const image = await this.imageService.generatePieceImage(pieceDesc, data.style, userId);

    const versionNum = updatedPieceVersions[pieceIndex].length;
    const path = `generations/${generationId}/piece-${pieceIndex}-v${versionNum}.png`;
    const buffer = Buffer.from(image.data, 'base64');
    await this.storageService.uploadBuffer(buffer, path, image.mimeType);

    updatedPieceVersions[pieceIndex].push(path);
    updatedDescriptions[pieceIndex] = { ...data.descriptions[pieceIndex], description };
  }

  const newCount = data.pieceRegenerationCount + pieces.length;

  await db.collection('generations').doc(generationId).set(
    { pieceVersions: updatedPieceVersions, descriptions: updatedDescriptions, pieceRegenerationCount: newCount },
    { merge: true },
  );

  return { pieceVersions: updatedPieceVersions, pieceRegenerationCount: newCount };
}
```

Also add the `GenerationDocument` import at the top of `generationService.ts`:
```typescript
import { PieceDescription, UserPreferences, GenerationDocument } from '../types';
```

**Step 4: Run tests to verify they pass**

```bash
cd backend && npm test -- --testPathPattern=generationService
```

Expected: all tests PASS.

**Step 5: Commit**

```bash
git add backend/src/services/generationService.ts backend/src/services/generationService.test.ts
git commit -m "feat: add regeneratePieces to GenerationService with ownership, finalization and limit checks"
```

---

### Task 5: Add regenerateWallRender and finalizeGeneration to GenerationService

**Files:**
- Modify: `backend/src/services/generationService.ts`
- Modify: `backend/src/services/generationService.test.ts`

**Step 1: Write failing tests**

Add inside `describe('GenerationService')`:

```typescript
describe('regenerateWallRender', () => {
  const baseGenData = {
    userId: 'user123',
    style: 'Bohemian',
    preferences: { style: 'Bohemian', colorScheme: ['warm tones'], frameMaterial: 'wood', roomType: 'living room' },
    descriptions: [
      { title: 'Art 1', description: 'Desc 1', medium: 'Canvas', dimensions: '24x36', placement: 'Center' },
    ],
    pieceVersions: [['generations/gen1/piece-0-v0.png', 'generations/gen1/piece-0-v1.png']],
    wallRenderVersions: ['generations/gen1/wall-render-v0.png'],
    finalizedAt: null,
    pieceRegenerationCount: 1,
  };

  function setupDocMock(data: object) {
    const mockSet = jest.fn().mockResolvedValue(undefined);
    const { getDb } = require('../config/firebase');
    getDb.mockReturnValue({
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ exists: true, data: () => data }),
          set: mockSet,
          delete: jest.fn(),
        }),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: [] }),
      }),
    });
    return mockSet;
  }

  it('generates new wall render and appends to wallRenderVersions', async () => {
    const mockSet = setupDocMock(baseGenData);
    service = new GenerationService();

    await service.regenerateWallRender('user123', 'gen1', ['generations/gen1/piece-0-v1.png']);

    expect(mockImageService.prototype.generateWallRender).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        wallRenderVersions: [
          'generations/gen1/wall-render-v0.png',
          'generations/gen1/wall-render-v1.png',
        ],
      }),
      { merge: true },
    );
  });

  it('uses current versions — validates pieceImageRefs belong to this generation', async () => {
    setupDocMock(baseGenData);
    service = new GenerationService();

    await expect(
      service.regenerateWallRender('user123', 'gen1', ['generations/other-gen/piece-0-v0.png'])
    ).rejects.toThrow('Invalid piece image ref');
  });

  it('throws if caller does not own the generation', async () => {
    setupDocMock(baseGenData);
    service = new GenerationService();

    await expect(
      service.regenerateWallRender('other-user', 'gen1', ['generations/gen1/piece-0-v0.png'])
    ).rejects.toThrow('Unauthorized');
  });
});

describe('finalizeGeneration', () => {
  function setupDocMock(data: object, mockSet?: jest.Mock) {
    const set = mockSet ?? jest.fn().mockResolvedValue(undefined);
    const { getDb } = require('../config/firebase');
    getDb.mockReturnValue({
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ exists: true, data: () => data }),
          set,
          delete: jest.fn(),
        }),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: [] }),
      }),
    });
    return set;
  }

  it('sets finalizedAt on the generation document', async () => {
    const mockSet = setupDocMock({ userId: 'user123', finalizedAt: null });
    service = new GenerationService();

    await service.finalizeGeneration('user123', 'gen1');

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ finalizedAt: expect.any(String) }),
      { merge: true },
    );
  });

  it('throws if already finalized', async () => {
    setupDocMock({ userId: 'user123', finalizedAt: '2026-01-01T00:00:00.000Z' });
    service = new GenerationService();

    await expect(service.finalizeGeneration('user123', 'gen1')).rejects.toThrow('Already finalized');
  });

  it('throws if caller does not own the generation', async () => {
    setupDocMock({ userId: 'user123', finalizedAt: null });
    service = new GenerationService();

    await expect(service.finalizeGeneration('other-user', 'gen1')).rejects.toThrow('Unauthorized');
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd backend && npm test -- --testPathPattern=generationService
```

Expected: all new tests FAIL.

**Step 3: Implement both methods**

Add to `GenerationService`:

```typescript
async regenerateWallRender(
  userId: string,
  generationId: string,
  pieceImageRefs: string[],
): Promise<string[]> {
  const db = getDb();
  const doc = await db.collection('generations').doc(generationId).get();
  if (!doc.exists) throw new Error('Generation not found');
  const data = doc.data() as GenerationDocument;

  if (data.userId !== userId) throw new Error('Unauthorized');

  const allRefs = data.pieceVersions.flat();
  for (const ref of pieceImageRefs) {
    if (!allRefs.includes(ref)) throw new Error('Invalid piece image ref');
  }

  const wallRender = await this.imageService.generateWallRender(
    data.descriptions,
    data.style,
    data.preferences.roomType,
    userId,
  );

  const versionNum = data.wallRenderVersions.length;
  const wallPath = `generations/${generationId}/wall-render-v${versionNum}.png`;
  const buffer = Buffer.from(wallRender.data, 'base64');
  await this.storageService.uploadBuffer(buffer, wallPath, wallRender.mimeType);

  const updatedVersions = [...data.wallRenderVersions, wallPath];
  await db.collection('generations').doc(generationId).set(
    { wallRenderVersions: updatedVersions },
    { merge: true },
  );

  return updatedVersions;
}

async finalizeGeneration(userId: string, generationId: string): Promise<void> {
  const db = getDb();
  const doc = await db.collection('generations').doc(generationId).get();
  if (!doc.exists) throw new Error('Generation not found');
  const data = doc.data() as GenerationDocument;

  if (data.userId !== userId) throw new Error('Unauthorized');
  if (data.finalizedAt !== null) throw new Error('Already finalized');

  await db.collection('generations').doc(generationId).set(
    { finalizedAt: new Date().toISOString() },
    { merge: true },
  );

  await this.enforceHistoryLimit(userId);
}
```

**Step 4: Run tests**

```bash
cd backend && npm test -- --testPathPattern=generationService
```

Expected: all tests PASS.

**Step 5: Commit**

```bash
git add backend/src/services/generationService.ts backend/src/services/generationService.test.ts
git commit -m "feat: add regenerateWallRender and finalizeGeneration to GenerationService"
```

---

### Task 6: Create regenerate.ts route and tests

**Files:**
- Create: `backend/src/routes/regenerate.ts`
- Create: `backend/src/routes/regenerate.test.ts`

**Step 1: Write the failing test file**

Create `backend/src/routes/regenerate.test.ts`:

```typescript
import request from 'supertest';
import express from 'express';

const mockRegeneratePieces = jest.fn();
const mockRegenerateWallRender = jest.fn();

jest.mock('../services/generationService', () => ({
  GenerationService: jest.fn().mockImplementation(() => ({
    regeneratePieces: mockRegeneratePieces,
    regenerateWallRender: mockRegenerateWallRender,
  })),
}));

jest.mock('../config/firebase', () => ({
  getDb: jest.fn(() => ({ collection: jest.fn() })),
}));

import { regenerateRouter } from './regenerate';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = { uid: 'user123' };
  next();
});
app.use('/api/generate', regenerateRouter);

describe('POST /api/generate/pieces', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegeneratePieces.mockResolvedValue({
      pieceVersions: [['gen1/piece-0-v0.png', 'gen1/piece-0-v1.png']],
      pieceRegenerationCount: 1,
    });
  });

  it('returns updated pieceVersions and count', async () => {
    const res = await request(app)
      .post('/api/generate/pieces')
      .send({
        generationId: 'gen1',
        pieces: [{ pieceIndex: 0, description: 'New look' }],
      });
    expect(res.status).toBe(200);
    expect(res.body.pieceVersions).toBeDefined();
    expect(res.body.pieceRegenerationCount).toBe(1);
  });

  it('returns 400 if generationId missing', async () => {
    const res = await request(app)
      .post('/api/generate/pieces')
      .send({ pieces: [{ pieceIndex: 0, description: 'x' }] });
    expect(res.status).toBe(400);
  });

  it('returns 400 if pieces array empty', async () => {
    const res = await request(app)
      .post('/api/generate/pieces')
      .send({ generationId: 'gen1', pieces: [] });
    expect(res.status).toBe(400);
  });

  it('returns 403 if service throws Unauthorized', async () => {
    mockRegeneratePieces.mockRejectedValue(new Error('Unauthorized'));
    const res = await request(app)
      .post('/api/generate/pieces')
      .send({ generationId: 'gen1', pieces: [{ pieceIndex: 0, description: 'x' }] });
    expect(res.status).toBe(403);
  });

  it('returns 409 if generation is finalized', async () => {
    mockRegeneratePieces.mockRejectedValue(new Error('Generation is finalized'));
    const res = await request(app)
      .post('/api/generate/pieces')
      .send({ generationId: 'gen1', pieces: [{ pieceIndex: 0, description: 'x' }] });
    expect(res.status).toBe(409);
  });

  it('returns 429 if regeneration limit reached', async () => {
    mockRegeneratePieces.mockRejectedValue(new Error('Piece regeneration limit reached'));
    const res = await request(app)
      .post('/api/generate/pieces')
      .send({ generationId: 'gen1', pieces: [{ pieceIndex: 0, description: 'x' }] });
    expect(res.status).toBe(429);
  });
});

describe('POST /api/generate/wall-render', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegenerateWallRender.mockResolvedValue([
      'gen1/wall-render-v0.png',
      'gen1/wall-render-v1.png',
    ]);
  });

  it('returns updated wallRenderVersions', async () => {
    const res = await request(app)
      .post('/api/generate/wall-render')
      .send({ generationId: 'gen1', pieceImageRefs: ['gen1/piece-0-v1.png'] });
    expect(res.status).toBe(200);
    expect(res.body.wallRenderVersions).toHaveLength(2);
  });

  it('returns 400 if generationId missing', async () => {
    const res = await request(app)
      .post('/api/generate/wall-render')
      .send({ pieceImageRefs: ['gen1/piece-0-v0.png'] });
    expect(res.status).toBe(400);
  });

  it('returns 400 if pieceImageRefs is empty', async () => {
    const res = await request(app)
      .post('/api/generate/wall-render')
      .send({ generationId: 'gen1', pieceImageRefs: [] });
    expect(res.status).toBe(400);
  });

  it('returns 400 if a pieceImageRef does not belong to this generation', async () => {
    mockRegenerateWallRender.mockRejectedValue(new Error('Invalid piece image ref'));
    const res = await request(app)
      .post('/api/generate/wall-render')
      .send({ generationId: 'gen1', pieceImageRefs: ['other-gen/piece-0-v0.png'] });
    expect(res.status).toBe(400);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd backend && npm test -- --testPathPattern=regenerate
```

Expected: FAIL (`Cannot find module './regenerate'`).

**Step 3: Create regenerate.ts**

Create `backend/src/routes/regenerate.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { GenerationService } from '../services/generationService';

export const regenerateRouter = Router();
const generationService = new GenerationService();

regenerateRouter.post('/pieces', async (req: Request, res: Response) => {
  try {
    const { generationId, pieces } = req.body;
    const uid = (req as any).user.uid;

    if (!generationId || !pieces || !Array.isArray(pieces) || pieces.length === 0) {
      res.status(400).json({ error: 'Missing generationId or pieces' });
      return;
    }

    const result = await generationService.regeneratePieces(uid, generationId, pieces);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      res.status(403).json({ error: error.message });
    } else if (error.message === 'Generation is finalized') {
      res.status(409).json({ error: error.message });
    } else if (error.message === 'Piece regeneration limit reached') {
      res.status(429).json({ error: error.message });
    } else {
      console.error('Piece regeneration failed:', error);
      res.status(500).json({ error: 'Failed to regenerate pieces' });
    }
  }
});

regenerateRouter.post('/wall-render', async (req: Request, res: Response) => {
  try {
    const { generationId, pieceImageRefs } = req.body;
    const uid = (req as any).user.uid;

    if (!generationId || !pieceImageRefs || !Array.isArray(pieceImageRefs) || pieceImageRefs.length === 0) {
      res.status(400).json({ error: 'Missing generationId or pieceImageRefs' });
      return;
    }

    const wallRenderVersions = await generationService.regenerateWallRender(uid, generationId, pieceImageRefs);
    res.json({ wallRenderVersions });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      res.status(403).json({ error: error.message });
    } else if (error.message === 'Invalid piece image ref') {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Wall render regeneration failed:', error);
      res.status(500).json({ error: 'Failed to regenerate wall render' });
    }
  }
});
```

**Step 4: Run tests**

```bash
cd backend && npm test -- --testPathPattern=regenerate
```

Expected: all tests PASS.

**Step 5: Commit**

```bash
git add backend/src/routes/regenerate.ts backend/src/routes/regenerate.test.ts
git commit -m "feat: add regenerate routes for pieces and wall-render"
```

---

### Task 7: Create generations.ts finalize route and tests

**Files:**
- Create: `backend/src/routes/generations.ts`
- Create: `backend/src/routes/generations.test.ts`

**Step 1: Write the failing test file**

Create `backend/src/routes/generations.test.ts`:

```typescript
import request from 'supertest';
import express from 'express';

const mockFinalizeGeneration = jest.fn();

jest.mock('../services/generationService', () => ({
  GenerationService: jest.fn().mockImplementation(() => ({
    finalizeGeneration: mockFinalizeGeneration,
  })),
}));

jest.mock('../config/firebase', () => ({
  getDb: jest.fn(() => ({ collection: jest.fn() })),
}));

import { generationsRouter } from './generations';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = { uid: 'user123' };
  next();
});
app.use('/api/generations', generationsRouter);

describe('POST /api/generations/:id/finalize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFinalizeGeneration.mockResolvedValue(undefined);
  });

  it('returns 200 on success', async () => {
    const res = await request(app).post('/api/generations/gen1/finalize');
    expect(res.status).toBe(200);
    expect(mockFinalizeGeneration).toHaveBeenCalledWith('user123', 'gen1');
  });

  it('returns 403 if service throws Unauthorized', async () => {
    mockFinalizeGeneration.mockRejectedValue(new Error('Unauthorized'));
    const res = await request(app).post('/api/generations/gen1/finalize');
    expect(res.status).toBe(403);
  });

  it('returns 409 if already finalized', async () => {
    mockFinalizeGeneration.mockRejectedValue(new Error('Already finalized'));
    const res = await request(app).post('/api/generations/gen1/finalize');
    expect(res.status).toBe(409);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd backend && npm test -- --testPathPattern=generations
```

Expected: FAIL (`Cannot find module './generations'`).

**Step 3: Create generations.ts**

Create `backend/src/routes/generations.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { GenerationService } from '../services/generationService';

export const generationsRouter = Router();
const generationService = new GenerationService();

generationsRouter.post('/:id/finalize', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    await generationService.finalizeGeneration(uid, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      res.status(403).json({ error: error.message });
    } else if (error.message === 'Already finalized') {
      res.status(409).json({ error: error.message });
    } else {
      console.error('Finalize failed:', error);
      res.status(500).json({ error: 'Failed to finalize generation' });
    }
  }
});
```

**Step 4: Run tests**

```bash
cd backend && npm test -- --testPathPattern=generations
```

Expected: all tests PASS.

**Step 5: Commit**

```bash
git add backend/src/routes/generations.ts backend/src/routes/generations.test.ts
git commit -m "feat: add finalize route for generations"
```

---

### Task 8: Mount new routers in index.ts

**Files:**
- Modify: `backend/src/index.ts`

**Step 1: Add imports and mount routers**

Add imports after existing router imports:

```typescript
import { regenerateRouter } from './routes/regenerate';
import { generationsRouter } from './routes/generations';
```

Add after existing route mounts (no rate limit for regenerate/finalize):

```typescript
app.use('/api/generate', authenticate, regenerateRouter);       // pieces + wall-render, no rate limit
app.use('/api/generations', authenticate, generationsRouter);   // finalize
```

**Step 2: Run all tests**

```bash
cd backend && npm test
```

Expected: all tests PASS.

**Step 3: Commit**

```bash
git add backend/src/index.ts
git commit -m "feat: mount regenerate and generations routers"
```

---

### Task 9: Write migration script

**Files:**
- Create: `backend/scripts/migrate-generation-schema.ts`

**Step 1: Create the script**

```typescript
import dotenv from 'dotenv';
dotenv.config();

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore();

async function migrate() {
  const snapshot = await db.collection('generations').get();
  let migrated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (data.pieceVersions !== undefined) {
      console.log(`Skipping already-migrated doc: ${doc.id}`);
      continue;
    }

    const update: Record<string, any> = {
      pieceVersions: (data.imageRefs ?? []).map((ref: string) => [ref]),
      wallRenderVersions: data.wallRenderRef ? [data.wallRenderRef] : [],
      finalizedAt: null,
      pieceRegenerationCount: 0,
      imageRefs: FieldValue.delete(),
      wallRenderRef: FieldValue.delete(),
    };

    await doc.ref.update(update);
    console.log(`Migrated: ${doc.id}`);
    migrated++;
  }

  console.log(`Done. ${migrated} documents migrated.`);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

**Step 2: Add a script entry to package.json**

In `backend/package.json`, add under `"scripts"`:

```json
"migrate:generation-schema": "ts-node scripts/migrate-generation-schema.ts"
```

**Step 3: Run migration against production (coordinate with Abhi)**

```bash
cd backend && npm run migrate:generation-schema
```

**Step 4: Commit**

```bash
git add backend/scripts/migrate-generation-schema.ts backend/package.json
git commit -m "feat: add migration script to convert imageRefs to pieceVersions schema"
```

---

### Task 10: Frontend — per-card regenerate button on generate/page.tsx

**Files:**
- Modify: `frontend/src/app/generate/page.tsx`

**Step 1: Read the file first**

Read `frontend/src/app/generate/page.tsx` in full before making any changes.

**Step 2: Identify the description card render**

Find where each `PieceDescription` card is rendered. Look for where `description.title`, `description.description` etc. are displayed.

**Step 3: Add state for per-card loading**

Add state near the top of the component:

```typescript
const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
```

**Step 4: Add the API call function**

Add after existing handler functions:

```typescript
async function handleRegeneratePiece(pieceIndex: number) {
  if (!generationId) return;
  setRegeneratingIndex(pieceIndex);
  try {
    const res = await apiFetch('/api/generate/pieces', {
      method: 'POST',
      body: JSON.stringify({
        generationId,
        pieces: [{ pieceIndex, description: descriptions[pieceIndex].description }],
      }),
    });
    // Update the piece image in parent state if applicable
    // (exact state update depends on how generate/page.tsx manages image state)
  } catch (err) {
    console.error('Regenerate piece failed:', err);
  } finally {
    setRegeneratingIndex(null);
  }
}
```

**Step 5: Add the button to each card**

Inside the card render, below the existing description content, add:

```tsx
{generationId && (
  <button
    onClick={() => handleRegeneratePiece(index)}
    disabled={regeneratingIndex !== null}
    className="mt-2 text-sm underline text-blue-600 disabled:opacity-50"
  >
    {regeneratingIndex === index ? 'Regenerating…' : 'Regenerate this piece'}
  </button>
)}
```

**Step 6: Run the dev server and verify manually**

```bash
cd frontend && npm run dev
```

Navigate to the generate page with an existing generation and verify the button appears and shows a loading state when clicked.

**Step 7: Commit**

```bash
git add frontend/src/app/generate/page.tsx
git commit -m "feat: add per-card regenerate button to generate page"
```

---

### Task 11: Frontend — multi-select, version navigation, wall render update, finalize on wall/[id]/page.tsx

**Files:**
- Modify: `frontend/src/app/wall/[id]/page.tsx`
- Modify: `frontend/src/components/PieceGallery.tsx`

**Step 1: Read both files in full before making any changes**

Read `frontend/src/app/wall/[id]/page.tsx` and `frontend/src/components/PieceGallery.tsx`.

**Step 2: Add state to wall/[id]/page.tsx**

Add near the top of the component:

```typescript
const [selectedPieces, setSelectedPieces] = useState<Set<number>>(new Set());
const [currentVersionIndexes, setCurrentVersionIndexes] = useState<number[]>([]);
const [isRegenerating, setIsRegenerating] = useState(false);
const [isUpdatingWallRender, setIsUpdatingWallRender] = useState(false);
const [isFinalized, setIsFinalized] = useState(false);
const [pieceRegenerationCount, setPieceRegenerationCount] = useState(0);
const maxRegens = parseInt(process.env.NEXT_PUBLIC_MAX_PIECE_REGENERATIONS_PER_DRAFT ?? '20');
```

Initialize `currentVersionIndexes` from the generation data when it loads (set each to the last version index).

**Step 3: Add handler functions**

```typescript
function togglePieceSelection(index: number) {
  setSelectedPieces(prev => {
    const next = new Set(prev);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    return next;
  });
}

function navigateVersion(pieceIndex: number, delta: number) {
  setCurrentVersionIndexes(prev => {
    const next = [...prev];
    const versions = generation.pieceVersions[pieceIndex];
    next[pieceIndex] = Math.max(0, Math.min(versions.length - 1, next[pieceIndex] + delta));
    return next;
  });
}

async function handleRegenerateSelected() {
  if (selectedPieces.size === 0) return;
  setIsRegenerating(true);
  try {
    const pieces = Array.from(selectedPieces).map(i => ({
      pieceIndex: i,
      description: generation.descriptions[i].description,
    }));
    const res = await apiFetch(`/api/generate/pieces`, {
      method: 'POST',
      body: JSON.stringify({ generationId: generation.id, pieces }),
    });
    const data = await res.json();
    // Update local generation state with new pieceVersions
    setGeneration(prev => ({ ...prev, pieceVersions: data.pieceVersions }));
    setPieceRegenerationCount(data.pieceRegenerationCount);
    // Reset selected versions for regenerated pieces to latest
    setCurrentVersionIndexes(prev => {
      const next = [...prev];
      for (const i of selectedPieces) {
        next[i] = data.pieceVersions[i].length - 1;
      }
      return next;
    });
    setSelectedPieces(new Set());
  } catch (err) {
    console.error('Regenerate failed:', err);
  } finally {
    setIsRegenerating(false);
  }
}

async function handleUpdateWallRender() {
  setIsUpdatingWallRender(true);
  try {
    const pieceImageRefs = generation.pieceVersions.map(
      (versions: string[], i: number) => versions[currentVersionIndexes[i]]
    );
    const res = await apiFetch(`/api/generate/wall-render`, {
      method: 'POST',
      body: JSON.stringify({ generationId: generation.id, pieceImageRefs }),
    });
    const data = await res.json();
    setGeneration(prev => ({ ...prev, wallRenderVersions: data.wallRenderVersions }));
  } catch (err) {
    console.error('Wall render update failed:', err);
  } finally {
    setIsUpdatingWallRender(false);
  }
}

async function handleFinalize() {
  try {
    await apiFetch(`/api/generations/${generation.id}/finalize`, { method: 'POST' });
    setIsFinalized(true);
  } catch (err) {
    console.error('Finalize failed:', err);
  }
}
```

**Step 4: Add UI elements**

Pass the new state and handlers as props to `PieceGallery` and add the action bar above/below the wall render:

```tsx
{/* Regeneration controls */}
{!isFinalized && (
  <div className="flex gap-3 items-center mt-4">
    <button
      onClick={handleRegenerateSelected}
      disabled={selectedPieces.size === 0 || isRegenerating}
      className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
    >
      {isRegenerating ? 'Regenerating…' : `Regenerate Selected (${selectedPieces.size})`}
    </button>
    <button
      onClick={handleUpdateWallRender}
      disabled={isUpdatingWallRender}
      className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
    >
      {isUpdatingWallRender ? 'Updating…' : 'Update Wall Render'}
    </button>
    <button
      onClick={handleFinalize}
      className="px-4 py-2 bg-green-600 text-white rounded"
    >
      Finalize Wall
    </button>
    <span className="text-sm text-gray-500">
      {pieceRegenerationCount} / {maxRegens} regenerations used
    </span>
  </div>
)}
```

**Step 5: Update PieceGallery to support checkboxes and version navigation**

Read `PieceGallery.tsx` and add:
- A checkbox on each thumbnail (controlled by `selectedPieces` / `onToggleSelect` prop)
- Prev/next arrows on the thumbnail (or detail panel) using `currentVersionIndexes` / `onNavigateVersion` prop
- Pass `currentVersionIndex` per piece so the correct version image is shown

**Step 6: Add `NEXT_PUBLIC_MAX_PIECE_REGENERATIONS_PER_DRAFT` to frontend `.env.local`**

```
NEXT_PUBLIC_MAX_PIECE_REGENERATIONS_PER_DRAFT=20
```

**Step 7: Commit**

```bash
git add frontend/src/app/wall/[id]/page.tsx frontend/src/components/PieceGallery.tsx frontend/.env.local
git commit -m "feat: add multi-select regeneration, version navigation, and finalize to wall page"
```

---

### Task 12: Final test run and documentation update

**Step 1: Run all backend tests**

```bash
cd backend && npm test
```

Expected: all tests PASS. Zero failures.

**Step 2: Update docs/project_state.md**

- Add new endpoints to the API table in `docs/architecture.md`
- Update `docs/project_state.md` with the new feature status

**Step 3: Commit docs**

```bash
git add docs/
git commit -m "docs: update architecture and project state for regenerate-individual-pictures feature"
```
