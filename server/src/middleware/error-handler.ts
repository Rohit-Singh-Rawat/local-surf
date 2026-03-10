import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { error as errorResponse } from '../lib/api-response';
import { AppError } from '../lib/app-error';
import { logger } from '../lib/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
	const log = (req as Request & { log?: typeof logger }).log ?? logger;

	if (err instanceof AppError) {
		log.warn({ err, statusCode: err.statusCode }, err.message);
		res.status(err.statusCode).json(errorResponse(err.code, err.message));
		return;
	}

	if (err instanceof ZodError) {
		const messages = err.issues.map((i) => {
			const path = i.path.length ? `${i.path.join('.')}: ` : '';
			return `${path}${i.message}`;
		});
		res.status(400).json(errorResponse('VALIDATION_ERROR', messages.join(', ')));
		return;
	}

	// Express/body-parser errors carry a numeric `status` (e.g. 400 for malformed JSON).
	// Surface them with their intended status instead of masking as 500.
	if (err instanceof SyntaxError && 'status' in err && typeof err.status === 'number') {
		log.warn({ err, statusCode: err.status }, err.message);
		res.status(err.status).json(errorResponse('BAD_REQUEST', 'Malformed request body'));
		return;
	}

	const normalised = err instanceof Error ? err : new Error(String(err));
	log.error({ err: normalised }, 'Unhandled error');
	res
		.status(500)
		.json(
			errorResponse(
				'INTERNAL_ERROR',
				env.NODE_ENV === 'production' ? 'An unexpected error occurred' : normalised.message
			)
		);
}
