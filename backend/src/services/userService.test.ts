import { UserService } from './userService';

const mockDoc = {
  exists: true,
  data: jest.fn(() => ({
    email: 'test@gmail.com',
    dailyGenerationCount: 3,
    lastResetDate: '2026-02-14',
  })),
  id: 'user123',
};

const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockGet = jest.fn(() => Promise.resolve(mockDoc));

const mockDocRef = jest.fn(() => ({
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
}));

const mockDb = {
  collection: jest.fn(() => ({
    doc: mockDocRef,
  })),
};

jest.mock('../config/firebase', () => ({
  getDb: jest.fn(() => mockDb),
}));

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService();
  });

  it('getOrCreateUser returns existing user', async () => {
    const user = await service.getOrCreateUser('user123', 'test@gmail.com');
    expect(user.email).toBe('test@gmail.com');
    expect(user.dailyGenerationCount).toBe(3);
  });

  it('getOrCreateUser creates new user if not found', async () => {
    mockGet.mockResolvedValueOnce({ exists: false } as any);
    const user = await service.getOrCreateUser('user123', 'test@gmail.com');
    expect(mockSet).toHaveBeenCalled();
    expect(user.email).toBe('test@gmail.com');
    expect(user.dailyGenerationCount).toBe(0);
  });

  it('canGenerate returns true when under limit', async () => {
    const result = await service.canGenerate('user123');
    expect(result).toBe(true);
  });

  it('canGenerate returns false when at limit', async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        dailyGenerationCount: 10,
        lastResetDate: new Date().toISOString().split('T')[0],
      }),
    } as any);
    const result = await service.canGenerate('user123');
    expect(result).toBe(false);
  });

  it('canGenerate resets count if lastResetDate is yesterday', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        dailyGenerationCount: 10,
        lastResetDate: yesterday.toISOString().split('T')[0],
      }),
    } as any);
    const result = await service.canGenerate('user123');
    expect(result).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('incrementGenerationCount increments the count', async () => {
    await service.incrementGenerationCount('user123');
    expect(mockUpdate).toHaveBeenCalled();
  });
});
