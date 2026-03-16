import { Router, Request, Response } from 'express';
import { GenerationService } from '../services/generationService';
import { StorageService } from '../services/storageService';
import { ShoppingService } from '../services/shoppingService';

export const historyRouter = Router();
const generationService = new GenerationService();
const storageService = new StorageService();
const shoppingService = new ShoppingService();

historyRouter.get('/', async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const generations = await generationService.getUserGenerations(uid);
    const recent = generations.slice(0, 3);
    const withUrls = await Promise.all(
      recent.map(async (gen: any) => ({
        ...gen,
        wallRenderUrl: gen.wallRenderVersions?.length
          ? await storageService.getSignedUrl(gen.wallRenderVersions[gen.wallRenderVersions.length - 1])
          : null,
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
    const pieceVersions = (generation as any).pieceVersions as string[][] | undefined;
    const versions = pieceVersions?.[pieceIndex];
    const imageRef = versions ? versions[versions.length - 1] : undefined;
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
    const currentPieceRefs: string[] = data.pieceVersions
      ? (data.pieceVersions as string[][]).map(versions => versions[versions.length - 1])
      : [];
    const pieceUrls = await Promise.all(currentPieceRefs.map(ref => storageService.getSignedUrl(ref)));
    const wallRenderUrl = data.wallRenderVersions?.length
      ? await storageService.getSignedUrl((data.wallRenderVersions as string[])[(data.wallRenderVersions as string[]).length - 1])
      : null;
    const pieces = pieceUrls.map((imageUrl: string, i: number) => {
      const desc = data.descriptions?.[i];
      const links = desc ? shoppingService.getLinksForPiece(desc) : null;
      return {
        title: desc?.title || `Piece ${i + 1}`,
        imageUrl,
        links,
        ...(desc ? {
          description: desc.description,
          medium: desc.medium,
          dimensions: desc.dimensions,
          placement: desc.placement,
          type: desc.type,
          position: desc.position,
        } : {}),
      };
    });
    res.json({ ...generation, pieces, wallRenderUrl });
  } catch (error) {
    console.error('Failed to fetch generation:', error);
    res.status(500).json({ error: 'Failed to fetch generation' });
  }
});
