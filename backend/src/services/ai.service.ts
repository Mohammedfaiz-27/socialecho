import axios from 'axios'
import { env } from '../config/env'
import { Mention } from '../models/mongo/Mention'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export const aiService = {
  async generateSummary(projectId: string, from: string, to: string): Promise<string> {
    if (!env.GEMINI_API_KEY) {
      throw Object.assign(new Error('Gemini API key not configured'), { status: 400, code: 'NO_API_KEY' })
    }

    const fromDate = new Date(from)
    const toDate = new Date(to)

    // Gather data for the prompt
    const [totalAgg, sentimentAgg, sourceAgg, hashtagAgg, sampleMentions] = await Promise.all([
      Mention.aggregate([
        { $match: { projectId, 'temporal.publishedAt': { $gte: fromDate, $lte: toDate } } },
        { $group: { _id: null, total: { $sum: 1 }, totalReach: { $sum: '$author.followerCount' }, avgEngagement: { $avg: '$engagement.engagementRate' } } },
      ]),
      Mention.aggregate([
        { $match: { projectId, 'temporal.publishedAt': { $gte: fromDate, $lte: toDate } } },
        { $group: { _id: '$analysis.sentiment', count: { $sum: 1 } } },
      ]),
      Mention.aggregate([
        { $match: { projectId, 'temporal.publishedAt': { $gte: fromDate, $lte: toDate } } },
        { $group: { _id: '$source.platform', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 5 },
      ]),
      Mention.aggregate([
        { $match: { projectId, 'temporal.publishedAt': { $gte: fromDate, $lte: toDate }, 'analysis.hashtags': { $ne: [] } } },
        { $unwind: '$analysis.hashtags' },
        { $group: { _id: { $toLower: '$analysis.hashtags' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 },
      ]),
      Mention.find({ projectId, 'temporal.publishedAt': { $gte: fromDate, $lte: toDate } })
        .sort({ 'analysis.influenceScore': -1 })
        .limit(5)
        .select('content.text analysis.sentiment source.platform author.username')
        .lean(),
    ])

    const summary = totalAgg[0] ?? { total: 0, totalReach: 0, avgEngagement: 0 }
    const sentMap: Record<string, number> = {}
    sentimentAgg.forEach((s: { _id: string; count: number }) => { sentMap[s._id] = s.count })
    const total = summary.total as number || 1

    const prompt = `You are a brand monitoring analyst. Analyze the following social media monitoring data and write a concise, insightful executive summary in 3-4 paragraphs. Focus on key trends, risks, and opportunities.

MONITORING DATA (${from.split('T')[0]} to ${to.split('T')[0]}):
- Total mentions: ${summary.total}
- Total reach: ${(summary.totalReach as number).toLocaleString()} people
- Average engagement rate: ${((summary.avgEngagement as number) * 100).toFixed(1)}%
- Sentiment: ${Math.round(((sentMap.positive ?? 0) / total) * 100)}% positive, ${Math.round(((sentMap.negative ?? 0) / total) * 100)}% negative, ${Math.round(((sentMap.neutral ?? 0) / total) * 100)}% neutral
- Top platforms: ${sourceAgg.map((s: { _id: string; count: number }) => `${s._id} (${s.count})`).join(', ')}
- Trending hashtags: ${hashtagAgg.map((h: { _id: string; count: number }) => `#${h._id}`).join(', ')}
- Top mentions sample:
${sampleMentions.map((m) => `  • [${(m as Record<string, unknown> & { source?: { platform?: string }; analysis?: { sentiment?: string }; author?: { username?: string }; content?: { text?: string } }).source?.platform}] @${(m as Record<string, unknown> & { author?: { username?: string } }).author?.username}: "${String((m as Record<string, unknown> & { content?: { text?: string } }).content?.text ?? '').slice(0, 120)}"`).join('\n')}

Write the summary in a professional tone. Include: overall performance assessment, sentiment analysis insights, platform performance, notable trends, and 1-2 actionable recommendations.`

    let response
    try {
      response = await axios.post(
        `${GEMINI_URL}?key=${env.GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
      )
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: unknown } }
      const status = axiosErr.response?.status
      const detail = JSON.stringify(axiosErr.response?.data)
      throw new Error(`Gemini API error ${status}: ${detail}`)
    }

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('No response from Gemini')
    return text as string
  },
}
