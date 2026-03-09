import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from './src/db/schema';

const DATABASE_URL = process.env.DATABASE_URL ?? '';

const queryClient = postgres(DATABASE_URL, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
});

const db = drizzle(queryClient, { schema });

try {
  console.log('Testing db.execute(sql`SELECT 1`)...');
  const result = await db.execute(sql`SELECT 1`);
  console.log('✅ Drizzle DB OK:', result);
} catch (e: any) {
  console.error('❌ Drizzle DB ERROR:', e.message, e.stack);
} finally {
  await queryClient.end();
}
