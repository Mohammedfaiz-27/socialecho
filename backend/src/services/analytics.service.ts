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

    // Previous period for growth rate calculation
    const periodMs = toDate.getTime() - fromDate.getTime()
    const prevFromDate = new Date(fromDate.getTime() - periodMs)
    const prevToDate = new Date(fromDate.getTime())

    const [mentionsTrend, sentimentAgg, sourceAgg, topMentions, topInfluencers, totalReachAgg, prevPeriodAgg] =
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

        // Previous period mentions (for growth rate)
        Mention.countDocuments({ projectId, 'temporal.publishedAt': { $gte: prevFromDate, $lte: prevToDate } }),
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
    const aggregateSummary = totalReachAgg[0] ?? { totalMentions: 0, totalReach: 0, avgEngagement: 0 }
    const totalMentions = (aggregateSummary.totalMentions as number) ?? 0
    const sentimentBreakdown = {
      positive: sentimentMap.positive,
      negative: sentimentMap.negative,
      neutral: sentimentMap.neutral,
      positivePercent: totalMentions ? Math.round((sentimentMap.positive / totalMentions) * 100) : 0,
      negativePercent: totalMentions ? Math.round((sentimentMap.negative / totalMentions) * 100) : 0,
      neutralPercent: totalMentions ? Math.round((sentimentMap.neutral / totalMentions) * 100) : 0,
    }

    const totalReach = (aggregateSummary.totalReach as number) ?? 0
    // AVE/Media Value: industry average CPM ~$7.50
    const mediaValue = Math.round(totalReach * 7.5 / 1000)
    const prevMentions = (prevPeriodAgg as number) ?? 0
    const growthRate = prevMentions > 0
      ? Math.round(((totalMentions - prevMentions) / prevMentions) * 100)
      : totalMentions > 0 ? 100 : 0

    const metrics = {
      totalMentions,
      totalReach,
      avgEngagementRate: (aggregateSummary.avgEngagement as number) ?? 0,
      presenceScore: Math.min(100, Math.round((totalMentions / 100) * 10)),
      growthRate,
      mediaValue,
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

  async getTopHashtags(projectId: string, from: string, to: string, limit = 20) {
    const fromDate = new Date(from)
    const toDate = new Date(to)
    const results = await Mention.aggregate([
      { $match: { projectId, 'temporal.publishedAt': { $gte: fromDate, $lte: toDate }, 'analysis.hashtags': { $exists: true, $ne: [] } } },
      { $unwind: '$analysis.hashtags' },
      { $group: { _id: { $toLower: '$analysis.hashtags' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ])
    return results.map((r: { _id: string; count: number }) => ({ tag: r._id, count: r.count }))
  },

  async getKeywordPerformance(projectId: string, from: string, to: string) {
    const fromDate = new Date(from)
    const toDate = new Date(to)
    const results = await Mention.aggregate([
      { $match: { projectId, 'temporal.publishedAt': { $gte: fromDate, $lte: toDate }, 'analysis.keywordsMatched': { $exists: true, $ne: [] } } },
      { $unwind: '$analysis.keywordsMatched' },
      {
        $group: {
          _id: '$analysis.keywordsMatched',
          mentions: { $sum: 1 },
          reach: { $sum: '$author.followerCount' },
          avgInfluence: { $avg: '$analysis.influenceScore' },
          sentiments: { $push: '$analysis.sentiment' },
        },
      },
      { $sort: { mentions: -1 } },
      { $limit: 20 },
    ])
    return results.map((r: { _id: string; mentions: number; reach: number; avgInfluence: number; sentiments: string[] }) => {
      const pos = r.sentiments.filter((s) => s === 'positive').length
      const neg = r.sentiments.filter((s) => s === 'negative').length
      const total = r.sentiments.length || 1
      return {
        keyword: r._id,
        mentions: r.mentions,
        reach: r.reach,
        avgInfluence: Math.round(r.avgInfluence * 10) / 10,
        positivePercent: Math.round((pos / total) * 100),
        negativePercent: Math.round((neg / total) * 100),
      }
    })
  },

  async getSpikeDetection(projectId: string, from: string, to: string) {
    const fromDate = new Date(from)
    const toDate = new Date(to)
    // Extend lookback to 7 days before range for baseline
    const lookbackFrom = new Date(fromDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    const daily = await Mention.aggregate([
      { $match: { projectId, 'temporal.publishedAt': { $gte: lookbackFrom, $lte: toDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$temporal.publishedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const countMap = new Map(daily.map((d: { _id: string; count: number }) => [d._id, d.count]))
    const days = eachDayOfInterval({ start: fromDate, end: toDate })

    const spikes: Array<{ date: string; count: number; average: number; ratio: number }> = []

    for (const day of days) {
      const key = format(day, 'yyyy-MM-dd')
      const count = countMap.get(key) ?? 0

      // Rolling 7-day average (days before this day)
      const prev7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(day.getTime() - (i + 1) * 24 * 60 * 60 * 1000)
        return countMap.get(format(d, 'yyyy-MM-dd')) ?? 0
      })
      const avg = prev7.reduce((a, b) => a + b, 0) / 7

      if (avg > 0 && count >= avg * 2.5 && count >= 5) {
        spikes.push({ date: key, count, average: Math.round(avg), ratio: Math.round((count / avg) * 10) / 10 })
      }
    }

    return spikes
  },
}
