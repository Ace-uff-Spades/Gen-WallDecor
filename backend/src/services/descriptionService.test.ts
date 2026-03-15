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

// Mock Langfuse — functions defined inside factory to avoid jest hoisting issues.
// Access them in tests via jest.requireMock('langfuse').__traceMock
jest.mock('langfuse', () => {
  const traceMock = jest.fn().mockReturnValue({
    generation: jest.fn().mockReturnValue({ end: jest.fn() }),
  });
  return {
    Langfuse: jest.fn().mockReturnValue({ trace: traceMock }),
    __traceMock: traceMock,
  };
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

  it('buildPrompt with previousDescriptions uses refinement instruction', () => {
    const previousDescriptions = [
      { title: 'Desert Sunset', description: 'A warm painting', medium: 'Canvas', dimensions: '24x36', placement: 'Center' },
      { title: 'Woven Tapestry', description: 'A textured wall hanging', medium: 'Fiber art', dimensions: '18x24', placement: 'Left side' },
    ] as any;
    const prompt = service.buildPrompt(preferences, undefined, previousDescriptions);
    expect(prompt).toContain('Desert Sunset');
    expect(prompt).toContain('Woven Tapestry');
    expect(prompt).toContain('Refine');
  });

  it('buildPrompt with previousDescriptions and feedback labels feedback correctly', () => {
    const previousDescriptions = [
      { title: 'Desert Sunset', description: 'A warm painting', medium: 'Canvas', dimensions: '24x36', placement: 'Center' },
    ] as any;
    const prompt = service.buildPrompt(preferences, 'more blue', previousDescriptions);
    expect(prompt).toContain('more blue');
    expect(prompt).toContain('User feedback:');
    expect(prompt).toContain('Refine');
  });

  it('buildPrompt without previousDescriptions uses fresh generation instruction', () => {
    const prompt = service.buildPrompt(preferences);
    expect(prompt).toContain('Generate 4-6');
    expect(prompt).not.toContain('Refine');
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

  it('returns pieces with type field set to poster or object', async () => {
    mockParse.mockResolvedValue({
      choices: [{
        message: {
          parsed: {
            pieces: [{
              title: 'Forest Print',
              description: 'A print',
              medium: 'Giclee',
              dimensions: '24x36',
              placement: 'Center',
              type: 'poster',
              position: { x: 50, y: 40 },
              frameRecommendation: { material: 'wood', color: 'oak', style: 'rustic' },
            }],
          },
        },
      }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    });

    const result = await service.generateDescriptions(preferences);
    expect(result[0].type).toBe('poster');
    expect(result[0].position).toEqual({ x: 50, y: 40 });
    expect(result[0].frameRecommendation).toBeDefined();
  });

  it('returns object pieces with mountingRequirements and no frameRecommendation', async () => {
    mockParse.mockResolvedValue({
      choices: [{
        message: {
          parsed: {
            pieces: [{
              title: 'Ceramic Vase',
              description: 'A vase',
              medium: 'Ceramic',
              dimensions: '8x4',
              placement: 'Left',
              type: 'object',
              position: { x: 20, y: 60 },
              mountingRequirements: [
                { name: 'floating shelf', searchQuery: 'floating shelf small' },
              ],
            }],
          },
        },
      }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    });

    const result = await service.generateDescriptions(preferences);
    expect(result[0].type).toBe('object');
    expect(result[0].mountingRequirements).toHaveLength(1);
    expect(result[0].frameRecommendation).toBeUndefined();
  });

  it('generateDescriptions passes userId to Langfuse trace', async () => {
    mockParse.mockResolvedValue({
      choices: [{ message: { parsed: { pieces: [] } } }],
    });

    const { __traceMock } = jest.requireMock('langfuse');
    await service.generateDescriptions(preferences, undefined, undefined, 'user-abc');
    expect(__traceMock).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-abc' }));
  });
});
