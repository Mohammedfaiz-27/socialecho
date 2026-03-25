/**
 * YouTube Collector — uses YouTube Data API v3
 */
import axios from 'axios'
import { env } from '../../config/env'
import { mentionService } from '../mention.service'
import { sentimentService } from '../sentiment.service'
import { logger } from '../../utils/logger'
import { format } from 'date-fns'

const ytClient = axios.create({
  baseURL: 'https://www.googleapis.com/youtube/v3',
  timeout: 15000,
})

interface YTSearchItem {
  id: { videoId?: string }
  snippet: {
    title: string
    description: string
    publishedAt: string
    channelTitle: string
    channelId: string
  }
}

interface YTVideoStats {
  statistics?: {
    viewCount?: string
    likeCount?: string
    commentCount?: string
  }
  snippet?: {
    channelId?: string
  }
}

interface YTChannelStats {
  statistics?: {
    subscriberCount?: string
  }
}

export async function collectYouTubeMentions(
  projectId: string,
  keywords: string[]
): Promise<number> {
  if (!env.YOUTUBE_API_KEY) {
    logger.warn('YouTube collector: YOUTUBE_API_KEY not set, skipping')
    return 0
  }

  let collected = 0

  for (const keyword of keywords) {
    try {
      // Search for videos
      const { data: searchData } = await ytClient.get('/search', {
        params: {
          part: 'snippet',
          q: keyword,
          type: 'video',
          maxResults: 15,
          order: 'date',
          key: env.YOUTUBE_API_KEY,
        },
      })

      const items: YTSearchItem[] = searchData.items ?? []
      if (!items.length) continue

      const videoIds = items
        .map((i) => i.id.videoId)
        .filter(Boolean)
        .join(',')

      // Get video stats
      const { data: statsData } = await ytClient.get('/videos', {
        params: {
          part: 'statistics,snippet',
          id: videoIds,
          key: env.YOUTUBE_API_KEY,
        },
      })

      const statsMap: Record<string, YTVideoStats> = {}
      for (const v of statsData.items ?? []) {
        statsMap[v.id] = v
      }

      for (const item of items) {
        const videoId = item.id.videoId
        if (!videoId) continue

        const stats = statsMap[videoId]
        const text = `${item.snippet.title} — ${item.snippet.description?.slice(0, 200) ?? ''}`
        const sentiment = sentimentService.analyze(text)
        const publishedAt = new Date(item.snippet.publishedAt)

        // Get channel subscriber count
        let subscriberCount = 0
        try {
          const { data: channelData } = await ytClient.get('/channels', {
            params: {
              part: 'statistics',
              id: item.snippet.channelId,
              key: env.YOUTUBE_API_KEY,
            },
          })
          const ch: YTChannelStats = channelData.items?.[0]
          subscriberCount = parseInt(ch?.statistics?.subscriberCount ?? '0', 10)
        } catch { /* ignore */ }

        const likes = parseInt(stats?.statistics?.likeCount ?? '0', 10)
        const views = parseInt(stats?.statistics?.viewCount ?? '0', 10)
        const comments = parseInt(stats?.statistics?.commentCount ?? '0', 10)

        const influenceScore = sentimentService.calculateInfluenceScore({
          followerCount: subscriberCount,
          engagementRate: views > 0 ? (likes + comments) / views : 0,
          isVerified: false,
          accountAgeDays: 365,
          platform: 'youtube',
        })

        const saved = await mentionService.saveMention({
          projectId,
          mentionType: 'video',
          content: {
            text,
            title: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            language: 'en',
          },
          author: {
            username: item.snippet.channelId,
            displayName: item.snippet.channelTitle,
            profileUrl: `https://www.youtube.com/channel/${item.snippet.channelId}`,
            followerCount: subscriberCount,
            isVerified: false,
            accountAgeDays: 365,
          },
          source: {
            platform: 'youtube',
            domain: 'youtube.com',
            domainAuthority: 99,
            monthlyVisitors: 2000000000,
            isNewsSite: false,
            tier: 1,
          },
          temporal: {
            publishedAt,
            collectedAt: new Date(),
            dateString: format(publishedAt, 'yyyy-MM-dd'),
            weekYear: format(publishedAt, 'yyyy-ww'),
          },
          engagement: {
            likes,
            comments,
            shares: 0,
            views,
            engagementRate: views > 0 ? (likes + comments) / views : 0,
            capturedAt: new Date(),
          },
          analysis: {
            sentiment: sentiment.sentiment,
            sentimentConfidence: sentiment.confidence,
            isSarcasm: false,
            language: 'en',
            namedEntities: [],
            hashtags: [],
            keywordsMatched: [keyword],
            influenceScore,
            topics: [],
          },
          metadata: {
            tags: [],
            status: 'new',
            isStarred: false,
            lastUpdated: new Date(),
          },
        })

        if (saved) collected++
      }

      logger.debug(`YouTube: collected ${collected} mentions for keyword "${keyword}"`)
    } catch (err) {
      logger.error(`YouTube collector error for keyword "${keyword}"`, err)
    }

    await sleep(500)
  }

  return collected
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
