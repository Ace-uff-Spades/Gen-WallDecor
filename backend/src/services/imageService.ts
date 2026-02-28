import { GoogleGenAI } from '@google/genai';
import { PieceDescription } from '../types';

export interface GeneratedImage {
  data: string; // base64
  mimeType: string;
}

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

The artwork should be photorealistic and suitable for framing. Show only the artwork itself against a clean background, as if photographed for a catalog.`;
  }

  async generatePieceImage(piece: PieceDescription, style: string): Promise<GeneratedImage> {
    const prompt = this.buildPiecePrompt(piece, style);

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: ['Image'],
        imageConfig: { aspectRatio: '4:5' },
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
  ): Promise<GeneratedImage> {
    const pieceList = pieces.map((p, i) =>
      `${i + 1}. "${p.title}" - ${p.description} (${p.medium}, ${p.dimensions}, ${p.placement})`
    ).join('\n');

    const prompt = `Create a photorealistic 3D rendering of a ${roomType} wall decorated in the ${style} interior design style.

The wall features these pieces of decor:
${pieceList}

Show the wall from a slightly angled perspective to give depth. The room should feel lived-in and cohesive. Lighting should be warm and natural. The decor pieces should be arranged according to their placement descriptions.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: ['Image'],
        imageConfig: { aspectRatio: '16:9' },
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
