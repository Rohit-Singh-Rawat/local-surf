import type { Request } from 'express';
import { UnauthorizedError } from './app-error';

/**
 * Safely extracts authenticated user info from the request.
 * Throws 401 if auth middleware hasn't run — prevents silent undefined access.
 */
export function getAuth(req: Request): { userId: string; email: string } {
  if (!req.auth) throw new UnauthorizedError();
  return req.auth;
}
