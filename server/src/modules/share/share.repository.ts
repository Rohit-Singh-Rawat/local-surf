import type { InferSelectModel } from 'drizzle-orm';
import { and, desc, eq, gt, inArray, isNull, or } from 'drizzle-orm';
import { db } from '../../config/db';
import { files, shares, users } from '../../db/schema';

export type Share = InferSelectModel<typeof shares>;

export class ShareRepository {
  async create(data: {
    fileId: string;
    ownerId: string;
    sharedWithId: string | null;
    isPublic: boolean;
    publicToken: string | null;
    permission: 'view' | 'download';
    expiresAt: Date | null;
  }): Promise<Share> {
    const [share] = await db.insert(shares).values(data).returning();
    return share!;
  }

  async findByIdAndOwner(id: string, ownerId: string): Promise<Share | undefined> {
    const [share] = await db
      .select()
      .from(shares)
      .where(and(eq(shares.id, id), eq(shares.ownerId, ownerId)));
    return share;
  }

  async findByIdAndSharedWith(shareId: string, userId: string) {
    const now = new Date();
    const [row] = await db
      .select()
      .from(shares)
      .innerJoin(files, eq(shares.fileId, files.id))
      .where(
        and(
          eq(shares.id, shareId),
          eq(shares.sharedWithId, userId),
          or(isNull(shares.expiresAt), gt(shares.expiresAt, now)),
          eq(files.status, 'uploaded'),
        ),
      );
    if (!row) return undefined;
    return { share: row.shares, file: row.files };
  }

  async findByFileAndUser(fileId: string, sharedWithId: string): Promise<Share | undefined> {
    const [share] = await db
      .select()
      .from(shares)
      .where(
        and(
          eq(shares.fileId, fileId),
          eq(shares.sharedWithId, sharedWithId),
          eq(shares.isPublic, false),
        ),
      );
    return share;
  }

  /** Existing public link for this file by this owner, if any. */
  async findPublicLinkByFileAndOwner(fileId: string, ownerId: string): Promise<Share | undefined> {
    const [share] = await db
      .select()
      .from(shares)
      .where(
        and(eq(shares.fileId, fileId), eq(shares.ownerId, ownerId), eq(shares.isPublic, true)),
      );
    return share;
  }

  async findByPublicToken(token: string) {
    const now = new Date();
    const [row] = await db
      .select()
      .from(shares)
      .innerJoin(files, eq(shares.fileId, files.id))
      .where(
        and(
          eq(shares.publicToken, token),
          eq(shares.isPublic, true),
          or(isNull(shares.expiresAt), gt(shares.expiresAt, now)),
          eq(files.status, 'uploaded'),
        ),
      );
    if (!row) return undefined;
    return { share: row.shares, file: row.files };
  }

  async findSharedWithUser(userId: string) {
    const now = new Date();
    const rows = await db
      .select()
      .from(shares)
      .innerJoin(files, eq(shares.fileId, files.id))
      .where(
        and(
          eq(shares.sharedWithId, userId),
          or(isNull(shares.expiresAt), gt(shares.expiresAt, now)),
          eq(files.status, 'uploaded'),
        ),
      )
      .orderBy(desc(shares.createdAt));

    const ownerIds = [...new Set(rows.map((r) => r.shares.ownerId))];
    const owners =
      ownerIds.length > 0
        ? await db.select().from(users).where(inArray(users.id, ownerIds))
        : [];
    const ownerMap = new Map(owners.map((u) => [u.id, u]));

    return rows.map((r) => ({
      share: r.shares,
      file: r.files,
      owner: ownerMap.get(r.shares.ownerId)!,
    }));
  }

  async findByOwner(ownerId: string) {
    const rows = await db
      .select()
      .from(shares)
      .innerJoin(files, eq(shares.fileId, files.id))
      .where(and(eq(shares.ownerId, ownerId), eq(files.status, 'uploaded')))
      .orderBy(desc(shares.createdAt));

    const sharedWithIds = [
      ...new Set(rows.map((r) => r.shares.sharedWithId).filter(Boolean)),
    ] as string[];
    const sharedWithUsers =
      sharedWithIds.length > 0
        ? await db.select().from(users).where(inArray(users.id, sharedWithIds))
        : [];
    const userMap = new Map(sharedWithUsers.map((u) => [u.id, u]));

    return rows.map((r) => ({
      share: r.shares,
      file: r.files,
      sharedWith: r.shares.sharedWithId ? (userMap.get(r.shares.sharedWithId) ?? null) : null,
    }));
  }

  async findSharesForFile(fileId: string, ownerId: string): Promise<Share[]> {
    return db
      .select()
      .from(shares)
      .where(and(eq(shares.fileId, fileId), eq(shares.ownerId, ownerId)));
  }

  async delete(id: string): Promise<void> {
    await db.delete(shares).where(eq(shares.id, id));
  }

  async update(
    id: string,
    data: { permission?: 'view' | 'download'; expiresAt?: Date | null },
  ): Promise<Share | undefined> {
    const [share] = await db.update(shares).set(data).where(eq(shares.id, id)).returning();
    return share;
  }
}
