# Design: Shopping Links, Download Subject Only, Objects

> Created: 2026-03-14
> Status: Approved, awaiting implementation plan

---

## Overview

Three tightly-coupled features that define what a user can do with each generated piece based on its type:

- **Posters** — frameless download + frame shopping link + print service link
- **Objects** — no download; shopping link for the object itself + links for mounting hardware

GPT classifies each piece and provides all necessary metadata (frame recommendation, mounting requirements, wall position) during the description phase. A new overlay UI on the wall render surfaces links via interactive dots.

---

## Piece Types

Two types, assigned by GPT during description generation:

| Type | Download | Frame link | Print link | Object link | Mounting links |
|---|---|---|---|---|---|
| `poster` | Yes (frameless) | Yes | Yes | No | No |
| `object` | No | No | No | Yes | Yes (per requirement) |

---

## Data Model

`PieceDescription` in `types.ts` gains four new fields:

```typescript
type PieceType = 'poster' | 'object';

interface FrameRecommendation {
  material: string;  // e.g. "natural wood"
  color: string;     // e.g. "warm oak"
  style: string;     // e.g. "rustic"
}

interface MountingRequirement {
  name: string;         // e.g. "floating shelf"
  searchQuery: string;  // used to build Google Shopping URL
}

interface PieceDescription {
  title: string;
  description: string;
  medium: string;
  dimensions: string;
  placement: string;
  // NEW:
  type: PieceType;
  position: { x: number; y: number };           // 0–100%, approximate center on wall render
  frameRecommendation?: FrameRecommendation;    // poster only
  mountingRequirements?: MountingRequirement[]; // object only
}
```

---

## Backend Changes

### `descriptionService.ts`
- Extend the Zod schema to include `type`, `position`, `frameRecommendation`, `mountingRequirements`
- Update the GPT prompt to instruct the model to:
  - Classify each piece as `poster` or `object`
  - Output `position` as approximate center coordinates (0–100%) based on the layout it is designing
  - For posters: recommend the ideal frame given the user's `style`, `colorScheme`, `roomType`, and `frameMaterial` preferences
  - For objects: list what additional hardware/supports are needed to mount/display it on a wall (e.g. floating shelf, mounting bracket), each with a `searchQuery` suitable for Google Shopping

### `imageService.ts`
- Remove all frame-related language from the Gemini piece image prompt
- Images are always generated frameless
- Wall render prompt is unchanged

### New `shoppingService.ts`
- Pure utility, no API calls
- Constructs Google Shopping search URLs (`https://www.google.com/search?tbm=shop&q=...`):
  - **Frame:** `{style} {material} {color} picture frame {dimensions}`
  - **Print service:** `print poster {dimensions}`
  - **Object:** `{title} wall decor`
  - **Each mounting requirement:** `{searchQuery}`

---

## Frontend Changes

### `PieceGallery` details panel

**For `poster` pieces:**
- "Download" button (existing) — downloads frameless GCS image directly
- "Buy a frame" link — Google Shopping frame URL, with description e.g. "Warm oak rustic frame, 8×10"
- "Print this poster" link — print service search URL

**For `object` pieces:**
- No download button
- "Buy this piece" link — Google Shopping URL for the object
- Per mounting requirement: "Buy a {name}" link — e.g. "Buy a floating shelf"

All links open in a new tab with a plain-text description of what the user is purchasing.

### Wall render overlay (`wall/[id]/page.tsx`)

- Absolutely-positioned layer over the wall render image
- One dot per piece at `piece.position.x%` / `piece.position.y%`
- On hover: dot scales up (CSS `transform: scale(1.3)`) as click affordance
- On click: small popover opens showing piece title + condensed version of the same links from the details panel
- Only one popover open at a time; clicking outside closes it

---

## Shopping URL Strategy

Initial implementation uses Google Shopping search URLs (no API key required). Future improvement: integrate the Google Shopping API to surface specific product listings with prices directly in the UI (tracked in `Future_Features.md`).

---

## Testing

### `descriptionService.test.ts`
- Zod schema accepts all new fields
- Poster pieces have `frameRecommendation` populated, no `mountingRequirements`
- Object pieces have `mountingRequirements` populated, no `frameRecommendation`
- `position` values are within 0–100 for all pieces

### New `shoppingService.test.ts`
- Frame URL constructed correctly from `frameRecommendation` fields + dimensions
- Print service URL constructed correctly from dimensions
- Object URL constructed correctly from piece title
- Mounting requirement URLs constructed correctly from `searchQuery`
- All URLs use `google.com/search?tbm=shop`

### `imageService.test.ts`
- Verify Gemini piece image prompt contains no frame-related language
