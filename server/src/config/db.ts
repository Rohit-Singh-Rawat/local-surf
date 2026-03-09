import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import { env } from './env';

const queryClient = postgres(env.DATABASE_URL, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema, logger: env.NODE_ENV === 'development' });
export { queryClient };
