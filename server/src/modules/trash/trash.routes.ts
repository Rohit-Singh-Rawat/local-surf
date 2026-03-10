import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/async-handler';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { FileRepository } from '../file/file.repository';
import { FolderRepository } from '../folder/folder.repository';
import { TrashController } from './trash.controller';
import { TrashRepository } from './trash.repository';
import { TrashService } from './trash.service';

const trashRepo = new TrashRepository();
const fileRepo = new FileRepository();
const folderRepo = new FolderRepository();
const service = new TrashService(trashRepo, fileRepo, folderRepo);
const controller = new TrashController(service);

const idParam = z.object({ id: z.string().uuid() });

const router = Router();

router.use(authenticate);

router.delete('/empty', asyncHandler(controller.emptyTrash));
router.delete(
  '/files/:id',
  validate({ params: idParam }),
  asyncHandler(controller.permanentDeleteFile),
);
router.delete(
  '/folders/:id',
  validate({ params: idParam }),
  asyncHandler(controller.permanentDeleteFolder),
);

export { router as trashRoutes };
