import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { config } from '../lib/config.js';
import { HttpError } from '../lib/http-error.js';
import { requireAuth } from '../middleware/auth.js';

const allowedTypes: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

mkdirSync(config.uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (_req, file, cb) => {
      const ext = allowedTypes[file.mimetype] ?? path.extname(file.originalname);
      cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: config.maxUploadBytes },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in allowedTypes) {
      cb(null, true);
    } else {
      cb(
        new HttpError(400, 'INVALID_FILE_TYPE', 'jpeg, png, gif, webp 이미지만 올릴 수 있습니다.'),
      );
    }
  },
});

export const uploadsRouter = Router();

uploadsRouter.post('/image', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    throw new HttpError(400, 'FILE_REQUIRED', 'image 필드로 이미지 파일을 보내세요.');
  }
  res.status(201).json({ data: { url: `uploads/${req.file.filename}` } });
});
