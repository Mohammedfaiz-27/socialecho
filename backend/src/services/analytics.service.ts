import { Mention } from '../models/mongo/Mention'
import { cache } from '../config/redis'
import { format, eachDayOfInterval } from 'date-fns'

export const analyticsService = {
  async getMetrics(projectId: string, from: string, to: string) {
    const cacheKey = `analytics:${projectId}:${from}:${to}`
    const cached = await cache.get<object>(cacheKey)
    if (cached) return cached

    const fromDate = new Date(from)
    const toDate = new Date(to)

    const [mentionsTrend, sentimentAgg, sourceAgg, topMentions, topInfluencers, totalReachAgg] =
      await Promise.all([
        // Daily mention counts
        Mention.aggregate([
          { $match: { projectId, 'temporal.publishedAt': { $gte: fromDate, $lte: toDate } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$temporal.publishedAt' } },
              count: { $sum: 1 },
              reach: { $sum: '$author.followerCount' },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // Sentiment breakdown
        Mention.aggregate([
          { $match: { projectId, 'temporal.publishedAt': { $gte: fromDate, $lte: toDate } } },
          { $group: { _id: '$analysis.sentiment', count: { $sum: 1 } } },
        ]),

        // Source breakdown
        Mention.aggregate([
          { $match: { projectId, 'temporal.publishedAt': { $gte: fromDate, $lte: toDate } } },
          {
            $group: {
              _id: '$source.platform',
              count: { $sum: 1 },
              totalReach: { $sum: '$author.followerCount' },
            },
          },
          { $sort: { count: -1 } },
        ]),

        // Top mentions by engagement
        Mention.find({ projectId, 'temporal.publishedAt': { $gte: fromDate, $lte: toDate } })
          .sort({ 'engagement.likes': -1 })
          .limit(10)
          .lean(),

        // Top influencers
        Mention.aggregate([
          { $match: { projectId, 'temporal.publishedAt': { $gte: fromDate, $lte: toDate } } },
          {
            $group: {
              _id: '$author.username',
              displayName: { $first: '$author.displayName' },
              platform: { $first: '$source.platform' },
              followerCount: { $max: '$author.followerCount' },
              influenceScore: { $max: '$analysis.influenceScore' },
              mentionCount: { $sum: 1 },
              totalReach: { $sum: '$author.followerCount' },
              avgEngagement: { $avg: '$engagement.engagementRate' },
              sentiments: { $push: '$analysis.sentiment' },
            },
          },
          { $sort: { influenceScore: -1 } },
          { $limit: 20 },
        ]),

        // Total reach
        Mention.aggregate([
          { $match: { projectId, 'temporal.publishedAt': { $gte: fromDate, $lte: toDate } } },
          {
            $group: {
              _id: null,
              totalReach: { $sum: '$author.followerCount' },
              avgEngagement: { $avg: '$engagement.engagementRate' },
              totalMentions: { $sum: 1 },
            },
          },
        ]),
      ])

    // Fill in missing days for trend
    const days = eachDayOfInterval({ start: fromDate, end: toDate })
    const trendMap = new Map(mentionsTrend.map((d: { _id: string; count: number; reach: number }) => [d._id, d]))
    const mentionsTrendFilled = days.map((d) => {
      const key = format(d, 'yyyy-MM-dd')
      const entry = trendMap.get(key) as { count?: number; reach?: number } | undefined
      return { date: key, value: entry?.count ?? 0 }
    })
    const reachTrendFilled = days.map((d) => {
      const key = format(d, 'yyyy-MM-dd')
      const entry = trendMap.get(key) as { count?: number; reach?: number } | undefined
      return { date: key, value: entry?.reach ?? 0 }
    })

    // Sentiment breakdown
    const sentimentMap: Record<string, number> = { positive: 0, negative: 0, neutral: 0 }
    sentimentAgg.forEach((s: { _id: string; count: number }) => {
      sentimentMap[s._id] = s.count
    })
    const totalMentions = (totalReachAgg[0]?.totalMentions as number) ?? 0
    const sentimentBreakdown = {
      positive: sentimentMap.positive,
      negative: sentimentMap.negative,
      neutral: sentimentMap.neutral,
      positivePercent: totalMentions ? Math.round((sentimentMap.positive / totalMentions) * 100) : 0,
      negativePercent: totalMentions ? Math.round((sentimentMap.negative / totalMentions) * 100) : 0,
      neutralPercent: totalMentions ? Math.round((sentimentMap.neutral / totalMentions) * 100) : 0,
    }

    const metrics = {
      totalMentions,
      totalReach: (totalReachAgg[0]?.totalReach as number) ?? 0,
      avgEngagementRate: (totalReachAgg[0]?.avgEngagement as number) ?? 0,
      presenceScore: Math.min(100, Math.round((totalMentions / 100) * 10)),
      growthRate: 0, // Would need previous period comparison
      sentimentBreakdown,
      mentionsTrend: mentionsTrendFilled,
      reachTrend: reachTrendFilled,
      sourceBreakdown: sourceAgg.map((s: { _id: string; count: number; totalReach: number }) => ({
        platform: s._id,
        count: s.count,
        reach: s.totalReach,
        sentiment: sentimentBreakdown,
      })),
      topMentions: topMentions.map((m, i) => ({ rank: i + 1, mention: m })),
      topInfluencers: topInfluencers.map((inf: {
        _id: string; displayName: string; platform: string; followerCount: number;
        influenceScore: number; mentionCount: number; totalReach: number;
        avgEngagement: number; sentiments: string[]
      }) => {
        const sentiments = inf.sentiments as string[]
        const pos = sentiments.filter((s) => s === 'positive').length
        const neg = sentiments.filter((s) => s === 'negative').length
        const neu = sentiments.filter((s) => s === 'neutral').length
        const total = sentiments.length || 1
        return {
          id: inf._id,
          username: inf._id,
          displayName: inf.displayName,
          platform: inf.platform,
          followerCount: inf.followerCount,
          influenceScore: inf.influenceScore,
          mentionCount: inf.mentionCount,
          totalReach: inf.totalReach,
          engagementRate: inf.avgEngagement,
          trend: 'stable',
          sentimentDistribution: {
            positive: pos, negative: neg, neutral: neu,
            positivePercent: Math.round((pos / total) * 100),
            negativePercent: Math.round((neg / total) * 100),
            neutralPercent: Math.round((neu / total) * 100),
          },
        }
      }),
    }

    await cache.set(cacheKey, metrics, 300)
    return metrics
  },
}
