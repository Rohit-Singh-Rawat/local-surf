import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/async-handler';
import { hasInvalidPathChars } from '../../lib/validation';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { FolderController } from './folder.controller';
import { FolderRepository } from './folder.repository';
import { FolderService } from './folder.service';

const repo = new FolderRepository();
const service = new FolderService(repo);
const controller = new FolderController(service);

const folderName = z
  .string()
  .min(1, 'Folder name is required')
  .max(255)
  .trim()
  .refine((n) => !hasInvalidPathChars(n), 'Folder name contains invalid characters')
  .refine((n) => n !== '.' && n !== '..', 'Invalid folder name');

const folderIdParam = z.object({ id: z.string().uuid() });
const createBody = z.object({ name: folderName, parentId: z.string().uuid().optional() });
const renameBody = z.object({ name: folderName });

const router = Router();

router.use(authenticate);

// Static routes before parameterized ones
router.get('/trash', asyncHandler(controller.getTrash));
router.get('/root/contents', asyncHandler(controller.getRootContents));

router.post('/', validate({ body: createBody }), asyncHandler(controller.create));

router.get(
  '/:id/contents',
  validate({ params: folderIdParam }),
  asyncHandler(controller.getContents),
);
router.get(
  '/:id/path',
  validate({ params: folderIdParam }),
  asyncHandler(controller.getBreadcrumb),
);
router.patch(
  '/:id',
  validate({ params: folderIdParam, body: renameBody }),
  asyncHandler(controller.rename),
);
router.delete('/:id', validate({ params: folderIdParam }), asyncHandler(controller.delete));
router.post('/:id/restore', validate({ params: folderIdParam }), asyncHandler(controller.restore));

export { router as folderRoutes };
