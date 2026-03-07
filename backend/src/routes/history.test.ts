import request from 'supertest';
import express from 'express';

const mockGetGeneration = jest.fn();
const mockGetSignedUrl = jest.fn();

jest.mock('../services/generationService', () => ({
  GenerationService: jest.fn().mockImplementation(() => ({
    getGeneration: mockGetGeneration,
    getUserGenerations: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock('../services/storageService', () => ({
  StorageService: jest.fn().mockImplementation(() => ({
    getSignedUrl: mockGetSignedUrl,
  })),
}));

jest.mock('../config/firebase', () => ({
  getFirebaseApp: jest.fn(),
  getDb: jest.fn(),
  getBucket: jest.fn(),
}));

import { historyRouter } from './history';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = { uid: 'user123' };
  next();
});
app.use('/api/history', historyRouter);

const mockGeneration = {
  id: 'gen-1',
  userId: 'user123',
  style: 'Bohemian',
  preferences: { style: 'Bohemian', colorScheme: ['warm'], frameMaterial: 'wood', roomType: 'living room' },
  descriptions: [
    { title: 'Sunset', description: 'A warm watercolor sunset', medium: 'Watercolor', dimensions: '18" x 24"', placement: 'Center wall' },
    { title: 'Forest', description: 'Dense forest in oils', medium: 'Oil on canvas', dimensions: '12" x 16"', placement: 'Left wall' },
  ],
  imageRefs: ['gen-1/piece-0.png', 'gen-1/piece-1.png'],
  wallRenderRef: 'gen-1/wall-render.png',
  createdAt: '2026-03-07T00:00:00.000Z',
};

describe('GET /api/history/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetGeneration.mockResolvedValue(mockGeneration);
    mockGetSignedUrl.mockImplementation((ref: string) => Promise.resolve(`https://signed.url/${ref}`));
  });

  it('returns 404 when generation not found', async () => {
    mockGetGeneration.mockResolvedValue(null);
    const res = await request(app).get('/api/history/missing-id');
    expect(res.status).toBe(404);
  });

  it('includes full description fields in each piece', async () => {
    const res = await request(app).get('/api/history/gen-1');
    expect(res.status).toBe(200);
    expect(res.body.pieces).toHaveLength(2);
    expect(res.body.pieces[0]).toMatchObject({
      title: 'Sunset',
      imageUrl: 'https://signed.url/gen-1/piece-0.png',
      description: 'A warm watercolor sunset',
      medium: 'Watercolor',
      dimensions: '18" x 24"',
      placement: 'Center wall',
    });
    expect(res.body.pieces[1]).toMatchObject({
      title: 'Forest',
      description: 'Dense forest in oils',
      medium: 'Oil on canvas',
    });
  });

  it('falls back gracefully when descriptions array is missing', async () => {
    mockGetGeneration.mockResolvedValue({ ...mockGeneration, descriptions: undefined });
    const res = await request(app).get('/api/history/gen-1');
    expect(res.status).toBe(200);
    expect(res.body.pieces[0].title).toBe('Piece 1');
    expect(res.body.pieces[0].description).toBeUndefined();
  });
});
