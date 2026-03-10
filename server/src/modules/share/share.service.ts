import { randomBytes } from 'node:crypto';
import { generateDownloadUrl, generateViewUrl } from '../../config/s3';
import { ConflictError, NotFoundError, ValidationError } from '../../lib/app-error';
import type { FileRepository } from '../file/file.repository';
import type { UserRepository } from '../user/user.repository';
import type { ShareRepository } from './share.repository';

export class ShareService {
  constructor(
    private shareRepo: ShareRepository,
    private fileRepo: FileRepository,
    private userRepo: UserRepository,
  ) {}

  async shareWithUser(
    userId: string,
    dto: { fileId: string; email: string; permission: 'view' | 'download' },
  ) {
    const file = await this.fileRepo.findUploadedByIdAndUser(dto.fileId, userId);
    if (!file) throw new NotFoundError('File', dto.fileId);

    const target = await this.userRepo.findByEmail(dto.email);
    if (!target) throw new NotFoundError('User with email', dto.email);

    if (target.id === userId) {
      throw new ValidationError('Cannot share a file with yourself');
    }

    const existing = await this.shareRepo.findByFileAndUser(dto.fileId, target.id);
    if (existing) throw new ConflictError('File is already shared with this user');

    return this.shareRepo.create({
      fileId: dto.fileId,
      ownerId: userId,
      sharedWithId: target.id,
      isPublic: false,
      publicToken: null,
      permission: dto.permission,
      expiresAt: null,
    });
  }

  async createPublicLink(
    userId: string,
    dto: { fileId: string; permission: 'view' | 'download'; expiresAt?: string },
  ) {
    const file = await this.fileRepo.findUploadedByIdAndUser(dto.fileId, userId);
    if (!file) throw new NotFoundError('File', dto.fileId);

    const existing = await this.shareRepo.findPublicLinkByFileAndOwner(dto.fileId, userId);
    if (existing) return existing;

    const publicToken = randomBytes(32).toString('base64url');

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (expiresAt && expiresAt <= new Date()) {
      throw new ValidationError('expiresAt must be a future date');
    }

    return this.shareRepo.create({
      fileId: dto.fileId,
      ownerId: userId,
      sharedWithId: null,
      isPublic: true,
      publicToken,
      permission: dto.permission,
      expiresAt,
    });
  }

  async getSharedWithMe(userId: string) {
    return this.shareRepo.findSharedWithUser(userId);
  }

  async getMyShares(userId: string) {
    return this.shareRepo.findByOwner(userId);
  }

  async accessPublicLink(token: string) {
    const result = await this.shareRepo.findByPublicToken(token);
    if (!result) throw new NotFoundError('Shared link');

    const [viewUrl, downloadUrl] = await Promise.all([
      generateViewUrl(result.file.s3Key, result.file.mimeType),
      generateDownloadUrl(result.file.s3Key, result.file.name),
    ]);
    return { ...result, viewUrl, downloadUrl };
  }

  async accessSharedFile(userId: string, shareId: string) {
    const result = await this.shareRepo.findByIdAndSharedWith(shareId, userId);
    if (!result) throw new NotFoundError('Shared file');

    const [viewUrl, downloadUrl] = await Promise.all([
      generateViewUrl(result.file.s3Key, result.file.mimeType),
      generateDownloadUrl(result.file.s3Key, result.file.name),
    ]);
    return { ...result, viewUrl, downloadUrl };
  }

  async revokeShare(userId: string, shareId: string) {
    const share = await this.shareRepo.findByIdAndOwner(shareId, userId);
    if (!share) throw new NotFoundError('Share', shareId);
    await this.shareRepo.delete(shareId);
  }

  async updateShare(
    userId: string,
    shareId: string,
    dto: { permission?: 'view' | 'download'; expiresAt?: string | null },
  ) {
    const share = await this.shareRepo.findByIdAndOwner(shareId, userId);
    if (!share) throw new NotFoundError('Share', shareId);

    const expiresAt =
      dto.expiresAt === null ? null : dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    if (expiresAt && expiresAt <= new Date()) {
      throw new ValidationError('expiresAt must be a future date');
    }

    return this.shareRepo.update(shareId, { permission: dto.permission, expiresAt });
  }
}
