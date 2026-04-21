# GenWallDecor — Context Management

> Guidelines for working efficiently with Claude on this codebase without context degradation.

---

## Quick Project Context

- **What it is:** AI wall decor generator. User picks style → GPT describes pieces → Gemini draws them.
- **Two services:** `backend/` (Express + TypeScript) and `frontend/` (Next.js App Router)
- **Branch:** All work on `main`
- **Test command:** `cd backend && npm test`

---

## Start of Session Checklist

1. `docs/project_state.md` — What's done, what's next, known issues
2. `docs/architecture.md` — Only if touching data flow or adding a service
3. The specific file you're about to edit — Don't read the whole codebase

**Do NOT read:** `package-lock.json`, `frontend/.next/`, `node_modules/`, any file >200 lines unless editing it.

---

## File Reading Strategy

**Backend:** `backend/src/index.ts` (routes) → specific service/route → `backend/src/types.ts`

**Frontend:** `frontend/src/lib/api.ts` → `frontend/src/app/globals.css` (Tailwind v4 theme) → specific page/component

**Tests:** failing test file + its implementation file only

**Grep before reading** — use Grep to find definitions rather than reading multiple files.

---

## Context Budget

| Action | Cost | Guidance |
|--------|------|----------|
| Read 1 file | Low | Fine |
| Read 3–5 files | Medium | OK for focused task |
| Read 10+ files | High | Use Grep/Glob instead |
| `npm test` output | Low | Always OK |
| Full plan doc | Very High | Session start only |

---

## Implementation State

Phases 1–14 complete on main. App live on Cloud Run + Vercel. 97 backend tests passing.
Plans: `docs/superpowers/plans/` · Specs: `docs/superpowers/specs/`

---

## Working Pattern

TDD strictly: write failing test → run to confirm failure → implement → run to confirm pass → commit.

---

## Known Gotchas

- **Tailwind v4:** Theme in `globals.css` (`@theme inline`), no `tailwind.config.ts`
- **AUTH_DISABLED:** Set in `backend/.env` for local dev without Firebase credentials
- **OpenAI + Zod:** Use `.nullable()` not `.optional()` for structured output fields
- **GCS signed URLs:** 1-hour expiry — old history image URLs will break
- **Pencil MCP:** `batch_design` writes to Pencil's app memory, not disk. Always `Cmd+S` before `git commit`

---

## Git / Multi-Agent

- Main branch: `main`
- `docs/project_state.md` is shared state — read at start, update at end
- Check `git log` to confirm what's actually committed before picking up mid-task
