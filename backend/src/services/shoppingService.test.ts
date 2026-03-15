import { ShoppingService } from './shoppingService';
import { PieceDescription } from '../types';

const basePoster: PieceDescription = {
  title: 'Forest Dawn',
  description: 'A serene forest at dawn',
  medium: 'Giclee Print',
  dimensions: '24x36',
  placement: 'Center',
  type: 'poster',
  position: { x: 50, y: 40 },
  frameRecommendation: {
    material: 'natural wood',
    color: 'warm oak',
    style: 'rustic',
  },
};

const baseObject: PieceDescription = {
  title: 'Ceramic Vase',
  description: 'A small ceramic vase',
  medium: 'Ceramic',
  dimensions: '8x4',
  placement: 'Left shelf',
  type: 'object',
  position: { x: 20, y: 60 },
  mountingRequirements: [
    { name: 'floating shelf', searchQuery: 'floating wall shelf small' },
    { name: 'mounting bracket', searchQuery: 'small shelf mounting bracket' },
  ],
};

describe('ShoppingService', () => {
  let service: ShoppingService;

  beforeEach(() => {
    service = new ShoppingService();
  });

  describe('getFrameUrl', () => {
    it('builds a Google Shopping URL from frameRecommendation and dimensions', () => {
      const url = service.getFrameUrl(basePoster);
      expect(url).toContain('google.com/search');
      expect(url).toContain('tbm=shop');
      expect(url).toContain('rustic');
      expect(url).toContain('natural+wood');
      expect(url).toContain('warm+oak');
      expect(url).toContain('24x36');
    });

    it('returns null if piece has no frameRecommendation', () => {
      const piece = { ...basePoster, frameRecommendation: undefined };
      expect(service.getFrameUrl(piece)).toBeNull();
    });
  });

  describe('getPrintUrl', () => {
    it('builds a Google Shopping URL for printing', () => {
      const url = service.getPrintUrl(basePoster);
      expect(url).toContain('google.com/search');
      expect(url).toContain('tbm=shop');
      expect(url).toContain('print+poster');
      expect(url).toContain('24x36');
    });
  });

  describe('getObjectUrl', () => {
    it('builds a Google Shopping URL from piece title', () => {
      const url = service.getObjectUrl(baseObject);
      expect(url).toContain('google.com/search');
      expect(url).toContain('tbm=shop');
      expect(url).toContain('Ceramic+Vase');
    });
  });

  describe('getMountingUrls', () => {
    it('returns one URL per mounting requirement', () => {
      const urls = service.getMountingUrls(baseObject);
      expect(urls).toHaveLength(2);
      expect(urls[0].name).toBe('floating shelf');
      expect(urls[0].url).toContain('floating+wall+shelf+small');
      expect(urls[1].name).toBe('mounting bracket');
    });

    it('returns empty array if no mounting requirements', () => {
      const piece = { ...baseObject, mountingRequirements: undefined };
      expect(service.getMountingUrls(piece)).toEqual([]);
    });
  });

  describe('getLinksForPiece', () => {
    it('returns frame and print links for posters', () => {
      const links = service.getLinksForPiece(basePoster);
      expect(links.frameUrl).toBeTruthy();
      expect(links.printUrl).toBeTruthy();
      expect(links.objectUrl).toBeNull();
      expect(links.mountingUrls).toHaveLength(0);
    });

    it('returns object and mounting links for objects', () => {
      const links = service.getLinksForPiece(baseObject);
      expect(links.objectUrl).toBeTruthy();
      expect(links.mountingUrls).toHaveLength(2);
      expect(links.frameUrl).toBeNull();
      expect(links.printUrl).toBeNull();
    });
  });
});
