import { Router } from 'express'
import { analyticsService } from '../services/analytics.service'
import { authenticate } from '../middleware/auth'
import { success } from '../utils/response'
import type { AuthRequest } from '../types'
import { subDays, formatISO } from 'date-fns'

const router = Router({ mergeParams: true })

router.use(authenticate)

router.get('/metrics', async (req: AuthRequest, res, next) => {
  try {
    const to = (req.query.to as string) ?? formatISO(new Date())
    const from = (req.query.from as string) ?? formatISO(subDays(new Date(), 30))
    const metrics = await analyticsService.getMetrics(req.params.projectId, from, to)
    success(res, metrics)
  } catch (err) { next(err) }
})

export default router
