/**
 * News Collector — uses Google News RSS (no API key required)
 * Falls back to fetching headlines from RSS feeds
 */
import axios from 'axios'
import { mentionService } from '../mention.service'
import { sentimentService } from '../sentiment.service'
import { logger } from '../../utils/logger'
import { format } from 'date-fns'

const client = axios.create({ timeout: 15000 })

interface NewsItem {
  title: string
  link: string
  pubDate?: string
  source?: string
  description?: string
}

function parseRSS(xml: string): NewsItem[] {
  const items: NewsItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const title = extractTag(block, 'title')
    const link = extractTag(block, 'link') || extractTag(block, 'guid')
    const pubDate = extractTag(block, 'pubDate')
    const source = extractTag(block, 'source')
    const description = extractTag(block, 'description')

    if (title && link) {
      items.push({ title, link, pubDate, source, description })
    }
  }

  return items
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
  return match?.[1]?.trim() ?? ''
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return 'news.google.com'
  }
}

export async function collectNewsMentions(
  projectId: string,
  keywords: string[]
): Promise<number> {
  let collected = 0

  for (const keyword of keywords) {
    try {
      const encodedKeyword = encodeURIComponent(keyword)
      const rssUrl = `https://news.google.com/rss/search?q=${encodedKeyword}&hl=en-US&gl=US&ceid=US:en`

      const { data: xml } = await client.get(rssUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SocialEcho/1.0)' },
      })

      const items = parseRSS(xml).slice(0, 20)

      for (const item of items) {
        const text = item.title + (item.description ? ` ${item.description.replace(/<[^>]*>/g, '').slice(0, 300)}` : '')
        const sentiment = sentimentService.analyze(text)
        const domain = extractDomain(item.link)
        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date()

        const saved = await mentionService.saveMention({
          projectId,
          mentionType: 'news',
          content: {
            text,
            title: item.title,
            url: item.link,
            language: 'en',
          },
          author: {
            username: item.source ?? domain,
            displayName: item.source ?? domain,
            profileUrl: `https://${domain}`,
            followerCount: 50000,
            isVerified: true,
            accountAgeDays: 1825,
          },
          source: {
            platform: 'news',
            domain,
            domainAuthority: 70,
            monthlyVisitors: 1000000,
            isNewsSite: true,
            tier: 2,
          },
          temporal: {
            publishedAt,
            collectedAt: new Date(),
            dateString: format(publishedAt, 'yyyy-MM-dd'),
            weekYear: format(publishedAt, 'yyyy-ww'),
          },
          engagement: {
            likes: 0,
            comments: 0,
            shares: 0,
            views: 0,
            engagementRate: 0,
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
            influenceScore: 6.0,
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

      logger.debug(`News: collected ${collected} mentions for keyword "${keyword}"`)
    } catch (err) {
      logger.error(`News collector error for keyword "${keyword}"`, err)
    }

    await sleep(300)
  }

  return collected
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
