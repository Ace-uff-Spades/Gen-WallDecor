import { GenerationService } from './generationService';
import { UserPreferences } from '../types';

// Mock all dependencies
jest.mock('./descriptionService');
jest.mock('./imageService');
jest.mock('./storageService');
jest.mock('../config/firebase', () => ({
  getDb: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn(() => Promise.resolve({ id: 'gen123' })),
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
        set: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      get: jest.fn(() => Promise.resolve({
        docs: [],
        size: 0,
      })),
    })),
  })),
}));

import { DescriptionService } from './descriptionService';
import { ImageService } from './imageService';
import { StorageService } from './storageService';

const mockDescriptionService = DescriptionService as jest.MockedClass<typeof DescriptionService>;
const mockImageService = ImageService as jest.MockedClass<typeof ImageService>;
const mockStorageService = StorageService as jest.MockedClass<typeof StorageService>;

describe('GenerationService', () => {
  let service: GenerationService;

  const preferences: UserPreferences = {
    style: 'Bohemian',
    colorScheme: ['warm earth tones'],
    frameMaterial: 'natural wood',
    roomType: 'living room',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockDescriptionService.prototype.generateDescriptions = jest.fn().mockResolvedValue([
      { title: 'Art 1', description: 'Desc 1', medium: 'Canvas', dimensions: '24x36', placement: 'Center' },
    ]);

    mockImageService.prototype.generatePieceImage = jest.fn().mockResolvedValue({
      data: 'base64data',
      mimeType: 'image/png',
    });

    mockImageService.prototype.generateWallRender = jest.fn().mockResolvedValue({
      data: 'walldata',
      mimeType: 'image/png',
    });

    mockStorageService.prototype.uploadBuffer = jest.fn().mockResolvedValue(undefined);
    mockStorageService.prototype.getSignedUrl = jest.fn().mockResolvedValue('https://signed.url');

    service = new GenerationService();
  });

  it('generateDescriptions delegates to DescriptionService', async () => {
    const result = await service.generateDescriptions(preferences);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Art 1');
  });

  it('generateDescriptions passes previousDescriptions to DescriptionService', async () => {
    const previousDescriptions = [
      { title: 'Art 1', description: 'Desc 1', medium: 'Canvas', dimensions: '24x36', placement: 'Center' },
    ] as any;
    await service.generateDescriptions(preferences, 'more blue', previousDescriptions);
    expect(mockDescriptionService.prototype.generateDescriptions).toHaveBeenCalledWith(
      preferences,
      'more blue',
      previousDescriptions,
      undefined
    );
  });

  it('generateDescriptions forwards userId to DescriptionService', async () => {
    await service.generateDescriptions(preferences, undefined, undefined, 'user-abc');
    expect(mockDescriptionService.prototype.generateDescriptions).toHaveBeenCalledWith(
      preferences,
      undefined,
      undefined,
      'user-abc'
    );
  });

  it('generateImages forwards userId to ImageService', async () => {
    const descriptions = [
      { title: 'Art 1', description: 'Desc 1', medium: 'Canvas', dimensions: '24x36', placement: 'Center' },
    ] as any;
    await service.generateImages('user123', preferences, descriptions);
    expect(mockImageService.prototype.generatePieceImage).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Art 1' }),
      preferences.style,
      'user123'
    );
    expect(mockImageService.prototype.generateWallRender).toHaveBeenCalledWith(
      descriptions,
      preferences.style,
      preferences.roomType,
      'user123'
    );
  });

  it('generateImages creates images and uploads to GCS', async () => {
    const descriptions = [
      { title: 'Art 1', description: 'Desc 1', medium: 'Canvas', dimensions: '24x36', placement: 'Center' },
    ] as any;

    const result = await service.generateImages('user123', preferences, descriptions);
    expect(result.generationId).toBeDefined();
    expect(mockImageService.prototype.generatePieceImage).toHaveBeenCalledTimes(1);
    expect(mockImageService.prototype.generateWallRender).toHaveBeenCalledTimes(1);
    expect(mockStorageService.prototype.uploadBuffer).toHaveBeenCalled();
  });

  it('generateImages stores pieceVersions and wallRenderVersions (not imageRefs/wallRenderRef)', async () => {
    const mockSet = jest.fn().mockResolvedValue(undefined);
    const mockAdd = jest.fn().mockResolvedValue({ id: 'gen123' });
    const { getDb } = require('../config/firebase');
    getDb.mockReturnValue({
      collection: jest.fn().mockReturnValue({
        add: mockAdd,
        doc: jest.fn().mockReturnValue({ set: mockSet, get: jest.fn(), delete: jest.fn() }),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: [] }),
      }),
    });

    service = new GenerationService();
    const descriptions = [
      { title: 'Art 1', description: 'Desc 1', medium: 'Canvas', dimensions: '24x36', placement: 'Center', type: 'poster' as const, position: { x: 50, y: 50 } },
    ];
    await service.generateImages('user123', preferences, descriptions);

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        pieceVersions: [['generations/gen123/piece-0-v0.png']],
        wallRenderVersions: ['generations/gen123/wall-render-v0.png'],
        finalizedAt: null,
        pieceRegenerationCount: 0,
      }),
      { merge: true }
    );
  });

  it('enforceHistoryLimit only evicts finalized generations and uses MAX_FINALIZED_GENERATIONS env var', async () => {
    process.env.MAX_FINALIZED_GENERATIONS = '2';

    const finalizedGen = (id: string) => ({
      id,
      data: () => ({
        userId: 'user123',
        finalizedAt: '2026-01-01T00:00:00.000Z',
        pieceVersions: [['generations/' + id + '/piece-0-v0.png']],
        wallRenderVersions: ['generations/' + id + '/wall-render-v0.png'],
      }),
    });
    const draftGen = {
      id: 'draft1',
      data: () => ({ userId: 'user123', finalizedAt: null, pieceVersions: [], wallRenderVersions: [] }),
    };

    const mockDelete = jest.fn().mockResolvedValue(undefined);
    const { getDb } = require('../config/firebase');
    getDb.mockReturnValue({
      collection: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          docs: [finalizedGen('gen1'), finalizedGen('gen2'), finalizedGen('gen3'), draftGen],
        }),
        doc: jest.fn().mockReturnValue({ delete: mockDelete }),
      }),
    });

    mockStorageService.prototype.deleteFile = jest.fn().mockResolvedValue(undefined);
    service = new GenerationService();
    await service.enforceHistoryLimit('user123');

    // gen3 is the oldest finalized beyond limit=2; gen1 and gen2 are kept; draft is never evicted
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockStorageService.prototype.deleteFile).toHaveBeenCalledWith('generations/gen3/piece-0-v0.png');

    delete process.env.MAX_FINALIZED_GENERATIONS;
  });
});
