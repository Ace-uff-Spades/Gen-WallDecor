import request from 'supertest';
import express from 'express';

const mockFinalizeGeneration = jest.fn();

jest.mock('../services/generationService', () => ({
  GenerationService: jest.fn().mockImplementation(() => ({
    finalizeGeneration: mockFinalizeGeneration,
  })),
}));

jest.mock('../config/firebase', () => ({
  getDb: jest.fn(() => ({ collection: jest.fn() })),
}));

import { generationsRouter } from './generations';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = { uid: 'user123' };
  next();
});
app.use('/api/generations', generationsRouter);

describe('POST /api/generations/:id/finalize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFinalizeGeneration.mockResolvedValue(undefined);
  });

  it('returns 200 on success', async () => {
    const res = await request(app).post('/api/generations/gen1/finalize');
    expect(res.status).toBe(200);
    expect(mockFinalizeGeneration).toHaveBeenCalledWith('user123', 'gen1');
  });

  it('returns 403 if service throws Unauthorized', async () => {
    mockFinalizeGeneration.mockRejectedValue(new Error('Unauthorized'));
    const res = await request(app).post('/api/generations/gen1/finalize');
    expect(res.status).toBe(403);
  });

  it('returns 409 if already finalized', async () => {
    mockFinalizeGeneration.mockRejectedValue(new Error('Already finalized'));
    const res = await request(app).post('/api/generations/gen1/finalize');
    expect(res.status).toBe(409);
  });
});
