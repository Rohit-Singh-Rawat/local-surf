import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../lib/app-error';
import { type TokenPayload, verifyAccessToken } from '../lib/jwt';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  // Prefer the httpOnly cookie (browser clients) over the Authorization header (API clients/curl).
  // Both are valid — the cookie is safer for browsers (not readable by JS, no XSS risk).
  const cookieToken = req.cookies?.['access_token'] as string | undefined;
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined;

  const token = cookieToken ?? headerToken;
  if (!token) throw new UnauthorizedError();

  let payload: TokenPayload;
  try {
    payload = await verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }

  req.auth = { userId: payload.sub, email: payload.email };
  next();
}
