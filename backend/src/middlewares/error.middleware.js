import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
