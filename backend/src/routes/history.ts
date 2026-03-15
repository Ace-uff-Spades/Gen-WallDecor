import { Router, Request, Response } from 'express';
import { GenerationService } from '../services/generationService';
import { StorageService } from '../services/storageService';

export const historyRouter = Router();
const generationService = new GenerationService();
const storageService = new StorageService();

historyRouter.get('/', async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const generations = await generationService.getUserGenerations(uid);
    const recent = generations.slice(0, 3);
    const withUrls = await Promise.all(
      recent.map(async (gen: any) => ({
        ...gen,
        wallRenderUrl: gen.wallRenderRef ? await storageService.getSignedUrl(gen.wallRenderRef) : null,
      }))
    );
    res.json({ generations: withUrls });
  } catch (error) {
    console.error('Failed to fetch history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

historyRouter.get('/:id/pieces/:pieceIndex/download-url', async (req: Request<{ id: string; pieceIndex: string }>, res: Response) => {
  try {
    const generation = await generationService.getGeneration(req.params.id);
    if (!generation) {
      res.status(404).json({ error: 'Generation not found' });
      return;
    }
    if ((generation as any).userId !== (req as any).user.uid) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const pieceIndex = parseInt(req.params.pieceIndex, 10);
    const imageRef = (generation as any).imageRefs?.[pieceIndex];
    if (!imageRef) {
      res.status(404).json({ error: 'Piece not found' });
      return;
    }
    const url = await storageService.getSignedUrl(imageRef, 10 * 60 * 1000);
    res.json({ url });
  } catch (error) {
    console.error('Failed to get download URL:', error);
    res.status(500).json({ error: 'Failed to get download URL' });
  }
});

historyRouter.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const generation = await generationService.getGeneration(req.params.id);
    if (!generation) {
      res.status(404).json({ error: 'Generation not found' });
      return;
    }
    if ((generation as any).userId !== (req as any).user.uid) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const data = generation as any;
    const pieceUrls = data.imageRefs
      ? await Promise.all(data.imageRefs.map((ref: string) => storageService.getSignedUrl(ref)))
      : [];
    const wallRenderUrl = data.wallRenderRef ? await storageService.getSignedUrl(data.wallRenderRef) : null;
    const pieces = pieceUrls.map((imageUrl: string, i: number) => {
      const desc = data.descriptions?.[i];
      return {
        title: desc?.title || `Piece ${i + 1}`,
        imageUrl,
        ...(desc ? {
          description: desc.description,
          medium: desc.medium,
          dimensions: desc.dimensions,
          placement: desc.placement,
        } : {}),
      };
    });
    res.json({ ...generation, pieces, wallRenderUrl });
  } catch (error) {
    console.error('Failed to fetch generation:', error);
    res.status(500).json({ error: 'Failed to fetch generation' });
  }
});
