import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/async-handler';
import { MAX_FILE_SIZE } from '../../lib/constants';
import { hasInvalidPathChars } from '../../lib/validation';
import { authenticate } from '../../middleware/auth.middleware';
import { rateLimit } from '../../middleware/rate-limit.middleware';
import { validate } from '../../middleware/validate.middleware';
import { FolderRepository } from '../folder/folder.repository';
import { UserRepository } from '../user/user.repository';
import { FileController } from './file.controller';
import { FileRepository } from './file.repository';
import { FileService } from './file.service';

const fileRepo = new FileRepository();
const folderRepo = new FolderRepository();
const userRepo = new UserRepository();
const service = new FileService(fileRepo, folderRepo, userRepo);
const controller = new FileController(service);

const fileName = z
  .string()
  .min(1, 'File name is required')
  .max(255)
  .trim()
  .refine((n) => !hasInvalidPathChars(n), 'File name contains invalid characters')
  .refine((n) => n !== '.' && n !== '..', 'Invalid file name');

const fileIdParam = z.object({ id: z.string().uuid() });

const uploadBody = z.object({
  name: fileName,
  folderId: z.string().uuid().optional(),
  mimeType: z.string().min(1).max(255),
  size: z.number().int().positive().max(MAX_FILE_SIZE),
});

const renameBody = z.object({ name: fileName });

const searchQuery = z.object({
  q: z.string().min(1).max(255).trim(),
});

const router = Router();

router.use(authenticate);

router.get('/search', validate({ query: searchQuery }), asyncHandler(controller.search));

const uploadRateLimit = rateLimit({
  windowMs: 60_000,
  max: 30,
  keyPrefix: 'upload',
  keyGenerator: (req) => req.auth?.userId ?? req.ip ?? 'unknown',
});

router.post(
  '/upload',
  uploadRateLimit,
  validate({ body: uploadBody }),
  asyncHandler(controller.initiateUpload),
);

router.post(
  '/:id/confirm',
  validate({ params: fileIdParam }),
  asyncHandler(controller.confirmUpload),
);
router.get('/:id', validate({ params: fileIdParam }), asyncHandler(controller.getById));
router.get(
  '/:id/download',
  validate({ params: fileIdParam }),
  asyncHandler(controller.getDownloadUrl),
);
router.get(
  '/:id/view',
  validate({ params: fileIdParam }),
  asyncHandler(controller.getViewUrl),
);
router.patch(
  '/:id',
  validate({ params: fileIdParam, body: renameBody }),
  asyncHandler(controller.rename),
);
router.delete('/:id', validate({ params: fileIdParam }), asyncHandler(controller.delete));
router.post('/:id/restore', validate({ params: fileIdParam }), asyncHandler(controller.restore));

export { router as fileRoutes };
