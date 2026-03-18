import { Router, Request, Response } from 'express';
import { GenerationService } from '../services/generationService';

export const generationsRouter = Router();
const generationService = new GenerationService();

generationsRouter.post('/:id/finalize', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    await generationService.finalizeGeneration(uid, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      res.status(403).json({ error: error.message });
    } else if (error.message === 'Already finalized') {
      res.status(409).json({ error: error.message });
    } else {
      console.error('Finalize failed:', error);
      res.status(500).json({ error: 'Failed to finalize generation' });
    }
  }
});
