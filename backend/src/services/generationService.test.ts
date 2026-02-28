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

  it('generateImages creates images and uploads to GCS', async () => {
    const descriptions = [
      { title: 'Art 1', description: 'Desc 1', medium: 'Canvas', dimensions: '24x36', placement: 'Center' },
    ];

    const result = await service.generateImages('user123', preferences, descriptions);
    expect(result.generationId).toBeDefined();
    expect(mockImageService.prototype.generatePieceImage).toHaveBeenCalledTimes(1);
    expect(mockImageService.prototype.generateWallRender).toHaveBeenCalledTimes(1);
    expect(mockStorageService.prototype.uploadBuffer).toHaveBeenCalled();
  });
});
