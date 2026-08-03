import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `file_${Date.now()}_${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  }
});

const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|txt|mp4/;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only documents, images, and videos are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});
