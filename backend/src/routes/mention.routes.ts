import { Router } from 'express'
import { mentionService } from '../services/mention.service'
import { authenticate } from '../middleware/auth'
import { success, paginated, error } from '../utils/response'
import { Project } from '../models/postgres/Project'
import type { AuthRequest } from '../types'

const router = Router({ mergeParams: true })

router.use(authenticate)

// Verify the requesting user owns the project before any mention access
router.use(async (req: AuthRequest, res, next) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.projectId, userId: req.user!.userId },
    })
    if (!project) { error(res, 'Project not found', 'NOT_FOUND', 404); return }
    next()
  } catch (err) { next(err) }
})

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

// Get mention stats — defined before /:mentionId to prevent route shadowing
router.get('/stats', async (req: AuthRequest, res, next) => {
  try {
    const stats = await mentionService.getMentionStats(req.params.projectId)
    success(res, stats)
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
    const VALID_STATUSES = ['new', 'reviewed', 'assigned', 'archived'] as const
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      error(res, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 'VALIDATION_ERROR', 400)
      return
    }
    const mention = await mentionService.updateMention(
      req.params.projectId,
      req.params.mentionId,
      { tags, notes, status, isStarred }
    )
    success(res, mention)
  } catch (err) { next(err) }
})

export default router
