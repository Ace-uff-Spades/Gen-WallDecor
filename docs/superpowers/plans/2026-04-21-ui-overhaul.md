# UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul every frontend page to match the Pencil wireframes — new design system (orange + slate, DM Sans), split-screen creation flow with style-matched room photos, and a full-bleed dark wall result page.

**Architecture:** Component-first (bottom-up). Design system tokens and fonts land first; then shared components (Navbar, WizardSplitLayout, AuthButton); then pages in dependency order. No backend changes. Routes unchanged.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4 (`@theme inline`), `next/font/google`, Unsplash static URLs (no API key needed for direct photo links).

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `frontend/src/app/globals.css` | Modify | New color tokens + font variables |
| `frontend/src/app/layout.tsx` | Modify | Load DM Sans + DM Mono via `next/font/google` |
| `frontend/src/components/AuthButton.tsx` | Modify | Dark-navbar-aware styling |
| `frontend/src/components/Navbar.tsx` | Modify | Dark slate redesign |
| `frontend/src/lib/stylePhotos.ts` | Create | Unsplash photo URL map (style name → URL) |
| `frontend/src/components/WizardSplitLayout.tsx` | Create | Split-screen shell used by `/create` and `/generate` |
| `frontend/src/components/WizardLayout.tsx` | Delete | Superseded by WizardSplitLayout |
| `frontend/src/app/page.tsx` | Modify | Landing page full redesign |
| `frontend/src/components/StyleCard.tsx` | Modify | New card design with orange selected state |
| `frontend/src/components/ColorSchemeSelector.tsx` | Modify | Pill chip redesign |
| `frontend/src/components/FrameMaterialSelector.tsx` | Modify | Pill chip redesign |
| `frontend/src/components/RoomContextForm.tsx` | Modify | Pill chips for room type, clean inputs |
| `frontend/src/app/create/page.tsx` | Modify | Use WizardSplitLayout, pass style photo |
| `frontend/src/components/DescriptionCard.tsx` | Modify | Accordion pattern (collapsed by default, expand on click) |
| `frontend/src/app/generate/page.tsx` | Modify | Split-screen, inline loading/auth, accordion cards |
| `frontend/src/components/PieceGallery.tsx` | Modify | Horizontal strip + fixed detail panel |
| `frontend/src/app/wall/[id]/page.tsx` | Modify | Full-bleed dark layout |

---

## Baseline

- [ ] **Confirm tests pass before touching anything**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/backend" && npm test
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run build
```

Both must pass. If not, stop and surface the failure.

---

## Task 1: Design System — globals.css + layout.tsx

**Files:**
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: Replace globals.css**

```css
@import "tailwindcss";

@theme inline {
  --color-primary: #E55722;
  --color-primary-hover: #CC4A1A;
  --color-bg: #FAF8F5;
  --color-surface: #FFFFFF;
  --color-dark: #1A2535;
  --color-dark-secondary: #243044;
  --color-text: #1A2535;
  --color-text-muted: #6B7280;
  --color-text-light: #F5F4F2;
  --color-border: #E8E5E0;
  --color-step-inactive: #D1CEC9;
  --font-sans: var(--font-dm-sans), system-ui, sans-serif;
  --font-mono: var(--font-dm-mono), ui-monospace, monospace;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: Replace layout.tsx**

```tsx
import type { Metadata } from 'next';
import { DM_Sans, DM_Mono } from 'next/font/google';
import Navbar from '@/components/Navbar';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GenWallDecor',
  description: 'AI-powered wall decor that matches your style',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body className="antialiased pt-14">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
```

Note: `pt-14` = 56px, matching the new `h-14` navbar height.

- [ ] **Step 3: Verify build passes**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run build
```

Expected: Build succeeds. Pages may look unstyled until Navbar is updated next — that's fine.

- [ ] **Step 4: Commit**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor" && git add frontend/src/app/globals.css frontend/src/app/layout.tsx && git commit -m "design: replace color tokens with orange/slate system, load DM Sans + DM Mono"
```

---

## Task 2: AuthButton — Dark Navbar Styling

**Files:**
- Modify: `frontend/src/components/AuthButton.tsx`

The AuthButton renders inside the dark navbar. All text and border colors need to work on `#1A2535` background.

- [ ] **Step 1: Replace AuthButton.tsx**

```tsx
'use client';

import { useAuth } from '@/lib/useAuth';

export default function AuthButton() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return <div className="h-8 w-20 animate-pulse rounded-lg bg-dark-secondary" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-light/60 truncate max-w-[160px]">
          {user.email}
        </span>
        <button
          onClick={signOut}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium text-text-light/80 hover:border-white/40 hover:text-text-light transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="rounded-lg border border-white/20 px-4 py-1.5 text-sm font-medium text-text-light hover:bg-white/10 transition-colors cursor-pointer"
    >
      Sign in
    </button>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run build
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor" && git add frontend/src/components/AuthButton.tsx && git commit -m "design: update AuthButton for dark navbar"
```

---

## Task 3: Navbar — Dark Slate Redesign

**Files:**
- Modify: `frontend/src/components/Navbar.tsx`

- [ ] **Step 1: Replace Navbar.tsx**

```tsx
'use client';

import Link from 'next/link';
import AuthButton from './AuthButton';
import { useAuth } from '../lib/useAuth';

export default function Navbar() {
  const { user } = useAuth();
  const isAdmin = user?.uid === process.env.NEXT_PUBLIC_ADMIN_UID;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark h-14 flex items-center">
      <div className="w-full flex items-center justify-between px-6 lg:px-10">
        <Link
          href="/"
          className="font-mono text-xs tracking-widest uppercase text-text-light font-medium"
        >
          GenWallDecor
        </Link>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link
              href="/admin/usage"
              className="px-3 py-1.5 text-sm font-medium text-text-light/60 hover:text-text-light transition-colors"
            >
              Admin
            </Link>
          )}
          <Link
            href="/history"
            className="px-3 py-1.5 text-sm font-medium text-text-light/60 hover:text-text-light transition-colors"
          >
            History
          </Link>
          <div className="ml-2">
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run build
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor" && git add frontend/src/components/Navbar.tsx && git commit -m "design: navbar — dark slate with DM Mono logo and ghost links"
```

---

## Task 4: stylePhotos.ts — Source and Map Room Photos

**Files:**
- Create: `frontend/src/lib/stylePhotos.ts`

This task requires sourcing 21 Unsplash photos (20 styles + 1 default). Search Unsplash (unsplash.com) for each style. Use the direct image URL from Unsplash (right-click image → copy image address, then replace size params with `?auto=format&fit=crop&w=1400&q=85`). Choose photos that show styled interior rooms with visible wall space.

- [ ] **Step 1: For each style, search Unsplash and pick a photo URL**

Search queries to use on unsplash.com:
- Default/fallback: "modern living room interior wall art"
- Transitional: "transitional style living room"
- Traditional: "traditional elegant living room"
- Modern: "modern minimalist interior black white"
- Eclectic: "eclectic colorful living room"
- Contemporary: "contemporary sleek interior"
- Minimalist: "minimalist white interior scandinavian"
- Mid Century Modern: "mid century modern living room walnut"
- Bohemian: "bohemian boho living room terracotta"
- Modern Farmhouse: "modern farmhouse interior shiplap"
- Shabby Chic: "shabby chic pastel vintage interior"
- Coastal: "coastal beach house interior blue"
- Hollywood Glam: "glamorous dramatic dark luxurious interior"
- Southwestern: "southwestern desert interior turquoise"
- Rustic: "rustic wood interior natural"
- Industrial: "industrial loft urban interior brick"
- French Country: "french country provincial interior"
- Scandinavian: "scandinavian nordic interior hygge"
- Mediterranean: "mediterranean villa interior terracotta"
- Art Deco: "art deco geometric 1920s interior gold"
- Asian Zen: "zen japanese interior bamboo minimal"

- [ ] **Step 2: Create frontend/src/lib/stylePhotos.ts with real URLs**

Structure (fill in the URL strings found in step 1):

```ts
// Each value is a direct Unsplash image URL with sizing params:
// ?auto=format&fit=crop&w=1400&q=85
export const STYLE_PHOTOS: Record<string, string> = {
  default:               '<URL>',
  Transitional:          '<URL>',
  Traditional:           '<URL>',
  Modern:                '<URL>',
  Eclectic:              '<URL>',
  Contemporary:          '<URL>',
  Minimalist:            '<URL>',
  'Mid Century Modern':  '<URL>',
  Bohemian:              '<URL>',
  'Modern Farmhouse':    '<URL>',
  'Shabby Chic':         '<URL>',
  Coastal:               '<URL>',
  'Hollywood Glam':      '<URL>',
  Southwestern:          '<URL>',
  Rustic:                '<URL>',
  Industrial:            '<URL>',
  'French Country':      '<URL>',
  Scandinavian:          '<URL>',
  Mediterranean:         '<URL>',
  'Art Deco':            '<URL>',
  'Asian Zen':           '<URL>',
};

export function getStylePhoto(styleName: string): string {
  return STYLE_PHOTOS[styleName] ?? STYLE_PHOTOS.default;
}
```

Replace every `<URL>` with a real Unsplash URL found in Step 1.

- [ ] **Step 3: Verify build passes**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run build
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor" && git add frontend/src/lib/stylePhotos.ts && git commit -m "feat: add Unsplash room photo map for creation flow right panel"
```

---

## Task 5: WizardSplitLayout — Split-Screen Shell Component

**Files:**
- Create: `frontend/src/components/WizardSplitLayout.tsx`

This component is the shell for `/create` (steps 1–3) and `/generate` (step "3 of 3" descriptions). It renders a fixed left panel with wizard chrome (step indicator, title, children, nav buttons) and a right panel with a room photo.

- [ ] **Step 1: Create frontend/src/components/WizardSplitLayout.tsx**

```tsx
'use client';

interface WizardSplitLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  photoUrl: string;
  onNext?: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  children: React.ReactNode;
}

export default function WizardSplitLayout({
  step,
  totalSteps,
  title,
  subtitle,
  photoUrl,
  onNext,
  onBack,
  nextDisabled = false,
  nextLabel = 'Next →',
  children,
}: WizardSplitLayoutProps) {
  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
      {/* Left panel — scrollable form area */}
      <div className="w-[42%] flex flex-col bg-surface border-r border-border">
        {/* Scrollable content */}
        <div className="flex flex-col flex-1 px-10 py-8 overflow-y-auto">
          {/* Step indicator */}
          <div className="mb-6">
            <p className="font-mono text-[11px] tracking-widest uppercase text-text-muted mb-2">
              Step {step} of {totalSteps}
            </p>
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                    i < step ? 'bg-primary' : 'bg-step-inactive'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-[22px] font-bold text-text leading-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
          )}

          {/* Form content */}
          <div className="mt-6 flex-1">{children}</div>
        </div>

        {/* Navigation — pinned to bottom */}
        <div className="flex items-center justify-between border-t border-border px-10 py-4 bg-surface">
          {onBack ? (
            <button
              onClick={onBack}
              className="text-sm font-medium text-text-muted hover:text-text transition-colors cursor-pointer"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          {onNext && (
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className="rounded-xl bg-primary hover:bg-primary-hover px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {nextLabel}
            </button>
          )}
        </div>
      </div>

      {/* Right panel — sticky photo */}
      <div
        className="w-[58%] sticky top-14"
        style={{ height: 'calc(100vh - 3.5rem)' }}
      >
        <img
          src={photoUrl}
          alt="Room inspiration"
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run build
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor" && git add frontend/src/components/WizardSplitLayout.tsx && git commit -m "feat: add WizardSplitLayout split-screen shell component"
```

---

## Task 6: Landing Page

**Files:**
- Modify: `frontend/src/app/page.tsx`

Reference: Pencil wireframe node `OR06L`. Structure: dark hero with frosted card → white "How It Works" cards → dark CTA strip.

- [ ] **Step 1: Replace frontend/src/app/page.tsx**

```tsx
import Link from 'next/link';

const HERO_PHOTO = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1800&q=85';

const steps = [
  {
    number: 1,
    title: 'Choose Your Style',
    description: 'Pick from 20 curated decor styles that match your taste and space.',
  },
  {
    number: 2,
    title: 'Review AI Descriptions',
    description: 'AI creates detailed art piece descriptions tailored to your chosen style.',
  },
  {
    number: 3,
    title: 'See Your Wall',
    description: 'Get a full wall visualization with AI-generated artwork ready to order.',
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero — full viewport height */}
      <section
        className="relative flex items-center justify-center"
        style={{
          minHeight: 'calc(100vh - 3.5rem)',
          backgroundImage: `url(${HERO_PHOTO})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 w-full max-w-xl mx-auto px-6 text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-10 py-12 border border-white/20">
            <p className="font-mono text-[11px] tracking-widest uppercase text-white/60 mb-5">
              GenWallDecor
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.1] mb-5">
              Design Your<br />Perfect Wall
            </h1>
            <p className="text-base text-white/75 mb-8 leading-relaxed">
              AI-powered wall decor that matches your style.
            </p>
            <Link
              href="/create"
              className="inline-block rounded-xl bg-primary hover:bg-primary-hover px-8 py-3.5 text-sm font-semibold text-white transition-colors"
            >
              Start Creating
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="font-mono text-[11px] tracking-widest uppercase text-text-muted mb-3">
            How It Works
          </p>
          <h2 className="text-3xl font-bold text-text mb-14">
            Three steps to your perfect wall
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl bg-bg p-8 text-left shadow-sm"
              >
                <p className="font-mono text-[11px] tracking-widest uppercase text-primary mb-3">
                  Step {step.number}
                </p>
                <h3 className="text-base font-semibold text-text mb-2">{step.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA strip */}
      <section className="bg-dark py-16 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-text-light mb-1">
              Ready to transform your space?
            </h2>
            <p className="text-sm text-text-light/50">
              It only takes a few minutes to create something beautiful.
            </p>
          </div>
          <Link
            href="/create"
            className="shrink-0 rounded-xl bg-primary hover:bg-primary-hover px-8 py-3.5 text-sm font-semibold text-white transition-colors"
          >
            Get Started →
          </Link>
        </div>
      </section>
    </main>
  );
}
```

Note: The hero photo URL `photo-1586023492125-27b2c045efd7` is a well-known Unsplash interior shot. If it doesn't load, replace with the `STYLE_PHOTOS.default` URL from stylePhotos.ts.

- [ ] **Step 2: Verify build passes**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run build
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor" && git add frontend/src/app/page.tsx && git commit -m "design: landing page — dark hero, How It Works cards, dark CTA strip"
```

---

## Task 7: StyleCard Redesign

**Files:**
- Modify: `frontend/src/components/StyleCard.tsx`

- [ ] **Step 1: Replace StyleCard.tsx**

```tsx
import { DecorStyle } from '@/lib/styles';

interface StyleCardProps {
  style: DecorStyle;
  selected: boolean;
  onSelect: () => void;
}

export default function StyleCard({ style, selected, onSelect }: StyleCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`relative w-full text-left rounded-xl border p-4 transition-all cursor-pointer ${
        selected
          ? 'border-primary bg-orange-50'
          : 'border-border bg-white hover:border-text-muted hover:shadow-sm'
      }`}
    >
      {selected && (
        <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
      <p className="pr-6 text-sm font-semibold text-text">{style.name}</p>
      <p className="mt-0.5 text-xs text-text-muted">{style.description}</p>
    </button>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run build
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor" && git add frontend/src/components/StyleCard.tsx && git commit -m "design: StyleCard — border/orange selected state with checkmark"
```

---

## Task 8: ColorSchemeSelector + FrameMaterialSelector — Pill Redesign

**Files:**
- Modify: `frontend/src/components/ColorSchemeSelector.tsx`
- Modify: `frontend/src/components/FrameMaterialSelector.tsx`

- [ ] **Step 1: Replace ColorSchemeSelector.tsx**

```tsx
'use client';

const PRESET_COLORS = [
  'white', 'off-white', 'cream', 'beige', 'light gray', 'charcoal', 'black',
  'blush pink', 'burgundy', 'red accent', 'coral',
  'butter yellow', 'mustard', 'gold',
  'sage', 'olive', 'forest green', 'emerald', 'teal',
  'soft blue', 'ocean blue', 'cobalt blue', 'navy',
  'lavender', 'deep purple',
  'terracotta', 'burnt orange', 'rust',
  'sand', 'brown', 'warm earth tones', 'natural wood tones',
  'jewel tones',
];

interface ColorSchemeSelectorProps {
  selected: string[];
  onChange: (colors: string[]) => void;
}

export default function ColorSchemeSelector({ selected, onChange }: ColorSchemeSelectorProps) {
  const toggle = (color: string) => {
    if (selected.includes(color)) {
      onChange(selected.filter((c) => c !== color));
    } else {
      onChange([...selected, color]);
    }
  };

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-text">
        Color palette
        <span className="ml-1.5 text-xs text-text-muted font-normal">
          ({selected.length} selected)
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => toggle(color)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selected.includes(color)
                ? 'bg-primary text-white'
                : 'bg-bg border border-border text-text-muted hover:border-text-muted hover:text-text'
            }`}
          >
            {color}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace FrameMaterialSelector.tsx**

```tsx
'use client';

import { FRAME_MATERIALS } from '@/lib/styles';

interface FrameMaterialSelectorProps {
  selected: string;
  onChange: (material: string) => void;
}

export default function FrameMaterialSelector({ selected, onChange }: FrameMaterialSelectorProps) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-text">Frame material</p>
      <div className="flex flex-wrap gap-2">
        {FRAME_MATERIALS.map((material) => (
          <button
            key={material}
            onClick={() => onChange(material)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selected === material
                ? 'bg-primary text-white'
                : 'bg-bg border border-border text-text-muted hover:border-text-muted hover:text-text'
            }`}
          >
            {material}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build passes**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run build
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor" && git add frontend/src/components/ColorSchemeSelector.tsx frontend/src/components/FrameMaterialSelector.tsx && git commit -m "design: color + frame selectors — pill chip pattern"
```

---

## Task 9: RoomContextForm — Pill Chips + Clean Inputs

**Files:**
- Modify: `frontend/src/components/RoomContextForm.tsx`

Replace the `<select>` with pill chips (matching the style of ColorSchemeSelector), keep dimension inputs but restyle them.

- [ ] **Step 1: Replace RoomContextForm.tsx**

```tsx
'use client';

import { ROOM_TYPES } from '@/lib/styles';

interface RoomContextFormProps {
  roomType: string;
  wallWidth?: number;
  wallHeight?: number;
  onRoomTypeChange: (roomType: string) => void;
  onDimensionsChange: (width?: number, height?: number) => void;
}

export default function RoomContextForm({
  roomType,
  wallWidth,
  wallHeight,
  onRoomTypeChange,
  onDimensionsChange,
}: RoomContextFormProps) {
  return (
    <div className="space-y-8">
      {/* Room type */}
      <div>
        <p className="mb-3 text-sm font-medium text-text">Room type</p>
        <div className="flex flex-wrap gap-2">
          {ROOM_TYPES.map((room) => (
            <button
              key={room}
              onClick={() => onRoomTypeChange(room)}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                roomType === room
                  ? 'bg-primary text-white'
                  : 'bg-bg border border-border text-text-muted hover:border-text-muted hover:text-text'
              }`}
            >
              {room}
            </button>
          ))}
        </div>
      </div>

      {/* Wall dimensions */}
      <div>
        <p className="mb-1 text-sm font-medium text-text">
          Wall dimensions
          <span className="ml-1.5 text-xs text-text-muted font-normal">(optional, in feet)</span>
        </p>
        <div className="flex gap-4 mt-3">
          <div className="flex-1">
            <label htmlFor="wall-width" className="mb-1 block text-xs text-text-muted">
              Width
            </label>
            <input
              id="wall-width"
              type="number"
              min={1}
              max={50}
              value={wallWidth ?? ''}
              onChange={(e) =>
                onDimensionsChange(
                  e.target.value ? Number(e.target.value) : undefined,
                  wallHeight,
                )
              }
              placeholder="e.g. 12"
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="wall-height" className="mb-1 block text-xs text-text-muted">
              Height
            </label>
            <input
              id="wall-height"
              type="number"
              min={1}
              max={50}
              value={wallHeight ?? ''}
              onChange={(e) =>
                onDimensionsChange(
                  wallWidth,
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              placeholder="e.g. 9"
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run build
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor" && git add frontend/src/components/RoomContextForm.tsx && git commit -m "design: RoomContextForm — pill chips for room type, clean dimension inputs"
```

---

## Task 10: Wire create/page.tsx — Use WizardSplitLayout

**Files:**
- Modify: `frontend/src/app/create/page.tsx`
- Delete: `frontend/src/components/WizardLayout.tsx`

- [ ] **Step 1: Replace create/page.tsx**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCreationWizard } from '@/lib/useCreationWizard';
import { DECOR_STYLES } from '@/lib/styles';
import { getStylePhoto } from '@/lib/stylePhotos';
import WizardSplitLayout from '@/components/WizardSplitLayout';
import StyleCard from '@/components/StyleCard';
import ColorSchemeSelector from '@/components/ColorSchemeSelector';
import FrameMaterialSelector from '@/components/FrameMaterialSelector';
import RoomContextForm from '@/components/RoomContextForm';

const STEP_TITLES = ['Choose Your Style', 'Visual Preferences', 'Your Room'];
const STEP_SUBTITLES = [
  'Pick a look that matches your space.',
  'Set the color palette and frame style.',
  'Tell us about the room.',
];

export default function CreatePage() {
  const router = useRouter();
  const {
    state,
    setStyle,
    setColorScheme,
    setFrameMaterial,
    setRoomType,
    setDimensions,
    nextStep,
    prevStep,
  } = useCreationWizard();

  const handleNext = () => {
    if (state.step === 3) {
      const params = new URLSearchParams({
        style: state.style,
        colors: state.colorScheme.join(','),
        frame: state.frameMaterial,
        room: state.roomType,
        ...(state.wallWidth ? { w: String(state.wallWidth) } : {}),
        ...(state.wallHeight ? { h: String(state.wallHeight) } : {}),
      });
      router.push(`/generate?${params.toString()}`);
      return;
    }

    if (state.step === 1) {
      const selected = DECOR_STYLES.find((s) => s.name === state.style);
      if (selected && state.colorScheme.length === 0) {
        setColorScheme(selected.defaultColorScheme);
        setFrameMaterial(selected.defaultFrameMaterial);
      }
    }

    nextStep();
  };

  const isNextDisabled = () => {
    switch (state.step) {
      case 1: return !state.style;
      case 2: return state.colorScheme.length === 0 || !state.frameMaterial;
      case 3: return !state.roomType;
      default: return false;
    }
  };

  const photoUrl = getStylePhoto(state.style);

  return (
    <WizardSplitLayout
      step={state.step}
      totalSteps={3}
      title={STEP_TITLES[state.step - 1]}
      subtitle={STEP_SUBTITLES[state.step - 1]}
      photoUrl={photoUrl}
      onNext={handleNext}
      onBack={state.step > 1 ? prevStep : undefined}
      nextDisabled={isNextDisabled()}
      nextLabel={state.step === 3 ? 'Generate →' : 'Next →'}
    >
      {state.step === 1 && (
        <div className="grid grid-cols-2 gap-3">
          {DECOR_STYLES.map((style) => (
            <StyleCard
              key={style.name}
              style={style}
              selected={state.style === style.name}
              onSelect={() => setStyle(style.name)}
            />
          ))}
        </div>
      )}

      {state.step === 2 && (
        <div className="space-y-8">
          <ColorSchemeSelector
            selected={state.colorScheme}
            onChange={setColorScheme}
          />
          <FrameMaterialSelector
            selected={state.frameMaterial}
            onChange={setFrameMaterial}
          />
        </div>
      )}

      {state.step === 3 && (
        <RoomContextForm
          roomType={state.roomType}
          wallWidth={state.wallWidth}
          wallHeight={state.wallHeight}
          onRoomTypeChange={setRoomType}
          onDimensionsChange={setDimensions}
        />
      )}
    </WizardSplitLayout>
  );
}
```

- [ ] **Step 2: Delete WizardLayout.tsx**

```bash
rm "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend/src/components/WizardLayout.tsx"
```

- [ ] **Step 3: Verify build passes**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run build
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor" && git add -A frontend/src/app/create/ frontend/src/components/WizardLayout.tsx && git commit -m "design: create flow — split-screen layout with style-matched room photo"
```

---

## Task 11: DescriptionCard — Accordion Pattern

**Files:**
- Modify: `frontend/src/components/DescriptionCard.tsx`

Accordion behavior: collapsed by default (shows title + one-line description + metadata chips), expands to show editable fields inline. The parent (`generate/page.tsx`) controls which card is expanded — so this component needs an `isExpanded` prop and an `onExpand` callback.

**Interface change:** Add `isExpanded: boolean` and `onExpand: () => void` props. The generate page will track which index is expanded and pass these down.

- [ ] **Step 1: Replace DescriptionCard.tsx**

```tsx
'use client';

import { useState } from 'react';

export interface PieceDescription {
  title: string;
  description: string;
  medium: string;
  dimensions: string;
  placement: string;
}

interface DescriptionCardProps {
  piece: PieceDescription;
  index: number;
  isExpanded: boolean;
  onExpand: () => void;
  onUpdate: (updated: PieceDescription) => void;
}

export default function DescriptionCard({
  piece,
  index,
  isExpanded,
  onExpand,
  onUpdate,
}: DescriptionCardProps) {
  const [draft, setDraft] = useState(piece);

  // When parent regenerates descriptions, sync the local draft (but not while user is editing)
  useEffect(() => {
    if (!isExpanded) {
      setDraft(piece);
    }
  }, [piece]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    onUpdate(draft);
    onExpand(); // toggles off — collapses the card
  };

  const handleCancel = () => {
    setDraft(piece);
    onExpand(); // toggles off — collapses the card
  };

  return (
    <div
      className={`rounded-xl border bg-white transition-all ${
        isExpanded ? 'border-primary shadow-sm' : 'border-border'
      }`}
    >
      {/* Header — always visible, click to expand */}
      <button
        onClick={onExpand}
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] tracking-widest uppercase text-primary mb-0.5">
            Piece {index + 1}
          </p>
          <p className="text-sm font-semibold text-text truncate">{piece.title}</p>
          {!isExpanded && (
            <p className="text-xs text-text-muted mt-0.5 truncate">{piece.description}</p>
          )}
        </div>
        <svg
          className={`ml-3 shrink-0 h-4 w-4 text-text-muted transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-border">
          <div className="pt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Title</label>
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Description</label>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Medium</label>
                <input
                  value={draft.medium}
                  onChange={(e) => setDraft({ ...draft, medium: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Dimensions</label>
                <input
                  value={draft.dimensions}
                  onChange={(e) => setDraft({ ...draft, dimensions: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Placement</label>
                <input
                  value={draft.placement}
                  onChange={(e) => setDraft({ ...draft, placement: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="cursor-pointer rounded-lg px-4 py-1.5 text-sm text-text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="cursor-pointer rounded-lg bg-primary hover:bg-primary-hover px-4 py-1.5 text-sm font-medium text-white transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Metadata chips — only when collapsed */}
      {!isExpanded && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-4">
          {piece.medium && (
            <span className="rounded-full bg-bg border border-border px-2.5 py-0.5 text-[11px] text-text-muted">
              {piece.medium}
            </span>
          )}
          {piece.dimensions && (
            <span className="rounded-full bg-bg border border-border px-2.5 py-0.5 text-[11px] text-text-muted">
              {piece.dimensions}
            </span>
          )}
          {piece.placement && (
            <span className="rounded-full bg-bg border border-border px-2.5 py-0.5 text-[11px] text-text-muted">
              {piece.placement}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run build
```

Expected: Build may fail because generate/page.tsx hasn't been updated yet to pass `isExpanded` and `onExpand`. If so, proceed immediately to Task 12 and fix in that task.

- [ ] **Step 3: Commit**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor" && git add frontend/src/components/DescriptionCard.tsx && git commit -m "design: DescriptionCard — accordion with expand/collapse and inline edit"
```

---

## Task 12: Generate Page — Split-Screen + Accordion

**Files:**
- Modify: `frontend/src/app/generate/page.tsx`

Uses `WizardSplitLayout` as the shell. Tracking `expandedIndex` state for the accordion. Loading and auth states are shown inline in the left panel (not full-screen).

- [ ] **Step 1: Replace generate/page.tsx**

```tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import { getStylePhoto } from '@/lib/stylePhotos';
import WizardSplitLayout from '@/components/WizardSplitLayout';
import DescriptionCard, { PieceDescription } from '@/components/DescriptionCard';

function GenerateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading, signIn } = useAuth();

  const [descriptions, setDescriptions] = useState<PieceDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const preferences = {
    style: searchParams.get('style') || '',
    colorScheme: searchParams.get('colors')?.split(',').filter(Boolean) || [],
    frameMaterial: searchParams.get('frame') || '',
    roomType: searchParams.get('room') || '',
    ...(searchParams.get('w') && searchParams.get('h')
      ? { wallDimensions: { width: Number(searchParams.get('w')), height: Number(searchParams.get('h')) } }
      : {}),
  };

  const photoUrl = getStylePhoto(preferences.style);

  const fetchDescriptions = useCallback(async (feedbackText?: string, previousDescriptions?: PieceDescription[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.generateDescriptions(preferences, feedbackText, previousDescriptions);
      setDescriptions(result.descriptions);
      setExpandedIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate descriptions');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  useEffect(() => {
    if (!user) return;
    const initialFeedback = searchParams.get('feedback') || undefined;
    fetchDescriptions(initialFeedback);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDescriptions, user]);

  const handleRegenerate = async () => {
    await fetchDescriptions(feedback, descriptions);
    setFeedback('');
  };

  const handleUpdateDescription = (index: number, updated: PieceDescription) => {
    setDescriptions((prev) => prev.map((d, i) => (i === index ? updated : d)));
  };

  async function handleRegeneratePiece(pieceIndex: number) {
    if (!generationId) return;
    setRegeneratingIndex(pieceIndex);
    try {
      await api.regeneratePiece(generationId, pieceIndex, descriptions[pieceIndex].description);
    } catch (err) {
      console.error('Regenerate piece failed:', err);
    } finally {
      setRegeneratingIndex(null);
    }
  }

  const handleGenerateImages = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await api.generateImages(preferences, descriptions);
      router.push(`/wall/${result.generationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate images');
      setGenerating(false);
    }
  };

  const toggleExpanded = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  // Left panel content rendered as children of WizardSplitLayout
  const leftContent = (() => {
    if (authLoading) {
      return (
        <div className="flex items-center gap-3 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          <span className="text-sm text-text-muted">Loading…</span>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="py-8">
          <p className="text-sm text-text-muted mb-4">Sign in to generate your wall decor.</p>
          <button
            onClick={signIn}
            className="rounded-xl bg-primary hover:bg-primary-hover px-6 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            Sign in with Google
          </button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex items-center gap-3 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          <span className="text-sm text-text-muted">Generating descriptions…</span>
        </div>
      );
    }

    return (
      <>
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Accordion */}
        <div className="space-y-3">
          {descriptions.map((desc, i) => (
            <DescriptionCard
              key={i}
              piece={desc}
              index={i}
              isExpanded={expandedIndex === i}
              onExpand={() => toggleExpanded(i)}
              onUpdate={(updated) => handleUpdateDescription(i, updated)}
            />
          ))}
        </div>

        {/* Feedback */}
        <div className="mt-6 rounded-xl border border-border bg-bg p-4">
          <p className="text-xs font-medium text-text-muted mb-2">Want something different?</p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g., Make them more colorful, add abstract pieces…"
            rows={2}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none resize-none"
          />
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="mt-2 cursor-pointer rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-text-muted hover:text-text hover:border-text-muted transition-colors disabled:opacity-40"
          >
            Regenerate All
          </button>
        </div>
      </>
    );
  })();

  const canGenerate = !generating && descriptions.length > 0 && !!user && !loading;

  return (
    <WizardSplitLayout
      step={3}
      totalSteps={3}
      title="Here's what we'll make"
      subtitle={preferences.style ? `Style: ${preferences.style}` : undefined}
      photoUrl={photoUrl}
      onNext={canGenerate ? handleGenerateImages : undefined}
      onBack={() => router.back()}
      nextDisabled={!canGenerate}
      nextLabel={generating ? 'Generating…' : 'Generate Images →'}
    >
      {leftContent}
    </WizardSplitLayout>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    }>
      <GenerateContent />
    </Suspense>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run build
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor" && git add frontend/src/app/generate/page.tsx && git commit -m "design: generate page — split-screen accordion descriptions, inline auth/loading"
```

---

## Task 13: PieceGallery — Horizontal Strip + Redesigned Detail Panel

**Files:**
- Modify: `frontend/src/components/PieceGallery.tsx`

Changes: thumbnail grid → horizontal scroll strip. Detail panel: keeps all existing logic (download, shopping links), restyled for the dark wall page.

- [ ] **Step 1: Replace PieceGallery.tsx**

```tsx
'use client';

import { useState } from 'react';
import { api } from '../lib/api';

interface PieceLinks {
  frameUrl: string | null;
  printUrl: string | null;
  objectUrl: string | null;
  mountingUrls: { name: string; url: string }[];
}

interface Piece {
  title: string;
  imageUrl: string;
  description?: string;
  medium?: string;
  dimensions?: string;
  placement?: string;
  type?: 'poster' | 'object';
  links?: PieceLinks;
  position?: { x: number; y: number };
}

interface PieceGalleryProps {
  pieces: Piece[];
  generationId: string;
  selectedPieces?: Set<number>;
  onToggleSelect?: (index: number) => void;
  currentVersionIndexes?: number[];
  pieceVersions?: string[][];
  onNavigateVersion?: (pieceIndex: number, delta: number) => void;
}

export default function PieceGallery({
  pieces,
  generationId,
  selectedPieces,
  onToggleSelect,
  currentVersionIndexes,
  pieceVersions,
  onNavigateVersion,
}: PieceGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = pieces[activeIndex];

  const handleDownload = async () => {
    try {
      const { url } = await api.getPieceDownloadUrl(generationId, activeIndex);
      const res = await fetch(url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `${active.title}.png`;
      a.click();
      URL.revokeObjectURL(objUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  function resolveImageUrl(piece: Piece, i: number): string {
    const versions = pieceVersions?.[i];
    if (!versions || versions.length === 0) return piece.imageUrl;
    const versionIdx = currentVersionIndexes?.[i] ?? versions.length - 1;
    return versions[versionIdx] ?? piece.imageUrl;
  }

  return (
    <div className="flex gap-6 items-start">
      {/* Horizontal scroll strip */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 pb-3" style={{ minWidth: 'max-content' }}>
          {pieces.map((piece, i) => {
            const isChecked = selectedPieces?.has(i) ?? false;
            const versions = pieceVersions?.[i];
            const hasMultipleVersions = versions && versions.length > 1;
            const versionIdx = currentVersionIndexes?.[i] ?? 0;
            const displayUrl = resolveImageUrl(piece, i);

            return (
              <div key={`${piece.title}-${i}`} className="relative shrink-0 w-40">
                <button
                  onClick={() => setActiveIndex(i)}
                  className={`w-full rounded-xl overflow-hidden border-2 text-left transition-colors ${
                    i === activeIndex ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={displayUrl}
                    alt={piece.title}
                    className="w-40 h-40 object-cover"
                  />
                </button>
                <p className="mt-1.5 text-xs text-text-light/60 truncate text-center">
                  {piece.title}
                </p>

                {/* Selection checkbox */}
                {onToggleSelect && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(i); }}
                    aria-label={isChecked ? `Deselect ${piece.title}` : `Select ${piece.title}`}
                    className={`absolute top-1.5 left-1.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-primary border-primary text-white'
                        : 'bg-dark/60 border-white/40 hover:border-white'
                    }`}
                  >
                    {isChecked && (
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                )}

                {/* Version navigation */}
                {hasMultipleVersions && onNavigateVersion && (
                  <div className="absolute bottom-8 left-0 right-0 flex justify-between px-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigateVersion(i, -1); }}
                      disabled={versionIdx === 0}
                      aria-label="Previous version"
                      className="w-6 h-6 rounded-full bg-dark/70 flex items-center justify-center text-white disabled:opacity-30 hover:bg-dark transition-colors"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M7.5 2L4 6l3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <span className="text-[10px] bg-dark/70 rounded px-1 self-center text-white/70">
                      {versionIdx + 1}/{versions.length}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigateVersion(i, 1); }}
                      disabled={versionIdx === versions.length - 1}
                      aria-label="Next version"
                      className="w-6 h-6 rounded-full bg-dark/70 flex items-center justify-center text-white disabled:opacity-30 hover:bg-dark transition-colors"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M4.5 2L8 6l-3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="w-72 lg:w-80 shrink-0 rounded-2xl bg-dark-secondary p-5 text-text-light">
        <p className="font-mono text-[10px] tracking-widest uppercase text-text-light/40 mb-2">
          Details
        </p>
        <h4 className="font-bold text-text-light text-base">{active.title}</h4>

        {active.description && (
          <p className="mt-3 text-sm text-text-light/60 leading-relaxed">{active.description}</p>
        )}

        {(active.medium || active.dimensions || active.placement) && (
          <div className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-xs text-text-light/50">
            {active.medium && (
              <p><span className="font-medium text-text-light/70">Medium:</span> {active.medium}</p>
            )}
            {active.dimensions && (
              <p><span className="font-medium text-text-light/70">Dimensions:</span> {active.dimensions}</p>
            )}
            {active.placement && (
              <p><span className="font-medium text-text-light/70">Placement:</span> {active.placement}</p>
            )}
          </div>
        )}

        {/* Shopping links */}
        {active.type === 'poster' && (
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <p className="font-mono text-[10px] tracking-widest uppercase text-text-light/40 mb-2">
              Get This Piece
            </p>
            {active.links?.frameUrl && (
              <a href={active.links.frameUrl} target="_blank" rel="noopener noreferrer"
                className="block text-sm text-primary hover:text-primary-hover transition-colors">
                Buy a frame — {active.dimensions}
              </a>
            )}
            {active.links?.printUrl && (
              <a href={active.links.printUrl} target="_blank" rel="noopener noreferrer"
                className="block text-sm text-primary hover:text-primary-hover transition-colors">
                Print this poster ({active.dimensions})
              </a>
            )}
            <button onClick={handleDownload}
              className="block text-sm text-primary hover:text-primary-hover transition-colors text-left cursor-pointer">
              Download artwork (frameless)
            </button>
          </div>
        )}

        {active.type === 'object' && (
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <p className="font-mono text-[10px] tracking-widest uppercase text-text-light/40 mb-2">
              Get This Piece
            </p>
            {active.links?.objectUrl && (
              <a href={active.links.objectUrl} target="_blank" rel="noopener noreferrer"
                className="block text-sm text-primary hover:text-primary-hover transition-colors">
                Buy this piece — {active.title}
              </a>
            )}
            {active.links?.mountingUrls.map(m => (
              <a key={m.name} href={m.url} target="_blank" rel="noopener noreferrer"
                className="block text-sm text-primary hover:text-primary-hover transition-colors">
                Buy a {m.name}
              </a>
            ))}
          </div>
        )}

        {!active.type && (
          <button onClick={handleDownload}
            className="mt-5 w-full rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2 text-sm font-medium text-text-light transition-colors cursor-pointer">
            Download for print
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run build
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor" && git add frontend/src/components/PieceGallery.tsx && git commit -m "design: PieceGallery — horizontal scroll strip, dark detail panel"
```

---

## Task 14: Wall Result Page — Full-Bleed Dark Redesign

**Files:**
- Modify: `frontend/src/app/wall/[id]/page.tsx`

Full-bleed dark layout. Zone 1: hero wall render with dot overlay + controls bar. Zone 2: PieceGallery (horizontal strip + detail panel). Bottom: retry section. The existing logic (regenerate, version nav, finalize, retry) is unchanged — only the visual treatment changes.

- [ ] **Step 1: Replace wall/[id]/page.tsx**

```tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import PieceGallery from '@/components/PieceGallery';

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
  wallRenderVersions?: string[];
  pieces: {
    title: string;
    imageUrl: string;
    description?: string;
    medium?: string;
    dimensions?: string;
    placement?: string;
    type?: 'poster' | 'object';
    position?: { x: number; y: number };
    links?: {
      frameUrl: string | null;
      printUrl: string | null;
      objectUrl: string | null;
      mountingUrls: { name: string; url: string }[];
    };
  }[];
  pieceVersions?: string[][];
  finalizedAt?: string;
  createdAt: string;
}

export default function WallViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<GenerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [openDotIndex, setOpenDotIndex] = useState<number | null>(null);
  const [selectedPieces, setSelectedPieces] = useState<Set<number>>(new Set());
  const [currentVersionIndexes, setCurrentVersionIndexes] = useState<number[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isUpdatingWallRender, setIsUpdatingWallRender] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [pieceRegenerationCount, setPieceRegenerationCount] = useState(0);

  useEffect(() => {
    async function fetchGeneration() {
      try {
        const result = await api.getGeneration(id);
        setData(result);
        setCurrentVersionIndexes(
          result.pieces.map((_: any, i: number) => {
            const versions = result.pieceVersions?.[i];
            return versions ? versions.length - 1 : 0;
          })
        );
        if (result.finalizedAt) setIsFinalized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load generation');
      } finally {
        setLoading(false);
      }
    }
    fetchGeneration();
  }, [id]);

  useEffect(() => {
    function handleClick() {
      if (openDotIndex !== null) setOpenDotIndex(null);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [openDotIndex]);

  function togglePieceSelection(index: number) {
    setSelectedPieces(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function navigateVersion(pieceIndex: number, delta: number) {
    setCurrentVersionIndexes(prev => {
      const next = [...prev];
      const versions = data?.pieceVersions?.[pieceIndex];
      if (!versions) return next;
      next[pieceIndex] = Math.max(0, Math.min(versions.length - 1, next[pieceIndex] + delta));
      return next;
    });
  }

  async function handleRegenerateSelected() {
    if (selectedPieces.size === 0 || !data) return;
    setIsRegenerating(true);
    try {
      const pieces = Array.from(selectedPieces).map(i => ({
        pieceIndex: i,
        description: data.pieces[i].description ?? '',
      }));
      const result = await api.regeneratePieces(id, pieces);
      setData(prev => prev ? { ...prev, pieceVersions: result.pieceVersions } : prev);
      setPieceRegenerationCount(result.pieceRegenerationCount);
      setCurrentVersionIndexes(prev => {
        const next = [...prev];
        for (const i of selectedPieces) {
          next[i] = result.pieceVersions[i].length - 1;
        }
        return next;
      });
      setSelectedPieces(new Set());
    } catch (err) {
      console.error('Regenerate failed:', err);
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleUpdateWallRender() {
    if (!data) return;
    setIsUpdatingWallRender(true);
    try {
      const pieceImageRefs = (data.pieceVersions ?? []).map(
        (versions: string[], i: number) => versions[currentVersionIndexes[i]] ?? versions[versions.length - 1]
      );
      const result = await api.regenerateWallRender(id, pieceImageRefs);
      setData(prev => prev ? { ...prev, wallRenderVersions: result.wallRenderVersions } : prev);
    } catch (err) {
      console.error('Wall render update failed:', err);
    } finally {
      setIsUpdatingWallRender(false);
    }
  }

  async function handleFinalize() {
    if (!data) return;
    try {
      await api.finalizeGeneration(id);
      setIsFinalized(true);
    } catch (err) {
      console.error('Finalize failed:', err);
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-secondary border-t-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-text-light/60 text-sm">{error || 'Generation not found'}</p>
      </div>
    );
  }

  const wallRenderSrc =
    data.wallRenderVersions && data.wallRenderVersions.length > 0
      ? data.wallRenderVersions[data.wallRenderVersions.length - 1]
      : data.wallRenderUrl;

  return (
    <div className="min-h-screen bg-dark pb-16">
      {/* Zone 1: Hero wall render */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {/* Title */}
        <p className="font-mono text-[11px] tracking-widest uppercase text-text-light/40 mb-2">
          Your Wall
        </p>
        <h1 className="text-2xl font-bold text-text-light mb-6">{data.style}</h1>

        {/* Wall render */}
        <div className="relative rounded-2xl overflow-hidden">
          <img
            src={wallRenderSrc}
            alt={`${data.style} wall render`}
            className="w-full object-cover max-h-[520px]"
          />

          {/* Interactive piece dots */}
          {data.pieces.map((piece, i) => {
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
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenDotIndex(isOpen ? null : i); }}
                  className="w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-md transition-transform hover:scale-125 focus:outline-none"
                  aria-label={`View links for ${piece.title}`}
                />
                {isOpen && (
                  <div
                    className="absolute z-10 bg-white rounded-xl shadow-lg p-4 w-52 text-sm"
                    style={{ top: '1.5rem', left: '50%', transform: 'translateX(-50%)' }}
                  >
                    <p className="font-semibold text-text mb-3">{piece.title}</p>
                    {piece.type === 'poster' && (
                      <>
                        {piece.links?.frameUrl && (
                          <a href={piece.links.frameUrl} target="_blank" rel="noopener noreferrer"
                            className="block text-primary hover:text-primary-hover transition-colors mb-1.5 text-sm">
                            Buy a frame
                          </a>
                        )}
                        {piece.links?.printUrl && (
                          <a href={piece.links.printUrl} target="_blank" rel="noopener noreferrer"
                            className="block text-primary hover:text-primary-hover transition-colors text-sm">
                            Print this poster
                          </a>
                        )}
                      </>
                    )}
                    {piece.type === 'object' && (
                      <>
                        {piece.links?.objectUrl && (
                          <a href={piece.links.objectUrl} target="_blank" rel="noopener noreferrer"
                            className="block text-primary hover:text-primary-hover transition-colors mb-1.5 text-sm">
                            Buy this piece
                          </a>
                        )}
                        {piece.links?.mountingUrls.map(m => (
                          <a key={m.name} href={m.url} target="_blank" rel="noopener noreferrer"
                            className="block text-primary hover:text-primary-hover transition-colors text-sm">
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

        {/* Controls bar */}
        {!isFinalized ? (
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={handleRegenerateSelected}
              disabled={selectedPieces.size === 0 || isRegenerating}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-text-light hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isRegenerating ? 'Regenerating…' : `Regenerate Selected${selectedPieces.size > 0 ? ` (${selectedPieces.size})` : ''}`}
            </button>
            <button
              onClick={handleUpdateWallRender}
              disabled={isUpdatingWallRender}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-text-light hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUpdatingWallRender ? 'Updating…' : 'Update Wall Render'}
            </button>
            <button
              onClick={handleFinalize}
              className="rounded-xl bg-primary hover:bg-primary-hover px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              Finalize Wall
            </button>
            {pieceRegenerationCount > 0 && (
              <span className="text-xs text-text-light/40 ml-auto">
                {pieceRegenerationCount} regenerations used
              </span>
            )}
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-medium text-green-400">✓ Wall finalized</span>
          </div>
        )}
      </div>

      {/* Zone 2: Pieces strip + detail panel */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
        <p className="font-mono text-[11px] tracking-widest uppercase text-text-light/40 mb-4">
          Individual Pieces
        </p>
        <PieceGallery
          pieces={data.pieces}
          generationId={id}
          selectedPieces={selectedPieces}
          onToggleSelect={isFinalized ? undefined : togglePieceSelection}
          currentVersionIndexes={currentVersionIndexes}
          pieceVersions={data.pieceVersions}
          onNavigateVersion={navigateVersion}
        />
      </div>

      {/* Retry section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-12 text-center">
        {!showFeedback ? (
          <button
            onClick={() => setShowFeedback(true)}
            className="rounded-xl border border-white/20 px-6 py-2.5 text-sm font-medium text-text-light/60 hover:text-text-light hover:border-white/40 transition-colors cursor-pointer"
          >
            Not happy? Start over with changes
          </button>
        ) : (
          <div className="mx-auto max-w-lg rounded-2xl bg-dark-secondary p-6 text-left">
            <p className="text-sm font-medium text-text-light mb-3">What would you change?</p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., More vibrant colors, larger centerpiece…"
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-dark px-4 py-2.5 text-sm text-text-light placeholder:text-text-light/30 focus:border-primary focus:outline-none resize-none"
            />
            <div className="mt-3 flex gap-2 justify-end">
              <button
                onClick={() => setShowFeedback(false)}
                className="rounded-lg px-4 py-2 text-sm text-text-light/50 hover:text-text-light transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRetry}
                className="rounded-xl bg-primary hover:bg-primary-hover px-5 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run build
```

- [ ] **Step 3: Run backend tests to confirm nothing broke**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/backend" && npm test
```

Expected: all 97 tests still passing.

- [ ] **Step 4: Commit**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor" && git add frontend/src/app/wall/ && git commit -m "design: wall result page — full-bleed dark layout, horizontal piece strip, redesigned controls"
```

---

## Task 15: Visual Review + Final Cleanup

- [ ] **Step 1: Start dev server and review all pages**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run dev
```

Visit in order:
1. `http://localhost:3000` — landing page: dark hero, How It Works, dark CTA strip
2. `http://localhost:3000/create` — split-screen, style cards, room photo on right
3. Select a style, proceed through steps 2 and 3
4. `http://localhost:3000/generate?style=Modern&colors=black,white&frame=Black Metal&room=Living Room` — split-screen accordion

Look for: text colors rendering correctly (no invisible text), photo loading, layout not breaking at normal viewport sizes.

- [ ] **Step 2: Fix any visual issues surfaced during review**

Common issues to check:
- Text using old token names (e.g., `text-text-darker`, `bg-secondary`) — grep and replace
- Tailwind classes for new tokens not resolving — ensure `@theme inline` variables match exactly
- Right panel photo not displaying — verify URL is accessible

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend"
grep -r "text-text-darker\|bg-secondary\|text-text-dark\|bg-background\|bg-primary/\|border-secondary" src/ --include="*.tsx"
```

Replace any remaining old tokens found with their new equivalents:
- `text-text-darker` → `text-text`
- `text-text-dark` → `text-text-muted`
- `bg-secondary` → `bg-border` or `bg-bg` depending on context
- `bg-background` → `bg-bg`
- `border-secondary` → `border-border`

- [ ] **Step 3: Final build check**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm run build
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/backend" && npm test
```

Both must pass clean.

- [ ] **Step 4: Final commit**

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor" && git add -A frontend/src/ && git commit -m "design: final token cleanup and visual fixes"
```

---

## Completion Checklist

- [ ] All 97 backend tests pass
- [ ] `npm run build` passes with 0 TypeScript errors
- [ ] Landing page: dark hero + frosted card + How It Works + dark CTA
- [ ] Navbar: dark slate, DM Mono logo, ghost links
- [ ] Creation flow: split-screen (left form, right room photo), photo updates on style selection
- [ ] Descriptions page: split-screen, accordion cards, inline auth/loading
- [ ] Wall result: full-bleed dark bg, horizontal piece strip, dark detail panel, controls bar
- [ ] Shopping links: orange text links (no more blue underlines)
- [ ] No old color tokens remaining in source files
