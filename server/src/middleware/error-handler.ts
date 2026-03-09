import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { error as errorResponse } from '../lib/api-response';
import { AppError } from '../lib/app-error';
import { logger } from '../lib/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const log = req.log || logger;

  if (err instanceof AppError) {
    log.warn({ err, statusCode: err.statusCode }, err.message);
    res.status(err.statusCode).json(errorResponse(err.code, err.message));
    return;
  }

  log.error({ err }, 'Unhandled error');
  res
    .status(500)
    .json(
      errorResponse(
        'INTERNAL_ERROR',
        env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
      ),
    );
}
