import { DbUser } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { apiKeys, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function verifyApiKey(apiKey: string): Promise<DbUser | null> {
  if (!apiKey) return null;

  const [row] = await db
    .select({ user: users })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(eq(apiKeys.key, apiKey))
    .limit(1);

  return row?.user ?? null;
}
