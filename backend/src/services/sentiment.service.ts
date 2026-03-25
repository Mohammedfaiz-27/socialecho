/**
 * Sentiment Analysis Service
 *
 * In production this integrates with an NLP provider (OpenAI, HuggingFace, etc.)
 * This implementation provides a rule-based fallback for development.
 */

const POSITIVE_WORDS = new Set([
  'great', 'excellent', 'amazing', 'love', 'fantastic', 'wonderful', 'best', 'good',
  'happy', 'awesome', 'perfect', 'brilliant', 'outstanding', 'superb', 'positive',
  'recommend', 'helpful', 'impressed', 'satisfied', 'delighted', 'beautiful', 'nice',
])

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'broken', 'failed',
  'disappointed', 'useless', 'waste', 'problem', 'issue', 'error', 'bug', 'crash',
  'slow', 'expensive', 'scam', 'fraud', 'fake', 'poor', 'ugly', 'disgusting',
])

const SARCASM_PHRASES = [
  'oh great',
  'so helpful',
  'wow thanks',
  'brilliant job',
  'great job breaking',
  'as if',
  'sure thing',
]

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  isSarcasm: boolean
  language: string
}

export const sentimentService = {
  analyze(text: string): SentimentResult {
    const lower = text.toLowerCase()
    const words = lower.split(/\W+/)

    let posScore = 0
    let negScore = 0

    for (const word of words) {
      if (POSITIVE_WORDS.has(word)) posScore++
      if (NEGATIVE_WORDS.has(word)) negScore++
    }

    // Check for sarcasm patterns
    const isSarcasm = SARCASM_PHRASES.some((phrase) => lower.includes(phrase))

    let sentiment: 'positive' | 'negative' | 'neutral'
    let confidence: number

    if (posScore === 0 && negScore === 0) {
      sentiment = 'neutral'
      confidence = 75
    } else if (isSarcasm) {
      // Sarcasm inverts positive to negative
      sentiment = 'negative'
      confidence = 70
    } else if (posScore > negScore) {
      sentiment = 'positive'
      confidence = Math.min(95, 65 + (posScore - negScore) * 5)
    } else if (negScore > posScore) {
      sentiment = 'negative'
      confidence = Math.min(95, 65 + (negScore - posScore) * 5)
    } else {
      sentiment = 'neutral'
      confidence = 60
    }

    return { sentiment, confidence, isSarcasm, language: 'en' }
  },

  calculateInfluenceScore(params: {
    followerCount: number
    engagementRate: number
    isVerified: boolean
    accountAgeDays: number
    platform: string
  }): number {
    const { followerCount, engagementRate, isVerified, accountAgeDays } = params

    // Follower score (log scale, caps at 1M+)
    const followerScore = Math.min(4, Math.log10(Math.max(1, followerCount)) / 6 * 4)

    // Engagement score
    const engagementScore = Math.min(3, engagementRate * 10)

    // Verification bonus
    const verifiedBonus = isVerified ? 1 : 0

    // Account age (older = more trustworthy)
    const ageScore = Math.min(2, accountAgeDays / 365)

    const raw = followerScore + engagementScore + verifiedBonus + ageScore
    return Math.round(Math.min(10, raw) * 10) / 10
  },
}
