import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const globalForDb = globalThis as unknown as {
  dbClient?: postgres.Sql;
};

const client =
  globalForDb.dbClient ||
  postgres(connectionString, {
    max: process.env.NODE_ENV === 'development' ? 5 : 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.dbClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
