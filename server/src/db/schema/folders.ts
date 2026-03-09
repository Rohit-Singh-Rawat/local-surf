import { sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const folderStatusEnum = pgEnum('folder_status', ['active', 'trashed']);

export const folders = pgTable(
  'folders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    parentId: uuid('parent_id').references((): AnyPgColumn => folders.id),
    path: text('path').notNull().default('/'),
    depth: integer('depth').notNull().default(0),
    name: text('name').notNull(),
    status: folderStatusEnum('status').notNull().default('active'),
    trashedAt: timestamp('trashed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('folders_user_parent_idx').on(table.userId, table.parentId, table.status),
    index('folders_path_idx').on(table.userId, table.path),
    uniqueIndex('uniq_folder_name_in_parent')
      .on(table.userId, table.parentId, table.name)
      .where(sql`${table.status} = 'active' AND ${table.parentId} IS NOT NULL`),
    uniqueIndex('uniq_folder_name_at_root')
      .on(table.userId, table.name)
      .where(sql`${table.status} = 'active' AND ${table.parentId} IS NULL`),
  ],
);
