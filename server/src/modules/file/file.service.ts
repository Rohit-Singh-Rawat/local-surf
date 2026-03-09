import { generateDownloadUrl, generateUploadUrl, headObject } from '../../config/s3';
import {
  ConflictError,
  NotFoundError,
  QuotaExceededError,
  UnauthorizedError,
  ValidationError,
} from '../../lib/app-error';
import { MAX_FILE_SIZE } from '../../lib/constants';
import { isUniqueViolation } from '../../lib/db-errors';
import type { FolderRepository } from '../folder/folder.repository';
import type { UserRepository } from '../user/user.repository';
import type { FileRepository, FileRow } from './file.repository';

export class FileService {
  constructor(
    private fileRepo: FileRepository,
    private folderRepo: FolderRepository,
    private userRepo: UserRepository,
  ) {}

  async initiateUpload(
    userId: string,
    dto: { name: string; folderId?: string; mimeType: string; size: number },
  ) {
    if (dto.size > MAX_FILE_SIZE) {
      throw new ValidationError(`File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    const user = await this.userRepo.findById(userId);
    if (!user) throw new UnauthorizedError();
    if (user.storageUsed + dto.size > user.storageQuota) {
      throw new QuotaExceededError();
    }

    const folderId = dto.folderId ?? null;
    if (folderId) {
      const folder = await this.folderRepo.findActiveByIdAndUser(folderId, userId);
      if (!folder) throw new NotFoundError('Folder', folderId);
    }

    const fileId = crypto.randomUUID();
    const s3Key = `${userId}/${fileId}`;

    try {
      const file = await this.fileRepo.create({
        id: fileId,
        userId,
        folderId,
        name: dto.name,
        s3Key,
        mimeType: dto.mimeType,
        size: dto.size,
      });

      const uploadUrl = await generateUploadUrl(s3Key, dto.mimeType);
      return { file, uploadUrl };
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictError(`A file named '${dto.name}' already exists in this location`);
      }
      throw err;
    }
  }

  async confirmUpload(userId: string, fileId: string): Promise<FileRow> {
    const pending = await this.fileRepo.findPendingByIdAndUser(fileId, userId);
    if (!pending) throw new NotFoundError('Pending file', fileId);

    let s3Head: { size: number };
    try {
      s3Head = await headObject(pending.s3Key);
    } catch {
      throw new ValidationError('File has not been uploaded to storage yet');
    }

    if (s3Head.size > MAX_FILE_SIZE) {
      throw new ValidationError(
        `Uploaded file exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    // Re-check quota with actual S3 size (prevents declared-size spoofing)
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UnauthorizedError();
    if (user.storageUsed + s3Head.size > user.storageQuota) {
      throw new QuotaExceededError();
    }

    const confirmed = await this.fileRepo.confirmUpload(fileId, userId, s3Head.size);
    if (!confirmed) throw new NotFoundError('File', fileId);
    return confirmed;
  }

  async getDownloadUrl(userId: string, fileId: string) {
    const file = await this.fileRepo.findUploadedByIdAndUser(fileId, userId);
    if (!file) throw new NotFoundError('File', fileId);
    const downloadUrl = await generateDownloadUrl(file.s3Key, file.name);
    return { file, downloadUrl };
  }

  async rename(userId: string, fileId: string, name: string): Promise<FileRow> {
    const file = await this.fileRepo.findUploadedByIdAndUser(fileId, userId);
    if (!file) throw new NotFoundError('File', fileId);

    if (file.name === name) return file;

    try {
      const updated = await this.fileRepo.updateName(fileId, userId, name);
      return updated!;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictError(`A file named '${name}' already exists in this location`);
      }
      throw err;
    }
  }

  async softDelete(userId: string, fileId: string): Promise<void> {
    const file = await this.fileRepo.findUploadedByIdAndUser(fileId, userId);
    if (!file) throw new NotFoundError('File', fileId);
    await this.fileRepo.softDelete(fileId, userId);
  }

  async restore(userId: string, fileId: string): Promise<FileRow> {
    const file = await this.fileRepo.findTrashedByIdAndUser(fileId, userId);
    if (!file) throw new NotFoundError('File', fileId);

    // Verify parent folder is still active (if file was in a folder)
    if (file.folderId) {
      const folder = await this.folderRepo.findActiveByIdAndUser(file.folderId, userId);
      if (!folder) {
        throw new ValidationError(
          'Cannot restore: parent folder is in trash. Restore the folder first.',
        );
      }
    }

    try {
      const restored = await this.fileRepo.restore(fileId, userId);
      if (!restored) throw new NotFoundError('File', fileId);
      return restored;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictError(
          'Cannot restore: a file with the same name already exists in this location',
        );
      }
      throw err;
    }
  }

  async search(userId: string, query: string): Promise<FileRow[]> {
    return this.fileRepo.searchByName(userId, query);
  }
}
