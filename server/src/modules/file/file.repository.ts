import type { InferSelectModel } from 'drizzle-orm';
import { and, eq, ilike, sql } from 'drizzle-orm';
import { db } from '../../config/db';
import { files, users } from '../../db/schema';
import { escapeLikePattern } from '../../lib/validation';

export type FileRow = InferSelectModel<typeof files>;

export class FileRepository {
  async findById(id: string): Promise<FileRow | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async findUploadedByIdAndUser(id: string, userId: string): Promise<FileRow | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, id), eq(files.userId, userId), eq(files.status, 'uploaded')));
    return file;
  }

  async findPendingByIdAndUser(id: string, userId: string): Promise<FileRow | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, id), eq(files.userId, userId), eq(files.status, 'pending')));
    return file;
  }

  async findTrashedByIdAndUser(id: string, userId: string): Promise<FileRow | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, id), eq(files.userId, userId), eq(files.status, 'trashed')));
    return file;
  }

  async create(data: {
    id: string;
    userId: string;
    folderId: string | null;
    name: string;
    s3Key: string;
    mimeType: string;
    size: number;
  }): Promise<FileRow> {
    const [file] = await db.insert(files).values(data).returning();
    return file!;
  }

  async updateName(id: string, userId: string, name: string): Promise<FileRow | undefined> {
    const [file] = await db
      .update(files)
      .set({ name })
      .where(and(eq(files.id, id), eq(files.userId, userId), eq(files.status, 'uploaded')))
      .returning();
    return file;
  }

  /**
   * Atomically confirms upload and increments user storage.
   * Uses the actual S3 size (from HEAD) to prevent client-side size spoofing.
   */
  async confirmUpload(
    fileId: string,
    userId: string,
    actualSize: number,
  ): Promise<FileRow | undefined> {
    return db.transaction(async (tx) => {
      const [file] = await tx
        .update(files)
        .set({ status: 'uploaded', size: actualSize })
        .where(and(eq(files.id, fileId), eq(files.userId, userId), eq(files.status, 'pending')))
        .returning();

      if (!file) return undefined;

      await tx
        .update(users)
        .set({ storageUsed: sql`${users.storageUsed} + ${actualSize}` })
        .where(eq(users.id, userId));

      return file;
    });
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await db
      .update(files)
      .set({ status: 'trashed', trashedAt: new Date() })
      .where(and(eq(files.id, id), eq(files.userId, userId), eq(files.status, 'uploaded')));
  }

  async restore(id: string, userId: string): Promise<FileRow | undefined> {
    const [file] = await db
      .update(files)
      .set({ status: 'uploaded', trashedAt: null })
      .where(and(eq(files.id, id), eq(files.userId, userId), eq(files.status, 'trashed')))
      .returning();
    return file;
  }

  async searchByName(userId: string, query: string): Promise<FileRow[]> {
    const escaped = escapeLikePattern(query);
    return db
      .select()
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          eq(files.status, 'uploaded'),
          ilike(files.name, `%${escaped}%`),
        ),
      )
      .orderBy(files.name)
      .limit(50);
  }
}
