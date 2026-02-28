import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';

const userService = new UserService();

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const uid = (req as any).user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const canGenerate = await userService.canGenerate(uid);
  if (!canGenerate) {
    res.status(429).json({ error: 'Daily generation limit reached (10/day)' });
    return;
  }

  next();
}
