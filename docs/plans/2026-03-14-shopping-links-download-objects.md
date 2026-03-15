# Shopping Links, Download Subject Only, Objects — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Classify each generated piece as `poster` or `object`, enrich descriptions with frame recommendations and mounting requirements, generate frameless images, and surface shopping/download links in the PieceGallery details panel and as an interactive overlay on the wall render.

**Architecture:** Extend `PieceDescription` with `type`, `position`, `frameRecommendation`, and `mountingRequirements`. Update the GPT Zod schema and prompt in `descriptionService.ts` to output these fields. Update the Gemini piece image prompt in `imageService.ts` to generate frameless images. Add a pure utility `shoppingService.ts` that builds Google Shopping search URLs. Update frontend `PieceGallery` details panel and add an overlay on the wall render image.

**Tech Stack:** Express + TypeScript, OpenAI SDK with Zod structured output, Jest for backend tests, Next.js App Router + React for frontend.

---

### Task 1: Extend PieceDescription in types.ts

**Files:**
- Modify: `backend/src/types.ts`

**Step 1: Update the interface**

Replace the existing `PieceDescription` interface:

```typescript
export type PieceType = 'poster' | 'object';

export interface FrameRecommendation {
  material: string;  // e.g. "natural wood"
  color: string;     // e.g. "warm oak"
  style: string;     // e.g. "rustic"
}

export interface MountingRequirement {
  name: string;         // e.g. "floating shelf"
  searchQuery: string;  // used to build Google Shopping URL
}

export interface PieceDescription {
  title: string;
  description: string;
  medium: string;
  dimensions: string;
  placement: string;
  type: PieceType;
  position: { x: number; y: number };            // 0–100%, approximate center on wall render
  frameRecommendation?: FrameRecommendation;     // poster only
  mountingRequirements?: MountingRequirement[];  // object only
}
```

**Step 2: Run all backend tests to confirm no breakage**

```bash
cd backend && npm test
```

Expected: all tests PASS (new fields are optional or additive; existing test mock data without the new fields will still compile since TypeScript tests use `as any` or partial mocks).

**Step 3: Commit**

```bash
git add backend/src/types.ts
git commit -m "feat: extend PieceDescription with type, position, frameRecommendation, mountingRequirements"
```

---

### Task 2: Create shoppingService.ts with tests

**Files:**
- Create: `backend/src/services/shoppingService.ts`
- Create: `backend/src/services/shoppingService.test.ts`

**Step 1: Write the failing tests**

Create `backend/src/services/shoppingService.test.ts`:

```typescript
import { ShoppingService } from './shoppingService';
import { PieceDescription } from '../types';

const basePoster: PieceDescription = {
  title: 'Forest Dawn',
  description: 'A serene forest at dawn',
  medium: 'Giclee Print',
  dimensions: '24x36',
  placement: 'Center',
  type: 'poster',
  position: { x: 50, y: 40 },
  frameRecommendation: {
    material: 'natural wood',
    color: 'warm oak',
    style: 'rustic',
  },
};

const baseObject: PieceDescription = {
  title: 'Ceramic Vase',
  description: 'A small ceramic vase',
  medium: 'Ceramic',
  dimensions: '8x4',
  placement: 'Left shelf',
  type: 'object',
  position: { x: 20, y: 60 },
  mountingRequirements: [
    { name: 'floating shelf', searchQuery: 'floating wall shelf small' },
    { name: 'mounting bracket', searchQuery: 'small shelf mounting bracket' },
  ],
};

describe('ShoppingService', () => {
  let service: ShoppingService;

  beforeEach(() => {
    service = new ShoppingService();
  });

  describe('getFrameUrl', () => {
    it('builds a Google Shopping URL from frameRecommendation and dimensions', () => {
      const url = service.getFrameUrl(basePoster);
      expect(url).toContain('google.com/search');
      expect(url).toContain('tbm=shop');
      expect(url).toContain('rustic');
      expect(url).toContain('natural+wood');
      expect(url).toContain('warm+oak');
      expect(url).toContain('24x36');
    });

    it('returns null if piece has no frameRecommendation', () => {
      const piece = { ...basePoster, frameRecommendation: undefined };
      expect(service.getFrameUrl(piece)).toBeNull();
    });
  });

  describe('getPrintUrl', () => {
    it('builds a Google Shopping URL for printing', () => {
      const url = service.getPrintUrl(basePoster);
      expect(url).toContain('google.com/search');
      expect(url).toContain('tbm=shop');
      expect(url).toContain('print+poster');
      expect(url).toContain('24x36');
    });
  });

  describe('getObjectUrl', () => {
    it('builds a Google Shopping URL from piece title', () => {
      const url = service.getObjectUrl(baseObject);
      expect(url).toContain('google.com/search');
      expect(url).toContain('tbm=shop');
      expect(url).toContain('Ceramic+Vase');
    });
  });

  describe('getMountingUrls', () => {
    it('returns one URL per mounting requirement', () => {
      const urls = service.getMountingUrls(baseObject);
      expect(urls).toHaveLength(2);
      expect(urls[0].name).toBe('floating shelf');
      expect(urls[0].url).toContain('floating+wall+shelf+small');
      expect(urls[1].name).toBe('mounting bracket');
    });

    it('returns empty array if no mounting requirements', () => {
      const piece = { ...baseObject, mountingRequirements: undefined };
      expect(service.getMountingUrls(piece)).toEqual([]);
    });
  });

  describe('getLinksForPiece', () => {
    it('returns frame and print links for posters', () => {
      const links = service.getLinksForPiece(basePoster);
      expect(links.frameUrl).toBeTruthy();
      expect(links.printUrl).toBeTruthy();
      expect(links.objectUrl).toBeNull();
      expect(links.mountingUrls).toHaveLength(0);
    });

    it('returns object and mounting links for objects', () => {
      const links = service.getLinksForPiece(baseObject);
      expect(links.objectUrl).toBeTruthy();
      expect(links.mountingUrls).toHaveLength(2);
      expect(links.frameUrl).toBeNull();
      expect(links.printUrl).toBeNull();
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd backend && npm test -- --testPathPattern=shoppingService
```

Expected: FAIL (`Cannot find module './shoppingService'`).

**Step 3: Implement shoppingService.ts**

Create `backend/src/services/shoppingService.ts`:

```typescript
import { PieceDescription } from '../types';

const BASE = 'https://www.google.com/search?tbm=shop&q=';

function encode(s: string): string {
  return encodeURIComponent(s).replace(/%20/g, '+');
}

export interface PieceLinks {
  frameUrl: string | null;
  printUrl: string | null;
  objectUrl: string | null;
  mountingUrls: { name: string; url: string }[];
}

export class ShoppingService {
  getFrameUrl(piece: PieceDescription): string | null {
    if (!piece.frameRecommendation) return null;
    const { style, material, color } = piece.frameRecommendation;
    const query = `${style} ${material} ${color} picture frame ${piece.dimensions}`;
    return `${BASE}${encode(query)}`;
  }

  getPrintUrl(piece: PieceDescription): string {
    const query = `print poster ${piece.dimensions}`;
    return `${BASE}${encode(query)}`;
  }

  getObjectUrl(piece: PieceDescription): string {
    const query = `${piece.title} wall decor`;
    return `${BASE}${encode(query)}`;
  }

  getMountingUrls(piece: PieceDescription): { name: string; url: string }[] {
    if (!piece.mountingRequirements?.length) return [];
    return piece.mountingRequirements.map(req => ({
      name: req.name,
      url: `${BASE}${encode(req.searchQuery)}`,
    }));
  }

  getLinksForPiece(piece: PieceDescription): PieceLinks {
    if (piece.type === 'poster') {
      return {
        frameUrl: this.getFrameUrl(piece),
        printUrl: this.getPrintUrl(piece),
        objectUrl: null,
        mountingUrls: [],
      };
    }
    return {
      frameUrl: null,
      printUrl: null,
      objectUrl: this.getObjectUrl(piece),
      mountingUrls: this.getMountingUrls(piece),
    };
  }
}
```

**Step 4: Run tests**

```bash
cd backend && npm test -- --testPathPattern=shoppingService
```

Expected: all tests PASS.

**Step 5: Commit**

```bash
git add backend/src/services/shoppingService.ts backend/src/services/shoppingService.test.ts
git commit -m "feat: add ShoppingService to build Google Shopping search URLs for pieces"
```

---

### Task 3: Update descriptionService.ts — extend Zod schema and GPT prompt

**Files:**
- Modify: `backend/src/services/descriptionService.ts`
- Modify: `backend/src/services/descriptionService.test.ts`

**Step 1: Write failing tests**

Read `backend/src/services/descriptionService.test.ts` in full first. Then add these tests inside the existing test suite:

```typescript
it('returns pieces with type field set to poster or object', async () => {
  mockParse.mockResolvedValue({
    choices: [{
      message: {
        parsed: {
          pieces: [{
            title: 'Forest Print',
            description: 'A print',
            medium: 'Giclee',
            dimensions: '24x36',
            placement: 'Center',
            type: 'poster',
            position: { x: 50, y: 40 },
            frameRecommendation: { material: 'wood', color: 'oak', style: 'rustic' },
          }],
        },
      },
    }],
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  });

  const result = await service.generateDescriptions(preferences);
  expect(result[0].type).toBe('poster');
  expect(result[0].position).toEqual({ x: 50, y: 40 });
  expect(result[0].frameRecommendation).toBeDefined();
});

it('returns object pieces with mountingRequirements and no frameRecommendation', async () => {
  mockParse.mockResolvedValue({
    choices: [{
      message: {
        parsed: {
          pieces: [{
            title: 'Ceramic Vase',
            description: 'A vase',
            medium: 'Ceramic',
            dimensions: '8x4',
            placement: 'Left',
            type: 'object',
            position: { x: 20, y: 60 },
            mountingRequirements: [
              { name: 'floating shelf', searchQuery: 'floating shelf small' },
            ],
          }],
        },
      },
    }],
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  });

  const result = await service.generateDescriptions(preferences);
  expect(result[0].type).toBe('object');
  expect(result[0].mountingRequirements).toHaveLength(1);
  expect(result[0].frameRecommendation).toBeUndefined();
});
```

**Step 2: Run tests to verify they fail**

```bash
cd backend && npm test -- --testPathPattern=descriptionService
```

Expected: tests FAIL (Zod schema rejects unrecognized fields / type field not present).

**Step 3: Update Zod schema in descriptionService.ts**

Replace the `PieceDescriptionSchema` and `DescriptionsResponseSchema`:

```typescript
const FrameRecommendationSchema = z.object({
  material: z.string(),
  color: z.string(),
  style: z.string(),
});

const MountingRequirementSchema = z.object({
  name: z.string(),
  searchQuery: z.string(),
});

const PieceDescriptionSchema = z.object({
  title: z.string(),
  description: z.string(),
  medium: z.string(),
  dimensions: z.string(),
  placement: z.string(),
  type: z.enum(['poster', 'object']),
  position: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }),
  frameRecommendation: FrameRecommendationSchema.optional(),
  mountingRequirements: z.array(MountingRequirementSchema).optional(),
});

const DescriptionsResponseSchema = z.object({
  pieces: z.array(PieceDescriptionSchema),
});
```

**Step 4: Update buildPrompt in descriptionService.ts**

In `buildPrompt`, extend the instructions for GPT. Add the following to the end of both the initial and refinement prompt branches:

```typescript
prompt += `

For each piece, you must also provide:
- "type": "poster" if the piece is flat wall art (prints, paintings, photographs, canvas); "object" if it is a 3D decorative item (vase, sculpture, plant, figurine, clock, etc.)
- "position": approximate center position of this piece on the wall as { "x": 0-100, "y": 0-100 } percentages, based on the placement you are describing
- "frameRecommendation" (poster type only): the ideal frame for this piece given the style "${preferences.style}", color scheme "${preferences.colorScheme.join(', ')}", room "${preferences.roomType}", and preferred material "${preferences.frameMaterial}". Include: material, color, style.
- "mountingRequirements" (object type only): list of additional items needed to display this piece on a wall (e.g. floating shelf, mounting bracket, picture ledge). Each item needs a "name" and a "searchQuery" suitable for Google Shopping.`;
```

**Step 5: Run tests**

```bash
cd backend && npm test -- --testPathPattern=descriptionService
```

Expected: all tests PASS.

**Step 6: Commit**

```bash
git add backend/src/services/descriptionService.ts backend/src/services/descriptionService.test.ts
git commit -m "feat: extend description service Zod schema and prompt for piece type, position, frame, mounting"
```

---

### Task 4: Update imageService.ts — generate frameless piece images

**Files:**
- Modify: `backend/src/services/imageService.ts`
- Modify: `backend/src/services/imageService.test.ts`

**Step 1: Read imageService.test.ts in full**

Read `backend/src/services/imageService.test.ts` before making changes.

**Step 2: Write the failing test**

Add a test that verifies the piece prompt contains no frame language:

```typescript
it('buildPiecePrompt does not mention frames or framing', () => {
  const piece: PieceDescription = {
    title: 'Forest Dawn',
    description: 'A forest scene',
    medium: 'Oil painting',
    dimensions: '24x36',
    placement: 'Center',
    type: 'poster',
    position: { x: 50, y: 40 },
    frameRecommendation: { material: 'wood', color: 'oak', style: 'rustic' },
  };
  const prompt = service.buildPiecePrompt(piece, 'Bohemian');
  expect(prompt.toLowerCase()).not.toContain('frame');
  expect(prompt.toLowerCase()).not.toContain('framing');
  expect(prompt.toLowerCase()).not.toContain('framed');
});
```

**Step 3: Run test to verify it fails**

```bash
cd backend && npm test -- --testPathPattern=imageService
```

Expected: test FAILS because `buildPiecePrompt` currently says "suitable for framing".

**Step 4: Update buildPiecePrompt in imageService.ts**

Replace the current `buildPiecePrompt` method:

```typescript
buildPiecePrompt(piece: PieceDescription, style: string): string {
  return `Create a high-quality wall art piece in the ${style} interior design style.

Title: ${piece.title}
Description: ${piece.description}
Medium: ${piece.medium}
Dimensions: ${piece.dimensions}

The artwork should be photorealistic. Show only the artwork itself against a clean white background, as if photographed for a catalog. Do not include any frame, border, or mounting — just the artwork alone.`;
}
```

**Step 5: Run tests**

```bash
cd backend && npm test -- --testPathPattern=imageService
```

Expected: all tests PASS.

**Step 6: Commit**

```bash
git add backend/src/services/imageService.ts backend/src/services/imageService.test.ts
git commit -m "feat: update Gemini piece image prompt to generate frameless artwork"
```

---

### Task 5: Expose shopping links from the history API

The `GET /api/history/:id` endpoint returns piece data to the frontend. It needs to include shopping links so the frontend doesn't have to call a separate endpoint.

**Files:**
- Modify: `backend/src/routes/history.ts`
- Modify: `backend/src/routes/history.test.ts` (read first)

**Step 1: Read history.test.ts in full**

**Step 2: Add a test verifying shopping links are included in GET /:id**

```typescript
it('includes shopping links in piece data for GET /:id', async () => {
  mockGetGeneration.mockResolvedValue({
    id: 'gen1',
    userId: 'user123',
    descriptions: [{
      title: 'Forest Print',
      description: 'A print',
      medium: 'Giclee',
      dimensions: '24x36',
      placement: 'Center',
      type: 'poster',
      position: { x: 50, y: 40 },
      frameRecommendation: { material: 'wood', color: 'oak', style: 'rustic' },
    }],
    pieceVersions: [['generations/gen1/piece-0-v0.png']],
    wallRenderVersions: ['generations/gen1/wall-render-v0.png'],
    finalizedAt: null,
    pieceRegenerationCount: 0,
  });
  mockGetSignedUrl.mockResolvedValue('https://signed.url');

  const res = await request(app).get('/api/history/gen1');
  expect(res.status).toBe(200);
  expect(res.body.pieces[0].links).toBeDefined();
  expect(res.body.pieces[0].links.frameUrl).toContain('google.com');
  expect(res.body.pieces[0].links.printUrl).toContain('google.com');
});
```

**Step 3: Run test to verify it fails**

```bash
cd backend && npm test -- --testPathPattern=history
```

Expected: FAIL (`links` not in response).

**Step 4: Update GET /:id in history.ts to include shopping links**

Add import at the top:
```typescript
import { ShoppingService } from '../services/shoppingService';
```

Add instance after existing service declarations:
```typescript
const shoppingService = new ShoppingService();
```

In the `GET /:id` handler, update the pieces map to include links:

```typescript
const pieces = pieceUrls.map((imageUrl: string, i: number) => {
  const desc = data.descriptions?.[i];
  const links = desc ? shoppingService.getLinksForPiece(desc) : null;
  return {
    title: desc?.title || `Piece ${i + 1}`,
    imageUrl,
    links,
    ...(desc ? {
      description: desc.description,
      medium: desc.medium,
      dimensions: desc.dimensions,
      placement: desc.placement,
      type: desc.type,
      position: desc.position,
    } : {}),
  };
});
```

**Step 5: Run all tests**

```bash
cd backend && npm test
```

Expected: all tests PASS.

**Step 6: Commit**

```bash
git add backend/src/routes/history.ts backend/src/routes/history.test.ts
git commit -m "feat: include shopping links in GET /api/history/:id piece data"
```

---

### Task 6: Frontend — PieceGallery details panel with shopping/download links

**Files:**
- Modify: `frontend/src/components/PieceGallery.tsx`

**Step 1: Read PieceGallery.tsx in full**

**Step 2: Add a `PieceLinks` type in the frontend**

At the top of the component file (or a shared types file), add:

```typescript
interface PieceLinks {
  frameUrl: string | null;
  printUrl: string | null;
  objectUrl: string | null;
  mountingUrls: { name: string; url: string }[];
}
```

**Step 3: Update the piece type to include links and type**

In the `Piece` interface (or wherever piece shape is typed), add:

```typescript
type?: 'poster' | 'object';
links?: PieceLinks;
position?: { x: number; y: number };
```

**Step 4: Add the links section to the details panel**

In the details panel render (the right-hand sticky panel), add after the existing description/metadata fields:

```tsx
{/* Download and shopping links */}
{selectedPiece.type === 'poster' && (
  <div className="mt-4 space-y-2">
    <a
      href={selectedPiece.links?.frameUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-sm text-blue-600 underline"
    >
      Buy a frame — {selectedPiece.frameRecommendation?.style} {selectedPiece.frameRecommendation?.material} ({selectedPiece.dimensions})
    </a>
    <a
      href={selectedPiece.links?.printUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-sm text-blue-600 underline"
    >
      Print this poster ({selectedPiece.dimensions})
    </a>
    <button
      onClick={() => window.open(downloadUrl, '_blank')}
      className="block text-sm text-blue-600 underline text-left"
    >
      Download artwork (frameless)
    </button>
  </div>
)}

{selectedPiece.type === 'object' && (
  <div className="mt-4 space-y-2">
    <a
      href={selectedPiece.links?.objectUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-sm text-blue-600 underline"
    >
      Buy this piece — {selectedPiece.title}
    </a>
    {selectedPiece.links?.mountingUrls.map(m => (
      <a
        key={m.name}
        href={m.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-sm text-blue-600 underline"
      >
        Buy a {m.name} (needed for wall mounting)
      </a>
    ))}
  </div>
)}
```

**Step 5: Commit**

```bash
git add frontend/src/components/PieceGallery.tsx
git commit -m "feat: add shopping and download links to PieceGallery details panel"
```

---

### Task 7: Frontend — interactive dot overlay on wall render

**Files:**
- Modify: `frontend/src/app/wall/[id]/page.tsx`

**Step 1: Read wall/[id]/page.tsx in full**

**Step 2: Add overlay state**

```typescript
const [openDotIndex, setOpenDotIndex] = useState<number | null>(null);
```

**Step 3: Add the overlay component**

Wrap the wall render `<img>` in a relative-positioned container and add dots:

```tsx
<div className="relative inline-block w-full">
  <img
    src={wallRenderUrl}
    alt="Your wall"
    className="w-full rounded-lg"
  />

  {/* Interactive piece dots */}
  {pieces.map((piece, i) => {
    if (!piece.position) return null;
    const isOpen = openDotIndex === i;
    return (
      <div
        key={i}
        className="absolute"
        style={{
          left: `${piece.position.x}%`,
          top: `${piece.position.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Dot */}
        <button
          onClick={() => setOpenDotIndex(isOpen ? null : i)}
          className="w-4 h-4 rounded-full bg-white border-2 border-gray-700 shadow transition-transform hover:scale-125 focus:outline-none"
          aria-label={`View links for ${piece.title}`}
        />

        {/* Popover */}
        {isOpen && (
          <div
            className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-48 text-sm"
            style={{ top: '1.5rem', left: '50%', transform: 'translateX(-50%)' }}
          >
            <p className="font-semibold mb-2">{piece.title}</p>
            {piece.type === 'poster' && (
              <>
                {piece.links?.frameUrl && (
                  <a href={piece.links.frameUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-600 underline mb-1">
                    Buy a frame
                  </a>
                )}
                {piece.links?.printUrl && (
                  <a href={piece.links.printUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-600 underline">
                    Print this poster
                  </a>
                )}
              </>
            )}
            {piece.type === 'object' && (
              <>
                {piece.links?.objectUrl && (
                  <a href={piece.links.objectUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-600 underline mb-1">
                    Buy this piece
                  </a>
                )}
                {piece.links?.mountingUrls.map(m => (
                  <a key={m.name} href={m.url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 underline">
                    Buy a {m.name}
                  </a>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    );
  })}
</div>
```

**Step 4: Close popover on outside click**

Add a `useEffect` to close the popover when clicking outside:

```typescript
useEffect(() => {
  function handleClick(e: MouseEvent) {
    if (openDotIndex !== null) setOpenDotIndex(null);
  }
  document.addEventListener('click', handleClick);
  return () => document.removeEventListener('click', handleClick);
}, [openDotIndex]);
```

Stop propagation on the dot button clicks so they don't immediately close:

```tsx
onClick={(e) => { e.stopPropagation(); setOpenDotIndex(isOpen ? null : i); }}
```

**Step 5: Build check**

```bash
cd frontend && npm run build
```

Expected: build completes with 0 errors.

**Step 6: Commit**

```bash
git add frontend/src/app/wall/[id]/page.tsx
git commit -m "feat: add interactive dot overlay on wall render for piece shopping links"
```

---

### Task 8: Final test run and documentation

**Step 1: Run all backend tests**

```bash
cd backend && npm test
```

Expected: all tests PASS. Zero failures.

**Step 2: Update docs/architecture.md**

Add the new `shoppingService.ts` to the backend components table:

```
| `services/shoppingService.ts` | Builds Google Shopping search URLs from PieceDescription fields |
```

**Step 3: Update docs/project_state.md** with new feature status.

**Step 4: Commit docs**

```bash
git add docs/
git commit -m "docs: update architecture and project state for shopping-links feature"
```
