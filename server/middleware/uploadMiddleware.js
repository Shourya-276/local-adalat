/**
 * @file uploadMiddleware.js
 * @description Multer configuration with security extension and MIME-type validation.
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const BLOCKED_EXTENSIONS = ['.exe', '.php', '.js', '.sh', '.bat', '.cmd', '.html', '.htm', '.py', '.pl', '.cgi', '.vbs', '.jar', '.scr'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `media-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Security Restriction: Files with extension '${ext}' are strictly prohibited.`));
  }

  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only Image and Video media files are allowed.'));
  }
};

export const uploadMedia = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter
});
