import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import logger from '../config/logger.js';

// Custom API Error class
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export const Errors = {
  // Authentication errors
  UNAUTHORIZED: (message = 'Authentication required') => 
    new ApiError(401, 'UNAUTHORIZED', message),
  FORBIDDEN: (message = 'Access denied') => 
    new ApiError(403, 'FORBIDDEN', message),
  TOKEN_EXPIRED: () => 
    new ApiError(401, 'TOKEN_EXPIRED', 'Token has expired'),
  INVALID_TOKEN: () => 
    new ApiError(401, 'INVALID_TOKEN', 'Invalid token'),
  
  // Resource errors
  NOT_FOUND: (resource = 'Resource') => 
    new ApiError(404, 'NOT_FOUND', `${resource} not found`),
  ALREADY_EXISTS: (resource = 'Resource') => 
    new ApiError(409, 'ALREADY_EXISTS', `${resource} already exists`),
  
  // Validation errors
  VALIDATION_ERROR: (details: Record<string, string[]>) => 
    new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', details),
  INVALID_INPUT: (message = 'Invalid input') => 
    new ApiError(400, 'INVALID_INPUT', message),
  
  // Business logic errors
  INSUFFICIENT_FUNDS: () => 
    new ApiError(400, 'INSUFFICIENT_FUNDS', 'Insufficient funds'),
  ESCROW_INVALID_STATE: (message = 'Invalid escrow state') => 
    new ApiError(400, 'ESCROW_INVALID_STATE', message),
  VERIFICATION_REQUIRED: () => 
    new ApiError(403, 'VERIFICATION_REQUIRED', 'User verification required'),
  
  // Server errors
  INTERNAL_ERROR: () => 
    new ApiError(500, 'INTERNAL_ERROR', 'Internal server error'),
  SERVICE_UNAVAILABLE: (message = 'Service temporarily unavailable') => 
    new ApiError(503, 'SERVICE_UNAVAILABLE', message),
};

// Global error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error('Error occurred:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Handle known error types
  
  // Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    err.errors.forEach((error) => {
      const path = error.path.join('.');
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(error.message);
    });

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details,
      },
    });
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.[0] || 'field';
      res.status(409).json({
        success: false,
        message: 'Resource already exists',
        error: {
          code: 'ALREADY_EXISTS',
          message: `A record with this ${field} already exists`,
        },
      });
      return;
    }

    // Record not found
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Resource not found',
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found',
        },
      });
      return;
    }

    // Foreign key constraint
    if (err.code === 'P2003') {
      res.status(400).json({
        success: false,
        message: 'Invalid reference',
        error: {
          code: 'INVALID_REFERENCE',
          message: 'Referenced resource does not exist',
        },
      });
      return;
    }
  }

  // Prisma validation error
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: 'Invalid data',
      error: {
        code: 'INVALID_DATA',
        message: 'Provided data is invalid or incomplete',
      },
    });
    return;
  }

  // Custom API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: {
        code: 'INVALID_TOKEN',
        message: 'The provided token is invalid',
      },
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'The token has expired',
      },
    });
    return;
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    let message = 'File upload error';
    if (err.message === 'File too large') {
      message = 'File size exceeds the limit';
    } else if (err.message === 'Too many files') {
      message = 'Too many files uploaded';
    } else if (err.message === 'Unexpected field') {
      message = 'Invalid file field';
    }

    res.status(400).json({
      success: false,
      message,
      error: {
        code: 'FILE_UPLOAD_ERROR',
        message,
      },
    });
    return;
  }

  // Syntax errors (malformed JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON',
      error: {
        code: 'INVALID_JSON',
        message: 'Request body contains invalid JSON',
      },
    });
    return;
  }

  // Default: Internal server error
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: {
      code: 'INTERNAL_ERROR',
      message: isDevelopment ? err.message : 'An unexpected error occurred',
      ...(isDevelopment && { stack: err.stack }),
    },
  });
}

// 404 handler
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    },
  });
}

// Async handler wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Request validator wrapper
export function validateRequest<T>(
  schema: { parse: (data: unknown) => T },
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      // Attach validated data to request
      (req as unknown as Record<string, unknown>)[`validated${source.charAt(0).toUpperCase() + source.slice(1)}`] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!details[path]) {
            details[path] = [];
          }
          details[path].push(err.message);
        });

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details,
          },
        });
        return;
      }
      next(error);
    }
  };
}
