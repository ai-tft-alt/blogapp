import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/jwt.js';
import { unauthorized } from '../lib/http-error.js';

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readToken(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    next(unauthorized());
    return;
  }
  res.locals.userId = payload.userId;
  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = readToken(req);
  const payload = token ? verifyToken(token) : null;
  if (payload) res.locals.userId = payload.userId;
  next();
}

export function viewerId(res: Response): number | undefined {
  return typeof res.locals.userId === 'number' ? res.locals.userId : undefined;
}

export function currentUserId(res: Response): number {
  const id = viewerId(res);
  if (id === undefined) throw unauthorized();
  return id;
}
