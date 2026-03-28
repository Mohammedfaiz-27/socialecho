/**
 * Twitter/X Collector — uses RapidAPI Twttr API (twitter241.p.rapidapi.com)
 * Endpoint: GET /search-v2?query=...&type=Top&count=20
 */
import axios from 'axios'
import { env } from '../../config/env'
import { mentionService } from '../mention.service'
import { sentimentService } from '../sentiment.service'
import { logger } from '../../utils/logger'
import { format } from 'date-fns'

const TWITTER_HOST = 'twitter241.p.rapidapi.com'
const TWITTER_PATH = '/search-v2'

// Languages supported by MongoDB text search — anything else falls back to 'en'
const MONGODB_TEXT_LANGUAGES = new Set([
  'da', 'nl', 'en', 'fi', 'fr', 'de', 'hu', 'it', 'nb', 'pt', 'ro', 'ru', 'es', 'sv', 'tr',
])

const client = axios.create({
  headers: {
    'x-rapidapi-key': env.RAPIDAPI_KEY,
  },
  timeout: 15000,
})

// Raw Twitter v2 GraphQL shapes from twitter241 /search-v2
interface TweetLegacy {
  full_text?: string
  id_str?: string
  created_at?: string
  favorite_count?: number
  retweet_count?: number
  reply_count?: number
  lang?: string
  entities?: { hashtags?: Array<{ text: string }> }
}
interface UserLegacy {
  name?: string
  screen_name?: string
  followers_count?: number
  verified?: boolean
  created_at?: string
  description?: string
}
interface TweetResult {
  rest_id?: string
  legacy?: TweetLegacy
  views?: { count?: string }
  core?: { user_results?: { result?: { rest_id?: string; legacy?: UserLegacy } } }
}

export async function collectTwitterMentions(
  projectId: string,
  keywords: string[]
): Promise<number> {
  if (!env.RAPIDAPI_KEY) {
    logger.warn('Twitter collector: RAPIDAPI_KEY not set, skipping')
    return 0
  }

  let collected = 0

  for (const keyword of keywords) {
    try {
      let data: Record<string, unknown> | null = null

      try {
        const res = await client.get(`https://${TWITTER_HOST}${TWITTER_PATH}`, {
          params: { query: `"${keyword}" lang:en`, type: 'Latest', count: 40 },
          headers: { 'x-rapidapi-host': TWITTER_HOST },
        })
        data = res.data
        logger.info(`Twitter: success for keyword "${keyword}"`)

      } catch (reqErr: unknown) {
        const msg = reqErr instanceof Error ? reqErr.message : String(reqErr)
        const status = (reqErr as { response?: { status?: number; data?: unknown } })?.response?.status
        const body = (reqErr as { response?: { status?: number; data?: unknown } })?.response?.data
        logger.warn(`Twitter: request failed [${status ?? 'no-response'}]: ${msg} ${JSON.stringify(body ?? '')}`)
      }

      if (!data) {
        logger.warn(`Twitter: no data for keyword "${keyword}"`)
        continue
      }

      // Recursively scan the entire response for tweet result objects
      // A tweet result has { rest_id, legacy: { full_text } }
      const tweetResults: TweetResult[] = []
      collectTweetResults(data, tweetResults, 0)
      logger.debug(`Twitter: found ${tweetResults.length} tweets for keyword "${keyword}"`)

      for (const tr of tweetResults.slice(0, 20)) {
        const legacy = tr.legacy
        const text = legacy?.full_text ?? ''
        if (!text) continue

        // Skip tweets that don't actually contain the keyword in the text
        if (!text.toLowerCase().includes(keyword.toLowerCase())) continue

        const tweetId = tr.rest_id ?? legacy?.id_str ?? ''
        const userResult = tr.core?.user_results?.result
        const userLegacy = userResult?.legacy
        const userResultRaw = userResult as unknown as Record<string, unknown>
        const followerCount = userLegacy?.followers_count ?? 0
        const screenName = userLegacy?.screen_name
          ?? userResultRaw?.screen_name as string | undefined
          ?? userResultRaw?.username as string | undefined
          ?? userLegacy?.name?.toLowerCase().replace(/\s+/g, '_')
          ?? keyword.toLowerCase().replace(/[^a-z0-9_]/g, '_')
        const rawLang = legacy?.lang ?? 'en'
        const lang = MONGODB_TEXT_LANGUAGES.has(rawLang) ? rawLang : 'en'
        const favorites = legacy?.favorite_count ?? 0
        const retweets = legacy?.retweet_count ?? 0
        const replies = legacy?.reply_count ?? 0
        const views = parseInt(tr.views?.count ?? '0', 10)
        const hashtags = legacy?.entities?.hashtags?.map((h) => h.text) ?? extractHashtags(text)

        const sentiment = sentimentService.analyze(text)
        const influenceScore = sentimentService.calculateInfluenceScore({
          followerCount,
          engagementRate: followerCount > 0 ? (favorites + retweets) / followerCount : 0,
          isVerified: userLegacy?.verified ?? false,
          accountAgeDays: userLegacy?.created_at
            ? Math.floor((Date.now() - new Date(userLegacy.created_at).getTime()) / 86400000)
            : 365,
          platform: 'twitter',
        })

        const publishedAt = legacy?.created_at ? new Date(legacy.created_at) : new Date()

        const saved = await mentionService.saveMention({
          projectId,
          mentionType: 'social_media',
          content: {
            text,
            url: `https://twitter.com/${screenName}/status/${tweetId}`,
            language: lang,
          },
          author: {
            username: screenName,
            displayName: userLegacy?.name ?? userResultRaw?.name as string | undefined ?? screenName,
            profileUrl: `https://twitter.com/${screenName}`,
            followerCount,
            isVerified: userLegacy?.verified ?? false,
            accountAgeDays: 365,
            bio: userLegacy?.description,
          },
          source: {
            platform: 'twitter',
            domain: 'twitter.com',
            domainAuthority: 95,
            monthlyVisitors: 500000000,
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
            likes: favorites,
            comments: replies,
            shares: retweets,
            views,
            engagementRate: followerCount > 0 ? (favorites + retweets) / followerCount : 0,
            capturedAt: new Date(),
          },
          analysis: {
            sentiment: sentiment.sentiment,
            sentimentConfidence: sentiment.confidence,
            isSarcasm: sentiment.isSarcasm,
            language: lang,
            namedEntities: [],
            hashtags,
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

      logger.debug(`Twitter: collected ${collected} mentions for keyword "${keyword}"`)
    } catch (err) {
      logger.error(`Twitter collector error for keyword "${keyword}"`, err)
    }

    // Small delay between keywords to avoid rate limits
    await sleep(1000)
  }

  return collected
}

function collectTweetResults(obj: unknown, results: TweetResult[], depth: number): void {
  if (depth > 15 || !obj || typeof obj !== 'object') return
  const o = obj as Record<string, unknown>
  // Detect a tweet result: has rest_id and legacy.full_text
  if (typeof o.rest_id === 'string' && o.legacy && typeof (o.legacy as Record<string,unknown>).full_text === 'string') {
    results.push(o as unknown as TweetResult)
    return
  }
  for (const val of Object.values(o)) {
    if (Array.isArray(val)) {
      for (const item of val) collectTweetResults(item, results, depth + 1)
    } else if (val && typeof val === 'object') {
      collectTweetResults(val, results, depth + 1)
    }
  }
}

function extractHashtags(text: string): string[] {
  return (text.match(/#\w+/g) ?? []).map((h) => h.slice(1))
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
