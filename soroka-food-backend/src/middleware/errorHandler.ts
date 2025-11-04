import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: any[];

  constructor(message: string, statusCode: number, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log all errors with explicit stdout
  process.stdout.write(`\n!!! ERROR HANDLER CAUGHT ERROR !!!\n`);
  process.stdout.write(`Path: ${req.method} ${req.path}\n`);
  process.stdout.write(`Error message: ${err.message}\n`);
  console.error('!!! ERROR HANDLER:', err);

  if (err instanceof AppError) {
    process.stdout.write(`AppError with status code: ${err.statusCode}\n`);
    res.status(err.statusCode).json({
      error: err.message,
      errors: err.errors,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    return;
  }

  // Unknown errors
  process.stdout.write('Unexpected error (not AppError) - sending 500\n');
  console.error('Unexpected error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
