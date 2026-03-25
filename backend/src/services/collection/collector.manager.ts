/**
 * Collection Manager
 * Runs all data collectors on a schedule for every active project.
 */
import { Project } from '../../models/postgres/Project'
import { collectTwitterMentions } from './twitter.collector'
import { collectYouTubeMentions } from './youtube.collector'
import { collectNewsMentions } from './news.collector'
import { env } from '../../config/env'
import { logger } from '../../utils/logger'
import type { Server as SocketServer } from 'socket.io'

let collectionTimer: ReturnType<typeof setInterval> | null = null
let io: SocketServer | null = null

export function setSocketServer(socketServer: SocketServer) {
  io = socketServer
}

export async function runCollectionCycle(): Promise<void> {
  logger.info('Starting data collection cycle…')

  try {
    const projects = await Project.findAll()
    if (!projects.length) {
      logger.info('No projects found, skipping collection cycle')
      return
    }

    for (const project of projects) {
      const keywords = (project.keywords as Array<{ keyword: string; isActive: boolean }>)
        .filter((k) => k.isActive !== false)
        .map((k) => k.keyword)

      if (!keywords.length) continue

      logger.info(`Collecting mentions for project: ${project.name} (${keywords.length} keywords)`)

      const [twitterCount, youtubeCount, newsCount] = await Promise.allSettled([
        collectTwitterMentions(project.id, keywords),
        collectYouTubeMentions(project.id, keywords),
        env.ENABLE_NEWS_COLLECTION ? collectNewsMentions(project.id, keywords) : Promise.resolve(0),
      ]).then((results) =>
        results.map((r) => (r.status === 'fulfilled' ? r.value : 0))
      )

      const total = twitterCount + youtubeCount + newsCount
      logger.info(
        `Project "${project.name}": +${total} mentions (Twitter: ${twitterCount}, YouTube: ${youtubeCount}, News: ${newsCount})`
      )

      // Notify connected dashboard users via WebSocket
      if (total > 0 && io) {
        io.to(`project:${project.id}`).emit('collection_update', {
          projectId: project.id,
          newMentions: total,
        })
      }
    }
  } catch (err) {
    logger.error('Collection cycle error', err)
  }

  logger.info('Data collection cycle complete')
}

export function startCollectionScheduler(socketServer?: SocketServer): void {
  if (!env.ENABLE_AUTO_COLLECTION) {
    logger.info('Auto collection disabled (ENABLE_AUTO_COLLECTION=false)')
    return
  }

  if (socketServer) io = socketServer

  const intervalMs = env.DATA_COLLECTION_INTERVAL_MINUTES * 60 * 1000
  logger.info(`Starting collection scheduler (every ${env.DATA_COLLECTION_INTERVAL_MINUTES} minutes)`)

  // Run immediately on startup after a short delay
  setTimeout(() => runCollectionCycle(), 10_000)

  // Then run on schedule
  collectionTimer = setInterval(() => runCollectionCycle(), intervalMs)
}

export function stopCollectionScheduler(): void {
  if (collectionTimer) {
    clearInterval(collectionTimer)
    collectionTimer = null
    logger.info('Collection scheduler stopped')
  }
}
