/**
 * Instagram Collector — uses RapidAPI Instagram Looter2
 * Host: instagram-looter2.p.rapidapi.com
 * Endpoint: GET /search?query=<keyword>  (global search by keyword)
 *
 * Requires: RAPIDAPI_KEY in .env
 * Optional: INSTAGRAM_RAPIDAPI_HOST (override default host)
 */
import axios from 'axios'
import { env } from '../../config/env'
import { mentionService } from '../mention.service'
import { sentimentService } from '../sentiment.service'
import { logger } from '../../utils/logger'
import { format } from 'date-fns'

const DEFAULT_HOST = 'instagram-looter2.p.rapidapi.com'

interface IGPost {
  id?: string | number
  pk?: string | number
  shortcode?: string
  code?: string
  taken_at?: number
  timestamp?: number
  caption?: string | { text?: string }
  edge_media_to_caption?: { edges?: Array<{ node?: { text?: string } }> }
  like_count?: number
  edge_liked_by?: { count?: number }
  edge_media_to_comment?: { count?: number }
  comment_count?: number
  view_count?: number
  play_count?: number
  video_view_count?: number
  owner?: IGUser
  user?: IGUser
  // Search result may wrap post in a node
  node?: IGPost
  media?: IGPost
}

interface IGUser {
  pk?: string | number
  id?: string | number
  username?: string
  full_name?: string
  follower_count?: number
  edge_followed_by?: { count?: number }
  is_verified?: boolean
}

function getCaption(post: IGPost): string {
  if (typeof post.caption === 'string') return post.caption
  if (post.caption && typeof post.caption === 'object') return (post.caption as { text?: string }).text ?? ''
  const edges = post.edge_media_to_caption?.edges
  if (edges?.length) return edges[0]?.node?.text ?? ''
  return ''
}

function extractPosts(data: unknown): IGPost[] {
  if (!data || typeof data !== 'object') return []
  const d = data as Record<string, unknown>

  // Shape: { items: [...] }
  if (Array.isArray(d.items)) return d.items as IGPost[]

  if (d.data && typeof d.data === 'object') {
    const inner = d.data as Record<string, unknown>
    if (Array.isArray(inner.items)) return inner.items as IGPost[]
    if (Array.isArray(inner.medias)) return inner.medias as IGPost[]
    if (Array.isArray(inner.results)) return inner.results as IGPost[]

    // Shape: { data: { hashtag: { edge_hashtag_to_media: { edges: [...] } } } }
    if (inner.hashtag && typeof inner.hashtag === 'object') {
      const ht = inner.hashtag as Record<string, unknown>
      logger.debug(`Instagram: hashtag keys: ${Object.keys(ht).join(',')}`)

      // edge_hashtag_to_media
      const ehtm = ht.edge_hashtag_to_media as Record<string, unknown> | undefined
      if (ehtm && Array.isArray(ehtm.edges)) {
        return (ehtm.edges as Array<{ node?: IGPost }>).map((e) => e?.node).filter(Boolean) as IGPost[]
      }

      // top_posts / recent_posts
      if (Array.isArray(ht.top_posts)) return ht.top_posts as IGPost[]
      if (Array.isArray(ht.recent_posts)) return ht.recent_posts as IGPost[]

      // sections: [{ layout_content: { medias: [...] } }]
      if (Array.isArray(ht.sections)) {
        const posts: IGPost[] = []
        for (const sec of ht.sections as Array<Record<string, unknown>>) {
          const lc = sec.layout_content as Record<string, unknown> | undefined
          if (lc && Array.isArray(lc.medias)) {
            posts.push(...(lc.medias as IGPost[]))
          }
        }
        if (posts.length) return posts
      }
    }
  }

  // Shape: { results: [...] } or { medias: [...] }
  if (Array.isArray(d.results)) return d.results as IGPost[]
  if (Array.isArray(d.medias)) return d.medias as IGPost[]

  // Shape: { edges: [{ node: {...} }] }
  if (Array.isArray(d.edges)) {
    return (d.edges as Array<{ node?: IGPost }>).map((e) => e?.node).filter(Boolean) as IGPost[]
  }

  return []
}

function unwrapPost(item: IGPost): IGPost {
  // Some APIs wrap the actual post in .node or .media
  return item.node ?? item.media ?? item
}

export async function collectInstagramMentions(
  projectId: string,
  keywords: string[]
): Promise<number> {
  if (!env.RAPIDAPI_KEY) {
    logger.warn('Instagram collector: RAPIDAPI_KEY not set, skipping')
    return 0
  }

  const host = env.INSTAGRAM_RAPIDAPI_HOST || DEFAULT_HOST
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
        const res = await client.get(`https://${host}/search`, {
          params: { query: keyword },
        })
        data = res.data
        logger.info(`Instagram: success for keyword "${keyword}"`)
      } catch (reqErr: unknown) {
        const msg = reqErr instanceof Error ? reqErr.message : String(reqErr)
        const status = (reqErr as { response?: { status?: number } })?.response?.status
        logger.warn(`Instagram: request failed [${status ?? 'no-response'}]: ${msg}`)
        if (status === 403) {
          logger.warn('Instagram: 403 received, skipping remaining keywords (check RapidAPI subscription)')
          return collected
        }
      }

      if (!data) {
        logger.warn(`Instagram: no data for keyword "${keyword}"`)
        await sleep(1000)
        continue
      }

      // /search returns discovery results (users/hashtags), not posts.
      // Extract the best username or hashtag and fetch posts from it.
      const searchResult = data as Record<string, unknown>
      const usersArr = Array.isArray(searchResult.users) ? searchResult.users as Array<{ position: number; user: { username?: string; pk?: string; full_name?: string } }> : []
      const hashtagsArr = Array.isArray(searchResult.hashtags) ? searchResult.hashtags as Array<{ position: number; hashtag: { name?: string } }> : []

      // Prefer verified/top user; fall back to top hashtag
      const topUser = usersArr.sort((a, b) => a.position - b.position)[0]?.user
      const topHashtag = hashtagsArr.sort((a, b) => a.position - b.position)[0]?.hashtag

      let feedData: unknown = null
      let feedUsername: string | undefined
      let feedDisplayName: string | undefined

      if (topUser?.pk) {
        logger.debug(`Instagram: fetching user feed for @${topUser.username} pk=${topUser.pk} (keyword "${keyword}")`)
        try {
          const r = await client.get(`https://${host}/user-feeds`, {
            params: { user_id: topUser.pk, count: 20 },
          })
          const rd = r.data as Record<string, unknown>
          if (rd?.status === false) {
            logger.debug(`Instagram: user-feeds returned error for "${keyword}" (status:false), trying hashtag`)
          } else {
            feedData = r.data
            feedUsername = topUser.username
          }
        } catch (e: unknown) {
          const status = (e as { response?: { status?: number } })?.response?.status
          logger.debug(`Instagram: user-feeds failed [${status ?? 'err'}] for "${keyword}", trying hashtag`)
        }
      }

      if (!feedData && topHashtag?.name) {
        logger.debug(`Instagram: fetching tag feed for #${topHashtag.name} (keyword "${keyword}")`)
        try {
          const r = await client.get(`https://${host}/tag-feeds`, {
            params: { query: topHashtag.name, count: 20 },
          })
          feedData = r.data
        } catch (e: unknown) {
          const status = (e as { response?: { status?: number } })?.response?.status
          logger.debug(`Instagram: tag-feeds failed [${status ?? 'err'}] for "${keyword}"`)
        }
      }

      // Also capture display name from search result for fallback
      if (topUser?.username) {
        feedUsername = feedUsername ?? topUser.username
      }
      feedDisplayName = usersArr[0]?.user?.full_name ?? feedUsername

      if (!feedData) {
        logger.warn(`Instagram: no feed data found for keyword "${keyword}"`)
        await sleep(1000)
        continue
      }

      const rawPosts = extractPosts(feedData)
      if (rawPosts.length === 0) {
        logger.debug(`Instagram: feed response shape for "${keyword}": ${JSON.stringify(feedData).slice(0, 400)}`)
      }
      const posts = rawPosts.map(unwrapPost)
      logger.debug(`Instagram: found ${posts.length} posts for keyword "${keyword}"`)

      for (const post of posts.slice(0, 20)) {
        const text = getCaption(post)
        if (!text) continue

        if (!text.toLowerCase().includes(keyword.toLowerCase())) continue

        const owner = post.owner ?? post.user
        const postUsername = owner?.username
          ?? (post as unknown as Record<string, unknown>).username as string | undefined
          ?? (post as unknown as Record<string, unknown>).screen_name as string | undefined
          ?? owner?.full_name?.toLowerCase().replace(/\s+/g, '_')
          ?? feedUsername
          ?? keyword.toLowerCase().replace(/\s+/g, '_')
        const displayName = owner?.full_name ?? owner?.username ?? feedDisplayName ?? postUsername
        const followerCount = owner?.follower_count ?? owner?.edge_followed_by?.count ?? 0
        const isVerified = owner?.is_verified ?? false

        const shortcode = post.shortcode ?? post.code ?? String(post.id ?? post.pk ?? '')
        const url = shortcode
          ? `https://www.instagram.com/p/${shortcode}/`
          : `https://www.instagram.com/${postUsername}/`

        const likes = post.like_count ?? post.edge_liked_by?.count ?? 0
        const comments = post.comment_count ?? post.edge_media_to_comment?.count ?? 0
        const views = post.view_count ?? post.play_count ?? post.video_view_count ?? 0

        const rawTs = post.taken_at ?? post.timestamp
        const publishedAt = rawTs ? new Date(rawTs * 1000) : new Date()

        const sentiment = sentimentService.analyze(text)
        const influenceScore = sentimentService.calculateInfluenceScore({
          followerCount,
          engagementRate: followerCount > 0 ? (likes + comments) / followerCount : 0,
          isVerified,
          accountAgeDays: 365,
          platform: 'instagram',
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
            username: postUsername,
            displayName,
            profileUrl: `https://www.instagram.com/${postUsername}/`,
            followerCount,
            isVerified,
            accountAgeDays: 365,
          },
          source: {
            platform: 'instagram',
            domain: 'instagram.com',
            domainAuthority: 94,
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
            engagementRate: followerCount > 0 ? (likes + comments) / followerCount : 0,
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
            emotion: sentiment.emotion,
            intent: sentiment.intent,
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

      logger.debug(`Instagram: collected ${collected} mentions for keyword "${keyword}"`)
    } catch (err) {
      logger.error(`Instagram collector error for keyword "${keyword}"`, err)
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
