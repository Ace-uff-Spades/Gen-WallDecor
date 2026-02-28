import { DescriptionService } from './descriptionService';
import { UserPreferences } from '../types';

// Mock OpenAI
const mockParse = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        parse: mockParse,
      },
    },
  }));
});

describe('DescriptionService', () => {
  let service: DescriptionService;
  const preferences: UserPreferences = {
    style: 'Bohemian',
    colorScheme: ['warm earth tones', 'terracotta'],
    frameMaterial: 'natural wood',
    roomType: 'living room',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    service = new DescriptionService();
  });

  it('buildPrompt includes style, colors, material, and room type', () => {
    const prompt = service.buildPrompt(preferences);
    expect(prompt).toContain('Bohemian');
    expect(prompt).toContain('warm earth tones');
    expect(prompt).toContain('terracotta');
    expect(prompt).toContain('natural wood');
    expect(prompt).toContain('living room');
  });

  it('buildPrompt includes feedback when provided', () => {
    const prompt = service.buildPrompt(preferences, 'more blue accents');
    expect(prompt).toContain('more blue accents');
  });

  it('buildPrompt includes wallDimensions when provided', () => {
    const preferencesWithDimensions: UserPreferences = {
      ...preferences,
      wallDimensions: { width: 12, height: 8 },
    };
    const prompt = service.buildPrompt(preferencesWithDimensions);
    expect(prompt).toContain('Wall dimensions: 12ft x 8ft');
  });

  it('generateDescriptions calls OpenAI with correct model', async () => {
    mockParse.mockResolvedValue({
      choices: [{
        message: {
          parsed: {
            pieces: [
              {
                title: 'Desert Sunset',
                description: 'A warm-toned abstract painting',
                medium: 'Canvas print',
                dimensions: '24x36 inches',
                placement: 'Center wall, eye level',
              },
            ],
          },
        },
      }],
    });

    const result = await service.generateDescriptions(preferences);
    expect(mockParse).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4o-mini' })
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Desert Sunset');
  });
});
