import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { authenticate } from '../../middleware/auth.middleware';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

const userRepo = new UserRepository();
const userService = new UserService(userRepo);
const controller = new UserController(userService);

const router = Router();

router.get('/me', authenticate, asyncHandler(controller.getMe));

export { router as userRoutes };
