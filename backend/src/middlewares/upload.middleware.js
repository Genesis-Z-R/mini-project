import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { env } from '../config/env.js';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

const isS3Mode = () => {
  const driver = (process.env.STORAGE_DRIVER || env.STORAGE_DRIVER || '').toLowerCase();
  const endpoint = process.env.AWS_ENDPOINT_URL_S3 || process.env.S3_ENDPOINT || env.AWS_ENDPOINT_URL_S3;
  const accessKey = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || env.AWS_ACCESS_KEY_ID;
  return driver === 's3' || Boolean(endpoint && accessKey);
};

if (!isS3Mode() && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const customStorage = {
  _handleFile(req, file, cb) {
    if (isS3Mode()) {
      multer.memoryStorage()._handleFile(req, file, cb);
    } else {
      const diskStorage = multer.diskStorage({
        destination: (r, f, c) => c(null, uploadDir),
        filename: (r, f, c) => {
          const ext = path.extname(f.originalname).toLowerCase();
          c(null, `file_${Date.now()}_${crypto.randomUUID()}${ext}`);
        }
      });
      diskStorage._handleFile(req, file, cb);
    }
  },
  _removeFile(req, file, cb) {
    if (isS3Mode()) {
      multer.memoryStorage()._removeFile(req, file, cb);
    } else {
      const diskStorage = multer.diskStorage({ destination: uploadDir });
      diskStorage._removeFile(req, file, cb);
    }
  }
};

const allowedExtensions = /^(pdf|doc|docx|png|jpg|jpeg|gif|webp|mp4)$/i;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowedExtensions.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only academic documents (.pdf, .doc, .docx), images (.png, .jpg, .jpeg, .gif, .webp), and videos (.mp4) are allowed.'));
  }
};

export const upload = multer({
  storage: customStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});
