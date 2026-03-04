# GenWallDecor — Learnings

> Things learned along the way, explained for future reference.

---

## How Docker + Cloud Run + GitHub Actions work together

### What Docker is doing

The Express backend is currently TypeScript files run locally with `ts-node-dev`. To deploy to Cloud Run, Google needs a self-contained package that runs anywhere — that's what Docker provides.

A `Dockerfile` is a recipe: "start with Node 20, copy my code in, compile TypeScript, run `node dist/index.js`." The output is a **Docker image** — a snapshot of the app that runs identically on any machine, with no local environment dependencies.

### Where the image lives

Google's **Artifact Registry** is a private warehouse for Docker images. GitHub Actions builds the image and pushes it there. Cloud Run pulls from it when deploying.

### The full deploy flow (on every merge to `main`)

```
Merge PR to main
      │
      ▼
GitHub Actions kicks off:
  1. Runs backend tests (npm test) — stops here if they fail
  2. Builds the Docker image
  3. Pushes the image to GCP Artifact Registry
      │
      ▼
Deploys to Cloud Run:
  "Hey Cloud Run, use this new image"
      │
      ▼
Cloud Run swaps in the new container
Backend is live at the same URL as before
```

### How GitHub Actions gets permission to push to GCP

One-time manual setup: create a **GCP service account** with permission to push to Artifact Registry and deploy to Cloud Run. Download its credentials as a JSON key and add it as a secret in the GitHub repo settings (`GCP_SA_KEY`). GitHub Actions uses that secret to authenticate — never goes in code.

### Diagram of all the pieces

```
GitHub Repo
├── backend/Dockerfile            ← recipe for the image
├── .github/workflows/
│   ├── ci.yml                    ← runs tests on every PR
│   └── deploy.yml                ← builds + deploys on merge to main
│
└── (GitHub secret: GCP_SA_KEY)   ← one-time setup, stored in GitHub settings
         │
         ▼
GCP Artifact Registry             ← stores built Docker images
         │
         ▼
Cloud Run                         ← runs the latest image, exposes a stable URL
```

---

## Vitest + React Testing Library — what they are and what they test

**Vitest** is a test runner for JavaScript/TypeScript — the frontend equivalent of Jest (which runs the backend tests). It finds and runs test files and reports pass/fail.

**React Testing Library (RTL)** pairs with Vitest to let you render React components in a fake browser environment and interact with them — click buttons, check text, simulate user flows — without a real browser.

Together they let you write tests like:
- "When I select a style and click Next, the wizard advances to step 2"
- "When no room type is selected, the Generate button is disabled"
- "If the API call fails, the error message renders"

**What you can test with Vitest in this project:**
- Hook logic (`useCreationWizard`, `useAuth`) — state transitions, validation rules
- Component rendering — does the right UI appear given certain props/state
- API client (`api.ts`) — does it construct the right fetch calls
- Pure utility functions in `lib/`

**What Vitest can't test:** real browser interactions, actual network calls to the backend, or full E2E flows. That requires a real browser tool like Playwright.

**`useCreationWizard`** is the custom React hook in `frontend/src/lib/useCreationWizard.ts` that holds all state for the 3-step creation wizard — which style is selected, colors/frame/room chosen, which step you're on, and forward/back navigation logic. It's the brain of the `/create` page. A Vitest test for it would look like:

```ts
it('should not allow advancing to step 2 without a style selected', () => {
  const { result } = renderHook(() => useCreationWizard())
  expect(result.current.canAdvance).toBe(false)

  act(() => result.current.selectStyle('Modern'))
  expect(result.current.canAdvance).toBe(true)
})
```

---
