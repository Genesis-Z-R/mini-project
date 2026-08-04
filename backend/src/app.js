import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import routes from './routes/index.js';
import { env } from './config/env.js';
import { setupSwagger } from './swagger.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

const allowedOrigins = (env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(',');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

// Public static file uploads directory
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (ext === '.docx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } else if (ext === '.doc') {
      res.setHeader('Content-Type', 'application/msword');
    } else if (ext === '.mp4') {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.webp') {
      res.setHeader('Content-Type', 'image/webp');
    }
  }
}));

// Master API Routes
app.use('/api', routes);

// Swagger API Documentation
setupSwagger(app);

// Global Error Handler
app.use(errorHandler);

export default app;
