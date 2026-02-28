import { Request, Response, NextFunction } from 'express';

const mockCanGenerate = jest.fn();
jest.mock('../services/userService', () => ({
  UserService: jest.fn().mockImplementation(() => ({
    canGenerate: mockCanGenerate,
  })),
}));

import { rateLimitMiddleware } from './rateLimit';

function mockReqResNext(uid: string) {
  const req = { user: { uid } } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

describe('rateLimitMiddleware', () => {
  it('calls next when user can generate', async () => {
    mockCanGenerate.mockResolvedValue(true);
    const { req, res, next } = mockReqResNext('user123');
    await rateLimitMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 429 when user has hit limit', async () => {
    mockCanGenerate.mockResolvedValue(false);
    const { req, res, next } = mockReqResNext('user123');
    await rateLimitMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(next).not.toHaveBeenCalled();
  });
});
