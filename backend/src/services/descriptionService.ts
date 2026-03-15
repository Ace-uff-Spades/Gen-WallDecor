import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { Langfuse } from 'langfuse';
import { PieceDescription, UserPreferences } from '../types';

const FrameRecommendationSchema = z.object({
  material: z.string(),
  color: z.string(),
  style: z.string(),
});

const MountingRequirementSchema = z.object({
  name: z.string(),
  searchQuery: z.string(),
});

const PieceDescriptionSchema = z.object({
  title: z.string(),
  description: z.string(),
  medium: z.string(),
  dimensions: z.string(),
  placement: z.string(),
  type: z.enum(['poster', 'object']),
  position: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }),
  // OpenAI structured output requires all fields; use nullable + transform to undefined for compatibility
  frameRecommendation: FrameRecommendationSchema.nullable(),
  mountingRequirements: z.array(MountingRequirementSchema).nullable(),
});

const DescriptionsResponseSchema = z.object({
  pieces: z.array(PieceDescriptionSchema),
});

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
  flushAt: 1,
});

export class DescriptionService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  buildPrompt(preferences: UserPreferences, feedback?: string, previousDescriptions?: PieceDescription[]): string {
    let prompt = `You are an expert interior designer specializing in wall decor curation.`;

    if (previousDescriptions && previousDescriptions.length > 0) {
      const formatted = previousDescriptions.map((p, i) =>
        `Piece ${i + 1}: ${p.title}\n  Description: ${p.description}\n  Medium: ${p.medium}\n  Dimensions: ${p.dimensions}\n  Placement: ${p.placement}`
      ).join('\n\n');

      prompt += `\n\nHere are the current wall decor descriptions for a ${preferences.roomType} in the ${preferences.style} style:\n\n${formatted}`;
      prompt += `\n\nColor scheme: ${preferences.colorScheme.join(', ')}\nFrame material: ${preferences.frameMaterial}`;
      if (preferences.wallDimensions) {
        prompt += `\nWall dimensions: ${preferences.wallDimensions.width}ft x ${preferences.wallDimensions.height}ft`;
      }
      if (feedback) {
        prompt += `\n\nUser feedback: ${feedback}`;
      }
      prompt += `\n\nRefine these descriptions based on the feedback. Keep pieces that are working well and modify those that need changing. Return exactly 4-6 pieces.`;

      prompt += `\n\nFor each piece, you must also provide:
- "type": "poster" if the piece is flat wall art (prints, paintings, photographs, canvas); "object" if it is a 3D decorative item (vase, sculpture, plant, figurine, clock, etc.)
- "position": approximate center position of this piece on the wall as { "x": 0-100, "y": 0-100 } percentages, based on the placement you are describing
- "frameRecommendation" (poster type only): the ideal frame for this piece given the style "${preferences.style}", color scheme "${preferences.colorScheme.join(', ')}", room "${preferences.roomType}", and preferred material "${preferences.frameMaterial}". Include: material, color, style.
- "mountingRequirements" (object type only): list of additional items needed to display this piece on a wall (e.g. floating shelf, mounting bracket, picture ledge). Each item needs a "name" and a "searchQuery" suitable for Google Shopping.`;
    } else {
      prompt += `\n\nGenerate 4-6 wall decor piece descriptions for a ${preferences.roomType} in the ${preferences.style} style.

Color scheme: ${preferences.colorScheme.join(', ')}
Frame material: ${preferences.frameMaterial}
${preferences.wallDimensions ? `Wall dimensions: ${preferences.wallDimensions.width}ft x ${preferences.wallDimensions.height}ft` : ''}

Each piece should:
- Be cohesive with the overall style and color scheme
- Vary in size and type (mix of prints, paintings, photographs, decorative objects)
- Include specific placement suggestions for visual balance
- Use the specified frame material where applicable

Provide exactly 4-6 pieces that work together as a curated collection.`;

      if (feedback) {
        prompt += `\n\nUser feedback on previous generation: ${feedback}`;
      }

      prompt += `\n\nFor each piece, you must also provide:
- "type": "poster" if the piece is flat wall art (prints, paintings, photographs, canvas); "object" if it is a 3D decorative item (vase, sculpture, plant, figurine, clock, etc.)
- "position": approximate center position of this piece on the wall as { "x": 0-100, "y": 0-100 } percentages, based on the placement you are describing
- "frameRecommendation" (poster type only): the ideal frame for this piece given the style "${preferences.style}", color scheme "${preferences.colorScheme.join(', ')}", room "${preferences.roomType}", and preferred material "${preferences.frameMaterial}". Include: material, color, style.
- "mountingRequirements" (object type only): list of additional items needed to display this piece on a wall (e.g. floating shelf, mounting bracket, picture ledge). Each item needs a "name" and a "searchQuery" suitable for Google Shopping.`;
    }

    return prompt;
  }

  async generateDescriptions(preferences: UserPreferences, feedback?: string, previousDescriptions?: PieceDescription[], userId?: string): Promise<PieceDescription[]> {
    const prompt = this.buildPrompt(preferences, feedback, previousDescriptions);
    const trace = langfuse.trace({ name: 'generate-descriptions', userId });
    const generation = trace.generation({
      name: 'gpt-4o-mini-descriptions',
      model: 'gpt-4o-mini',
      input: prompt,
    });

    const response = await this.client.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert interior designer. Return structured JSON descriptions of wall decor pieces.' },
        { role: 'user', content: prompt },
      ],
      response_format: zodResponseFormat(DescriptionsResponseSchema, 'descriptions'),
    });

    generation.end({
      usage: {
        input: response.usage?.prompt_tokens,
        output: response.usage?.completion_tokens,
        total: response.usage?.total_tokens,
      },
    });

    const parsed = response.choices[0].message.parsed;
    if (!parsed) {
      throw new Error('Failed to parse description response');
    }

    return parsed.pieces.map(piece => ({
      ...piece,
      frameRecommendation: piece.frameRecommendation ?? undefined,
      mountingRequirements: piece.mountingRequirements ?? undefined,
    }));
  }
}
