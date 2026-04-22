# GenWallDecor — Portfolio case study outline (Notion-style)

**Purpose:** Source doc for NotebookLM visuals + eventual `/projects/[id]` page. Audience: recruiters, startup PMs, builders. **Angle:** production AI product—not a demo—full pipeline, guardrails, deploy, observability.

**Repo:** `GenWallDecor` (Next.js frontend + Express backend). **Stack snapshot:** GPT-4o-mini (structured text) → user review → Gemini 2.5 Flash (piece images + wall composite); Firebase Auth + Firestore + GCS; Langfuse; Cloud Run + Vercel.

**Duplicate:** Same file lives in `Abhi_Portfolio/docs/GenWallDecor-case-study-outline.md`—update both if you change the outline.

---

## Page meta (for site header later)

| Field | Suggested copy |
|--------|----------------|
| **Title** | GenWallDecor |
| **Subtitle** | AI wall decor studio: curated pieces + photoreal wall renders |
| **One-liner** | End-to-end generative interior decor with a describe-then-generate pipeline, real auth, private asset storage, and ops visibility—not a single-model toy. |

---

## 1. TL;DR

> **Callout (recruiter scan):** Shipper profile—owns product narrative, model boundaries, API design, and cost/risk tradeoffs.

- **What it is:** A web app that turns style preferences into a **cohesive set of wall decor concepts** (titles, mediums, placement, frame notes, shopping hooks), then **generates frameless artwork per piece** and a **single composite “wall” render** users can iterate on.
- **Why it’s “production AI”:** Two-model pipeline with **human-in-the-loop before image spend**; **Zod-validated structured LLM output**; **versioned regenerations**; **Firebase-backed identity and data**; **GCS + signed URLs**; **rate limits and history caps**; **Langfuse + admin cost dashboards**; **90+ backend tests**.
- **What I want you to remember:** I design AI features where **failure modes, cost, and UX** are first-class—not bolted on after a prototype.

**NotebookLM visual ideas**

- [ ] Simple hero diagram: Preferences → GPT (cards) → User edit → Gemini (thumbnails + wall) → Firestore/GCS
- [ ] “Not a chatbot” badge row: Structured output · Storage · Auth · Limits · Observability

---

## 2. The problem

### 2.1 User pain

- Decorating a wall is **high uncertainty**: style, cohesion, and “will this look real on *my* wall?” are hard without visualization.
- Raw text-to-image is **cheap to demo, expensive to get wrong**: unconstrained generation burns tokens and produces incoherent galleries.

### 2.2 Builder / PM pain

- **Serverless timeouts** and opaque failures break long multimodal jobs.
- **Unstructured model output** breaks UI and downstream image prompts.
- **Unbounded storage and API calls** don’t survive real users.

**NotebookLM visual ideas**

- [ ] Split panel: “One-shot image spam” vs “Curated plan → approve → generate”

---

## 3. The solution (product story)

### 3.1 Describe-then-generate pipeline

1. **Preferences:** Style, palette, frame material, room type (and optional wall dimensions)—from a guided wizard.
2. **Concept phase (GPT-4o-mini):** Returns **4–6** `PieceDescription` objects with fields usable by UI and image prompts (title, medium, dimensions, placement, type poster vs object, **normalized wall position** `{x,y}`, frame recommendation or mounting/shopping hints).
3. **Human review:** User edits cards **before** image generation—reduces wasted multimodal calls and aligns output with intent.
4. **Image phase (Gemini):** Per-piece images (frameless artwork where appropriate) + **16:9 wall render** composed from the set.
5. **Persistence:** Generation record in Firestore; binaries in **private GCS**; **time-limited signed URLs** for display/download patterns.

### 3.2 Iteration without starting over

- **Regenerate selected pieces** with versioned paths (`piece-{i}-v{n}.png`).
- **Regenerate wall render** when the set changes.
- **Finalize** flow: locks a generation; **history eviction** applies to finalized sets (MVP cost control).

### 3.3 From pixels to “what do I buy?”

- **ShoppingService:** Builds **Google Shopping** search URLs from structured piece metadata (especially useful for 3D objects / mounting needs).
- **Interactive wall UI:** Dot overlay at **model-predicted positions** ties the render back to each piece (transparency for PMs: model outputs drive UX).

**NotebookLM visual ideas**

- [ ] 5-step horizontal journey: Create → Generate (text) → Generate (images) → Wall → History
- [ ] Annotated screenshot wireframe: piece gallery + details panel + wall with dots

---

## 4. AI architecture (for technical readers)

### 4.1 Model split (intentional)

| Stage | Model | Job |
|--------|--------|-----|
| Structured planning | **GPT-4o-mini** | Interior-designer role; **JSON via Zod** (`openai` parse helpers)—typed `PieceDescription[]`, fewer parse failures |
| Image synthesis | **Gemini 2.5 Flash** | Piece images + composite wall render |

### 4.2 Why not “one model does everything”

- **Separation of concerns:** Text schema is a **contract** between LLM, UI, Shopping links, and image prompts.
- **Cost control:** Text is cheap; images are not—**gating** matters.

### 4.3 Observability

- **Langfuse** tracing on the language side; **admin usage routes** aggregate **tokens, calls, and estimated USD** (with charts for GPT vs Gemini over time)—shows you run AI like an **operated service**, not a script.

**NotebookLM visual ideas**

- [ ] Architecture diagram (match portfolio PolySci style): Browser → Express API → OpenAI / Gemini → Firestore / GCS
- [ ] Small table graphic: “Prompt contract” columns → UI field / image prompt / shopping query

---

## 5. Engineering & production decisions

### 5.1 Why Express on Cloud Run (not only Next API routes)

- Multimodal generation can run **tens of seconds**; dedicated **long-lived Node** avoids serverless **timeout** surprises and gives explicit control over the request lifecycle.

### 5.2 Security & data

- **Firebase ID tokens** on API routes; **per-user** generation ownership checks.
- **Private bucket** + **signed URLs** (short TTL)—assets aren’t public by default.

### 5.3 Abuse and cost containment (MVP-grade)

- **Per-user daily generation counter** (lazy date reset—no cron required for v1).
- **Rate limiting** before expensive work.
- **Cap on finalized history** + **piece regeneration limits** on drafts—storage and API blast radius stay bounded.

### 5.4 Quality bar in code

- **Backend:** Broad automated test coverage (dozens of suites)—routes and services mocked where appropriate for CI without live API keys.

**NotebookLM visual ideas**

- [ ] “Production checklist” illustration: Auth · Private assets · Limits · Tests · Dashboard
- [ ] Simple sequence: Request → verify token → rate check → LLM → store → signed URL response

---

## 6. What makes this different (differentiation block)

Use this as the portfolio analog to **“What Makes PolySci Different.”**

- **Pipeline product thinking:** Not “prompt → image”—**plan → validate → generate → version → finalize**.
- **Structured AI as API:** Zod-shaped outputs are the **integration layer** between LLM and app (same mindset as JSON-mode-heavy products).
- **Multimodal orchestration:** Multiple Gemini calls + one coherent wall render—**coordination** is the feature.
- **Operability:** Admin visibility into **who burns what** (tokens/costs)—what startups ask once you’re past the hackathon.

---

## 7. Honest tradeoffs (trust section)

Brief bullets—shows seniority.

- Sequential per-piece image generation today (parallelization = future speed win).
- Signed URL expiry means **history UX** may need refresh endpoints for long sessions.
- Cost figures from dashboards may be **approximate** for some image pricing models.
- Frontend test pyramid still weighted toward **backend** tests.

---

## 8. Role framing (optional short block)

**For recruiters:** Full-stack AI feature delivery—prompt/schema design, API surface, cloud storage, and measurable constraints.

**For PMs:** Clear **user-controlled checkpoint** before expensive steps; explicit **success metrics** (completion, regen usage, cost per generation).

**For builders:** Typed LLM outputs, separate services for **latency boundaries**, Firebase/GCS patterns you’d recognize in shipped consumer apps.

---

## 9. Table of contents (for portfolio TOC component)

Mirror existing case studies—anchor IDs can be slugified later.

1. TL;DR  
2. The Problem  
3. The Solution  
4. AI Architecture  
5. Production & Engineering  
6. What Makes GenWallDecor Different  
7. Tradeoffs & Next Steps  

---

## 10. Asset shot list (for you + NotebookLM)

Prioritize **evidence of shipping**, not generic AI art.

| # | Asset | Notes |
|---|--------|--------|
| A | Wizard / create flow | Shows structured inputs (style, room, palette) |
| B | Description cards (pre-image) | Highlight edit-before-generate |
| C | Wall render + dot overlay | Positions from model—ties AI output to UI |
| D | Piece gallery + details (shopping / download) | Real “downstream” use of structured fields |
| E | History grid | Bounded history / real persistence |
| F | Admin usage chart (if shareable) | Cost/tokens narrative—blur numbers if needed |
| G | Architecture diagram | From section 4 / repo `docs/architecture.md` |

---

## 11. Suggested CTAs (footer of case study)

- GitHub repo link (when public or shared).  
- Optional: “Stack: Next.js · Express · Firebase · OpenAI · Gemini · GCS · Langfuse.”

---

*Outline derived from GenWallDecor `docs/architecture.md` and `docs/project_state.md` (March 2026). Update metrics and links when the public case study ships.*
