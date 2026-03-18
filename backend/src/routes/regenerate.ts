import { Router, Request, Response } from 'express';
import { GenerationService } from '../services/generationService';

export const regenerateRouter = Router();
const generationService = new GenerationService();

regenerateRouter.post('/pieces', async (req: Request, res: Response) => {
  try {
    const { generationId, pieces } = req.body;
    const uid = (req as any).user.uid;

    if (!generationId || !pieces || !Array.isArray(pieces) || pieces.length === 0) {
      res.status(400).json({ error: 'Missing generationId or pieces' });
      return;
    }

    const result = await generationService.regeneratePieces(uid, generationId, pieces);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      res.status(403).json({ error: error.message });
    } else if (error.message === 'Generation is finalized') {
      res.status(409).json({ error: error.message });
    } else if (error.message === 'Piece regeneration limit reached') {
      res.status(429).json({ error: error.message });
    } else {
      console.error('Piece regeneration failed:', error);
      res.status(500).json({ error: 'Failed to regenerate pieces' });
    }
  }
});

regenerateRouter.post('/wall-render', async (req: Request, res: Response) => {
  try {
    const { generationId, pieceImageRefs } = req.body;
    const uid = (req as any).user.uid;

    if (!generationId || !pieceImageRefs || !Array.isArray(pieceImageRefs) || pieceImageRefs.length === 0) {
      res.status(400).json({ error: 'Missing generationId or pieceImageRefs' });
      return;
    }

    const wallRenderVersions = await generationService.regenerateWallRender(uid, generationId, pieceImageRefs);
    res.json({ wallRenderVersions });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      res.status(403).json({ error: error.message });
    } else if (error.message === 'Invalid piece image ref') {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Wall render regeneration failed:', error);
      res.status(500).json({ error: 'Failed to regenerate wall render' });
    }
  }
});
