import { ImageService } from './imageService';
import { PieceDescription } from '../types';

const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

describe('ImageService', () => {
  let service: ImageService;

  const description: PieceDescription = {
    title: 'Desert Sunset',
    description: 'A warm abstract painting with terracotta and burnt orange',
    medium: 'Canvas print',
    dimensions: '24x36 inches',
    placement: 'Center wall',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
    service = new ImageService();
  });

  it('buildPiecePrompt includes description details', () => {
    const prompt = service.buildPiecePrompt(description, 'Bohemian');
    expect(prompt).toContain('Desert Sunset');
    expect(prompt).toContain('warm abstract painting');
    expect(prompt).toContain('Bohemian');
    expect(prompt).toContain('Canvas print');
  });

  it('generatePieceImage returns base64 image data', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{
            inlineData: {
              data: 'base64imagedata',
              mimeType: 'image/png',
            },
          }],
        },
      }],
    });

    const result = await service.generatePieceImage(description, 'Bohemian');
    expect(result.data).toBe('base64imagedata');
    expect(result.mimeType).toBe('image/png');
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-2.5-flash-image' })
    );
  });

  it('generateWallRender includes room context in prompt', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{
            inlineData: { data: 'wallrenderdata', mimeType: 'image/png' },
          }],
        },
      }],
    });

    const pieces = [description];
    const result = await service.generateWallRender(pieces, 'Bohemian', 'living room');
    expect(result.data).toBe('wallrenderdata');
  });

  it('throws if no image in response', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{ text: 'No image generated' }],
        },
      }],
    });

    await expect(service.generatePieceImage(description, 'Bohemian'))
      .rejects.toThrow('No image in response');
  });
});
