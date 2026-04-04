import mongoose from 'mongoose'
import { Sequelize } from 'sequelize'
import { env } from './env'
import { logger } from '../utils/logger'

// ── MongoDB ───────────────────────────────────────────────────────────────────
export async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    })
    logger.info('MongoDB connected')
  } catch (err) {
    logger.error('MongoDB connection failed', err)
    throw err
  }
}

// ── PostgreSQL ────────────────────────────────────────────────────────────────
export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  logging: env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
})

export async function connectPostgres(): Promise<void> {
  try {
    await sequelize.authenticate()
    await sequelize.sync({ alter: false })
    logger.info('PostgreSQL connected & synced')
  } catch (err) {
    logger.error('PostgreSQL connection failed', err)
    throw err
  }
}
