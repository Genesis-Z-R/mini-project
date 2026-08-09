import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

// Resolve S3 configuration dynamically across standard AWS / Railway environment variable aliases
const getS3Config = () => {
  const driver = (process.env.STORAGE_DRIVER || env.STORAGE_DRIVER || '').toLowerCase();
  
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID || env.AWS_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY || env.AWS_SECRET_ACCESS_KEY || '';
  const endpoint = process.env.AWS_ENDPOINT_URL_S3 || process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT || env.AWS_ENDPOINT_URL_S3 || '';
  const bucket = process.env.S3_BUCKET_NAME || process.env.BUCKET_NAME || process.env.RAILWAY_BUCKET_NAME || env.S3_BUCKET_NAME || '';
  const publicUrl = process.env.S3_PUBLIC_URL || process.env.PUBLIC_URL || process.env.S3_CUSTOM_DOMAIN || env.S3_PUBLIC_URL || '';
  const region = process.env.AWS_REGION || process.env.S3_REGION || env.AWS_REGION || 'us-east-1';

  // Determine if S3 mode should be active
  const isS3 = driver === 's3' || Boolean(accessKeyId && secretAccessKey && endpoint && bucket);

  return {
    isS3,
    accessKeyId,
    secretAccessKey,
    endpoint,
    bucket,
    publicUrl,
    region
  };
};

const initS3Client = () => {
  const config = getS3Config();
  if (!config.isS3) return null;

  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    },
    forcePathStyle: true
  });
};

let s3Client = initS3Client();

export const StorageService = {
  async saveFile(file) {
    const config = getS3Config();
    const ext = path.extname(file.originalname || '').toLowerCase();
    const filename = file.filename || `file_${Date.now()}_${crypto.randomUUID()}${ext}`;

    if (config.isS3) {
      if (!s3Client) {
        s3Client = initS3Client();
      }

      if (!file.buffer) {
        throw new Error('File buffer is empty. Unable to upload to Object Storage.');
      }

      const contentType = file.mimetype || 'application/octet-stream';

      try {
        await s3Client.send(new PutObjectCommand({
          Bucket: config.bucket,
          Key: filename,
          Body: file.buffer,
          ContentType: contentType
        }));
      } catch (err) {
        console.error('❌ Railway Object Storage S3 Upload Failed:', err);
        throw new Error(`Railway Object Storage Upload Failed: ${err.message || 'Check S3 credentials and endpoint.'}`);
      }

      const publicUrl = config.publicUrl
        ? `${config.publicUrl.replace(/\/+$/, '')}/${filename}`
        : `${config.endpoint.replace(/\/+$/, '')}/${config.bucket}/${filename}`;

      return {
        filename,
        publicUrl
      };
    }

    // Local Disk Fallback
    const publicUrl = `http://localhost:${env.PORT || 8080}/uploads/${filename}`;
    return {
      filename,
      publicUrl
    };
  },

  async getPresignedDownloadUrl(filename, expiresInSeconds = 3600) {
    if (!filename) return null;
    const config = getS3Config();

    if (config.isS3) {
      if (!s3Client) {
        s3Client = initS3Client();
      }
      try {
        const command = new GetObjectCommand({
          Bucket: config.bucket,
          Key: filename
        });
        return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
      } catch (err) {
        console.error('❌ Failed to generate presigned S3 URL:', err);
        throw new Error(`Failed to generate download URL: ${err.message}`);
      }
    }

    // Local Disk Fallback
    return `http://localhost:${env.PORT || 8080}/uploads/${filename}`;
  },

  async deleteFile(filename) {
    if (!filename) return;
    const config = getS3Config();

    if (config.isS3) {
      if (!s3Client) {
        s3Client = initS3Client();
      }
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: config.bucket,
          Key: filename
        }));
      } catch (err) {
        console.warn('⚠️ S3 Object Delete Warning:', err.message);
      }
      return;
    }

    // Local Disk Fallback
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  },

  getFileUrl(filename) {
    const config = getS3Config();
    if (config.isS3) {
      return config.publicUrl
        ? `${config.publicUrl.replace(/\/+$/, '')}/${filename}`
        : `${config.endpoint.replace(/\/+$/, '')}/${config.bucket}/${filename}`;
    }
    return `http://localhost:${env.PORT || 8080}/uploads/${filename}`;
  }
};
