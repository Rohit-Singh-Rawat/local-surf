import { deleteObjects } from '../../config/s3';
import { NotFoundError } from '../../lib/app-error';
import { logger } from '../../lib/logger';
import type { FileRepository } from '../file/file.repository';
import type { FolderRepository } from '../folder/folder.repository';
import type { TrashRepository } from './trash.repository';

export class TrashService {
  constructor(
    private trashRepo: TrashRepository,
    private fileRepo: FileRepository,
    private folderRepo: FolderRepository,
  ) {}

  async permanentDeleteFile(userId: string, fileId: string) {
    const file = await this.fileRepo.findTrashedByIdAndUser(fileId, userId);
    if (!file) throw new NotFoundError('Trashed file', fileId);

    const deleted = await this.trashRepo.permanentDeleteFile(userId, fileId);
    if (!deleted) throw new NotFoundError('Trashed file', fileId);

    // S3 cleanup — best-effort (DB is source of truth)
    await deleteObjects([deleted.s3Key]).catch((err) =>
      logger.error({ err, s3Key: deleted.s3Key }, 'Failed to delete S3 object'),
    );
  }

  async permanentDeleteFolder(userId: string, folderId: string) {
    const folder = await this.folderRepo.findTrashedByIdAndUser(folderId, userId);
    if (!folder) throw new NotFoundError('Trashed folder', folderId);

    const pathPrefix = `${folder.path}${folder.id}/`;
    const result = await this.trashRepo.permanentDeleteFolderCascade(userId, folderId, pathPrefix);

    if (result.s3Keys.length > 0) {
      await deleteObjects(result.s3Keys).catch((err) =>
        logger.error({ err, count: result.s3Keys.length }, 'Failed to delete S3 objects'),
      );
    }

    return result;
  }

  async emptyTrash(userId: string) {
    const result = await this.trashRepo.emptyTrash(userId);

    if (result.s3Keys.length > 0) {
      await deleteObjects(result.s3Keys).catch((err) =>
        logger.error({ err, count: result.s3Keys.length }, 'Failed to delete S3 objects'),
      );
    }

    return result;
  }
}
