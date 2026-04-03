import { randomBytes } from "crypto";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys, media, otps, settings, shortlinks, users } from "@/lib/db/schema";

function makeShortId() {
  return randomBytes(4).toString("base64url").slice(0, 6);
}

function pickSelected(row: any, select?: Record<string, boolean>) {
  if (!select) return row;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(select)) {
    if (select[key]) out[key] = row[key];
  }
  return out;
}

const prisma = {
  user: {
    async count() {
      const [row] = await db.select({ value: sql<number>`count(*)::int` }).from(users);
      return row?.value ?? 0;
    },
    async findUnique(args: any) {
      const where = args?.where ?? {};
      const condition = where.id
        ? eq(users.id, where.id)
        : where.email
          ? eq(users.email, where.email)
          : undefined;
      if (!condition) return null;

      const [row] = await db.select().from(users).where(condition).limit(1);
      if (!row) return null;
      return pickSelected(row, args?.select);
    },
    async create(args: any) {
      const [row] = await db.insert(users).values(args.data).returning();
      return row;
    },
    async update(args: any) {
      const data = { ...args.data };
      if (data.storageUsed?.decrement !== undefined) {
        data.storageUsed = sql`${users.storageUsed} - ${data.storageUsed.decrement}`;
      }
      const [row] = await db.update(users).set(data).where(eq(users.id, args.where.id)).returning();
      return row;
    },
    async findMany(args: any) {
      const order = args?.orderBy?.createdAt === "asc" ? asc : desc;
      const rows = await db.select().from(users).orderBy(order(users.createdAt));
      if (!args?.include?._count && !args?.include?.settings) return rows;

      const withExtras = await Promise.all(
        rows.map(async (row) => {
          const [m] = await db
            .select({ value: sql<number>`count(*)::int` })
            .from(media)
            .where(eq(media.userId, row.id));
          const [s] = await db
            .select({ value: sql<number>`count(*)::int` })
            .from(shortlinks)
            .where(eq(shortlinks.userId, row.id));
          const [k] = await db
            .select({ value: sql<number>`count(*)::int` })
            .from(apiKeys)
            .where(eq(apiKeys.userId, row.id));
          const [st] = await db.select().from(settings).where(eq(settings.userId, row.id)).limit(1);
          return {
            ...row,
            settings: st ?? null,
            _count: {
              Media: m?.value ?? 0,
              Shortlink: s?.value ?? 0,
              apiKeys: k?.value ?? 0,
            },
          };
        }),
      );
      return withExtras;
    },
  },
  apiKey: {
    async findFirst(args: any) {
      const [row] = await db.select().from(apiKeys).where(eq(apiKeys.key, args.where.key)).limit(1);
      if (!row) return null;
      if (args?.include?.user) {
        const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
        return { ...row, user: user ?? null };
      }
      return row;
    },
    async findUnique(args: any) {
      const where = args.where;
      const cond = where.id ? eq(apiKeys.id, where.id) : eq(apiKeys.key, where.key);
      const [row] = await db.select().from(apiKeys).where(cond).limit(1);
      if (!row) return null;
      if (args?.include?.user) {
        const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
        return { ...row, user: user ?? null };
      }
      return pickSelected(row, args?.select);
    },
    async findMany(args: any) {
      const order = args?.orderBy?.createdAt === "asc" ? asc : desc;
      return db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.userId, args.where.userId))
        .orderBy(order(apiKeys.createdAt));
    },
    async count(args: any) {
      const where = args?.where ?? {};
      const conds = [eq(apiKeys.userId, where.userId)];
      if (where.lastUsed?.gte) {
        conds.push(gte(apiKeys.lastUsed, where.lastUsed.gte));
      }
      const [row] = await db
        .select({ value: sql<number>`count(*)::int` })
        .from(apiKeys)
        .where(and(...conds));
      return row?.value ?? 0;
    },
    async create(args: any) {
      const [row] = await db.insert(apiKeys).values(args.data).returning();
      return row;
    },
    async update(args: any) {
      const where = args.where;
      const cond = where.id ? eq(apiKeys.id, where.id) : eq(apiKeys.key, where.key);
      const [row] = await db.update(apiKeys).set(args.data).where(cond).returning();
      return row;
    },
    async delete(args: any) {
      const [row] = await db.delete(apiKeys).where(eq(apiKeys.id, args.where.id)).returning();
      return row;
    },
  },
  media: {
    async count(args: any) {
      const cond = args?.where?.userId ? eq(media.userId, args.where.userId) : undefined;
      const q = db.select({ value: sql<number>`count(*)::int` }).from(media);
      const [row] = cond ? await q.where(cond) : await q;
      return row?.value ?? 0;
    },
    async findMany(args: any) {
      const where = args?.where;
      const cond = where?.userId ? eq(media.userId, where.userId) : undefined;
      let orderCol = media.createdAt;
      if (args?.orderBy?.filename) orderCol = media.filename as any;
      if (args?.orderBy?.size) orderCol = media.size as any;
      const orderDir = Object.values(args?.orderBy ?? {})[0] === "asc" ? asc : desc;
      let q: any = db.select().from(media).orderBy(orderDir(orderCol));
      if (cond) q = q.where(cond);
      if (args?.skip !== undefined) q = q.offset(args.skip);
      if (args?.take !== undefined) q = q.limit(args.take);
      return q;
    },
    async aggregate(args: any) {
      const cond = args?.where?.userId ? eq(media.userId, args.where.userId) : undefined;
      const q = db.select({ size: sql<number>`coalesce(sum(${media.size}),0)::int` }).from(media);
      const [row] = cond ? await q.where(cond) : await q;
      return { _sum: { size: row?.size ?? 0 } };
    },
    async create(args: any) {
      const data = { ...args.data };
      if (!data.id) data.id = makeShortId();
      const [row] = await db.insert(media).values(data).returning();
      return row;
    },
    async findUnique(args: any) {
      const [row] = await db.select().from(media).where(eq(media.id, args.where.id)).limit(1);
      if (!row) return null;
      if (args?.include?.user) {
        const userSelect = args.include.user.select ?? {};
        const [u] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);

        let userWithRelations: any = u ? pickSelected(u, userSelect) : null;

        if (u && userSelect.settings) {
          const settingsSelect =
            typeof userSelect.settings === "object" ? userSelect.settings.select : undefined;

          const [s] = await db.select().from(settings).where(eq(settings.userId, u.id)).limit(1);

          userWithRelations = {
            ...userWithRelations,
            settings: s ? pickSelected(s, settingsSelect) : null,
          };
        }

        return {
          ...row,
          user: userWithRelations,
        };
      }
      return pickSelected(row, args?.select);
    },
    async delete(args: any) {
      const [row] = await db.delete(media).where(eq(media.id, args.where.id)).returning();
      return row;
    },
  },
  settings: {
    async findUnique(args: any) {
      const [row] = await db
        .select()
        .from(settings)
        .where(eq(settings.userId, args.where.userId))
        .limit(1);
      if (!row) return null;
      return pickSelected(row, args?.select);
    },
    async create(args: any) {
      const [row] = await db.insert(settings).values(args.data).returning();
      return row;
    },
    async upsert(args: any) {
      const existing = await this.findUnique({ where: args.where });
      if (existing) {
        const [row] = await db
          .update(settings)
          .set(args.update)
          .where(eq(settings.userId, args.where.userId))
          .returning();
        return row;
      }
      const [row] = await db.insert(settings).values(args.create).returning();
      return row;
    },
  },
  oTP: {
    async create(args: any) {
      const [row] = await db.insert(otps).values(args.data).returning();
      return row;
    },
    async deleteMany(args: any) {
      await db
        .delete(otps)
        .where(
          and(
            args.where.email ? eq(otps.email, args.where.email) : undefined,
            args.where.userId ? eq(otps.userId, args.where.userId) : undefined,
            args.where.type ? eq(otps.type, args.where.type) : undefined,
            args.where.used !== undefined ? eq(otps.used, args.where.used) : undefined,
          ) as any,
        );
      return { count: 0 };
    },
    async findFirst(args: any) {
      const where = args.where;
      const conds: any[] = [];
      if (where.email) conds.push(eq(otps.email, where.email));
      if (where.userId) conds.push(eq(otps.userId, where.userId));
      if (where.code) conds.push(eq(otps.code, where.code));
      if (where.type) conds.push(eq(otps.type, where.type));
      if (where.used !== undefined) conds.push(eq(otps.used, where.used));
      if (where.expiresAt?.gt) conds.push(gte(otps.expiresAt, where.expiresAt.gt));
      const [row] = await db
        .select()
        .from(otps)
        .where(and(...conds))
        .limit(1);
      if (!row) return null;
      if (args?.include?.user) {
        const [u] = row.userId
          ? await db.select().from(users).where(eq(users.id, row.userId)).limit(1)
          : [null];
        return { ...row, user: u };
      }
      return row;
    },
    async update(args: any) {
      const [row] = await db
        .update(otps)
        .set(args.data)
        .where(eq(otps.id, args.where.id))
        .returning();
      return row;
    },
  },
  shortlink: {
    async findMany(args: any) {
      const order = args?.orderBy?.createdAt === "asc" ? asc : desc;
      return db
        .select()
        .from(shortlinks)
        .where(eq(shortlinks.userId, args.where.userId))
        .orderBy(order(shortlinks.createdAt));
    },
    async findUnique(args: any) {
      const [row] = await db
        .select()
        .from(shortlinks)
        .where(eq(shortlinks.id, args.where.id))
        .limit(1);
      return row ?? null;
    },
    async create(args: any) {
      const data = { ...args.data };
      if (!data.id) data.id = makeShortId();
      const [row] = await db.insert(shortlinks).values(data).returning();
      return row;
    },
    async update(args: any) {
      const [row] = await db
        .update(shortlinks)
        .set(args.data)
        .where(eq(shortlinks.id, args.where.id))
        .returning();
      return row;
    },
    async delete(args: any) {
      const [row] = await db.delete(shortlinks).where(eq(shortlinks.id, args.where.id)).returning();
      return row;
    },
  },
  async $queryRaw(_parts: TemplateStringsArray) {
    const [row] = await db
      .select({ total: sql<bigint>`coalesce(sum(${media.size}),0)` })
      .from(media);
    return [row ?? { total: 0n }];
  },
  async $transaction(promises: Promise<unknown>[]) {
    return Promise.all(promises);
  },
};

export default prisma;
