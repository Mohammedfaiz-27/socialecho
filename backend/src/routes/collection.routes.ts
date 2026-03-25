import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { runCollectionCycle } from '../services/collection/collector.manager'
import { collectNewsMentions } from '../services/collection/news.collector'
import { collectTwitterMentions } from '../services/collection/twitter.collector'
import { collectYouTubeMentions } from '../services/collection/youtube.collector'
import { Project } from '../models/postgres/Project'
import { success, error } from '../utils/response'
import type { AuthRequest } from '../types'

const router = Router()
router.use(authenticate)

// Trigger full collection cycle manually
router.post('/trigger', async (_req, res, next) => {
  try {
    // Run async, don't wait
    runCollectionCycle().catch(console.error)
    success(res, { message: 'Collection cycle started' })
  } catch (err) { next(err) }
})

// Trigger collection for a specific project
router.post('/trigger/:projectId', async (req: AuthRequest, res, next) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.projectId, userId: req.user!.userId },
    })
    if (!project) { error(res, 'Project not found', 'NOT_FOUND', 404); return }

    const keywords = (project.keywords as Array<{ keyword: string; isActive: boolean }>)
      .filter((k) => k.isActive !== false)
      .map((k) => k.keyword)

    if (!keywords.length) {
      error(res, 'No keywords configured for this project', 'NO_KEYWORDS', 400)
      return
    }

    // Run all collectors in parallel, don't wait
    Promise.all([
      collectTwitterMentions(project.id, keywords),
      collectYouTubeMentions(project.id, keywords),
      collectNewsMentions(project.id, keywords),
    ]).then(([t, y, n]) => {
      console.log(`Manual collection done: Twitter=${t} YouTube=${y} News=${n}`)
    }).catch(console.error)

    success(res, { message: `Collection started for ${keywords.length} keywords`, keywords })
  } catch (err) { next(err) }
})

export default router
