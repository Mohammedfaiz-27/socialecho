import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { env } from './config/env'
import { standardLimiter } from './middleware/rateLimiter'
import { notFound, globalErrorHandler } from './middleware/errorHandler'
import { logger } from './utils/logger'

// Routes
import authRoutes from './routes/auth.routes'
import projectRoutes from './routes/project.routes'
import mentionRoutes from './routes/mention.routes'
import analyticsRoutes from './routes/analytics.routes'
import collectionRoutes from './routes/collection.routes'

const app = express()

// ── Security & Utility Middleware ─────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.use(compression())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: () => env.NODE_ENV === 'test',
  })
)
app.use(standardLimiter)

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
})

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/projects', projectRoutes)
app.use('/api/v1/projects/:projectId/mentions', mentionRoutes)
app.use('/api/v1/projects/:projectId/analytics', analyticsRoutes)
app.use('/api/v1/collection', collectionRoutes)

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound)
app.use(globalErrorHandler)

export default app
