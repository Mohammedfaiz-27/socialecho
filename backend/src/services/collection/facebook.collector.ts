/**
 * Facebook Collector — uses RapidAPI facebook-scraper-api4
 * Host: facebook-scraper-api4.p.rapidapi.com
 * Endpoint: GET /fetch_search_posts?query=<keyword>
 *
 * Requires: RAPIDAPI_KEY in .env
 * Optional: FACEBOOK_RAPIDAPI_HOST (override default host)
 */
import axios from 'axios'
import { env } from '../../config/env'
import { mentionService } from '../mention.service'
import { sentimentService } from '../sentiment.service'
import { logger } from '../../utils/logger'
import { format } from 'date-fns'

const DEFAULT_HOST = 'facebook-scraper-api4.p.rapidapi.com'

interface FBPost {
  post_id?: string
  id?: string
  message?: string
  text?: string
  story?: string
  created_time?: string
  timestamp?: number
  permalink_url?: string
  link?: string
  url?: string
  reactions?: { count?: number } | number
  reaction_count?: number
  likes?: number
  comments_count?: number
  comments?: { count?: number } | number
  shares?: { count?: number } | number
  shares_count?: number
  from?: {
    id?: string
    name?: string
    username?: string
    fan_count?: number
    followers_count?: number
  }
  author?: {
    id?: string
    name?: string
    username?: string
    follower_count?: number
  }
  user?: {
    id?: string
    name?: string
    username?: string
  }
}

function getCount(val: { count?: number } | number | undefined): number {
  if (!val) return 0
  if (typeof val === 'number') return val
  return val.count ?? 0
}

function extractPosts(data: unknown): FBPost[] {
  if (!data || typeof data !== 'object') return []
  const d = data as Record<string, unknown>

  if (d.data && typeof d.data === 'object') {
    const inner = d.data as Record<string, unknown>

    // Shape: { data: { items: [{ basic_info: {...}, feedback_details: {...} }] } }
    if (Array.isArray(inner.items)) {
      return (inner.items as Array<Record<string, unknown>>).map((item) => {
        const bi = (item.basic_info ?? {}) as Record<string, unknown>
        const fd = (item.feedback_details ?? {}) as Record<string, unknown>
        const authorInfo = (item.author_info ?? item.owner_info ?? {}) as Record<string, unknown>
        return {
          post_id: bi.post_id as string | undefined,
          message: bi.post_text as string | undefined,
          url: bi.url as string | undefined,
          permalink_url: bi.url as string | undefined,
          reaction_count: fd.reaction_count as number | undefined,
          comments_count: typeof fd.total_comments === 'number' ? fd.total_comments : undefined,
          shares_count: typeof fd.total_shares === 'string'
            ? (parseInt(fd.total_shares as string, 10) || 0)
            : (fd.total_shares as number | undefined),
          from: authorInfo.name ? {
            name: authorInfo.name as string,
            id: authorInfo.id as string | undefined,
          } : undefined,
        } as FBPost
      })
    }

    // Shape: { data: { posts: { edges: [{ node: {...} }] } } }
    if (inner.posts && typeof inner.posts === 'object') {
      const posts = inner.posts as Record<string, unknown>
      if (Array.isArray(posts.edges)) {
        return posts.edges
          .map((e: unknown) => (e as Record<string, unknown>)?.node)
          .filter(Boolean) as FBPost[]
      }
      if (Array.isArray(posts.data)) return posts.data as FBPost[]
    }
    if (Array.isArray(inner.data)) return inner.data as FBPost[]
    if (Array.isArray(inner.results)) return inner.results as FBPost[]
    if (Array.isArray(inner.posts)) return inner.posts as FBPost[]
  }

  // Shape: { results: [...] } or { posts: [...] } or { data: [...] }
  if (Array.isArray(d.results)) return d.results as FBPost[]
  if (Array.isArray(d.posts)) return d.posts as FBPost[]
  if (Array.isArray(d.data)) return d.data as FBPost[]

  return []
}

export async function collectFacebookMentions(
  projectId: string,
  keywords: string[]
): Promise<number> {
  if (!env.RAPIDAPI_KEY) {
    logger.warn('Facebook collector: RAPIDAPI_KEY not set, skipping')
    return 0
  }

  const host = env.FACEBOOK_RAPIDAPI_HOST || DEFAULT_HOST
  const client = axios.create({
    timeout: 15000,
    headers: {
      'x-rapidapi-key': env.RAPIDAPI_KEY,
      'x-rapidapi-host': host,
    },
  })

  let collected = 0

  for (const keyword of keywords) {
    try {
      let data: unknown = null

      try {
        const res = await client.get(`https://${host}/fetch_search_posts`, {
          params: { query: keyword },
        })
        data = res.data
        logger.info(`Facebook: success for keyword "${keyword}"`)
      } catch (reqErr: unknown) {
        const msg = reqErr instanceof Error ? reqErr.message : String(reqErr)
        const status = (reqErr as { response?: { status?: number } })?.response?.status
        logger.warn(`Facebook: request failed [${status ?? 'no-response'}]: ${msg}`)
        // 403 = API key has no access — stop trying remaining keywords
        if (status === 403) {
          logger.warn('Facebook: 403 received, skipping remaining keywords (check RapidAPI subscription)')
          return collected
        }
      }

      if (!data) {
        logger.warn(`Facebook: no data for keyword "${keyword}"`)
        continue
      }

      const posts = extractPosts(data)
      if (posts.length === 0) {
        const d = data as Record<string, unknown>
        const topKeys = Object.keys(d)
        const dataKeys = d.data && typeof d.data === 'object' ? Object.keys(d.data as object) : []
        const postsVal = (d.data as Record<string, unknown>)?.posts
        const postsKeys = postsVal && typeof postsVal === 'object' ? Object.keys(postsVal as object) : []
        logger.debug(`Facebook: 0 posts for "${keyword}" — top:${topKeys} data:${dataKeys} data.posts:${postsKeys}`)
        // Also log first 300 chars of each data key's value type for shape inspection
        for (const k of dataKeys) {
          const v = (d.data as Record<string, unknown>)[k]
          if (k !== 'page_info') logger.debug(`Facebook: data.${k} = ${JSON.stringify(v).slice(0, 300)}`)
        }
      }
      logger.debug(`Facebook: found ${posts.length} posts for keyword "${keyword}"`)

      for (const post of posts.slice(0, 20)) {
        const text = post.message ?? post.text ?? post.story ?? ''
        if (!text) continue

        const postId = post.post_id ?? post.id ?? ''
        const author = post.from ?? post.author ?? post.user
        const username = author?.username ?? author?.name?.toLowerCase().replace(/\s+/g, '.') ?? 'unknown'
        const displayName = author?.name ?? username
        const followerCount = (post.from as FBPost['from'])?.fan_count
          ?? (post.from as FBPost['from'])?.followers_count
          ?? (post.author as FBPost['author'])?.follower_count
          ?? 0
        const likes = typeof post.likes === 'number' ? post.likes : getCount(post.reactions) + (post.reaction_count ?? 0)
        const comments = post.comments_count ?? getCount(post.comments)
        const shares = post.shares_count ?? getCount(post.shares)

        const rawDate = post.created_time ?? (post.timestamp ? new Date(post.timestamp * 1000).toISOString() : null)
        const publishedAt = rawDate ? new Date(rawDate) : new Date()

        const url = post.permalink_url ?? post.link ?? post.url ?? `https://www.facebook.com/${postId}`

        const sentiment = sentimentService.analyze(text)
        const influenceScore = sentimentService.calculateInfluenceScore({
          followerCount,
          engagementRate: followerCount > 0 ? (likes + comments + shares) / followerCount : 0,
          isVerified: false,
          accountAgeDays: 365,
          platform: 'facebook',
        })

        const saved = await mentionService.saveMention({
          projectId,
          mentionType: 'social_media',
          content: {
            text,
            url,
            language: 'en',
          },
          author: {
            username,
            displayName,
            profileUrl: `https://www.facebook.com/${author?.id ?? username}`,
            followerCount,
            isVerified: false,
            accountAgeDays: 365,
          },
          source: {
            platform: 'facebook',
            domain: 'facebook.com',
            domainAuthority: 96,
            monthlyVisitors: 3000000000,
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
            shares,
            views: 0,
            engagementRate: followerCount > 0 ? (likes + comments + shares) / followerCount : 0,
            capturedAt: new Date(),
          },
          analysis: {
            sentiment: sentiment.sentiment,
            sentimentConfidence: sentiment.confidence,
            isSarcasm: sentiment.isSarcasm,
            language: 'en',
            namedEntities: [],
            hashtags: extractHashtags(text),
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

      logger.debug(`Facebook: collected ${collected} mentions for keyword "${keyword}"`)
    } catch (err) {
      logger.error(`Facebook collector error for keyword "${keyword}"`, err)
    }

    await sleep(1200)
  }

  return collected
}

function extractHashtags(text: string): string[] {
  return (text.match(/#\w+/g) ?? []).map((h) => h.slice(1))
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
