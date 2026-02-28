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

historyRouter.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const generation = await generationService.getGeneration(req.params.id);
    if (!generation) {
      res.status(404).json({ error: 'Generation not found' });
      return;
    }
    const data = generation as any;
    const pieceUrls = data.imageRefs
      ? await Promise.all(data.imageRefs.map((ref: string) => storageService.getSignedUrl(ref)))
      : [];
    const wallRenderUrl = data.wallRenderRef ? await storageService.getSignedUrl(data.wallRenderRef) : null;
    res.json({ ...generation, pieceUrls, wallRenderUrl });
  } catch (error) {
    console.error('Failed to fetch generation:', error);
    res.status(500).json({ error: 'Failed to fetch generation' });
  }
});
