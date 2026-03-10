import { Router } from 'express';
import passport from 'passport';
import type { Profile } from 'passport-google-oauth20';
import { z } from 'zod';
import { env } from '../../config/env';
import { error as errorResponse } from '../../lib/api-response';
import { asyncHandler } from '../../lib/async-handler';
import { authenticate } from '../../middleware/auth.middleware';
import { rateLimit } from '../../middleware/rate-limit.middleware';
import { validate } from '../../middleware/validate.middleware';
import { UserRepository } from '../user/user.repository';
import { UserService } from '../user/user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const userRepo = new UserRepository();
const userService = new UserService(userRepo);
const authService = new AuthService(userService);
const controller = new AuthController(authService);

const refreshBodySchema = z.object({
  refreshToken: z.string().optional(),
});

const authRateLimit = rateLimit({ windowMs: 60_000, max: 20, keyPrefix: 'auth' });

const router = Router();

router.use(authRateLimit);

router.get('/google', (_req, res) => {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'profile email',
    access_type: 'offline',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get(
  '/google/callback',
  asyncHandler((req, res, next) => {
    return new Promise<void>((resolve, reject) => {
      passport.authenticate(
        'google',
        { session: false },
        (err: Error | null, user: Profile | false) => {
          if (err) return reject(err);
          if (!user) {
            res.redirect(`${env.FRONTEND_URL}/auth/error`);
            return resolve();
          }
          req.user = user;
          resolve();
          next();
        },
      )(req, res, next);
    });
  }),
  asyncHandler(controller.googleCallback),
);

router.post('/refresh', validate({ body: refreshBodySchema }), asyncHandler(controller.refresh));
router.post('/logout', validate({ body: refreshBodySchema }), asyncHandler(controller.logout));
router.post('/logout-all', authenticate, asyncHandler(controller.logoutAll));

router.get('/failed', (_req, res) => {
  res.status(401).json(errorResponse('AUTH_FAILED', 'Google authentication failed'));
});

export { router as authRoutes };
