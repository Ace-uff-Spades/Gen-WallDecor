# Design: Regenerate Individual Pictures

> Created: 2026-03-14
> Status: Approved, awaiting implementation plan

---

## Overview

Allow users to re-roll individual wall decor pieces after the initial generation. Users can multi-select pieces on the wall page and regenerate them, browse version history per piece, and compose a new wall render from their preferred versions. A "Finalize Wall" action counts the wall toward the user's quota.

---

## User Flow

1. **`generate` page** — each description card has a "Regenerate" button. Clicking it re-runs Gemini for just that piece using the current description. Shows a per-card loading spinner.
2. **`wall/[id]` page** — piece thumbnails have checkboxes for multi-select. "Regenerate Selected (n)" button calls the backend for all checked pieces. Per-piece prev/next arrows let users browse version history. "Update Wall Render" composes a wall render from whichever version is currently displayed per piece. "Finalize Wall" consumes one quota slot and locks the generation.

---

## Data Model

`generations/{genId}` Firestore doc changes:

| Field | Before | After |
|---|---|---|
| `imageRefs: string[]` | current piece GCS paths | **removed** |
| `wallRenderRef: string` | current wall render path | **removed** |
| `pieceVersions: string[][]` | — | version history per piece; `pieceVersions[i]` is ordered oldest→newest |
| `wallRenderVersions: string[]` | — | version history of wall renders, oldest→newest |
| `finalizedAt: string \| null` | — | null = draft; ISO date = finalized |
| `pieceRegenerationCount: number` | — | incremented per regeneration call; blocked at env-var limit |

**Current image for piece i** → `pieceVersions[i].at(-1)`
**Current wall render** → `wallRenderVersions.at(-1)`

**GCS paths** change from `piece-{n}.png` → `piece-{n}-v{k}.png` and `wall-render.png` → `wall-render-v{k}.png` so versions never overwrite each other.

**Migration:** One-time script converts existing records: wraps `imageRefs[i]` into `pieceVersions[i] = [imageRefs[i]]`, wraps `wallRenderRef` into `wallRenderVersions = [wallRenderRef]`, sets `finalizedAt: null`, `pieceRegenerationCount: 0`.

---

## Quota & Finalization

- The 3-generation slot cap (configurable via `MAX_FINALIZED_GENERATIONS` env var) applies to **finalized** generations only.
- Piece regenerations within a draft do not consume a slot.
- Per-draft piece regeneration cap: `MAX_PIECE_REGENERATIONS_PER_DRAFT` env var (default: 20).
- A counter `pieceRegenerationCount / MAX_PIECE_REGENERATIONS_PER_DRAFT` is shown in the UI.
- On finalization: if user now has more than `MAX_FINALIZED_GENERATIONS` finalized records, the oldest is evicted (Firestore doc + GCS objects deleted).

---

## Backend API

### `POST /api/generate/pieces`
- **Auth:** Required
- **Body:** `{ generationId: string, pieces: { pieceIndex: number, description: string }[] }`
- **Validates:** generation belongs to user, `finalizedAt === null`, `pieceRegenerationCount + pieces.length <= MAX_PIECE_REGENERATIONS_PER_DRAFT`
- **Action:** For each piece — calls Gemini with the generation's original `style` and `preferences` (fetched from Firestore) plus the new description. Uploads result as `piece-{n}-v{k}.png`. Appends GCS path to `pieceVersions[n]`. Updates `descriptions[pieceIndex]`. Increments `pieceRegenerationCount`.
- **Returns:** Updated `pieceVersions` for affected pieces + new `pieceRegenerationCount`

### `POST /api/generate/wall-render`
- **Auth:** Required
- **Body:** `{ generationId: string, pieceImageRefs: string[] }` — frontend passes the GCS paths of the currently-displayed version for each piece
- **Validates:** generation belongs to user, all `pieceImageRefs` belong to this generation
- **Action:** Calls Gemini with the specified piece images to compose a wall render. Uploads as `wall-render-v{k}.png`. Appends to `wallRenderVersions`.
- **Returns:** Updated `wallRenderVersions`

### `POST /api/generations/:id/finalize`
- **Auth:** Required
- **Action:** Sets `finalizedAt = new Date().toISOString()`. Counts user's finalized generations. If over `MAX_FINALIZED_GENERATIONS`, evicts the oldest finalized generation.
- **Returns:** Updated generation doc

---

## Frontend Changes

### `generate/page.tsx`
- Per-card "Regenerate" button (visible after initial generation exists)
- Calls `POST /api/generate/pieces` with that card's piece index + current description
- Card shows loading spinner while regenerating; other cards remain interactive
- On success, updates displayed piece image

### `wall/[id]/page.tsx` + `PieceGallery`
- Checkboxes on piece thumbnails for multi-select
- "Regenerate Selected (n)" button — calls `POST /api/generate/pieces` for all checked pieces
- Per-piece prev/next version navigation arrows — tracks `currentVersionIndex[pieceIndex]` in local UI state (not persisted to server)
- "Update Wall Render" button — calls `POST /api/generate/wall-render` passing the currently-viewed GCS path for each piece
- "Finalize Wall" button — calls `POST /api/generations/:id/finalize`; on success disables all regeneration controls
- Regeneration counter: `{pieceRegenerationCount} / {MAX_PIECE_REGENERATIONS_PER_DRAFT} regenerations used`

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MAX_FINALIZED_GENERATIONS` | `3` | Max finalized walls per user before eviction |
| `MAX_PIECE_REGENERATIONS_PER_DRAFT` | `20` | Max piece regenerations per draft generation |

---

## Testing

- `POST /api/generate/pieces` — validates ownership, rejects finalized generations, enforces `MAX_PIECE_REGENERATIONS_PER_DRAFT`, appends to `pieceVersions`, increments count, updates descriptions
- `POST /api/generate/pieces` — **style consistency**: verifies Gemini is called with the generation's original `style` and `preferences`, not just the new description
- `POST /api/generate/wall-render` — validates ownership, validates `pieceImageRefs` belong to this generation, appends to `wallRenderVersions`
- `POST /api/generate/wall-render` — **current versions**: verifies wall render uses exactly the `pieceImageRefs` from the request body
- `POST /api/generations/:id/finalize` — sets `finalizedAt`, triggers eviction when over `MAX_FINALIZED_GENERATIONS`
- Migration script — correctly converts `imageRefs`/`wallRenderRef` to versioned arrays, sets `finalizedAt: null`, `pieceRegenerationCount: 0`
- Updated `generationService.test.ts` — eviction logic uses `MAX_FINALIZED_GENERATIONS` env var
- Updated `generate.test.ts` — uses new data shape
