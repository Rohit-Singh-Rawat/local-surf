import type { InferSelectModel } from 'drizzle-orm';
import { and, desc, eq, inArray, isNull, like, or } from 'drizzle-orm';
import { db } from '../../config/db';
import { files, folders } from '../../db/schema';

export type Folder = InferSelectModel<typeof folders>;
export type FileRow = InferSelectModel<typeof files>;

export class FolderRepository {
  async findById(id: string): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.id, id));
    return folder;
  }

  async findActiveByIdAndUser(id: string, userId: string): Promise<Folder | undefined> {
    const [folder] = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, userId), eq(folders.status, 'active')));
    return folder;
  }

  async findTrashedByIdAndUser(id: string, userId: string): Promise<Folder | undefined> {
    const [folder] = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, userId), eq(folders.status, 'trashed')));
    return folder;
  }

  async findChildren(userId: string, parentId: string | null): Promise<Folder[]> {
    const parentCondition = parentId ? eq(folders.parentId, parentId) : isNull(folders.parentId);
    return db
      .select()
      .from(folders)
      .where(and(eq(folders.userId, userId), parentCondition, eq(folders.status, 'active')))
      .orderBy(folders.name);
  }

  async findFilesInFolder(userId: string, folderId: string | null): Promise<FileRow[]> {
    const folderCondition = folderId ? eq(files.folderId, folderId) : isNull(files.folderId);
    return db
      .select()
      .from(files)
      .where(and(eq(files.userId, userId), folderCondition, eq(files.status, 'uploaded')))
      .orderBy(files.name);
  }

  async findByIds(ids: string[], userId: string): Promise<Folder[]> {
    if (ids.length === 0) return [];
    return db
      .select()
      .from(folders)
      .where(and(inArray(folders.id, ids), eq(folders.userId, userId)));
  }

  async create(data: {
    userId: string;
    parentId: string | null;
    path: string;
    depth: number;
    name: string;
  }): Promise<Folder> {
    const [folder] = await db.insert(folders).values(data).returning();
    return folder!;
  }

  async updateName(id: string, userId: string, name: string): Promise<Folder | undefined> {
    const [folder] = await db
      .update(folders)
      .set({ name })
      .where(and(eq(folders.id, id), eq(folders.userId, userId), eq(folders.status, 'active')))
      .returning();
    return folder;
  }

  /**
   * Atomically trashes a folder and all its descendants (folders + files).
   * Uses the materialized path to identify the full subtree.
   */
  async trashCascade(userId: string, folder: Folder): Promise<void> {
    const now = new Date();
    const pathPrefix = `${folder.path}${folder.id}/`;

    await db.transaction(async (tx) => {
      await tx
        .update(folders)
        .set({ status: 'trashed', trashedAt: now })
        .where(eq(folders.id, folder.id));

      await tx
        .update(folders)
        .set({ status: 'trashed', trashedAt: now })
        .where(
          and(
            eq(folders.userId, userId),
            like(folders.path, `${pathPrefix}%`),
            eq(folders.status, 'active'),
          ),
        );

      const affected = await tx
        .select({ id: folders.id })
        .from(folders)
        .where(
          and(
            eq(folders.userId, userId),
            or(eq(folders.id, folder.id), like(folders.path, `${pathPrefix}%`)),
          ),
        );
      const folderIds = affected.map((f) => f.id);

      if (folderIds.length > 0) {
        await tx
          .update(files)
          .set({ status: 'trashed', trashedAt: now })
          .where(
            and(
              eq(files.userId, userId),
              inArray(files.folderId, folderIds),
              eq(files.status, 'uploaded'),
            ),
          );
      }
    });
  }

  /**
   * Atomically restores a folder and all its descendants.
   * Files go back to 'uploaded', folders go back to 'active'.
   */
  async restoreCascade(userId: string, folder: Folder): Promise<void> {
    const pathPrefix = `${folder.path}${folder.id}/`;

    await db.transaction(async (tx) => {
      await tx
        .update(folders)
        .set({ status: 'active', trashedAt: null })
        .where(eq(folders.id, folder.id));

      await tx
        .update(folders)
        .set({ status: 'active', trashedAt: null })
        .where(
          and(
            eq(folders.userId, userId),
            like(folders.path, `${pathPrefix}%`),
            eq(folders.status, 'trashed'),
          ),
        );

      const affected = await tx
        .select({ id: folders.id })
        .from(folders)
        .where(
          and(
            eq(folders.userId, userId),
            or(eq(folders.id, folder.id), like(folders.path, `${pathPrefix}%`)),
          ),
        );
      const folderIds = affected.map((f) => f.id);

      if (folderIds.length > 0) {
        await tx
          .update(files)
          .set({ status: 'uploaded', trashedAt: null })
          .where(
            and(
              eq(files.userId, userId),
              inArray(files.folderId, folderIds),
              eq(files.status, 'trashed'),
            ),
          );
      }
    });
  }

  /**
   * Returns only top-level trashed items — items whose parent/folder is
   * either null (root) or still active. Cascade-trashed children are excluded
   * so the trash view isn't cluttered with nested items.
   */
  async findTrashedItems(userId: string): Promise<{ folders: Folder[]; files: FileRow[] }> {
    const [activeIds, trashedFolders, trashedFiles] = await Promise.all([
      db
        .select({ id: folders.id })
        .from(folders)
        .where(and(eq(folders.userId, userId), eq(folders.status, 'active'))),
      db
        .select()
        .from(folders)
        .where(and(eq(folders.userId, userId), eq(folders.status, 'trashed')))
        .orderBy(desc(folders.trashedAt)),
      db
        .select()
        .from(files)
        .where(and(eq(files.userId, userId), eq(files.status, 'trashed')))
        .orderBy(desc(files.trashedAt)),
    ]);

    const activeIdSet = new Set(activeIds.map((f) => f.id));

    return {
      folders: trashedFolders.filter((f) => !f.parentId || activeIdSet.has(f.parentId)),
      files: trashedFiles.filter((f) => !f.folderId || activeIdSet.has(f.folderId)),
    };
  }
}
