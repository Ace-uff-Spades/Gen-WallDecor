# Design: Retry Flow Fix + Auth UX Improvements

> Date: 2026-03-05

## Problem

Three issues found during E2E testing:

1. **Retry flow broken** — "Retry with Changes" from wall page and "Regenerate All" on generate page both fail with `Missing required preferences (style, roomType)`. Root cause: `handleRetry` only passes `style` in URL params; `roomType`, `colorScheme`, `frameMaterial` are missing.

2. **Auth error not user-friendly** — When not signed in, the raw backend error `Missing or malformed Authorization header` surfaces in the UI.

3. **Sign-in not apparent** — Users complete the 3-step wizard then hit an auth error on the generate page with no clear call to action.

## Changes

### 1. Fix retry flow (`wall/[id]/page.tsx`)

- Add `preferences` to `GenerationData` interface (already returned by the API via Firestore doc)
- Update `handleRetry` to serialize all preferences into URL params — matching the same params format used by `create/page.tsx` (`style`, `colors`, `frame`, `room`, `w`, `h`)
- Also pass `feedback` as a URL param so the initial description fetch on `/generate` uses it
- Update `generate/page.tsx` to read `feedback` from search params and pass it to the initial `fetchDescriptions` call

### 2. Fix auth error message (`api.ts`)

- In `getAuthHeader`, if `auth.currentUser` is null, throw `new Error('Please sign in to continue')` before the request is made
- This replaces the raw 401 error with a friendly message everywhere in the app

### 3. Sign-in gate on `/generate` (`generate/page.tsx`)

- Add `useAuth` hook to the `GenerateContent` component
- Add a check before initiating the description fetch:
  - Auth still loading → show existing spinner
  - Not signed in → show centered sign-in prompt (message + Google sign-in button using `signIn` from `useAuth`)
  - Signed in → existing flow unchanged
- The prompt replaces the loading state entirely — no description fetch is attempted until the user is authenticated

## Out of Scope

- No changes to backend validation logic
- No changes to the wizard flow
- No new routes or API changes
