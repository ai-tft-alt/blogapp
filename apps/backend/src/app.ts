import cors from 'cors';
import express from 'express';
import { config } from './lib/config.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { authRouter } from './routes/auth.js';
import { commentsRouter } from './routes/comments.js';
import { postsRouter } from './routes/posts.js';
import { uploadsRouter } from './routes/uploads.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/uploads', express.static(config.uploadDir));

  const api = express.Router();
  api.get('/health', (_req, res) => {
    res.json({ data: { status: 'ok' } });
  });
  api.use('/auth', authRouter);
  api.use('/posts', postsRouter);
  api.use('/comments', commentsRouter);
  api.use('/uploads', uploadsRouter);

  app.use('/api/v1', api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
