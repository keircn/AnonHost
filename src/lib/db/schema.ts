import {
  boolean,
  char,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const mediaTypeEnum = pgEnum("media_type", [
  "IMAGE",
  "VIDEO",
  "AUDIO",
  "TEXT",
  "DOCUMENT",
  "ARCHIVE",
]);

export const imageStatusEnum = pgEnum("image_status", ["pending", "ready", "failed"]);

export const users = pgTable("User", {
  id: uuid("id").defaultRandom().primaryKey(),
  uid: integer("uid").generatedAlwaysAsIdentity().unique(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  premium: boolean("premium").notNull().default(false),
  admin: boolean("admin").notNull().default(false),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  storageUsed: integer("storageUsed").notNull().default(0),
});

export const accounts = pgTable(
  "Account",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    providerProviderAccountIdUnique: unique().on(table.provider, table.providerAccountId),
  }),
);

export const sessions = pgTable("Session", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: text("sessionToken").notNull().unique(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "VerificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    identifierTokenUnique: unique().on(table.identifier, table.token),
  }),
);

export const media = pgTable("Media", {
  id: char("id", { length: 6 }).primaryKey(),
  url: text("url").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  duration: integer("duration"),
  type: mediaTypeEnum("type").notNull().default("IMAGE"),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  public: boolean("public").notNull().default(false),
  disableEmbed: boolean("disableEmbed").notNull().default(false),
  domain: varchar("domain", { length: 253 }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  archiveType: text("archiveType"),
  fileCount: integer("fileCount"),
  archiveMeta: jsonb("archiveMeta"),
});

export const images = pgTable("images", {
  id: varchar("id", { length: 21 }).primaryKey(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: integer("fileSize").notNull(),
  contentType: varchar("contentType", { length: 255 }).notNull(),
  status: imageStatusEnum("status").notNull().default("pending"),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text("url"),
});

export const apiKeys = pgTable("ApiKey", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lastUsed: timestamp("lastUsed", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export const settings = pgTable("Settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  enableNotifications: boolean("enableNotifications").notNull().default(true),
  makeImagesPublic: boolean("makeImagesPublic").notNull().default(false),
  enableDirectLinks: boolean("enableDirectLinks").notNull().default(true),
  disableEmbedByDefault: boolean("disableEmbedByDefault").notNull().default(false),
  embedTitleTemplate: text("embedTitleTemplate"),
  embedDescriptionTemplate: text("embedDescriptionTemplate"),
  embedSiteName: varchar("embedSiteName", { length: 120 }),
  embedAccentColor: varchar("embedAccentColor", { length: 7 }),
  customDomain: varchar("customDomain", { length: 253 }),
});

export const otps = pgTable(
  "OTP",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId").references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    code: text("code").notNull(),
    type: text("type").notNull().default("LOGIN"),
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    used: boolean("used").notNull().default(false),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("otp_email_idx").on(table.email),
    userIdx: index("otp_user_idx").on(table.userId),
  }),
);

export const shortlinks = pgTable(
  "Shortlink",
  {
    id: char("id", { length: 6 }).primaryKey(),
    uid: integer("uid").generatedAlwaysAsIdentity().unique(),
    originalUrl: text("originalUrl").notNull(),
    title: text("title"),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clicks: integer("clicks").notNull().default(0),
    public: boolean("public").notNull().default(false),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    expireAt: timestamp("expireAt", { mode: "date" }),
  },
  (table) => ({
    originalUrlIdx: index("shortlink_original_url_idx").on(table.originalUrl),
  }),
);

export type DbUser = typeof users.$inferSelect;
export type MediaType = (typeof mediaTypeEnum.enumValues)[number];
export type ImageStatus = (typeof imageStatusEnum.enumValues)[number];
