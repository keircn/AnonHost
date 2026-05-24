CREATE TYPE "public"."image_status" AS ENUM('pending', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "images" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"fileSize" integer NOT NULL,
	"contentType" varchar(255) NOT NULL,
	"status" "image_status" DEFAULT 'pending' NOT NULL,
	"userId" uuid NOT NULL,
	"url" text
);
--> statement-breakpoint
CREATE TABLE "PrivateUpload" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"downloadToken" varchar(64) NOT NULL,
	"objectKey" text NOT NULL,
	"filename" varchar(255) NOT NULL,
	"size" integer NOT NULL,
	"contentType" varchar(255) NOT NULL,
	"passwordHash" text NOT NULL,
	"passwordSalt" text NOT NULL,
	"oneUse" boolean DEFAULT false NOT NULL,
	"downloadTokenUsedAt" timestamp,
	"consumedAt" timestamp,
	"userId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "PrivateUpload_downloadToken_unique" UNIQUE("downloadToken")
);
--> statement-breakpoint
ALTER TABLE "Media" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Media" ADD COLUMN "deletionToken" varchar(64);--> statement-breakpoint
ALTER TABLE "Media" ADD COLUMN "disableEmbed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "Settings" ADD COLUMN "disableEmbedByDefault" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "Settings" ADD COLUMN "embedTitleTemplate" text;--> statement-breakpoint
ALTER TABLE "Settings" ADD COLUMN "embedDescriptionTemplate" text;--> statement-breakpoint
ALTER TABLE "Settings" ADD COLUMN "embedSiteName" varchar(120);--> statement-breakpoint
ALTER TABLE "Settings" ADD COLUMN "embedAccentColor" varchar(7);--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PrivateUpload" ADD CONSTRAINT "PrivateUpload_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "private_upload_user_idx" ON "PrivateUpload" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "private_upload_download_token_idx" ON "PrivateUpload" USING btree ("downloadToken");