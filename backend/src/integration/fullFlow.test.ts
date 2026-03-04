import request from 'supertest';

// In-memory Firestore mock
const mockStore: Record<string, Record<string, any>> = {
  users: {},
  generations: {},
};
let autoIdCounter = 0;

const mockDocRef = (collection: string, docId: string) => ({
  get: jest.fn(async () => {
    const data = mockStore[collection]?.[docId];
    return {
      exists: !!data,
      data: () => data,
      id: docId,
    };
  }),
  set: jest.fn(async (data: any, opts?: any) => {
    if (opts?.merge) {
      mockStore[collection][docId] = { ...mockStore[collection][docId], ...data };
    } else {
      mockStore[collection][docId] = data;
    }
  }),
  update: jest.fn(async (data: any) => {
    mockStore[collection][docId] = { ...mockStore[collection][docId], ...data };
  }),
  delete: jest.fn(async () => {
    delete mockStore[collection][docId];
  }),
});

const mockCollection = (name: string) => ({
  doc: (id: string) => mockDocRef(name, id),
  add: jest.fn(async (data: any) => {
    const id = `gen-${++autoIdCounter}`;
    mockStore[name][id] = data;
    return { id };
  }),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  get: jest.fn(async () => {
    const entries = Object.entries(mockStore[name] || {});
    return {
      docs: entries
        .filter(([, val]) => val.userId === 'test-user')
        .sort((a, b) => (b[1].createdAt > a[1].createdAt ? 1 : -1))
        .map(([id, data]) => ({ id, data: () => data, exists: true })),
    };
  }),
});

// Mock firebase config
jest.mock('../config/firebase', () => ({
  getFirebaseApp: jest.fn(),
  getDb: jest.fn(() => ({
    collection: (name: string) => mockCollection(name),
  })),
  getBucket: jest.fn(() => ({
    file: (path: string) => ({
      save: jest.fn(async () => {}),
      getSignedUrl: jest.fn(async () => [`https://storage.example.com/${path}?signed=true`]),
      delete: jest.fn(async () => {}),
    }),
  })),
}));

// Mock OpenAI — DescriptionService uses it
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        parse: jest.fn(async () => ({
          choices: [{
            message: {
              parsed: {
                pieces: [
                  {
                    title: 'Sunset Abstract',
                    description: 'A warm abstract painting with flowing curves',
                    medium: 'Acrylic on Canvas',
                    dimensions: '24x36 inches',
                    placement: 'Center wall, eye level',
                  },
                  {
                    title: 'Botanical Study',
                    description: 'Delicate line drawing of fern fronds',
                    medium: 'Ink on Paper',
                    dimensions: '16x20 inches',
                    placement: 'Left of center, slightly above eye level',
                  },
                  {
                    title: 'Geometric Harmony',
                    description: 'Balanced composition of overlapping shapes',
                    medium: 'Digital Print',
                    dimensions: '18x18 inches',
                    placement: 'Right of center, eye level',
                  },
                  {
                    title: 'Coastal Drift',
                    description: 'Photography of sea foam on sand',
                    medium: 'Photograph',
                    dimensions: '12x16 inches',
                    placement: 'Below center piece, slightly right',
                  },
                ],
              },
            },
          }],
        })),
      },
    },
  }));
});

// Mock Gemini — ImageService uses @google/genai
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn(async () => ({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: Buffer.from('fake-image-data').toString('base64'),
                mimeType: 'image/png',
              },
            }],
          },
        }],
      })),
    },
  })),
}));

// Mock zod response format helper
jest.mock('openai/helpers/zod', () => ({
  zodResponseFormat: jest.fn(() => ({ type: 'json_schema', json_schema: {} })),
}));

// Set AUTH_DISABLED to bypass Firebase Auth
process.env.AUTH_DISABLED = 'true';

import app from '../index';

describe('Full Generation Flow Integration Test', () => {
  beforeEach(() => {
    // Reset in-memory store
    mockStore.users = {};
    mockStore.generations = {};
    autoIdCounter = 0;
  });

  it('completes the full generation flow: descriptions → images → history → detail', async () => {
    // Step 1: POST /api/generate/descriptions — get AI-generated descriptions
    const descriptionsRes = await request(app)
      .post('/api/generate/descriptions')
      .send({
        preferences: {
          style: 'Modern',
          colorScheme: ['black', 'white', 'red accent'],
          frameMaterial: 'black metal',
          roomType: 'Living Room',
        },
      });

    expect(descriptionsRes.status).toBe(200);
    expect(descriptionsRes.body.descriptions).toHaveLength(4);
    expect(descriptionsRes.body.descriptions[0]).toMatchObject({
      title: expect.any(String),
      description: expect.any(String),
      medium: expect.any(String),
      dimensions: expect.any(String),
      placement: expect.any(String),
    });

    const descriptions = descriptionsRes.body.descriptions;

    // Step 2: POST /api/generate/images — generate images from descriptions
    // First, seed the user in mock store so rate limit check passes
    mockStore.users['test-user'] = {
      email: 'test@test.com',
      dailyGenerationCount: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    const imagesRes = await request(app)
      .post('/api/generate/images')
      .send({
        preferences: {
          style: 'Modern',
          colorScheme: ['black', 'white', 'red accent'],
          frameMaterial: 'black metal',
          roomType: 'Living Room',
        },
        descriptions,
      });

    expect(imagesRes.status).toBe(200);
    expect(imagesRes.body.generationId).toBeTruthy();
    expect(imagesRes.body.pieceUrls).toHaveLength(4);
    expect(imagesRes.body.wallRenderUrl).toBeTruthy();

    const { generationId } = imagesRes.body;

    // Verify generation count was incremented
    expect(mockStore.users['test-user'].dailyGenerationCount).toBe(1);

    // Step 3: GET /api/history — see the generation in history
    const historyRes = await request(app)
      .get('/api/history');

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.generations).toHaveLength(1);
    expect(historyRes.body.generations[0].style).toBe('Modern');

    // Step 4: GET /api/history/:id — get full generation detail
    const detailRes = await request(app)
      .get(`/api/history/${generationId}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.id).toBe(generationId);
    expect(detailRes.body.style).toBe('Modern');
    expect(detailRes.body.pieces).toHaveLength(4);
    expect(detailRes.body.pieces[0]).toMatchObject({ title: expect.any(String), imageUrl: expect.any(String) });
    expect(detailRes.body.wallRenderUrl).toBeTruthy();
  });

  it('returns 400 when preferences are missing required fields', async () => {
    const res = await request(app)
      .post('/api/generate/descriptions')
      .send({ preferences: { style: 'Modern' } }); // missing roomType

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Missing required preferences');
  });

  it('returns 400 when descriptions are missing for image generation', async () => {
    mockStore.users['test-user'] = {
      email: 'test@test.com',
      dailyGenerationCount: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    const res = await request(app)
      .post('/api/generate/images')
      .send({ preferences: { style: 'Modern', roomType: 'Bedroom' } });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Missing preferences or descriptions');
  });

  it('returns user profile', async () => {
    const res = await request(app)
      .get('/api/user/profile');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      email: expect.any(String),
      dailyGenerationCount: expect.any(Number),
    });
  });

  it('returns 404 for nonexistent generation', async () => {
    const res = await request(app)
      .get('/api/history/nonexistent-id');

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found');
  });
});
