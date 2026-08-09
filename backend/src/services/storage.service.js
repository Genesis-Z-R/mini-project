import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

const s3Client = env.STORAGE_DRIVER === 's3'
  ? new S3Client({
      region: env.AWS_REGION || 'us-east-1',
      endpoint: env.AWS_ENDPOINT_URL_S3,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY || ''
      },
      forcePathStyle: true
    })
  : null;

export const StorageService = {
  async saveFile(file) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const filename = file.filename || `file_${Date.now()}_${crypto.randomUUID()}${ext}`;

    if (env.STORAGE_DRIVER === 's3') {
      const bucket = env.S3_BUCKET_NAME;
      const contentType = file.mimetype || 'application/octet-stream';

      await s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: file.buffer,
        ContentType: contentType
      }));

      const publicUrl = env.S3_PUBLIC_URL
        ? `${env.S3_PUBLIC_URL.replace(/\/+$/, '')}/${filename}`
        : `${env.AWS_ENDPOINT_URL_S3.replace(/\/+$/, '')}/${bucket}/${filename}`;

      return {
        filename,
        publicUrl
      };
    }

    const publicUrl = `http://localhost:${env.PORT || 8080}/uploads/${filename}`;
    return {
      filename,
      publicUrl
    };
  },

  async deleteFile(filename) {
    if (!filename) return;

    if (env.STORAGE_DRIVER === 's3') {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: filename
      }));
      return;
    }

    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  },

  getFileUrl(filename) {
    if (env.STORAGE_DRIVER === 's3') {
      const bucket = env.S3_BUCKET_NAME;
      return env.S3_PUBLIC_URL
        ? `${env.S3_PUBLIC_URL.replace(/\/+$/, '')}/${filename}`
        : `${env.AWS_ENDPOINT_URL_S3.replace(/\/+$/, '')}/${bucket}/${filename}`;
    }
    return `http://localhost:${env.PORT || 8080}/uploads/${filename}`;
  }
};
