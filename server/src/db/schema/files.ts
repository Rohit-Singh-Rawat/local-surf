import { sql } from 'drizzle-orm';
import {
  bigint,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { folders } from './folders';
import { users } from './users';

export const fileStatusEnum = pgEnum('file_status', ['pending', 'uploaded', 'trashed']);

export const files = pgTable(
  'files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    folderId: uuid('folder_id').references(() => folders.id),
    name: text('name').notNull(),
    s3Key: text('s3_key').notNull().unique(),
    /** Present only while a multipart upload is in-progress. */
    s3UploadId: text('s3_upload_id'),
    mimeType: text('mime_type').notNull(),
    size: bigint('size', { mode: 'number' }).notNull(),
    status: fileStatusEnum('status').notNull().default('pending'),
    trashedAt: timestamp('trashed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('files_user_folder_idx').on(table.userId, table.folderId, table.status),
    index('files_user_name_idx').on(table.userId, table.name),
    index('files_user_trashed_idx')
      .on(table.userId, table.trashedAt)
      .where(sql`${table.status} = 'trashed'`),
    uniqueIndex('uniq_file_name_in_folder')
      .on(table.userId, table.folderId, table.name)
      .where(sql`${table.status} = 'uploaded' AND ${table.folderId} IS NOT NULL`),
    uniqueIndex('uniq_file_name_at_root')
      .on(table.userId, table.name)
      .where(sql`${table.status} = 'uploaded' AND ${table.folderId} IS NULL`),
  ],
);
