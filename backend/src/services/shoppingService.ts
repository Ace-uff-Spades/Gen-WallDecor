import { PieceDescription } from '../types';

const BASE = 'https://www.google.com/search?tbm=shop&q=';

function encode(s: string): string {
  return encodeURIComponent(s).replace(/%20/g, '+');
}

export interface PieceLinks {
  frameUrl: string | null;
  printUrl: string | null;
  objectUrl: string | null;
  mountingUrls: { name: string; url: string }[];
}

export class ShoppingService {
  getFrameUrl(piece: PieceDescription): string | null {
    if (!piece.frameRecommendation) return null;
    const { style, material, color } = piece.frameRecommendation;
    const query = `${style} ${material} ${color} picture frame ${piece.dimensions}`;
    return `${BASE}${encode(query)}`;
  }

  getPrintUrl(piece: PieceDescription): string {
    const query = `print poster ${piece.dimensions}`;
    return `${BASE}${encode(query)}`;
  }

  getObjectUrl(piece: PieceDescription): string {
    const query = `${piece.title} wall decor`;
    return `${BASE}${encode(query)}`;
  }

  getMountingUrls(piece: PieceDescription): { name: string; url: string }[] {
    if (!piece.mountingRequirements?.length) return [];
    return piece.mountingRequirements.map(req => ({
      name: req.name,
      url: `${BASE}${encode(req.searchQuery)}`,
    }));
  }

  getLinksForPiece(piece: PieceDescription): PieceLinks {
    if (piece.type === 'poster') {
      return {
        frameUrl: this.getFrameUrl(piece),
        printUrl: this.getPrintUrl(piece),
        objectUrl: null,
        mountingUrls: [],
      };
    }
    return {
      frameUrl: null,
      printUrl: null,
      objectUrl: this.getObjectUrl(piece),
      mountingUrls: this.getMountingUrls(piece),
    };
  }
}
