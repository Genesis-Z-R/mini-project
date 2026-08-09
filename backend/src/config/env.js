import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PORT: z.string().default('8080'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default('EstudySecretKeyForJWTSignatureGeneration32BytesLong!'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),

  // Storage Driver Configuration
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ENDPOINT_URL_S3: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.STORAGE_DRIVER === 's3') {
    if (!data.AWS_ACCESS_KEY_ID) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'AWS_ACCESS_KEY_ID is required when STORAGE_DRIVER=s3', path: ['AWS_ACCESS_KEY_ID'] });
    }
    if (!data.AWS_SECRET_ACCESS_KEY) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'AWS_SECRET_ACCESS_KEY is required when STORAGE_DRIVER=s3', path: ['AWS_SECRET_ACCESS_KEY'] });
    }
    if (!data.AWS_ENDPOINT_URL_S3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'AWS_ENDPOINT_URL_S3 is required when STORAGE_DRIVER=s3', path: ['AWS_ENDPOINT_URL_S3'] });
    }
    if (!data.S3_BUCKET_NAME) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'S3_BUCKET_NAME is required when STORAGE_DRIVER=s3', path: ['S3_BUCKET_NAME'] });
    }
  }
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ FATAL: Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
