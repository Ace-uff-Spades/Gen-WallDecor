import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { Langfuse } from 'langfuse';
import { PieceDescription, UserPreferences } from '../types';

const PieceDescriptionSchema = z.object({
  title: z.string(),
  description: z.string(),
  medium: z.string(),
  dimensions: z.string(),
  placement: z.string(),
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

  buildPrompt(preferences: UserPreferences, feedback?: string): string {
    let prompt = `You are an expert interior designer specializing in wall decor curation.

Generate 4-6 wall decor piece descriptions for a ${preferences.roomType} in the ${preferences.style} style.

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

    return prompt;
  }

  async generateDescriptions(preferences: UserPreferences, feedback?: string): Promise<PieceDescription[]> {
    const prompt = this.buildPrompt(preferences, feedback);
    const trace = langfuse.trace({ name: 'generate-descriptions' });
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

    return parsed.pieces;
  }
}
