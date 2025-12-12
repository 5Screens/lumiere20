const logger = require('../config/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  // Prisma errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          error: 'Unique constraint violation',
          message: 'A record with this value already exists',
          field: err.meta?.target,
        });
      case 'P2025':
        return res.status(404).json({
          error: 'Record not found',
          message: 'The requested record does not exist',
        });
      case 'P2003':
        return res.status(400).json({
          error: 'Foreign key constraint failed',
          message: 'Referenced record does not exist',
        });
      case 'P2011':
        return res.status(400).json({
          error: 'Null constraint violation',
          message: `Required field is missing: ${err.meta?.constraint || 'unknown'}`,
          field: err.meta?.constraint,
        });
      case 'P2012':
        return res.status(400).json({
          error: 'Missing required value',
          message: `A required value is missing: ${err.meta?.path || 'unknown'}`,
          field: err.meta?.path,
        });
      default:
        break;
    }
  }

  // Prisma validation errors (client-side validation before query)
  if (err.name === 'PrismaClientValidationError') {
    // Extract field name from error message like "Argument `display_order` must not be null"
    const fieldMatch = err.message.match(/Argument `(\w+)` must not be null/);
    const field = fieldMatch ? fieldMatch[1] : null;
    
    return res.status(400).json({
      error: 'Validation error',
      message: field 
        ? `Required field is missing: ${field}` 
        : 'A required field is missing or invalid',
      field: field,
    });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'The provided token is invalid',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'The provided token has expired',
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
