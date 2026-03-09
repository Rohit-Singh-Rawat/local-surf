import postgres from 'postgres';
import Redis from 'ioredis';

const DATABASE_URL = process.env.DATABASE_URL ?? '';
const REDIS_URL = process.env.REDIS_URL ?? '';

// Test DB
try {
  const sql = postgres(DATABASE_URL, { connect_timeout: 10 });
  const result = await sql`SELECT 1 as alive`;
  console.log('✅ DB OK:', result);
  await sql.end();
} catch (e: any) {
  console.error('❌ DB ERROR:', e.message);
}

// Test Redis
const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 1 });
redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});
try {
  const pong = await redis.ping();
  console.log('✅ Redis OK:', pong);
} catch (e: any) {
  console.error('❌ Redis ERROR:', e.message);
} finally {
  redis.disconnect();
}
