import { GoogleGenAI } from '@google/genai';
import { Langfuse } from 'langfuse';
import { PieceDescription } from '../types';

export interface GeneratedImage {
  data: string; // base64
  mimeType: string;
}

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
  flushAt: 1,
});

export class ImageService {
  private ai: InstanceType<typeof GoogleGenAI>;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }

  buildPiecePrompt(piece: PieceDescription, style: string): string {
    return `Create a high-quality wall art piece in the ${style} interior design style.

Title: ${piece.title}
Description: ${piece.description}
Medium: ${piece.medium}
Dimensions: ${piece.dimensions}

The artwork should be photorealistic. Show only the artwork itself against a clean white background, as if photographed for a catalog. Show only the art — no border, no mat, no mounting hardware, no surrounding decoration.`;
  }

  async generatePieceImage(piece: PieceDescription, style: string, userId?: string): Promise<GeneratedImage> {
    const prompt = this.buildPiecePrompt(piece, style);
    const trace = langfuse.trace({ name: 'generate-piece-image', userId });
    const generation = trace.generation({
      name: 'gemini-piece-image',
      model: 'gemini-2.5-flash-image',
      input: prompt,
    });

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: ['Image'],
        imageConfig: { aspectRatio: '4:5' },
      },
    });

    generation.end({
      usage: {
        input: response.usageMetadata?.promptTokenCount,
        output: response.usageMetadata?.candidatesTokenCount,
        total: response.usageMetadata?.totalTokenCount,
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error('No response from image model');

    for (const part of parts) {
      if (part.inlineData) {
        return {
          data: part.inlineData.data!,
          mimeType: part.inlineData.mimeType!,
        };
      }
    }

    throw new Error('No image in response');
  }

  async generateWallRender(
    pieces: PieceDescription[],
    style: string,
    roomType: string,
    userId?: string,
  ): Promise<GeneratedImage> {
    const pieceList = pieces.map((p, i) =>
      `${i + 1}. "${p.title}" - ${p.description} (${p.medium}, ${p.dimensions}, ${p.placement})`
    ).join('\n');

    const prompt = `Create a photorealistic 3D rendering of a ${roomType} wall decorated in the ${style} interior design style.

The wall features these pieces of decor:
${pieceList}

Show the wall from a slightly angled perspective to give depth. The room should feel lived-in and cohesive. Lighting should be warm and natural. The decor pieces should be arranged according to their placement descriptions.`;

    const trace = langfuse.trace({ name: 'generate-wall-render', userId });
    const generation = trace.generation({
      name: 'gemini-wall-render',
      model: 'gemini-2.5-flash-image',
      input: prompt,
    });

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: ['Image'],
        imageConfig: { aspectRatio: '16:9' },
      },
    });

    generation.end({
      usage: {
        input: response.usageMetadata?.promptTokenCount,
        output: response.usageMetadata?.candidatesTokenCount,
        total: response.usageMetadata?.totalTokenCount,
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error('No response from image model');

    for (const part of parts) {
      if (part.inlineData) {
        return {
          data: part.inlineData.data!,
          mimeType: part.inlineData.mimeType!,
        };
      }
    }

    throw new Error('No image in response');
  }
}
