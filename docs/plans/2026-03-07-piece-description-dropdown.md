# Piece Description Dropdown + Download Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show a click-to-expand description panel and a download button on each piece card in the wall view.

**Architecture:** Thread full `PieceDescription` fields through the existing `GET /history/:id` response into the `PieceGallery` component. The backend already has descriptions in Firestore and returns them in the `...generation` spread — we just need to include them in the `pieces` array. The frontend adds accordion state and a fetch-blob download trigger.

**Tech Stack:** TypeScript, Express, React (Next.js), Tailwind CSS, Jest + supertest

---

## Task 1: Include description fields in the history `GET /:id` pieces array

**Files:**
- Modify: `backend/src/routes/history.ts:39-41`

**Context:** The route builds the `pieces` array from `data.imageRefs` and `data.descriptions`, but only maps `title` and `imageUrl`. We need to also include `description`, `medium`, `dimensions`, and `placement`.

**Step 1: Write the failing test**

Create `backend/src/routes/history.test.ts`:

```typescript
import request from 'supertest';
import express from 'express';

const mockGetGeneration = jest.fn();
const mockGetSignedUrl = jest.fn();

jest.mock('../services/generationService', () => ({
  GenerationService: jest.fn().mockImplementation(() => ({
    getGeneration: mockGetGeneration,
    getUserGenerations: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock('../services/storageService', () => ({
  StorageService: jest.fn().mockImplementation(() => ({
    getSignedUrl: mockGetSignedUrl,
  })),
}));

jest.mock('../config/firebase', () => ({
  getFirebaseApp: jest.fn(),
  getDb: jest.fn(),
  getBucket: jest.fn(),
}));

import { historyRouter } from './history';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = { uid: 'user123' };
  next();
});
app.use('/api/history', historyRouter);

const mockGeneration = {
  id: 'gen-1',
  userId: 'user123',
  style: 'Bohemian',
  preferences: { style: 'Bohemian', colorScheme: ['warm'], frameMaterial: 'wood', roomType: 'living room' },
  descriptions: [
    { title: 'Sunset', description: 'A warm watercolor sunset', medium: 'Watercolor', dimensions: '18" x 24"', placement: 'Center wall' },
    { title: 'Forest', description: 'Dense forest in oils', medium: 'Oil on canvas', dimensions: '12" x 16"', placement: 'Left wall' },
  ],
  imageRefs: ['gen-1/piece-0.png', 'gen-1/piece-1.png'],
  wallRenderRef: 'gen-1/wall-render.png',
  createdAt: '2026-03-07T00:00:00.000Z',
};

describe('GET /api/history/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetGeneration.mockResolvedValue(mockGeneration);
    mockGetSignedUrl.mockImplementation((ref: string) => Promise.resolve(`https://signed.url/${ref}`));
  });

  it('returns 404 when generation not found', async () => {
    mockGetGeneration.mockResolvedValue(null);
    const res = await request(app).get('/api/history/missing-id');
    expect(res.status).toBe(404);
  });

  it('includes full description fields in each piece', async () => {
    const res = await request(app).get('/api/history/gen-1');
    expect(res.status).toBe(200);
    expect(res.body.pieces).toHaveLength(2);
    expect(res.body.pieces[0]).toMatchObject({
      title: 'Sunset',
      imageUrl: 'https://signed.url/gen-1/piece-0.png',
      description: 'A warm watercolor sunset',
      medium: 'Watercolor',
      dimensions: '18" x 24"',
      placement: 'Center wall',
    });
    expect(res.body.pieces[1]).toMatchObject({
      title: 'Forest',
      description: 'Dense forest in oils',
      medium: 'Oil on canvas',
    });
  });

  it('falls back gracefully when descriptions array is missing', async () => {
    mockGetGeneration.mockResolvedValue({ ...mockGeneration, descriptions: undefined });
    const res = await request(app).get('/api/history/gen-1');
    expect(res.status).toBe(200);
    expect(res.body.pieces[0].title).toBe('Piece 1');
    expect(res.body.pieces[0].description).toBeUndefined();
  });
});
```

**Step 2: Run the test to verify it fails**

```bash
cd backend && npx jest src/routes/history.test.ts --no-coverage
```

Expected: FAIL — `includes full description fields` fails because pieces only has `{ title, imageUrl }`.

**Step 3: Update the pieces mapping in `history.ts`**

In `backend/src/routes/history.ts`, change the `pieces` mapping (lines 39–41):

```typescript
// Before:
const pieces = pieceUrls.map((imageUrl: string, i: number) => ({
  title: data.descriptions?.[i]?.title || `Piece ${i + 1}`,
  imageUrl,
}));

// After:
const desc = data.descriptions?.[i];
// becomes:
const pieces = pieceUrls.map((imageUrl: string, i: number) => {
  const desc = data.descriptions?.[i];
  return {
    title: desc?.title || `Piece ${i + 1}`,
    imageUrl,
    ...(desc ? {
      description: desc.description,
      medium: desc.medium,
      dimensions: desc.dimensions,
      placement: desc.placement,
    } : {}),
  };
});
```

**Step 4: Run tests to verify they pass**

```bash
cd backend && npx jest src/routes/history.test.ts --no-coverage
```

Expected: All 3 tests PASS.

**Step 5: Run the full backend suite to check for regressions**

```bash
cd backend && npx jest --no-coverage
```

Expected: All suites PASS.

**Step 6: Commit**

```bash
cd backend
git add src/routes/history.test.ts src/routes/history.ts
git commit -m "feat: include full description fields in history GET /:id pieces"
```

---

## Task 2: Update frontend types and thread descriptions into PieceGallery

**Files:**
- Modify: `frontend/src/app/wall/[id]/page.tsx`
- Modify: `frontend/src/components/PieceGallery.tsx`

**Context:** `GenerationData.pieces` is typed as `{ title: string; imageUrl: string }[]`. We need to add the optional description fields, then pass them through to `PieceGallery`.

**Step 1: Update the `GenerationData` type in `wall/[id]/page.tsx`**

Change the `pieces` field in the `GenerationData` interface:

```typescript
// Before:
pieces: { title: string; imageUrl: string }[];

// After:
pieces: {
  title: string;
  imageUrl: string;
  description?: string;
  medium?: string;
  dimensions?: string;
  placement?: string;
}[];
```

**Step 2: Update `PieceGallery.tsx` — types and layout**

Replace the entire file with:

```typescript
'use client';

import { useState } from 'react';

interface Piece {
  title: string;
  imageUrl: string;
  description?: string;
  medium?: string;
  dimensions?: string;
  placement?: string;
}

interface PieceGalleryProps {
  pieces: Piece[];
}

function PieceCard({ piece }: { piece: Piece }) {
  const [open, setOpen] = useState(false);
  const hasDescription = piece.description || piece.medium || piece.dimensions || piece.placement;

  const handleDownload = async () => {
    const res = await fetch(piece.imageUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${piece.title}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-secondary/60 bg-white overflow-hidden">
      <img
        src={piece.imageUrl}
        alt={piece.title}
        className="aspect-square w-full object-cover"
      />
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-text-darker">{piece.title}</h3>
          <button
            onClick={handleDownload}
            title="Download for print"
            className="shrink-0 rounded-lg p-1.5 text-text-dark hover:bg-secondary/60 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        {hasDescription && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="mt-2 flex items-center gap-1 text-xs text-text-dark hover:text-text-darker transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {open ? 'Hide description' : 'View description'}
          </button>
        )}
        {open && (
          <div className="mt-3 space-y-1.5 border-t border-secondary/60 pt-3 text-xs text-text-dark">
            {piece.description && <p className="leading-relaxed">{piece.description}</p>}
            {piece.medium && (
              <p><span className="font-medium text-text-darker">Medium:</span> {piece.medium}</p>
            )}
            {piece.dimensions && (
              <p><span className="font-medium text-text-darker">Dimensions:</span> {piece.dimensions}</p>
            )}
            {piece.placement && (
              <p><span className="font-medium text-text-darker">Placement:</span> {piece.placement}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PieceGallery({ pieces }: PieceGalleryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {pieces.map((piece, i) => (
        <PieceCard key={i} piece={piece} />
      ))}
    </div>
  );
}
```

**Step 3: Verify the frontend builds**

```bash
cd frontend && npx next build 2>&1 | tail -20
```

Expected: Build completes with no TypeScript errors.

**Step 4: Commit**

```bash
cd ..  # back to repo root
git add frontend/src/app/wall/\[id\]/page.tsx frontend/src/components/PieceGallery.tsx
git commit -m "feat: add description accordion and download button to piece cards"
```

---

## Task 3: Smoke test in the browser

**Step 1: Start backend and frontend**

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

**Step 2: Navigate to a wall view**

Go to `http://localhost:3000`, sign in, create or view a generation.

**Step 3: Verify**

- Each piece card shows title + ↓ download icon
- "View description" toggle appears below the title
- Clicking it expands description, medium, dimensions, placement
- Clicking again collapses
- Download icon triggers a `.png` file download named after the piece title
