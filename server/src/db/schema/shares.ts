import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { files } from './files';
import { users } from './users';

export const sharePermissionEnum = pgEnum('share_permission', ['view', 'download']);

export const shares = pgTable(
  'shares',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fileId: uuid('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'cascade' }),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id),
    sharedWithId: uuid('shared_with_id').references(() => users.id),
    isPublic: boolean('is_public').notNull().default(false),
    publicToken: text('public_token').unique(),
    permission: sharePermissionEnum('permission').notNull().default('view'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('shares_shared_with_idx').on(table.sharedWithId, table.fileId),
    uniqueIndex('shares_public_token_idx')
      .on(table.publicToken)
      .where(sql`${table.isPublic} = true`),
    index('shares_file_idx').on(table.fileId),
  ],
);
