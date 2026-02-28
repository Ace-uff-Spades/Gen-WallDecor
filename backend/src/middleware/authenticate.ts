import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseApp } from '../config/firebase';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Test bypass
  if (process.env.AUTH_DISABLED === 'true') {
    (req as any).user = { uid: 'test-user', email: 'test@test.com' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    getFirebaseApp();
    const decodedToken = await getAuth().verifyIdToken(idToken);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}
