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
ALTER TABLE "PrivateUpload" ADD CONSTRAINT "PrivateUpload_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "private_upload_user_idx" ON "PrivateUpload" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX "private_upload_download_token_idx" ON "PrivateUpload" USING btree ("downloadToken");
