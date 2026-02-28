import { Request, Response, NextFunction } from 'express';
import { authenticate } from './authenticate';

// Mock firebase-admin/auth
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn((token: string) => {
      if (token === 'valid-token') {
        return Promise.resolve({ uid: 'user123', email: 'test@gmail.com' });
      }
      return Promise.reject(new Error('Invalid token'));
    }),
  })),
}));

// Also need to mock the firebase init since authenticate imports it
jest.mock('../config/firebase', () => ({
  getFirebaseApp: jest.fn(),
}));

function mockReqResNext(authHeader?: string) {
  const req = { headers: { authorization: authHeader } } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

describe('authenticate middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 401 if no Authorization header', async () => {
    const { req, res, next } = mockReqResNext();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if header does not start with Bearer', async () => {
    const { req, res, next } = mockReqResNext('Basic abc');
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 403 for invalid token', async () => {
    const { req, res, next } = mockReqResNext('Bearer invalid-token');
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('calls next() with user on req for valid token', async () => {
    const { req, res, next } = mockReqResNext('Bearer valid-token');
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual({ uid: 'user123', email: 'test@gmail.com' });
  });

  it('bypasses auth when AUTH_DISABLED=true', async () => {
    process.env.AUTH_DISABLED = 'true';
    const { req, res, next } = mockReqResNext();
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual({ uid: 'test-user', email: 'test@test.com' });
  });
});
