import request from 'supertest';
import express from 'express';

const mockRegeneratePieces = jest.fn();
const mockRegenerateWallRender = jest.fn();

jest.mock('../services/generationService', () => ({
  GenerationService: jest.fn().mockImplementation(() => ({
    regeneratePieces: mockRegeneratePieces,
    regenerateWallRender: mockRegenerateWallRender,
  })),
}));

jest.mock('../config/firebase', () => ({
  getDb: jest.fn(() => ({ collection: jest.fn() })),
}));

import { regenerateRouter } from './regenerate';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = { uid: 'user123' };
  next();
});
app.use('/api/generate', regenerateRouter);

describe('POST /api/generate/pieces', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegeneratePieces.mockResolvedValue({
      pieceVersions: [['gen1/piece-0-v0.png', 'gen1/piece-0-v1.png']],
      pieceRegenerationCount: 1,
    });
  });

  it('returns updated pieceVersions and count', async () => {
    const res = await request(app)
      .post('/api/generate/pieces')
      .send({
        generationId: 'gen1',
        pieces: [{ pieceIndex: 0, description: 'New look' }],
      });
    expect(res.status).toBe(200);
    expect(res.body.pieceVersions).toBeDefined();
    expect(res.body.pieceRegenerationCount).toBe(1);
  });

  it('returns 400 if generationId missing', async () => {
    const res = await request(app)
      .post('/api/generate/pieces')
      .send({ pieces: [{ pieceIndex: 0, description: 'x' }] });
    expect(res.status).toBe(400);
  });

  it('returns 400 if pieces array empty', async () => {
    const res = await request(app)
      .post('/api/generate/pieces')
      .send({ generationId: 'gen1', pieces: [] });
    expect(res.status).toBe(400);
  });

  it('returns 403 if service throws Unauthorized', async () => {
    mockRegeneratePieces.mockRejectedValue(new Error('Unauthorized'));
    const res = await request(app)
      .post('/api/generate/pieces')
      .send({ generationId: 'gen1', pieces: [{ pieceIndex: 0, description: 'x' }] });
    expect(res.status).toBe(403);
  });

  it('returns 409 if generation is finalized', async () => {
    mockRegeneratePieces.mockRejectedValue(new Error('Generation is finalized'));
    const res = await request(app)
      .post('/api/generate/pieces')
      .send({ generationId: 'gen1', pieces: [{ pieceIndex: 0, description: 'x' }] });
    expect(res.status).toBe(409);
  });

  it('returns 429 if regeneration limit reached', async () => {
    mockRegeneratePieces.mockRejectedValue(new Error('Piece regeneration limit reached'));
    const res = await request(app)
      .post('/api/generate/pieces')
      .send({ generationId: 'gen1', pieces: [{ pieceIndex: 0, description: 'x' }] });
    expect(res.status).toBe(429);
  });
});

describe('POST /api/generate/wall-render', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegenerateWallRender.mockResolvedValue([
      'gen1/wall-render-v0.png',
      'gen1/wall-render-v1.png',
    ]);
  });

  it('returns updated wallRenderVersions', async () => {
    const res = await request(app)
      .post('/api/generate/wall-render')
      .send({ generationId: 'gen1', pieceImageRefs: ['gen1/piece-0-v1.png'] });
    expect(res.status).toBe(200);
    expect(res.body.wallRenderVersions).toHaveLength(2);
  });

  it('returns 400 if generationId missing', async () => {
    const res = await request(app)
      .post('/api/generate/wall-render')
      .send({ pieceImageRefs: ['gen1/piece-0-v0.png'] });
    expect(res.status).toBe(400);
  });

  it('returns 400 if pieceImageRefs is empty', async () => {
    const res = await request(app)
      .post('/api/generate/wall-render')
      .send({ generationId: 'gen1', pieceImageRefs: [] });
    expect(res.status).toBe(400);
  });

  it('returns 400 if a pieceImageRef does not belong to this generation', async () => {
    mockRegenerateWallRender.mockRejectedValue(new Error('Invalid piece image ref'));
    const res = await request(app)
      .post('/api/generate/wall-render')
      .send({ generationId: 'gen1', pieceImageRefs: ['other-gen/piece-0-v0.png'] });
    expect(res.status).toBe(400);
  });
});
