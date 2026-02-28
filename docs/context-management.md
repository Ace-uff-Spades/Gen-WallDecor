# GenWallDecor — Context Management

> Guidelines for working efficiently with Claude on this codebase without context degradation.

---

## Quick Project Context

- **What it is:** AI wall decor generator. User picks style → GPT describes pieces → Gemini draws them.
- **Two services:** `backend/` (Express + TypeScript) and `frontend/` (Next.js App Router)
- **Branch:** All implementation work is on `feature/implementation` (worktree at `.worktrees/implementation`)
- **Test command:** `cd backend && npm test`

---

## Start of Session Checklist

Before doing any work, read these files (in this order):

1. `docs/project_state.md` — What's done, what's next, known issues
2. `docs/architecture.md` — Only if you need to understand data flow or add a new service
3. The specific file you're about to edit — Don't read the whole codebase

**Do NOT read these at session start** (they'll bloat context):
- `backend/package-lock.json`
- `frontend/package-lock.json`
- `frontend/.next/` (build artifacts)
- `node_modules/`
- Any file over 200 lines unless directly editing it

---

## File Reading Strategy

### For backend changes:
- Read `backend/src/index.ts` to understand route mounting
- Read only the specific service/route you're modifying
- Check `backend/src/types.ts` for shared interfaces

### For frontend changes:
- Read `frontend/src/lib/api.ts` for all API calls
- Read `frontend/src/lib/styles.ts` for decor style data
- Read only the specific page/component you're modifying

### For test failures:
- Read the failing test file
- Read the implementation file it tests
- Do NOT read unrelated test files

---

## Context Budget Guidelines

This codebase will grow large. Protect your context window:

| Action | Context cost | Guidance |
|--------|-------------|----------|
| Read one file | Low | Fine |
| Read 3-5 files | Medium | OK for a focused task |
| Read 10+ files | High | Use Grep/Glob instead to find what you need |
| Run `npm test` output | Low | Always OK — critical signal |
| Read full plan doc | Very High | Only at session start, then don't re-read |

**Grep before reading.** If you need to find where something is defined, use Grep rather than reading multiple files.

```bash
# Find where UserPreferences is used
grep -r "UserPreferences" backend/src/ --include="*.ts"

# Find which file has a specific route
grep -r "api/generate" backend/src/ --include="*.ts"
```

---

## Implementation State (Quick Reference)

The plan has 22 tasks. Status key: ✅ Done | ⏳ Pending

```
Phase 1 (Scaffolding):   Tasks 1-4  ✅ All done
Phase 2 (Services):      Tasks 5-9  ✅ 5,6 done | ⏳ 7,8,9 pending
Phase 3 (Routes):        Tasks 10-11 ⏳ Pending
Phase 4 (Frontend):      Tasks 12-20 ⏳ Pending
Phase 5 (Docs/Tests):    Tasks 21-22 ⏳ Pending
```

→ See `docs/project_state.md` for full task-by-task breakdown.

---

## Working Pattern

This project uses **TDD** (test-driven development) strictly:

1. Write the test file first
2. Run it — verify it **fails** (not just errors, but test runner runs)
3. Write the implementation
4. Run it — verify it **passes**
5. Commit with the plan's commit message

The plan at `docs/plans/2026-02-14-genwalldecor-implementation.md` has exact code for each task. Follow it closely.

---

## Known Gotchas

- **TypeScript strict mocks:** When using `jest.fn()` with an initial value and then calling `mockResolvedValueOnce()` with partial data, add `as any` to avoid TS2345 errors. See `userService.test.ts` for example.
- **Tailwind v4 vs v3:** Frontend was scaffolded with Tailwind v4. CSS variable approach differs from v3. Don't add a `tailwind.config.ts` if one isn't there — check if Tailwind v4 uses a different config approach.
- **AUTH_DISABLED env var:** Set `AUTH_DISABLED=true` in `backend/.env` for local development without real Firebase credentials. Tests mock auth directly and don't need this.
- **GCS signed URLs expire:** They're generated with 1-hour expiry. Old history entries will have broken image URLs. This is known tech debt.

---

## Git Workflow

- **Main branch:** `main` (clean, no implementation code yet)
- **Feature branch:** `feature/implementation` (all work happens here)
- **Worktree:** `.worktrees/implementation/` (isolated workspace)

```bash
# Always work in the worktree
cd /Users/abhi/Documents/Coding\ Projects/GenWallDecor/.worktrees/implementation

# Check status
git status
git log --oneline -5

# Run tests
cd backend && npm test
```

---

## Multi-Agent Collaboration

If multiple agents are working simultaneously, use `docs/project_state.md` as the shared state file:
- Update it at the end of each session
- Check it at the start of each session
- Do not start a task marked ✅ in the state file
- When picking up mid-task, check git log to confirm what's actually committed
