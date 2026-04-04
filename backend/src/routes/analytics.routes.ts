import { Router } from 'express'
import { analyticsService } from '../services/analytics.service'
import { aiService } from '../services/ai.service'
import { Mention } from '../models/mongo/Mention'
import { authenticate } from '../middleware/auth'
import { success, error } from '../utils/response'
import { Project } from '../models/postgres/Project'
import type { AuthRequest } from '../types'
import { subDays, formatISO } from 'date-fns'

const router = Router({ mergeParams: true })

router.use(authenticate)

// Verify the requesting user owns the project before any analytics access
router.use(async (req: AuthRequest, res, next) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.projectId, userId: req.user!.userId },
    })
    if (!project) { error(res, 'Project not found', 'NOT_FOUND', 404); return }
    next()
  } catch (err) { next(err) }
})

router.get('/metrics', async (req: AuthRequest, res, next) => {
  try {
    const to = (req.query.to as string) ?? formatISO(new Date())
    const from = (req.query.from as string) ?? formatISO(subDays(new Date(), 30))
    const metrics = await analyticsService.getMetrics(req.params.projectId, from, to)
    success(res, metrics)
  } catch (err) { next(err) }
})

router.get('/export', async (req: AuthRequest, res, next) => {
  try {
    const to = (req.query.to as string) ?? formatISO(new Date())
    const from = (req.query.from as string) ?? formatISO(subDays(new Date(), 30))

    const mentions = await Mention.find({
      projectId: req.params.projectId,
      'temporal.publishedAt': { $gte: new Date(from), $lte: new Date(to) },
    })
      .sort({ 'temporal.publishedAt': -1 })
      .limit(5000)
      .lean()

    const headers = ['Date', 'Platform', 'Author', 'Username', 'Content', 'Sentiment', 'Confidence', 'Followers', 'Likes', 'Comments', 'Shares', 'Engagement Rate', 'Influence Score', 'URL']
    const rows = mentions.map((m) => [
      m.temporal?.publishedAt ? new Date(m.temporal.publishedAt).toISOString().split('T')[0] : '',
      m.source?.platform ?? '',
      `"${(m.author?.displayName ?? '').replace(/"/g, '""')}"`,
      m.author?.username ?? '',
      `"${(m.content?.text ?? '').replace(/"/g, '""').slice(0, 300)}"`,
      m.analysis?.sentiment ?? '',
      m.analysis?.sentimentConfidence ?? 0,
      m.author?.followerCount ?? 0,
      m.engagement?.likes ?? 0,
      m.engagement?.comments ?? 0,
      m.engagement?.shares ?? 0,
      m.engagement?.engagementRate != null ? m.engagement.engagementRate.toFixed(2) : '0',
      m.analysis?.influenceScore != null ? m.analysis.influenceScore.toFixed(1) : '0',
      m.content?.url ?? '',
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const fromDate = from.split('T')[0]
    const toDate = to.split('T')[0]
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="mentions-${fromDate}-to-${toDate}.csv"`)
    res.send(csv)
  } catch (err) { next(err) }
})

router.get('/hashtags', async (req: AuthRequest, res, next) => {
  try {
    const to = (req.query.to as string) ?? formatISO(new Date())
    const from = (req.query.from as string) ?? formatISO(subDays(new Date(), 30))
    const limit = parseInt(req.query.limit as string ?? '20', 10)
    const data = await analyticsService.getTopHashtags(req.params.projectId, from, to, limit)
    success(res, data)
  } catch (err) { next(err) }
})

router.get('/keywords', async (req: AuthRequest, res, next) => {
  try {
    const to = (req.query.to as string) ?? formatISO(new Date())
    const from = (req.query.from as string) ?? formatISO(subDays(new Date(), 30))
    const data = await analyticsService.getKeywordPerformance(req.params.projectId, from, to)
    success(res, data)
  } catch (err) { next(err) }
})

router.get('/spikes', async (req: AuthRequest, res, next) => {
  try {
    const to = (req.query.to as string) ?? formatISO(new Date())
    const from = (req.query.from as string) ?? formatISO(subDays(new Date(), 30))
    const data = await analyticsService.getSpikeDetection(req.params.projectId, from, to)
    success(res, data)
  } catch (err) { next(err) }
})

router.get('/wordcloud', async (req: AuthRequest, res, next) => {
  try {
    const to = (req.query.to as string) ?? formatISO(new Date())
    const from = (req.query.from as string) ?? formatISO(subDays(new Date(), 30))
    const data = await analyticsService.getWordCloud(req.params.projectId, from, to)
    success(res, data)
  } catch (err) { next(err) }
})

router.get('/languages', async (req: AuthRequest, res, next) => {
  try {
    const to = (req.query.to as string) ?? formatISO(new Date())
    const from = (req.query.from as string) ?? formatISO(subDays(new Date(), 30))
    const data = await analyticsService.getLanguageBreakdown(req.params.projectId, from, to)
    success(res, data)
  } catch (err) { next(err) }
})

router.get('/heatmap', async (req: AuthRequest, res, next) => {
  try {
    const data = await analyticsService.getMentionHeatmap(req.params.projectId)
    success(res, data)
  } catch (err) { next(err) }
})

router.get('/geo', async (req: AuthRequest, res, next) => {
  try {
    const to = (req.query.to as string) ?? formatISO(new Date())
    const from = (req.query.from as string) ?? formatISO(subDays(new Date(), 30))
    const data = await analyticsService.getGeoBreakdown(req.params.projectId, from, to)
    success(res, data)
  } catch (err) { next(err) }
})

router.get('/competitors', async (req: AuthRequest, res, next) => {
  try {
    const to = (req.query.to as string) ?? formatISO(new Date())
    const from = (req.query.from as string) ?? formatISO(subDays(new Date(), 30))
    const names = ((req.query.names as string) ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    if (!names.length) { success(res, []); return }
    const data = await analyticsService.getCompetitorComparison(req.params.projectId, names, from, to)
    success(res, data)
  } catch (err) { next(err) }
})

router.post('/ai-summary', async (req: AuthRequest, res, next) => {
  try {
    const to = (req.query.to as string) ?? formatISO(new Date())
    const from = (req.query.from as string) ?? formatISO(subDays(new Date(), 30))
    const summary = await aiService.generateSummary(req.params.projectId, from, to)
    success(res, { summary })
  } catch (err) { next(err) }
})

export default router
