import { Mention } from '../models/mongo/Mention'
import { Project } from '../models/postgres/Project'
import { cache } from '../config/redis'
import type { FilterQuery } from 'mongoose'
import type { IMention } from '../models/mongo/Mention'

interface MentionFilters {
  search?: string
  sentiments?: string[]
  sources?: string[]
  languages?: string[]
  keywords?: string[]
  tags?: string[]
  minFollowers?: number
  minEngagement?: number
  sortBy?: string
  datePreset?: string
  from?: string
  to?: string
}

function buildDateRange(filters: MentionFilters): { from: Date; to: Date } {
  const now = new Date()
  const to = filters.to ? new Date(filters.to) : now

  if (filters.from) return { from: new Date(filters.from), to }

  const PRESETS: Record<string, number> = {
    last_hour: 1 / 24,
    last_24h: 1,
    last_7d: 7,
    last_30d: 30,
    last_90d: 90,
    last_year: 365,
  }

  const days = PRESETS[filters.datePreset ?? 'last_30d'] ?? 30
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return { from, to }
}

function buildSort(sortBy?: string): Record<string, 1 | -1> {
  switch (sortBy) {
    case 'date_desc': return { 'temporal.publishedAt': -1 }
    case 'date_asc':  return { 'temporal.publishedAt': 1 }
    case 'engagement': return { 'engagement.likes': -1 }
    case 'reach':     return { 'author.followerCount': -1 }
    default:          return { 'analysis.influenceScore': -1, 'temporal.publishedAt': -1 }
  }
}

export const mentionService = {
  async getMentions(
    projectId: string,
    filters: MentionFilters,
    page = 1,
    pageSize = 25
  ) {
    const { from, to } = buildDateRange(filters)

    const query: FilterQuery<IMention> = {
      projectId,
      'temporal.publishedAt': { $gte: from, $lte: to },
    }

    if (filters.sentiments?.length) {
      query['analysis.sentiment'] = { $in: filters.sentiments }
    }
    if (filters.sources?.length) {
      query['source.platform'] = { $in: filters.sources }
    }
    if (filters.languages?.length) {
      query['analysis.language'] = { $in: filters.languages }
    }
    if (filters.tags?.length) {
      query['metadata.tags'] = { $in: filters.tags }
    }
    if (filters.minFollowers) {
      query['author.followerCount'] = { $gte: filters.minFollowers }
    }
    if (filters.minEngagement) {
      query['engagement.likes'] = { $gte: filters.minEngagement }
    }
    if (filters.search) {
      query.$text = { $search: filters.search }
    }

    const sort = buildSort(filters.sortBy)
    const skip = (page - 1) * pageSize

    const [mentions, total] = await Promise.all([
      Mention.find(query).sort(sort).skip(skip).limit(pageSize).lean(),
      Mention.countDocuments(query),
    ])

    return {
      data: mentions.map(formatMention),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  },

  async getMention(projectId: string, mentionId: string) {
    const mention = await Mention.findOne({ _id: mentionId, projectId })
    if (!mention) throw Object.assign(new Error('Mention not found'), { status: 404, code: 'NOT_FOUND' })
    return formatMention(mention.toObject())
  },

  async updateMention(
    projectId: string,
    mentionId: string,
    update: { tags?: string[]; notes?: string; status?: string; isStarred?: boolean }
  ) {
    const mention = await Mention.findOneAndUpdate(
      { _id: mentionId, projectId },
      {
        $set: {
          ...(update.tags !== undefined && { 'metadata.tags': update.tags }),
          ...(update.notes !== undefined && { 'metadata.notes': update.notes }),
          ...(update.status !== undefined && { 'metadata.status': update.status }),
          ...(update.isStarred !== undefined && { 'metadata.isStarred': update.isStarred }),
          'metadata.lastUpdated': new Date(),
        },
      },
      { new: true }
    )
    if (!mention) throw Object.assign(new Error('Mention not found'), { status: 404, code: 'NOT_FOUND' })
    return formatMention(mention.toObject())
  },

  async getMentionStats(projectId: string) {
    const cacheKey = `stats:${projectId}`
    const cached = await cache.get<object>(cacheKey)
    if (cached) return cached

    const [total, bySentiment, byPlatform] = await Promise.all([
      Mention.countDocuments({ projectId }),
      Mention.aggregate([
        { $match: { projectId } },
        { $group: { _id: '$analysis.sentiment', count: { $sum: 1 } } },
      ]),
      Mention.aggregate([
        { $match: { projectId } },
        { $group: { _id: '$source.platform', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ])

    const stats = { total, bySentiment, byPlatform }
    await cache.set(cacheKey, stats, 60)
    return stats
  },

  async saveMention(mentionData: Partial<IMention>) {
    // Check for duplicate by URL
    const exists = await Mention.findOne({ 'content.url': mentionData.content?.url })
    if (exists) return null

    const mention = await Mention.create(mentionData)

    // Increment project counters
    await Project.increment(
      { totalMentionsCount: 1, mentionUsage: 1, newMentionsCount: 1 },
      { where: { id: mentionData.projectId } }
    )

    return mention
  },
}

function formatMention(m: Record<string, unknown> & { _id?: unknown; metadata?: Record<string, unknown>; content?: Record<string, unknown>; author?: Record<string, unknown>; source?: Record<string, unknown>; temporal?: Record<string, unknown>; engagement?: Record<string, unknown>; analysis?: Record<string, unknown> }) {
  const metadata = m.metadata as Record<string, unknown> ?? {}
  return {
    id: String(m._id),
    projectId: m.projectId,
    text: (m.content as Record<string, unknown>)?.text,
    title: (m.content as Record<string, unknown>)?.title,
    url: (m.content as Record<string, unknown>)?.url,
    author: m.author,
    source: m.source,
    engagement: m.engagement,
    analysis: m.analysis,
    publishedAt: (m.temporal as Record<string, unknown>)?.publishedAt,
    collectedAt: (m.temporal as Record<string, unknown>)?.collectedAt,
    tags: metadata.tags,
    notes: metadata.notes,
    status: metadata.status,
    isStarred: metadata.isStarred,
  }
}
