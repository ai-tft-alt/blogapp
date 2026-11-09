import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { currentUserId, optionalAuth, requireAuth, viewerId } from '../middleware/auth.js';
import * as postService from '../services/post.service.js';
import * as commentService from '../services/comment.service.js';
import * as likeService from '../services/like.service.js';
import {
  commentSchema,
  createPostSchema,
  idParam,
  listQuerySchema,
  updatePostSchema,
} from './schemas.js';

export const postsRouter = Router();

postsRouter.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { page, limit } = listQuerySchema.parse(req.query);
    res.json({ data: await postService.listPublished(page, limit, viewerId(res)) });
  }),
);

postsRouter.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ data: await postService.listMine(currentUserId(res)) });
  }),
);

postsRouter.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    res.json({ data: await postService.getPost(id, viewerId(res)) });
  }),
);

postsRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = createPostSchema.parse(req.body);
    res.status(201).json({ data: await postService.createPost(currentUserId(res), input) });
  }),
);

postsRouter.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const input = updatePostSchema.parse(req.body);
    res.json({ data: await postService.updatePost(id, currentUserId(res), input) });
  }),
);

postsRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    await postService.deletePost(id, currentUserId(res));
    res.status(204).end();
  }),
);

postsRouter.put(
  '/:id/like',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    res.json({ data: await likeService.likePost(id, currentUserId(res)) });
  }),
);

postsRouter.delete(
  '/:id/like',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    res.json({ data: await likeService.unlikePost(id, currentUserId(res)) });
  }),
);

postsRouter.get(
  '/:id/comments',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    res.json({ data: await commentService.listComments(id, viewerId(res)) });
  }),
);

postsRouter.post(
  '/:id/comments',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const { content } = commentSchema.parse(req.body);
    res
      .status(201)
      .json({ data: await commentService.createComment(id, currentUserId(res), content) });
  }),
);
