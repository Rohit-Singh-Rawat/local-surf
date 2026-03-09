import { ConflictError, NotFoundError, ValidationError } from '../../lib/app-error';
import { MAX_FOLDER_DEPTH } from '../../lib/constants';
import { isUniqueViolation } from '../../lib/db-errors';
import type { Folder, FolderRepository } from './folder.repository';

export class FolderService {
  constructor(private repo: FolderRepository) {}

  async create(userId: string, dto: { name: string; parentId?: string }): Promise<Folder> {
    let path = '/';
    let depth = 0;
    const parentId = dto.parentId ?? null;

    if (parentId) {
      const parent = await this.repo.findActiveByIdAndUser(parentId, userId);
      if (!parent) throw new NotFoundError('Parent folder', parentId);
      path = `${parent.path}${parent.id}/`;
      depth = parent.depth + 1;
    }

    if (depth >= MAX_FOLDER_DEPTH) {
      throw new ValidationError(`Maximum folder nesting depth of ${MAX_FOLDER_DEPTH} exceeded`);
    }

    try {
      return await this.repo.create({ userId, parentId, path, depth, name: dto.name });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictError(`A folder named '${dto.name}' already exists in this location`);
      }
      throw err;
    }
  }

  async getContents(userId: string, folderId: string | null) {
    let folder: Folder | null = null;

    if (folderId) {
      const found = await this.repo.findActiveByIdAndUser(folderId, userId);
      if (!found) throw new NotFoundError('Folder', folderId);
      folder = found;
    }

    const [childFolders, childFiles] = await Promise.all([
      this.repo.findChildren(userId, folderId),
      this.repo.findFilesInFolder(userId, folderId),
    ]);

    return { folder, folders: childFolders, files: childFiles };
  }

  async rename(userId: string, folderId: string, name: string): Promise<Folder> {
    const folder = await this.repo.findActiveByIdAndUser(folderId, userId);
    if (!folder) throw new NotFoundError('Folder', folderId);

    if (folder.name === name) return folder;

    try {
      const updated = await this.repo.updateName(folderId, userId, name);
      return updated!;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictError(`A folder named '${name}' already exists in this location`);
      }
      throw err;
    }
  }

  async softDelete(userId: string, folderId: string): Promise<void> {
    const folder = await this.repo.findActiveByIdAndUser(folderId, userId);
    if (!folder) throw new NotFoundError('Folder', folderId);
    await this.repo.trashCascade(userId, folder);
  }

  async restore(userId: string, folderId: string): Promise<void> {
    const folder = await this.repo.findTrashedByIdAndUser(folderId, userId);
    if (!folder) throw new NotFoundError('Folder', folderId);

    if (folder.parentId) {
      const parent = await this.repo.findById(folder.parentId);
      if (!parent || parent.status !== 'active') {
        throw new ValidationError(
          'Cannot restore: parent folder is in trash. Restore the parent first.',
        );
      }
    }

    try {
      await this.repo.restoreCascade(userId, folder);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictError(
          'Cannot restore: a folder with the same name already exists in this location',
        );
      }
      throw err;
    }
  }

  async getBreadcrumb(userId: string, folderId: string) {
    const folder = await this.repo.findActiveByIdAndUser(folderId, userId);
    if (!folder) throw new NotFoundError('Folder', folderId);

    const ancestorIds = folder.path.split('/').filter(Boolean);

    let ancestors: Folder[] = [];
    if (ancestorIds.length > 0) {
      ancestors = await this.repo.findByIds(ancestorIds, userId);
      ancestors.sort((a, b) => a.depth - b.depth);
    }

    return [
      ...ancestors.map((a) => ({ id: a.id, name: a.name })),
      { id: folder.id, name: folder.name },
    ];
  }

  async getTrash(userId: string) {
    return this.repo.findTrashedItems(userId);
  }
}
