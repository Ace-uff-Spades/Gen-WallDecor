import { StorageService } from './storageService';

const mockSave = jest.fn(() => Promise.resolve());
const mockDelete = jest.fn(() => Promise.resolve());
const mockGetSignedUrl = jest.fn(() => Promise.resolve(['https://signed-url.example.com']));

const mockFile = jest.fn(() => ({
  save: mockSave,
  delete: mockDelete,
  getSignedUrl: mockGetSignedUrl,
}));

jest.mock('../config/firebase', () => ({
  getBucket: jest.fn(() => ({
    file: mockFile,
  })),
}));

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StorageService();
  });

  it('uploadBuffer calls file.save with correct params', async () => {
    const buffer = Buffer.from('fake-image-data');
    const path = 'generations/gen123/piece-1.png';

    await service.uploadBuffer(buffer, path, 'image/png');

    expect(mockFile).toHaveBeenCalledWith(path);
    expect(mockSave).toHaveBeenCalledWith(buffer, {
      metadata: { contentType: 'image/png' },
    });
  });

  it('getSignedUrl returns a URL', async () => {
    const url = await service.getSignedUrl('some/path.png');
    expect(url).toBe('https://signed-url.example.com');
  });

  it('deleteFile calls file.delete', async () => {
    await service.deleteFile('some/path.png');
    expect(mockDelete).toHaveBeenCalled();
  });
});
