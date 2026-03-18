import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { authenticate } from './middleware/authenticate';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { generateRouter } from './routes/generate';
import { historyRouter } from './routes/history';
import { userRouter } from './routes/user';
import { adminRouter } from './routes/admin';
import { regenerateRouter } from './routes/regenerate';
import { generationsRouter } from './routes/generations';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
}));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Protected routes
app.use('/api/generate', authenticate, rateLimitMiddleware, generateRouter);
app.use('/api/history', authenticate, historyRouter);
app.use('/api/user', authenticate, userRouter);
app.use('/api/admin', authenticate, adminRouter);
app.use('/api/generate', authenticate, regenerateRouter);       // pieces + wall-render, no rate limit
app.use('/api/generations', authenticate, generationsRouter);   // finalize

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
