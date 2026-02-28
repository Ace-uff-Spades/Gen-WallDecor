import request from 'supertest';

jest.mock('./config/firebase', () => ({
  getFirebaseApp: jest.fn(),
  getDb: jest.fn(() => ({ collection: jest.fn() })),
  getBucket: jest.fn(),
}));

jest.mock('./services/generationService', () => ({
  GenerationService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('./services/userService', () => ({
  UserService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('./services/storageService', () => ({
  StorageService: jest.fn().mockImplementation(() => ({})),
}));

import app from './index';

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
