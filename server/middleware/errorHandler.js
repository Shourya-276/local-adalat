/**
 * @file errorHandler.js
 * @description Centralized Express Error Handling Middleware.
 * Formats clean, standardized JSON API error responses.
 */

export function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  console.error(`[API Error] [${req.method} ${req.originalUrl}] ${err.message}`);

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: process.env.NODE_ENV === 'development' ? [err.stack] : []
  });
}
