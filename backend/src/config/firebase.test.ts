const mockInitializeApp = jest.fn().mockReturnValue({ name: '[DEFAULT]' });
const mockCert = jest.fn().mockImplementation((config: any) => config);
const mockGetFirestore = jest.fn().mockReturnValue({ collection: jest.fn() });
const mockBucket = jest.fn().mockReturnValue({ name: 'walldecorgen-bucket-1' });
const mockGetStorage = jest.fn().mockReturnValue({ bucket: mockBucket });

jest.mock('firebase-admin/app', () => ({
  initializeApp: (...args: any[]) => mockInitializeApp(...args),
  cert: (...args: any[]) => mockCert(...args),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: (...args: any[]) => mockGetFirestore(...args),
}));

jest.mock('firebase-admin/storage', () => ({
  getStorage: (...args: any[]) => mockGetStorage(...args),
}));

import { getFirebaseApp, getDb, getBucket } from './firebase';

describe('Firebase config', () => {
  const originalEnv = process.env;

  beforeAll(() => {
    process.env = {
      ...originalEnv,
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_CLIENT_EMAIL: 'test@test.iam.gserviceaccount.com',
      FIREBASE_PRIVATE_KEY: 'line1\\nline2\\nline3',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('initializes with correct config on first call', () => {
    getFirebaseApp();

    // Verifies env vars are read and private key newlines are unescaped
    expect(mockCert).toHaveBeenCalledWith({
      projectId: 'test-project',
      clientEmail: 'test@test.iam.gserviceaccount.com',
      privateKey: 'line1\nline2\nline3',
    });

    expect(mockInitializeApp).toHaveBeenCalledWith(
      expect.objectContaining({
        storageBucket: 'walldecorgen-bucket-1',
      })
    );

    expect(mockInitializeApp).toHaveBeenCalledTimes(1);
  });

  it('reuses the same app on subsequent calls (singleton)', () => {
    mockInitializeApp.mockClear();
    mockCert.mockClear();

    const app1 = getFirebaseApp();
    const app2 = getFirebaseApp();

    expect(app1).toBe(app2);
    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(mockCert).not.toHaveBeenCalled();
  });

  it('getDb calls getFirebaseApp and returns Firestore instance', () => {
    const db = getDb();
    expect(db).toBeDefined();
    expect(db.collection).toBeDefined();
    expect(mockGetFirestore).toHaveBeenCalled();
  });

  it('getBucket calls getFirebaseApp and returns storage bucket', () => {
    const bucket = getBucket();
    expect(bucket).toBeDefined();
    expect(mockGetStorage).toHaveBeenCalled();
  });
});
