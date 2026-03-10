import { and, eq, inArray, like, or, sql } from 'drizzle-orm';
import { db } from '../../config/db';
import { files, folders, users } from '../../db/schema';

export class TrashRepository {
  /**
   * Hard-deletes a single trashed file and decrements user storage.
   * Shares are cascade-deleted by the FK constraint on shares.fileId.
   */
  async permanentDeleteFile(userId: string, fileId: string) {
    return db.transaction(async (tx) => {
      const [file] = await tx
        .delete(files)
        .where(and(eq(files.id, fileId), eq(files.userId, userId), eq(files.status, 'trashed')))
        .returning({ s3Key: files.s3Key, size: files.size });

      if (!file) return null;

      await tx
        .update(users)
        .set({ storageUsed: sql`GREATEST(${users.storageUsed} - ${file.size}, 0)` })
        .where(eq(users.id, userId));

      return file;
    });
  }

  /**
   * Hard-deletes a trashed folder and its entire subtree (all files + subfolders).
   * Returns S3 keys for post-transaction cleanup.
   */
  async permanentDeleteFolderCascade(userId: string, folderId: string, pathPrefix: string) {
    return db.transaction(async (tx) => {
      const affectedFolders = await tx
        .select({ id: folders.id })
        .from(folders)
        .where(
          and(
            eq(folders.userId, userId),
            or(eq(folders.id, folderId), like(folders.path, `${pathPrefix}%`)),
          ),
        );
      const folderIds = affectedFolders.map((f) => f.id);

      let deletedFiles: { s3Key: string; size: number }[] = [];
      if (folderIds.length > 0) {
        deletedFiles = await tx
          .delete(files)
          .where(and(eq(files.userId, userId), inArray(files.folderId, folderIds)))
          .returning({ s3Key: files.s3Key, size: files.size });
      }

      // Delete folders (all in one statement — self-referencing FK is safe
      // because every row referencing a deleted row is also deleted)
      await tx
        .delete(folders)
        .where(
          and(
            eq(folders.userId, userId),
            or(eq(folders.id, folderId), like(folders.path, `${pathPrefix}%`)),
          ),
        );

      const totalSize = deletedFiles.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > 0) {
        await tx
          .update(users)
          .set({ storageUsed: sql`GREATEST(${users.storageUsed} - ${totalSize}, 0)` })
          .where(eq(users.id, userId));
      }

      return {
        s3Keys: deletedFiles.map((f) => f.s3Key),
        filesDeleted: deletedFiles.length,
        foldersDeleted: folderIds.length,
        storageFreed: totalSize,
      };
    });
  }

  /**
   * Hard-deletes ALL trashed items for a user.
   * Deletes files first (FK to folders), then folders.
   * Returns S3 keys for post-transaction cleanup.
   */
  async emptyTrash(userId: string) {
    return db.transaction(async (tx) => {
      const deletedFiles = await tx
        .delete(files)
        .where(and(eq(files.userId, userId), eq(files.status, 'trashed')))
        .returning({ s3Key: files.s3Key, size: files.size });

      const deletedFolders = await tx
        .delete(folders)
        .where(and(eq(folders.userId, userId), eq(folders.status, 'trashed')))
        .returning({ id: folders.id });

      const totalSize = deletedFiles.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > 0) {
        await tx
          .update(users)
          .set({ storageUsed: sql`GREATEST(${users.storageUsed} - ${totalSize}, 0)` })
          .where(eq(users.id, userId));
      }

      return {
        s3Keys: deletedFiles.map((f) => f.s3Key),
        filesDeleted: deletedFiles.length,
        foldersDeleted: deletedFolders.length,
        storageFreed: totalSize,
      };
    });
  }
}
