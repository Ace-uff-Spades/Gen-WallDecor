import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService';

export const userRouter = Router();
const userService = new UserService();

userRouter.get('/profile', async (req: Request, res: Response) => {
  try {
    const { uid, email } = (req as any).user;
    const profile = await userService.getOrCreateUser(uid, email);
    res.json(profile);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});
