import request from 'supertest';
import express from 'express';

const mockObservationsGetMany = jest.fn();
const mockTraceList = jest.fn();

jest.mock('langfuse', () => ({
  Langfuse: jest.fn().mockImplementation(() => ({
    api: {
      observationsGetMany: mockObservationsGetMany,
      traceList: mockTraceList,
    },
  })),
}));

jest.mock('../config/firebase', () => ({
  getFirebaseApp: jest.fn(),
  getDb: jest.fn(),
  getBucket: jest.fn(),
}));

import { adminRouter } from './admin';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = { uid: 'admin-uid-123', email: 'admin@test.com' };
  next();
});
app.use('/api/admin', adminRouter);

const emptyObsResponse = { data: [], meta: { page: 1, limit: 100, totalItems: 0, totalPages: 0 } };
const emptyTraceResponse = { data: [], meta: { page: 1, limit: 100, totalItems: 0, totalPages: 0 } };

describe('GET /api/admin/usage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_UID = 'admin-uid-123';
    process.env.MONTHLY_BUDGET_USD = '50';
    process.env.LANGFUSE_SECRET_KEY = 'sk-test';
    process.env.LANGFUSE_PUBLIC_KEY = 'pk-test';
    process.env.LANGFUSE_BASE_URL = 'https://cloud.langfuse.com';
    mockObservationsGetMany.mockResolvedValue(emptyObsResponse);
    mockTraceList.mockResolvedValue(emptyTraceResponse);
  });

  it('returns 403 if uid does not match ADMIN_UID', async () => {
    process.env.ADMIN_UID = 'different-uid';
    const res = await request(app).get('/api/admin/usage');
    expect(res.status).toBe(403);
  });

  it('returns usage data with correct shape', async () => {
    const res = await request(app).get('/api/admin/usage');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      budgetUsd: 50,
      totalCostUsd: expect.any(Number),
      gpt: { calls: expect.any(Number), inputTokens: expect.any(Number), outputTokens: expect.any(Number), costUsd: expect.any(Number) },
      gemini: { calls: expect.any(Number), inputTokens: expect.any(Number), outputTokens: expect.any(Number), costUsd: expect.any(Number) },
      perUser: expect.any(Array),
    });
  });

  it('aggregates token counts and cost from observations', async () => {
    mockObservationsGetMany.mockResolvedValue({
      data: [
        { model: 'gpt-4o-mini', usage: { input: 1000, output: 500 }, traceId: 'trace-1' },
        { model: 'gemini-2.5-flash-image', usage: { input: 2000, output: 100 }, traceId: 'trace-2' },
      ],
      meta: { page: 1, limit: 100, totalItems: 2, totalPages: 1 },
    });

    const res = await request(app).get('/api/admin/usage');
    expect(res.status).toBe(200);
    expect(res.body.gpt.calls).toBe(1);
    expect(res.body.gpt.inputTokens).toBe(1000);
    expect(res.body.gpt.outputTokens).toBe(500);
    expect(res.body.gemini.calls).toBe(1);
    expect(res.body.totalCostUsd).toBeGreaterThan(0);
  });

  it('builds per-user breakdown by joining traces to observations', async () => {
    mockTraceList.mockResolvedValue({
      data: [
        { id: 'trace-1', userId: 'user-a', totalCost: 0 },
        { id: 'trace-2', userId: 'user-b', totalCost: 0 },
      ],
      meta: { page: 1, limit: 100, totalItems: 2, totalPages: 1 },
    });
    mockObservationsGetMany.mockResolvedValue({
      data: [
        { model: 'gpt-4o-mini', usage: { input: 1000, output: 500 }, traceId: 'trace-1' },
        { model: 'gpt-4o-mini', usage: { input: 500, output: 200 }, traceId: 'trace-2' },
      ],
      meta: { page: 1, limit: 100, totalItems: 2, totalPages: 1 },
    });

    const res = await request(app).get('/api/admin/usage');
    expect(res.status).toBe(200);
    expect(res.body.perUser).toHaveLength(2);
    const userA = res.body.perUser.find((u: any) => u.userId === 'user-a');
    expect(userA).toBeDefined();
    expect(userA.calls).toBe(1);
    expect(userA.costUsd).toBeGreaterThan(0);
  });
});

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
