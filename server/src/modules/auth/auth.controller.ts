import type { CookieOptions, Request, Response } from 'express';
import type { Profile } from 'passport-google-oauth20';
import { env } from '../../config/env';
import { success } from '../../lib/api-response';
import { ValidationError } from '../../lib/app-error';
import { getAuth } from '../../lib/auth-utils';
import { REFRESH_TOKEN_EXPIRY_MS } from '../../lib/constants';
import type { AuthService } from './auth.service';

const REFRESH_COOKIE = 'refresh_token';

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: REFRESH_TOKEN_EXPIRY_MS,
  path: '/api/auth',
};

export class AuthController {
  constructor(private authService: AuthService) {}

  googleCallback = async (req: Request, res: Response) => {
    const profile = req.user as Profile;
    const { accessToken, refreshToken } = await this.authService.handleGoogleAuth(profile);

    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(accessToken)}`);
  };

  refresh = async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    if (!token) throw new ValidationError('Refresh token is required');

    const { accessToken, refreshToken } = await this.authService.refresh(token);

    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
    res.json(success({ accessToken, refreshToken }));
  };

  logout = async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    if (token) await this.authService.logout(token);

    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.json(success({ message: 'Logged out' }));
  };

  logoutAll = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    await this.authService.logoutAll(userId);

    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.json(success({ message: 'All sessions revoked' }));
  };
}
