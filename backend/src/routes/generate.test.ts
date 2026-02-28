import request from 'supertest';
import express from 'express';

const mockGenerateDescriptions = jest.fn();
const mockGenerateImages = jest.fn();
const mockEnforceHistoryLimit = jest.fn();
const mockIncrementGenerationCount = jest.fn();

jest.mock('../services/generationService', () => ({
  GenerationService: jest.fn().mockImplementation(() => ({
    generateDescriptions: mockGenerateDescriptions,
    generateImages: mockGenerateImages,
    enforceHistoryLimit: mockEnforceHistoryLimit,
  })),
}));

jest.mock('../services/userService', () => ({
  UserService: jest.fn().mockImplementation(() => ({
    incrementGenerationCount: mockIncrementGenerationCount,
  })),
}));

jest.mock('../config/firebase', () => ({
  getFirebaseApp: jest.fn(),
  getDb: jest.fn(() => ({ collection: jest.fn() })),
  getBucket: jest.fn(),
}));

import { generateRouter } from './generate';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = { uid: 'user123', email: 'test@gmail.com' };
  next();
});
app.use('/api/generate', generateRouter);

describe('POST /api/generate/descriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateDescriptions.mockResolvedValue([
      { title: 'Art 1', description: 'Desc', medium: 'Canvas', dimensions: '24x36', placement: 'Center' },
    ]);
  });

  it('returns descriptions for valid preferences', async () => {
    const res = await request(app)
      .post('/api/generate/descriptions')
      .send({
        preferences: {
          style: 'Bohemian',
          colorScheme: ['warm tones'],
          frameMaterial: 'wood',
          roomType: 'living room',
        },
      });
    expect(res.status).toBe(200);
    expect(res.body.descriptions).toHaveLength(1);
  });

  it('returns 400 if preferences missing', async () => {
    const res = await request(app).post('/api/generate/descriptions').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/generate/images', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateImages.mockResolvedValue({
      generationId: 'gen123',
      pieceUrls: ['https://url1.com'],
      wallRenderUrl: 'https://wall.com',
    });
    mockEnforceHistoryLimit.mockResolvedValue(undefined);
    mockIncrementGenerationCount.mockResolvedValue(undefined);
  });

  it('returns generation result for valid input', async () => {
    const res = await request(app)
      .post('/api/generate/images')
      .send({
        preferences: { style: 'Bohemian', colorScheme: ['warm tones'], frameMaterial: 'wood', roomType: 'living room' },
        descriptions: [{ title: 'Art 1', description: 'Desc', medium: 'Canvas', dimensions: '24x36', placement: 'Center' }],
      });
    expect(res.status).toBe(200);
    expect(res.body.generationId).toBe('gen123');
  });
});
