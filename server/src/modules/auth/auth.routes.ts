import { Router } from 'express';
import passport from 'passport';
import { z } from 'zod';
import { error as errorResponse } from '../../lib/api-response';
import { asyncHandler } from '../../lib/async-handler';
import { authenticate } from '../../middleware/auth.middleware';
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

const router = Router();

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/failed' }),
  asyncHandler(controller.googleCallback),
);

router.post('/refresh', validate({ body: refreshBodySchema }), asyncHandler(controller.refresh));
router.post('/logout', validate({ body: refreshBodySchema }), asyncHandler(controller.logout));
router.post('/logout-all', authenticate, asyncHandler(controller.logoutAll));

router.get('/failed', (_req, res) => {
  res.status(401).json(errorResponse('AUTH_FAILED', 'Google authentication failed'));
});

export { router as authRoutes };
