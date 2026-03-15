# Admin Dashboard Time-Series Charts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add three independent time-series charts to the admin dashboard — call volume, token breakdown (GPT vs Gemini), and cost over time — each with a 7d/14d/30d/custom date range selector.

**Architecture:** New `GET /api/admin/usage/timeseries?from=YYYY-MM-DD&to=YYYY-MM-DD` endpoint buckets Langfuse observations by day (zero-filling gaps). Frontend uses Recharts for charts; a shared `DateRangeSelector` component handles preset and custom ranges; three chart components each manage their own date range state and API fetch independently.

**Tech Stack:** TypeScript, Express, Jest+supertest (backend); React, Next.js 14, Recharts, Tailwind CSS (frontend)

---

## Task 1: Backend timeseries endpoint

**Files:**
- Modify: `backend/src/routes/admin.ts`
- Modify: `backend/src/routes/admin.test.ts`

**Context:** `admin.ts` already has `PRICING`, `fetchAllObservations`, and auth guard patterns. The new route reuses all of these. `ApiObservationsView` from langfuse has a `startTime` field (ISO string) used to bucket by day. The router is mounted at `/api/admin` in `index.ts`.

### Step 1: Write failing tests

Add this describe block to the **end** of `backend/src/routes/admin.test.ts` (after the existing `GET /api/admin/usage` block):

```typescript
describe('GET /api/admin/usage/timeseries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_UID = 'admin-uid-123';
    process.env.LANGFUSE_SECRET_KEY = 'sk-test';
    process.env.LANGFUSE_PUBLIC_KEY = 'pk-test';
    process.env.LANGFUSE_BASE_URL = 'https://cloud.langfuse.com';
    mockObservationsGetMany.mockResolvedValue(emptyObsResponse);
    mockTraceList.mockResolvedValue(emptyTraceResponse);
  });

  it('returns 403 if uid does not match ADMIN_UID', async () => {
    process.env.ADMIN_UID = 'different-uid';
    const res = await request(app).get('/api/admin/usage/timeseries?from=2026-03-04&to=2026-03-11');
    expect(res.status).toBe(403);
  });

  it('returns 400 if from or to is missing', async () => {
    const res1 = await request(app).get('/api/admin/usage/timeseries?from=2026-03-04');
    expect(res1.status).toBe(400);
    const res2 = await request(app).get('/api/admin/usage/timeseries?to=2026-03-11');
    expect(res2.status).toBe(400);
    const res3 = await request(app).get('/api/admin/usage/timeseries');
    expect(res3.status).toBe(400);
  });

  it('returns one entry per day in range with zeroes for days with no activity', async () => {
    const res = await request(app).get('/api/admin/usage/timeseries?from=2026-03-04&to=2026-03-06');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0]).toMatchObject({
      date: '2026-03-04',
      gptCalls: 0,
      geminiCalls: 0,
      gptInputTokens: 0,
      gptOutputTokens: 0,
      geminiInputTokens: 0,
      geminiOutputTokens: 0,
      costUsd: 0,
    });
  });

  it('correctly aggregates observations into day buckets', async () => {
    mockObservationsGetMany.mockResolvedValue({
      data: [
        { model: 'gpt-4o-mini', usage: { input: 1000, output: 500 }, traceId: 't1', startTime: '2026-03-04T10:00:00.000Z' },
        { model: 'gemini-2.5-flash-image', usage: { input: 2000, output: 100 }, traceId: 't2', startTime: '2026-03-04T11:00:00.000Z' },
        { model: 'gpt-4o-mini', usage: { input: 800, output: 400 }, traceId: 't3', startTime: '2026-03-05T09:00:00.000Z' },
      ],
      meta: { page: 1, limit: 100, totalItems: 3, totalPages: 1 },
    });

    const res = await request(app).get('/api/admin/usage/timeseries?from=2026-03-04&to=2026-03-05');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);

    const day1 = res.body.data[0];
    expect(day1.date).toBe('2026-03-04');
    expect(day1.gptCalls).toBe(1);
    expect(day1.geminiCalls).toBe(1);
    expect(day1.gptInputTokens).toBe(1000);
    expect(day1.geminiInputTokens).toBe(2000);
    expect(day1.costUsd).toBeGreaterThan(0);

    const day2 = res.body.data[1];
    expect(day2.date).toBe('2026-03-05');
    expect(day2.gptCalls).toBe(1);
    expect(day2.geminiCalls).toBe(0);
  });
});
```

### Step 2: Run tests to verify they fail

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/backend" && npx jest src/routes/admin.test.ts --no-coverage 2>&1
```

Expected: The 4 new timeseries tests FAIL (route doesn't exist yet).

### Step 3: Add the timeseries route to `admin.ts`

Add this route **before** the existing `adminRouter.get('/usage', ...)` handler (place it between the `fetchAllTraces` function and the `adminRouter.get('/usage', ...)` line):

```typescript
adminRouter.get('/usage/timeseries', async (req: Request, res: Response) => {
  const uid = (req as any).user.uid;
  if (uid !== process.env.ADMIN_UID) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  const { from, to } = req.query as { from?: string; to?: string };
  if (!from || !to) {
    res.status(400).json({ error: 'from and to query params required (YYYY-MM-DD)' });
    return;
  }

  const fromIso = new Date(from).toISOString();
  const toExclusive = new Date(to);
  toExclusive.setDate(toExclusive.getDate() + 1);
  const toIso = toExclusive.toISOString();

  const langfuse = new Langfuse({
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL,
  });

  const observations = await fetchAllObservations(langfuse, fromIso, toIso);

  type DayBucket = {
    date: string;
    gptCalls: number;
    geminiCalls: number;
    gptInputTokens: number;
    gptOutputTokens: number;
    geminiInputTokens: number;
    geminiOutputTokens: number;
    costUsd: number;
  };

  // Zero-fill every day in the range
  const buckets: Record<string, DayBucket> = {};
  const cursor = new Date(from);
  const endDate = new Date(to);
  while (cursor <= endDate) {
    const dateStr = cursor.toISOString().slice(0, 10);
    buckets[dateStr] = {
      date: dateStr,
      gptCalls: 0, geminiCalls: 0,
      gptInputTokens: 0, gptOutputTokens: 0,
      geminiInputTokens: 0, geminiOutputTokens: 0,
      costUsd: 0,
    };
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const obs of observations) {
    const dateStr = obs.startTime ? String(obs.startTime).slice(0, 10) : null;
    if (!dateStr || !buckets[dateStr]) continue;

    const model = obs.model || 'unknown';
    const input = obs.usage?.input ?? 0;
    const output = obs.usage?.output ?? 0;
    const pricing = PRICING[model];
    const cost = pricing ? input * pricing.input + output * pricing.output : 0;

    if (model === 'gpt-4o-mini') {
      buckets[dateStr].gptCalls++;
      buckets[dateStr].gptInputTokens += input;
      buckets[dateStr].gptOutputTokens += output;
    } else if (model === 'gemini-2.5-flash-image') {
      buckets[dateStr].geminiCalls++;
      buckets[dateStr].geminiInputTokens += input;
      buckets[dateStr].geminiOutputTokens += output;
    }
    buckets[dateStr].costUsd += cost;
  }

  const data = Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
  res.json({ data });
});
```

### Step 4: Run the admin tests to verify they pass

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/backend" && npx jest src/routes/admin.test.ts --no-coverage 2>&1
```

Expected: All tests PASS (both existing `/usage` tests and new timeseries tests).

### Step 5: Run the full backend suite

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/backend" && npx jest --no-coverage 2>&1
```

Expected: All suites PASS.

### Step 6: Commit

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor"
git add backend/src/routes/admin.ts backend/src/routes/admin.test.ts
git commit -m "feat: add GET /api/admin/usage/timeseries endpoint with daily bucketing"
```

---

## Task 2: Install Recharts and add API method

**Files:**
- Modify: `frontend/package.json` (via npm install)
- Modify: `frontend/src/lib/api.ts`

**Context:** Recharts is the most popular React charting library. It works with `'use client'` components (no SSR issues). The `api.ts` file follows the pattern `method: (args) => apiRequest(path)`.

### Step 1: Install Recharts

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npm install recharts 2>&1
```

Expected: Installs successfully, `recharts` appears in `package.json` dependencies.

### Step 2: Add `getUsageTimeseries` to `api.ts`

Add this entry to the `api` object in `frontend/src/lib/api.ts`, after `getUsage`:

```typescript
getUsageTimeseries: (from: string, to: string) =>
  apiRequest(`/api/admin/usage/timeseries?from=${from}&to=${to}`),
```

### Step 3: Verify the frontend builds

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npx next build 2>&1 | tail -15
```

Expected: Build succeeds with no TypeScript errors.

### Step 4: Commit

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor"
git add frontend/package.json frontend/package-lock.json frontend/src/lib/api.ts
git commit -m "feat: install recharts and add getUsageTimeseries API method"
```

---

## Task 3: DateRangeSelector component

**Files:**
- Create: `frontend/src/components/DateRangeSelector.tsx`

**Context:** Each of the three chart components will import and use this. It manages preset buttons (7d/14d/30d/Custom) and, when Custom is selected, shows two `<input type="date">` fields. The exported `getDefaultRange` helper initialises chart state.

### Step 1: Create `DateRangeSelector.tsx`

```typescript
'use client';

export type Preset = '7d' | '14d' | '30d' | 'custom';

export interface DateRange {
  preset: Preset;
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

function presetToDays(preset: Preset): number {
  if (preset === '7d') return 7;
  if (preset === '14d') return 14;
  return 30;
}

function computeRange(preset: Preset): { from: string; to: string } {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const from = new Date(today);
  from.setDate(from.getDate() - presetToDays(preset) + 1);
  return { from: from.toISOString().slice(0, 10), to };
}

export function getDefaultRange(preset: Preset = '7d'): DateRange {
  return { preset, ...computeRange(preset) };
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS: Preset[] = ['7d', '14d', '30d', 'custom'];
const today = new Date().toISOString().slice(0, 10);

export default function DateRangeSelector({ value, onChange }: Props) {
  const handlePreset = (preset: Preset) => {
    if (preset === 'custom') {
      onChange({ ...value, preset: 'custom' });
    } else {
      onChange({ preset, ...computeRange(preset) });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p}
          onClick={() => handlePreset(p)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            value.preset === p
              ? 'bg-primary text-white'
              : 'bg-secondary/60 text-text-darker hover:bg-secondary'
          }`}
        >
          {p === 'custom' ? 'Custom' : p.toUpperCase()}
        </button>
      ))}
      {value.preset === 'custom' && (
        <>
          <input
            type="date"
            value={value.from}
            max={value.to}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="rounded-lg border border-secondary px-2 py-1 text-xs text-text-darker focus:border-primary focus:outline-none"
          />
          <span className="text-xs text-text-dark">to</span>
          <input
            type="date"
            value={value.to}
            min={value.from}
            max={today}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="rounded-lg border border-secondary px-2 py-1 text-xs text-text-darker focus:border-primary focus:outline-none"
          />
        </>
      )}
    </div>
  );
}
```

### Step 2: Verify the frontend builds

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npx next build 2>&1 | tail -15
```

Expected: Build succeeds.

### Step 3: Commit

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor"
git add frontend/src/components/DateRangeSelector.tsx
git commit -m "feat: add DateRangeSelector component with preset and custom range"
```

---

## Task 4: CallVolumeChart component

**Files:**
- Create: `frontend/src/components/charts/CallVolumeChart.tsx`

**Context:** Stacked bar chart. X-axis: date (formatted as "Mar 4"). Y-axis: call count. Two series: GPT calls (indigo) and Gemini calls (emerald). Fetches from `api.getUsageTimeseries` when date range changes.

### Step 1: Create the directory and component

```bash
mkdir -p "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend/src/components/charts"
```

Create `frontend/src/components/charts/CallVolumeChart.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '@/lib/api';
import DateRangeSelector, { DateRange, getDefaultRange } from '@/components/DateRangeSelector';

interface DayBucket {
  date: string;
  gptCalls: number;
  geminiCalls: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CallVolumeChart() {
  const [range, setRange] = useState<DateRange>(() => getDefaultRange('7d'));
  const [data, setData] = useState<DayBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getUsageTimeseries(range.from, range.to)
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  const chartData = data.map((d) => ({ ...d, date: formatDate(d.date) }));

  return (
    <div className="rounded-2xl border border-secondary/60 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-base font-semibold text-text-darker">Call Volume</h2>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-primary" />
        </div>
      ) : error ? (
        <p className="h-48 flex items-center justify-center text-sm text-text-dark">{error}</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={chartData.length > 14 ? 8 : 16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
            <Tooltip />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="gptCalls" name="GPT-4o-mini" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
            <Bar dataKey="geminiCalls" name="Gemini" stackId="a" fill="#10b981" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
```

### Step 2: Verify the frontend builds

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npx next build 2>&1 | tail -15
```

Expected: Build succeeds.

### Step 3: Commit

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor"
git add frontend/src/components/charts/CallVolumeChart.tsx
git commit -m "feat: add CallVolumeChart with stacked bar and date range selector"
```

---

## Task 5: TokenBreakdownChart component

**Files:**
- Create: `frontend/src/components/charts/TokenBreakdownChart.tsx`

**Context:** Stacked bar chart. Shows total tokens per model per day (GPT = gptInputTokens + gptOutputTokens; Gemini = geminiInputTokens + geminiOutputTokens). Y-axis formatted with K/M suffix.

### Step 1: Create `frontend/src/components/charts/TokenBreakdownChart.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '@/lib/api';
import DateRangeSelector, { DateRange, getDefaultRange } from '@/components/DateRangeSelector';

interface DayBucket {
  date: string;
  gptInputTokens: number;
  gptOutputTokens: number;
  geminiInputTokens: number;
  geminiOutputTokens: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function TokenBreakdownChart() {
  const [range, setRange] = useState<DateRange>(() => getDefaultRange('7d'));
  const [data, setData] = useState<DayBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getUsageTimeseries(range.from, range.to)
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    gptTokens: d.gptInputTokens + d.gptOutputTokens,
    geminiTokens: d.geminiInputTokens + d.geminiOutputTokens,
  }));

  return (
    <div className="rounded-2xl border border-secondary/60 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-base font-semibold text-text-darker">Token Breakdown</h2>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-primary" />
        </div>
      ) : error ? (
        <p className="h-48 flex items-center justify-center text-sm text-text-dark">{error}</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={chartData.length > 14 ? 8 : 16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatTokens} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
            <Tooltip formatter={(v: number) => formatTokens(v)} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="gptTokens" name="GPT-4o-mini" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
            <Bar dataKey="geminiTokens" name="Gemini" stackId="a" fill="#10b981" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
```

### Step 2: Verify the frontend builds

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npx next build 2>&1 | tail -15
```

Expected: Build succeeds.

### Step 3: Commit

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor"
git add frontend/src/components/charts/TokenBreakdownChart.tsx
git commit -m "feat: add TokenBreakdownChart with GPT vs Gemini stacked bars"
```

---

## Task 6: CostChart component

**Files:**
- Create: `frontend/src/components/charts/CostChart.tsx`

**Context:** Area chart, single series. Y-axis formatted as USD. Shows daily cost over the selected range.

### Step 1: Create `frontend/src/components/charts/CostChart.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '@/lib/api';
import DateRangeSelector, { DateRange, getDefaultRange } from '@/components/DateRangeSelector';

interface DayBucket {
  date: string;
  costUsd: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatUsd(n: number) {
  if (n === 0) return '$0';
  if (n < 0.01) return '<$0.01';
  return `$${n.toFixed(3)}`;
}

export default function CostChart() {
  const [range, setRange] = useState<DateRange>(() => getDefaultRange('7d'));
  const [data, setData] = useState<DayBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getUsageTimeseries(range.from, range.to)
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  const chartData = data.map((d) => ({ ...d, date: formatDate(d.date) }));

  return (
    <div className="rounded-2xl border border-secondary/60 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-base font-semibold text-text-darker">Cost Over Time</h2>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-primary" />
        </div>
      ) : error ? (
        <p className="h-48 flex items-center justify-center text-sm text-text-dark">{error}</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={(v) => (v === 0 ? '$0' : `$${v.toFixed(2)}`)}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip formatter={(v: number) => [formatUsd(v), 'Cost']} />
            <Area
              type="monotone"
              dataKey="costUsd"
              name="Cost"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#costGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
```

### Step 2: Verify the frontend builds

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npx next build 2>&1 | tail -15
```

Expected: Build succeeds.

### Step 3: Commit

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor"
git add frontend/src/components/charts/CostChart.tsx
git commit -m "feat: add CostChart area chart with daily cost and date range selector"
```

---

## Task 7: Wire charts into admin page

**Files:**
- Modify: `frontend/src/app/admin/usage/page.tsx`

**Context:** The admin page already has monthly summary sections. Add a "Trends" section at the bottom with the three chart components. Each chart is independent (manages its own state), so they just need to be imported and rendered.

### Step 1: Add imports to `admin/usage/page.tsx`

At the top of the file, after the existing imports, add:

```typescript
import CallVolumeChart from '@/components/charts/CallVolumeChart';
import TokenBreakdownChart from '@/components/charts/TokenBreakdownChart';
import CostChart from '@/components/charts/CostChart';
```

### Step 2: Add the Trends section to the page JSX

In `AdminUsagePage`, after the closing `</div>` of the Per-User Activity section (the last `</div>` before the outer `</div>`), add:

```tsx
{/* Trends */}
<div>
  <h2 className="text-base font-semibold text-text-darker mb-1">Trends</h2>
  <p className="text-xs text-text-dark mb-5">Each chart has its own time range — select a preset or enter a custom range.</p>
  <div className="space-y-6">
    <CallVolumeChart />
    <TokenBreakdownChart />
    <CostChart />
  </div>
</div>
```

### Step 3: Verify the frontend builds

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor/frontend" && npx next build 2>&1 | tail -15
```

Expected: Build succeeds with no TypeScript errors.

### Step 4: Commit

```bash
cd "/Users/abhi/Documents/Coding Projects/GenWallDecor"
git add "frontend/src/app/admin/usage/page.tsx"
git commit -m "feat: add Trends section with call volume, token, and cost charts to admin dashboard"
```
