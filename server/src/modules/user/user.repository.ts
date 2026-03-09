import type { InferSelectModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { users } from '../../db/schema';

export type User = InferSelectModel<typeof users>;

interface UpsertGoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatar: string | null;
}

export class UserRepository {
  async findById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertByGoogleId(data: UpsertGoogleUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(data)
      .onConflictDoUpdate({
        target: users.googleId,
        set: { email: data.email, name: data.name, avatar: data.avatar },
      })
      .returning();
    return user!;
  }
}
