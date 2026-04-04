import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import app from './app'
import { env } from './config/env'
import { connectMongoDB, connectPostgres } from './config/database'
import { connectRedis } from './config/redis'
import { logger } from './utils/logger'
import { startCollectionScheduler, stopCollectionScheduler } from './services/collection/collector.manager'
import { verifyToken } from './utils/jwt'
import { Project } from './models/postgres/Project'

async function bootstrap() {
  try {
    // Connect all databases in parallel
    await Promise.all([
      connectMongoDB(),
      connectPostgres(),
      connectRedis(),
    ])

    const httpServer = createServer(app)

    // ── Socket.io ───────────────────────────────────────────────────────────
    const io = new SocketServer(httpServer, {
      cors: {
        origin: env.FRONTEND_URL,
        credentials: true,
      },
    })

    // Authenticate socket connections via JWT passed in handshake auth
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token as string | undefined
      if (!token) {
        next(new Error('Authentication required'))
        return
      }
      try {
        const payload = verifyToken(token)
        socket.data.user = payload
        next()
      } catch {
        next(new Error('Invalid or expired token'))
      }
    })

    io.on('connection', (socket) => {
      logger.debug(`Socket connected: ${socket.id}`)

      socket.on('join_project', async (projectId: string) => {
        try {
          const userId = socket.data.user?.userId
          if (!userId) { socket.disconnect(); return }
          const project = await Project.findOne({ where: { id: projectId, userId } })
          if (!project) { socket.emit('error', { message: 'Project not found' }); return }
          socket.join(`project:${projectId}`)
          logger.debug(`Socket ${socket.id} joined project:${projectId}`)
        } catch (err) {
          logger.error('Socket join_project error', err)
        }
      })

      socket.on('leave_project', (projectId: string) => {
        socket.leave(`project:${projectId}`)
      })

      socket.on('disconnect', () => {
        logger.debug(`Socket disconnected: ${socket.id}`)
      })
    })

    // Attach io to app for use in routes/services
    app.set('io', io)

    // ── Start server ────────────────────────────────────────────────────────
    httpServer.listen(env.PORT, () => {
      logger.info(`SocialEcho backend running on port ${env.PORT} (${env.NODE_ENV})`)
      // Start data collection scheduler after server is ready
      startCollectionScheduler(io)
    })

    // ── Graceful shutdown ───────────────────────────────────────────────────
    const shutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully…`)
      stopCollectionScheduler()
      httpServer.close(() => {
        logger.info('HTTP server closed')
        process.exit(0)
      })
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT',  () => shutdown('SIGINT'))
  } catch (err) {
    logger.error('Failed to start server', err)
    process.exit(1)
  }
}

bootstrap()
