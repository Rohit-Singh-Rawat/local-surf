import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import Redis from 'ioredis';
import { env } from './src/config/env';

const queryClient = postgres(env.DATABASE_URL, { max: 20, idle_timeout: 30, connect_timeout: 10 });
const db = drizzle(queryClient);
const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });

redis.on('error', (err: Error) => console.error('Redis error event:', err.message));
redis.on('connect', () => console.log('Redis connect event fired'));

// Give redis a moment to connect
await new Promise((r) => setTimeout(r, 1500));

const [dbResult, redisResult] = await Promise.allSettled([db.execute(sql`SELECT 1`), redis.ping()]);

console.log('DB result status:', dbResult.status);
if (dbResult.status === 'rejected') console.error('DB reason:', (dbResult.reason as Error).message);
else console.log('DB value (first row):', dbResult.value[0]);

console.log('Redis result status:', redisResult.status);
if (redisResult.status === 'rejected')
	console.error('Redis reason:', (redisResult.reason as Error).message);
else console.log('Redis value:', redisResult.value);

await queryClient.end();
redis.disconnect();
