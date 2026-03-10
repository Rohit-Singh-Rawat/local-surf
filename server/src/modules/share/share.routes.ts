import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/async-handler';
import { authenticate } from '../../middleware/auth.middleware';
import { rateLimit } from '../../middleware/rate-limit.middleware';
import { validate } from '../../middleware/validate.middleware';
import { FileRepository } from '../file/file.repository';
import { UserRepository } from '../user/user.repository';
import { ShareController } from './share.controller';
import { ShareRepository } from './share.repository';
import { ShareService } from './share.service';

const shareRepo = new ShareRepository();
const fileRepo = new FileRepository();
const userRepo = new UserRepository();
const service = new ShareService(shareRepo, fileRepo, userRepo);
const controller = new ShareController(service);

const shareIdParam = z.object({ id: z.string().uuid() });
const publicTokenParam = z.object({ token: z.string().min(1) });

const userShareBody = z.object({
  fileId: z.string().uuid(),
  email: z.string().email(),
  permission: z.enum(['view', 'download']).default('view'),
});

const publicLinkBody = z.object({
  fileId: z.string().uuid(),
  permission: z.enum(['view', 'download']).default('view'),
  expiresAt: z.string().datetime().optional(),
});

const updateShareBody = z.object({
  permission: z.enum(['view', 'download']).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

const publicLinkRateLimit = rateLimit({ windowMs: 60_000, max: 30, keyPrefix: 'public-link' });

const router = Router();

// Public access (no auth, rate-limited)
router.get(
  '/public/:token',
  publicLinkRateLimit,
  validate({ params: publicTokenParam }),
  asyncHandler(controller.accessPublicLink),
);

// Authenticated routes
router.use(authenticate);

router.get('/shared-with-me', asyncHandler(controller.getSharedWithMe));
router.get('/my-shares', asyncHandler(controller.getMyShares));
router.get(
  '/:id/access',
  validate({ params: shareIdParam }),
  asyncHandler(controller.accessSharedFile),
);

router.post('/user', validate({ body: userShareBody }), asyncHandler(controller.shareWithUser));
router.post('/link', validate({ body: publicLinkBody }), asyncHandler(controller.createPublicLink));

router.patch(
  '/:id',
  validate({ params: shareIdParam, body: updateShareBody }),
  asyncHandler(controller.updateShare),
);
router.delete('/:id', validate({ params: shareIdParam }), asyncHandler(controller.revokeShare));

export { router as shareRoutes };
