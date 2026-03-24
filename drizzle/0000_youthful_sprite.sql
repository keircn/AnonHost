CREATE TYPE "public"."media_type" AS ENUM('IMAGE', 'VIDEO', 'AUDIO', 'TEXT', 'DOCUMENT', 'ARCHIVE');--> statement-breakpoint
CREATE TABLE "Account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "Account_provider_providerAccountId_unique" UNIQUE("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "ApiKey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"userId" uuid NOT NULL,
	"lastUsed" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ApiKey_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "Media" (
	"id" char(6) PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"filename" varchar(255) NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"duration" integer,
	"type" "media_type" DEFAULT 'IMAGE' NOT NULL,
	"userId" uuid NOT NULL,
	"public" boolean DEFAULT false NOT NULL,
	"domain" varchar(253),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"archiveType" text,
	"fileCount" integer,
	"archiveMeta" jsonb
);
--> statement-breakpoint
CREATE TABLE "OTP" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"type" text DEFAULT 'LOGIN' NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionToken" text NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "Session_sessionToken_unique" UNIQUE("sessionToken")
);
--> statement-breakpoint
CREATE TABLE "Settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"enableNotifications" boolean DEFAULT true NOT NULL,
	"makeImagesPublic" boolean DEFAULT false NOT NULL,
	"enableDirectLinks" boolean DEFAULT true NOT NULL,
	"customDomain" varchar(253),
	CONSTRAINT "Settings_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "Shortlink" (
	"id" char(6) PRIMARY KEY NOT NULL,
	"uid" integer GENERATED ALWAYS AS IDENTITY (sequence name "Shortlink_uid_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"originalUrl" text NOT NULL,
	"title" text,
	"userId" uuid NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"public" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expireAt" timestamp,
	CONSTRAINT "Shortlink_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uid" integer GENERATED ALWAYS AS IDENTITY (sequence name "User_uid_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"premium" boolean DEFAULT false NOT NULL,
	"admin" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"storageUsed" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "User_uid_unique" UNIQUE("uid"),
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "VerificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "VerificationToken_identifier_token_unique" UNIQUE("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Media" ADD CONSTRAINT "Media_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OTP" ADD CONSTRAINT "OTP_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Shortlink" ADD CONSTRAINT "Shortlink_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "otp_email_idx" ON "OTP" USING btree ("email");--> statement-breakpoint
CREATE INDEX "otp_user_idx" ON "OTP" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "shortlink_original_url_idx" ON "Shortlink" USING btree ("originalUrl");