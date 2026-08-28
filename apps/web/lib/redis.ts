import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// Queue helpers
export const QUEUES = {
  CALL_PROCESSING: 'call:processing',
  SMS_NOTIFICATIONS: 'sms:notifications',
  REVIEW_REQUESTS: 'review:requests',
  CALENDAR_SYNC: 'calendar:sync',
};

export async function enqueue(queue: string, data: unknown, delayMs = 0) {
  const job = {
    id: `job:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
    data,
    createdAt: Date.now(),
    attempts: 0,
  };

  if (delayMs > 0) {
    await redis.zadd(`queue:${queue}:delayed`, Date.now() + delayMs, JSON.stringify(job));
  } else {
    await redis.lpush(`queue:${queue}`, JSON.stringify(job));
  }

  return job.id;
}

export async function dequeue(queue: string) {
  const item = await redis.rpop(`queue:${queue}`);
  return item ? JSON.parse(item) : null;
}
