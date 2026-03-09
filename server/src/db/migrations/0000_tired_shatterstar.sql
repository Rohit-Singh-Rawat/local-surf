CREATE TYPE "public"."file_status" AS ENUM('pending', 'uploaded', 'trashed');--> statement-breakpoint
CREATE TYPE "public"."folder_status" AS ENUM('active', 'trashed');--> statement-breakpoint
CREATE TYPE "public"."share_permission" AS ENUM('view', 'download');--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"folder_id" uuid,
	"name" text NOT NULL,
	"s3_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" bigint NOT NULL,
	"status" "file_status" DEFAULT 'pending' NOT NULL,
	"trashed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "files_s3_key_unique" UNIQUE("s3_key")
);
--> statement-breakpoint
CREATE TABLE "folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"path" text DEFAULT '/' NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"status" "folder_status" DEFAULT 'active' NOT NULL,
	"trashed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"shared_with_id" uuid,
	"is_public" boolean DEFAULT false NOT NULL,
	"public_token" text,
	"permission" "share_permission" DEFAULT 'view' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shares_public_token_unique" UNIQUE("public_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar" text,
	"storage_used" bigint DEFAULT 0 NOT NULL,
	"storage_quota" bigint DEFAULT 1073741824 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_shared_with_id_users_id_fk" FOREIGN KEY ("shared_with_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "files_user_folder_idx" ON "files" USING btree ("user_id","folder_id","status");--> statement-breakpoint
CREATE INDEX "files_user_name_idx" ON "files" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "files_user_trashed_idx" ON "files" USING btree ("user_id","trashed_at") WHERE "files"."status" = 'trashed';--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_file_name_in_folder" ON "files" USING btree ("user_id","folder_id","name") WHERE "files"."status" = 'uploaded' AND "files"."folder_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_file_name_at_root" ON "files" USING btree ("user_id","name") WHERE "files"."status" = 'uploaded' AND "files"."folder_id" IS NULL;--> statement-breakpoint
CREATE INDEX "folders_user_parent_idx" ON "folders" USING btree ("user_id","parent_id","status");--> statement-breakpoint
CREATE INDEX "folders_path_idx" ON "folders" USING btree ("user_id","path");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_folder_name_in_parent" ON "folders" USING btree ("user_id","parent_id","name") WHERE "folders"."status" = 'active' AND "folders"."parent_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_folder_name_at_root" ON "folders" USING btree ("user_id","name") WHERE "folders"."status" = 'active' AND "folders"."parent_id" IS NULL;--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_hash_idx" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "shares_shared_with_idx" ON "shares" USING btree ("shared_with_id","file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shares_public_token_idx" ON "shares" USING btree ("public_token") WHERE "shares"."is_public" = true;--> statement-breakpoint
CREATE INDEX "shares_file_idx" ON "shares" USING btree ("file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_google_id_idx" ON "users" USING btree ("google_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");