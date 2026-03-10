import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { logger } from '../lib/logger';

const isDev = env.NODE_ENV === 'development';

const SENSITIVE_KEYS = new Set(['password', 'token', 'secret', 'authorization', 'refreshtoken']);

function sanitiseBody(body: unknown): unknown {
	if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
	return Object.fromEntries(
		Object.entries(body as Record<string, unknown>).map(([k, v]) => [
			k,
			SENSITIVE_KEYS.has(k.toLowerCase()) ? '[redacted]' : v,
		])
	);
}

export const requestLogger: RequestHandler = (req, res, next) => {
	const start = process.hrtime.bigint();

	res.on('finish', () => {
		const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

		const payload: Record<string, unknown> = {
			method: req.method,
			url: req.originalUrl || req.url,
			statusCode: res.statusCode,
			durationMs: Math.round(durationMs * 100) / 100,
		};

		if (isDev) {
			payload.ip = req.ip;
			payload.userAgent = req.get('user-agent');
			payload.body = sanitiseBody(req.body);
		}

		const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
		logger[level](payload, 'HTTP request');
	});

	next();
};
