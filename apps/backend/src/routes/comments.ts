import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { currentUserId, requireAuth } from '../middleware/auth.js';
import * as commentService from '../services/comment.service.js';
import { idParam } from './schemas.js';

export const commentsRouter = Router();

commentsRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    await commentService.deleteComment(id, currentUserId(res));
    res.status(204).end();
  }),
);
