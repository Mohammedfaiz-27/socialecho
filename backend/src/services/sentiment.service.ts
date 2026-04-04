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

const EMOTION_WORDS: Record<string, string[]> = {
  joy:      ['happy', 'excited', 'love', 'wonderful', 'amazing', 'delighted', 'thrilled', 'elated', 'cheerful', 'ecstatic', 'joyful', 'glad', 'pleased'],
  anger:    ['angry', 'furious', 'outraged', 'annoyed', 'frustrated', 'irritated', 'mad', 'rage', 'hate', 'infuriated', 'livid'],
  fear:     ['scared', 'afraid', 'worried', 'anxious', 'nervous', 'terrified', 'frightened', 'dread', 'panic', 'uneasy'],
  sadness:  ['sad', 'disappointed', 'depressed', 'unhappy', 'heartbroken', 'miserable', 'upset', 'grief', 'sorrow', 'hopeless'],
  surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'unexpected', 'wow', 'unbelievable', 'stunned'],
  disgust:  ['disgusting', 'revolting', 'nasty', 'gross', 'awful', 'horrible', 'repulsive', 'vile'],
}

const INTENT_PATTERNS: Record<string, Array<string | RegExp>> = {
  complaint:       ['problem', 'issue', 'broken', 'fix', 'wrong', 'terrible', 'worst', 'disappointed', 'refund', 'complain', 'not working', "doesn't work", "can't", 'failed', 'error'],
  question:        [/\?/, 'how do', 'what is', 'when will', 'where can', 'who is', 'why does', 'can you', 'could you', 'help me', 'how can'],
  praise:          ['love', 'great', 'amazing', 'excellent', 'fantastic', 'wonderful', 'best', 'recommend', 'awesome', 'brilliant', 'superb'],
  purchase_intent: ['buy', 'purchase', 'order', 'how much', 'price', 'cost', 'discount', 'deal', 'sale', 'subscribe', 'plan', 'pricing'],
}

export type EmotionType = 'joy' | 'anger' | 'fear' | 'sadness' | 'surprise' | 'disgust' | 'neutral'
export type IntentType = 'complaint' | 'question' | 'praise' | 'purchase_intent' | 'general'

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  isSarcasm: boolean
  language: string
  emotion: EmotionType
  intent: IntentType
}

function detectEmotion(lower: string, words: string[]): EmotionType {
  const scores: Record<string, number> = {}
  for (const [emotion, emotionWords] of Object.entries(EMOTION_WORDS)) {
    scores[emotion] = emotionWords.filter((w) => words.includes(w) || lower.includes(w)).length
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return best[1] > 0 ? (best[0] as EmotionType) : 'neutral'
}

function detectIntent(lower: string): IntentType {
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    const matched = patterns.some((p) =>
      typeof p === 'string' ? lower.includes(p) : p.test(lower)
    )
    if (matched) return intent as IntentType
  }
  return 'general'
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

    const emotion = detectEmotion(lower, words)
    const intent = detectIntent(lower)

    return { sentiment, confidence, isSarcasm, language: 'en', emotion, intent }
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
