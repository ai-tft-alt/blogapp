import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { currentUserId, requireAuth } from '../middleware/auth.js';
import * as authService from '../services/auth.service.js';
import { loginSchema, registerSchema } from './schemas.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    res.status(201).json({ data: await authService.register(input) });
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    res.json({ data: await authService.login(input) });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ data: await authService.getMe(currentUserId(res)) });
  }),
);
