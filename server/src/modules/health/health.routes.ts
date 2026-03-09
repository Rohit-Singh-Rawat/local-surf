import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { HealthController } from './health.controller';

const router = Router();
const controller = new HealthController();

router.get('/', asyncHandler(controller.check));

export { router as healthRoutes };
