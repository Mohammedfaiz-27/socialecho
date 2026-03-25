import Redis from 'ioredis'
import { env } from './env'
import { logger } from '../utils/logger'

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  lazyConnect: true,
})

redis.on('connect', () => logger.info('Redis connected'))
redis.on('error', (err) => logger.error('Redis error', err))

export async function connectRedis(): Promise<void> {
  await redis.connect()
}

// ── Cache helpers ─────────────────────────────────────────────────────────────
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const val = await redis.get(key)
    return val ? JSON.parse(val) : null
  },

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  },

  async del(key: string): Promise<void> {
    await redis.del(key)
  },

  async incr(key: string): Promise<number> {
    return redis.incr(key)
  },
}
