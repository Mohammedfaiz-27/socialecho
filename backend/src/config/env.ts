import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

function required(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required env var: ${key}`)
  return val
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '5000'), 10),
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5173'),

  JWT_SECRET: optional('JWT_SECRET', 'dev_jwt_secret_change_in_production'),
  JWT_REFRESH_SECRET: optional('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_in_production'),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '24h'),
  JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '7d'),

  MONGODB_URI: optional('MONGODB_URI', 'mongodb://localhost:27017/socialecho'),

  POSTGRES_HOST: optional('POSTGRES_HOST', 'localhost'),
  POSTGRES_PORT: parseInt(optional('POSTGRES_PORT', '5432'), 10),
  POSTGRES_DB: optional('POSTGRES_DB', 'socialecho'),
  POSTGRES_USER: optional('POSTGRES_USER', 'postgres'),
  POSTGRES_PASSWORD: optional('POSTGRES_PASSWORD', 'postgres'),

  REDIS_HOST: optional('REDIS_HOST', 'localhost'),
  REDIS_PORT: parseInt(optional('REDIS_PORT', '6379'), 10),
  REDIS_PASSWORD: optional('REDIS_PASSWORD', ''),

  ELASTICSEARCH_URL: optional('ELASTICSEARCH_URL', 'http://localhost:9200'),

  OPENAI_API_KEY: optional('OPENAI_API_KEY', ''),
  GEMINI_API_KEY: optional('GEMINI_API_KEY', ''),

  RAPIDAPI_KEY: optional('RAPIDAPI_KEY', ''),
  YOUTUBE_API_KEY: optional('YOUTUBE_API_KEY', ''),

  ENABLE_AUTO_COLLECTION: optional('ENABLE_AUTO_COLLECTION', 'true') === 'true',
  DATA_COLLECTION_INTERVAL_MINUTES: parseInt(optional('DATA_COLLECTION_INTERVAL_MINUTES', '15'), 10),
  ENABLE_NEWS_COLLECTION: optional('ENABLE_NEWS_COLLECTION', 'true') === 'true',

  RATE_LIMIT_WINDOW_MS: parseInt(optional('RATE_LIMIT_WINDOW_MS', '60000'), 10),
  RATE_LIMIT_MAX_STANDARD: parseInt(optional('RATE_LIMIT_MAX_STANDARD', '1000'), 10),
} as const
