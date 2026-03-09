import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../lib/app-error';
import { type TokenPayload, verifyAccessToken } from '../lib/jwt';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError();
  }

  let payload: TokenPayload;
  try {
    payload = await verifyAccessToken(header.slice(7));
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }

  req.auth = { userId: payload.sub, email: payload.email };
  next();
}
