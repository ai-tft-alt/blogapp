import jwt from 'jsonwebtoken';
import { config } from './config.js';

export interface TokenPayload {
  userId: number;
}

export function signToken(userId: number): string {
  return jwt.sign({ userId } satisfies TokenPayload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (typeof decoded === 'object' && typeof decoded.userId === 'number') {
      return { userId: decoded.userId };
    }
    return null;
  } catch {
    return null;
  }
}
