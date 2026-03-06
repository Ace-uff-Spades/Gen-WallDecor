# Retry Flow Fix + Auth UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the broken retry flow, show a friendly auth error message, and gate the generate page behind a sign-in prompt.

**Architecture:** Three isolated frontend changes — one in `api.ts` (auth error), one in `wall/[id]/page.tsx` (retry URL params), one in `generate/page.tsx` (sign-in gate + initial feedback). No backend changes. No new components.

**Tech Stack:** Next.js App Router, React hooks, Firebase Auth (`useAuth`), TypeScript

---

### Setup: Create feature branch

**Step 1: Create and checkout branch**
```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor"
git checkout -b feature/retry-auth-ux
```

---

### Task 1: Fix auth error message

**Files:**
- Modify: `frontend/src/lib/api.ts`

The `getAuthHeader` function currently returns an empty object when no user is signed in. The request proceeds, the backend returns a raw 401, and the ugly error surfaces in the UI. Fix: throw a friendly error before the request is made.

**Step 1: Make the change**

In `frontend/src/lib/api.ts`, replace:
```typescript
async function getAuthHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}
```

With:
```typescript
async function getAuthHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to continue');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}
```

**Step 2: Verify backend tests still pass**
```bash
cd backend && npm test
```
Expected: 39 passed, 0 failed

**Step 3: Commit**
```bash
git add frontend/src/lib/api.ts
git commit -m "fix: show friendly error when user is not signed in"
```

---

### Task 2: Fix retry flow — pass full preferences

**Files:**
- Modify: `frontend/src/app/wall/[id]/page.tsx`

The `handleRetry` function only passes `style` in the URL. The generate page reads all preferences from URL params, so `roomType` (and others) arrive as empty strings, failing backend validation. The full `preferences` object is already in the API response (it's stored in Firestore and returned by `GET /api/history/:id`).

**Step 1: Add `preferences` to `GenerationData` interface**

In `frontend/src/app/wall/[id]/page.tsx`, replace the interface:
```typescript
interface GenerationData {
  id: string;
  style: string;
  wallRenderUrl: string;
  pieces: { title: string; imageUrl: string }[];
  createdAt: string;
}
```

With:
```typescript
interface GenerationData {
  id: string;
  style: string;
  preferences: {
    style: string;
    colorScheme: string[];
    frameMaterial: string;
    roomType: string;
    wallDimensions?: { width: number; height: number };
  };
  wallRenderUrl: string;
  pieces: { title: string; imageUrl: string }[];
  createdAt: string;
}
```

**Step 2: Fix `handleRetry` to pass all preferences**

Replace:
```typescript
const handleRetry = () => {
  const params = new URLSearchParams({ style: data?.style || '' });
  if (feedback) params.set('feedback', feedback);
  router.push(`/generate?${params.toString()}`);
};
```

With:
```typescript
const handleRetry = () => {
  const prefs = data!.preferences;
  const params = new URLSearchParams({
    style: prefs.style,
    colors: prefs.colorScheme.join(','),
    frame: prefs.frameMaterial,
    room: prefs.roomType,
    ...(prefs.wallDimensions ? { w: String(prefs.wallDimensions.width), h: String(prefs.wallDimensions.height) } : {}),
    ...(feedback ? { feedback } : {}),
  });
  router.push(`/generate?${params.toString()}`);
};
```

**Step 3: Verify backend tests still pass**
```bash
cd backend && npm test
```
Expected: 39 passed, 0 failed

**Step 4: Commit**
```bash
git add frontend/src/app/wall/[id]/page.tsx
git commit -m "fix: pass full preferences in retry URL params"
```

---

### Task 3: Read initial feedback from URL on generate page

**Files:**
- Modify: `frontend/src/app/generate/page.tsx`

When coming from "Retry with Changes", feedback is passed as a `?feedback=` URL param but the generate page never reads it — the initial description fetch is called without feedback. Fix: read `feedback` from search params and pass it to the initial fetch.

**Step 1: Make the change**

In `frontend/src/app/generate/page.tsx`, replace:
```typescript
  useEffect(() => {
    fetchDescriptions();
  }, [fetchDescriptions]);
```

With:
```typescript
  useEffect(() => {
    const initialFeedback = searchParams.get('feedback') || undefined;
    fetchDescriptions(initialFeedback);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDescriptions]);
```

**Step 2: Verify backend tests still pass**
```bash
cd backend && npm test
```
Expected: 39 passed, 0 failed

**Step 3: Commit**
```bash
git add frontend/src/app/generate/page.tsx
git commit -m "fix: pass initial feedback from URL to first description fetch"
```

---

### Task 4: Add sign-in gate to generate page

**Files:**
- Modify: `frontend/src/app/generate/page.tsx`

Before fetching descriptions, check auth state. If not signed in, show a centered prompt instead of the spinner. If auth is still loading, keep showing the spinner.

**Step 1: Add `useAuth` import**

At the top of `frontend/src/app/generate/page.tsx`, add the import alongside existing imports:
```typescript
import { useAuth } from '@/lib/useAuth';
```

**Step 2: Add auth check inside `GenerateContent`**

After the existing `useState`/`useCallback` declarations (before the `useEffect`), add:
```typescript
  const { user, loading: authLoading, signIn } = useAuth();
```

**Step 3: Add the sign-in gate before the loading check**

Replace the existing loading check:
```typescript
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-secondary border-t-primary" />
          <p className="mt-4 text-text-dark">Generating descriptions...</p>
        </div>
      </div>
    );
  }
```

With:
```typescript
  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-secondary border-t-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <h2 className="text-xl font-bold text-text-darker">Almost there</h2>
          <p className="mt-2 text-text-dark">Sign in to generate your wall decor.</p>
          <button
            onClick={signIn}
            className="mt-6 cursor-pointer rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-secondary border-t-primary" />
          <p className="mt-4 text-text-dark">Generating descriptions...</p>
        </div>
      </div>
    );
  }
```

**Step 4: Verify backend tests still pass**
```bash
cd backend && npm test
```
Expected: 39 passed, 0 failed

**Step 5: Commit**
```bash
git add frontend/src/app/generate/page.tsx
git commit -m "feat: show sign-in prompt on generate page when not authenticated"
```

---

### Wrap-up: Push and verify

**Step 1: Push branch**
```bash
git push -u origin feature/retry-auth-ux
```

**Step 2: Manual E2E verification checklist**
- [ ] Not signed in → go to `/create` → complete wizard → `/generate` shows "Almost there" sign-in prompt
- [ ] Sign in → prompt disappears, descriptions load
- [ ] Complete flow → wall page → "Retry with Changes" → add feedback → Regenerate → descriptions load correctly with original roomType/style
- [ ] "Regenerate All" on generate page works
- [ ] Signed-out user hitting any API call sees "Please sign in to continue" in error banner

**Step 3: Merge to main**
```bash
git checkout main
git merge feature/retry-auth-ux
git push origin main
```
