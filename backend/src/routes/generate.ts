import { Router, Request, Response } from 'express';
import { GenerationService } from '../services/generationService';
import { UserService } from '../services/userService';

export const generateRouter = Router();
const generationService = new GenerationService();
const userService = new UserService();

generateRouter.post('/descriptions', async (req: Request, res: Response) => {
  try {
    const { preferences, feedback } = req.body;
    if (!preferences || !preferences.style || !preferences.roomType) {
      res.status(400).json({ error: 'Missing required preferences (style, roomType)' });
      return;
    }
    const descriptions = await generationService.generateDescriptions(preferences, feedback);
    res.json({ descriptions });
  } catch (error: any) {
    console.error('Description generation failed:', error);
    res.status(500).json({ error: 'Failed to generate descriptions' });
  }
});

generateRouter.post('/images', async (req: Request, res: Response) => {
  try {
    const { preferences, descriptions } = req.body;
    const uid = (req as any).user.uid;
    if (!preferences || !descriptions || !descriptions.length) {
      res.status(400).json({ error: 'Missing preferences or descriptions' });
      return;
    }
    const result = await generationService.generateImages(uid, preferences, descriptions);
    await userService.incrementGenerationCount(uid);
    await generationService.enforceHistoryLimit(uid);
    res.json(result);
  } catch (error: any) {
    console.error('Image generation failed:', error);
    res.status(500).json({ error: 'Failed to generate images' });
  }
});
