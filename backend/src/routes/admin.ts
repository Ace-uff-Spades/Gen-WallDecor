import { Router, Request, Response } from 'express';
import { Langfuse, ApiObservationsView, ApiTraceWithDetails } from 'langfuse';

export const adminRouter = Router();

// NOTE: Verify pricing at platform.openai.com and ai.google.dev before relying on cost figures.
// Gemini image generation may have different pricing than text — token-based costs are an approximation.
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
  'gemini-2.5-flash-image': { input: 0.075 / 1_000_000, output: 0.30 / 1_000_000 },
};

function getMonthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  return { start, end };
}

async function fetchAllObservations(langfuse: Langfuse, fromStartTime: string, toStartTime: string): Promise<ApiObservationsView[]> {
  const all: ApiObservationsView[] = [];
  let page = 1;
  while (true) {
    const result = await langfuse.api.observationsGetMany({ type: 'GENERATION', fromStartTime, toStartTime, limit: 100, page });
    all.push(...result.data);
    if (page >= result.meta.totalPages) break;
    page++;
  }
  return all;
}

async function fetchAllTraces(langfuse: Langfuse, fromTimestamp: string, toTimestamp: string): Promise<ApiTraceWithDetails[]> {
  const all: ApiTraceWithDetails[] = [];
  let page = 1;
  while (true) {
    const result = await langfuse.api.traceList({ fromTimestamp, toTimestamp, limit: 100, page });
    all.push(...result.data);
    if (page >= result.meta.totalPages) break;
    page++;
  }
  return all;
}

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

adminRouter.get('/usage', async (req: Request, res: Response) => {
  const uid = (req as any).user.uid;
  if (uid !== process.env.ADMIN_UID) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  const { start, end } = getMonthBounds();
  const budgetUsd = parseFloat(process.env.MONTHLY_BUDGET_USD || '0');
  const month = start.slice(0, 7);

  const langfuse = new Langfuse({
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL,
  });

  const [observations, traces] = await Promise.all([
    fetchAllObservations(langfuse, start, end),
    fetchAllTraces(langfuse, start, end),
  ]);

  // Build traceId → userId map
  const traceUserMap = new Map<string, string>();
  for (const trace of traces) {
    if (trace.userId) traceUserMap.set(trace.id, trace.userId);
  }

  // Aggregate by model + per-user
  type ModelStats = { calls: number; inputTokens: number; outputTokens: number; costUsd: number };
  type UserStats = { calls: number; costUsd: number };

  const byModel: Record<string, ModelStats> = {};
  const byUser: Record<string, UserStats> = {};

  for (const obs of observations) {
    const model = obs.model || 'unknown';
    if (!byModel[model]) byModel[model] = { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };

    const input = obs.usage?.input ?? 0;
    const output = obs.usage?.output ?? 0;
    const pricing = PRICING[model];
    const cost = pricing ? input * pricing.input + output * pricing.output : 0;

    byModel[model].calls++;
    byModel[model].inputTokens += input;
    byModel[model].outputTokens += output;
    byModel[model].costUsd += cost;

    const userId = obs.traceId ? (traceUserMap.get(obs.traceId) ?? 'anonymous') : 'anonymous';
    if (!byUser[userId]) byUser[userId] = { calls: 0, costUsd: 0 };
    byUser[userId].calls++;
    byUser[userId].costUsd += cost;
  }

  const empty: ModelStats = { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const totalCostUsd = Object.values(byModel).reduce((sum, m) => sum + m.costUsd, 0);

  const perUser = Object.entries(byUser)
    .map(([userId, stats]) => ({ userId, ...stats }))
    .sort((a, b) => b.costUsd - a.costUsd);

  res.json({
    month,
    budgetUsd,
    totalCostUsd,
    gpt: byModel['gpt-4o-mini'] ?? empty,
    gemini: byModel['gemini-2.5-flash-image'] ?? empty,
    perUser,
  });
});
