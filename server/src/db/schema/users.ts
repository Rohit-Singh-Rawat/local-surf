import { bigint, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    googleId: text('google_id').notNull(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    avatar: text('avatar'),
    storageUsed: bigint('storage_used', { mode: 'number' }).notNull().default(0),
    storageQuota: bigint('storage_quota', { mode: 'number' }).notNull().default(1_073_741_824),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('users_google_id_idx').on(table.googleId),
    uniqueIndex('users_email_idx').on(table.email),
  ],
);
