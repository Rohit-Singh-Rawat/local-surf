import type { CookieOptions, Request, Response } from 'express';
import type { Profile } from 'passport-google-oauth20';
import { env } from '../../config/env';
import { success } from '../../lib/api-response';
import { ValidationError } from '../../lib/app-error';
import { getAuth } from '../../lib/auth-utils';
import { ACCESS_TOKEN_EXPIRY_MS, REFRESH_TOKEN_EXPIRY_MS } from '../../lib/constants';
import type { AuthService } from './auth.service';

const ACCESS_COOKIE = 'access_token';
const ACCESS_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: ACCESS_TOKEN_EXPIRY_MS,
  path: '/',
};
const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: REFRESH_TOKEN_EXPIRY_MS,
  path: '/api/auth',
};

const SESSION_INDICATOR = 'ls_session';
const SESSION_INDICATOR_OPTIONS: CookieOptions = {
  httpOnly: false,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: REFRESH_TOKEN_EXPIRY_MS,
  path: '/',
};

export class AuthController {
  constructor(private authService: AuthService) {}

  googleCallback = async (req: Request, res: Response) => {
    const profile = req.user as Profile;
    const { code, refreshToken } = await this.authService.handleGoogleAuth(profile);

    res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS);

    // Redirect with a short-lived opaque code, NOT the JWT.
    // The client exchanges the code via POST /api/auth/exchange which then sets
    // the access_token as an httpOnly cookie — the JWT never appears in a URL.
    res.redirect(`${env.FRONTEND_URL}/auth/callback?code=${encodeURIComponent(code)}`);
  };

  exchange = async (req: Request, res: Response) => {
    const { code } = req.body as { code: string };
    const accessToken = await this.authService.exchangeAuthCode(code);

    // Set as httpOnly cookie — client never touches the raw JWT.
    res.cookie(ACCESS_COOKIE, accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie(SESSION_INDICATOR, '1', SESSION_INDICATOR_OPTIONS);
    res.json(success({}));
  };

  refresh = async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    if (!token) throw new ValidationError('Refresh token is required');

    const { accessToken, refreshToken } = await this.authService.refresh(token);

    res.cookie(ACCESS_COOKIE, accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS);
    res.cookie(SESSION_INDICATOR, '1', SESSION_INDICATOR_OPTIONS);
    res.json(success({}));
  };

  logout = async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    if (token) await this.authService.logout(token);

    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.clearCookie(SESSION_INDICATOR, { path: '/' });
    res.json(success({ message: 'Logged out' }));
  };

  logoutAll = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    await this.authService.logoutAll(userId);

    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.clearCookie(SESSION_INDICATOR, { path: '/' });
    res.json(success({ message: 'All sessions revoked' }));
  };
}
