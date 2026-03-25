import { Router } from 'express'
import { mentionService } from '../services/mention.service'
import { authenticate } from '../middleware/auth'
import { success, paginated } from '../utils/response'
import type { AuthRequest } from '../types'

const router = Router({ mergeParams: true })

router.use(authenticate)

// List mentions with filters
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(String(req.query.page ?? 1))
    const pageSize = parseInt(String(req.query.pageSize ?? 25))
    const filters = {
      search: req.query.search as string,
      sentiments: req.query.sentiments ? String(req.query.sentiments).split(',') : undefined,
      sources: req.query.sources ? String(req.query.sources).split(',') : undefined,
      languages: req.query.languages ? String(req.query.languages).split(',') : undefined,
      keywords: req.query.keywords ? String(req.query.keywords).split(',') : undefined,
      tags: req.query.tags ? String(req.query.tags).split(',') : undefined,
      minFollowers: req.query.minFollowers ? parseInt(String(req.query.minFollowers)) : undefined,
      minEngagement: req.query.minEngagement ? parseInt(String(req.query.minEngagement)) : undefined,
      sortBy: req.query.sortBy as string,
      datePreset: req.query.datePreset as string,
      from: req.query.from as string,
      to: req.query.to as string,
    }
    const result = await mentionService.getMentions(req.params.projectId, filters, page, pageSize)
    paginated(res, result.data, result.total, result.page, result.pageSize)
  } catch (err) { next(err) }
})

// Get single mention
router.get('/:mentionId', async (req: AuthRequest, res, next) => {
  try {
    const mention = await mentionService.getMention(req.params.projectId, req.params.mentionId)
    success(res, mention)
  } catch (err) { next(err) }
})

// Update mention metadata (tags, notes, status, star)
router.put('/:mentionId', async (req: AuthRequest, res, next) => {
  try {
    const { tags, notes, status, isStarred } = req.body
    const mention = await mentionService.updateMention(
      req.params.projectId,
      req.params.mentionId,
      { tags, notes, status, isStarred }
    )
    success(res, mention)
  } catch (err) { next(err) }
})

// Get mention stats
router.get('/stats', async (req: AuthRequest, res, next) => {
  try {
    const stats = await mentionService.getMentionStats(req.params.projectId)
    success(res, stats)
  } catch (err) { next(err) }
})

export default router
