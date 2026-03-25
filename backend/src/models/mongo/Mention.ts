import mongoose, { Schema, Document } from 'mongoose'

export interface IMention extends Document {
  projectId: string
  mentionType: string
  content: {
    text: string
    title?: string
    url: string
    cleanText?: string
    language: string
    mediaUrls?: string[]
  }
  author: {
    username: string
    displayName: string
    profileUrl: string
    profilePictureUrl?: string
    followerCount: number
    isVerified: boolean
    accountAgeDays: number
    bio?: string
    location?: string
  }
  source: {
    platform: string
    domain: string
    domainAuthority: number
    monthlyVisitors: number
    isNewsSite: boolean
    tier: number
  }
  temporal: {
    publishedAt: Date
    collectedAt: Date
    dateString: string  // YYYY-MM-DD
    weekYear: string    // YYYY-WW
  }
  engagement: {
    likes: number
    comments: number
    shares: number
    views: number
    engagementRate: number
    capturedAt: Date
  }
  analysis: {
    sentiment: string
    sentimentConfidence: number
    isSarcasm: boolean
    language: string
    namedEntities: string[]
    hashtags: string[]
    keywordsMatched: string[]
    influenceScore: number
    topics: string[]
    geolocation?: { country: string; region?: string; city?: string }
  }
  metadata: {
    tags: string[]
    notes?: string
    status: string
    isStarred: boolean
    lastUpdated: Date
  }
}

const MentionSchema = new Schema<IMention>(
  {
    projectId: { type: String, required: true, index: true },
    mentionType: { type: String, default: 'social_media' },
    content: {
      text: { type: String, required: true },
      title: String,
      url: { type: String, required: true },
      cleanText: String,
      language: { type: String, default: 'en' },
      mediaUrls: [String],
    },
    author: {
      username: { type: String, required: true },
      displayName: String,
      profileUrl: String,
      profilePictureUrl: String,
      followerCount: { type: Number, default: 0 },
      isVerified: { type: Boolean, default: false },
      accountAgeDays: { type: Number, default: 0 },
      bio: String,
      location: String,
    },
    source: {
      platform: { type: String, required: true },
      domain: { type: String, required: true },
      domainAuthority: { type: Number, default: 0 },
      monthlyVisitors: { type: Number, default: 0 },
      isNewsSite: { type: Boolean, default: false },
      tier: { type: Number, default: 3 },
    },
    temporal: {
      publishedAt: { type: Date, required: true },
      collectedAt: { type: Date, default: Date.now },
      dateString: String,
      weekYear: String,
    },
    engagement: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
      engagementRate: { type: Number, default: 0 },
      capturedAt: { type: Date, default: Date.now },
    },
    analysis: {
      sentiment: { type: String, enum: ['positive', 'negative', 'neutral'], default: 'neutral' },
      sentimentConfidence: { type: Number, default: 0 },
      isSarcasm: { type: Boolean, default: false },
      language: { type: String, default: 'en' },
      namedEntities: [String],
      hashtags: [String],
      keywordsMatched: [String],
      influenceScore: { type: Number, default: 0 },
      topics: [String],
      geolocation: { country: String, region: String, city: String },
    },
    metadata: {
      tags: { type: [String], default: [] },
      notes: String,
      status: {
        type: String,
        enum: ['new', 'reviewed', 'assigned', 'archived'],
        default: 'new',
      },
      isStarred: { type: Boolean, default: false },
      lastUpdated: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
)

// Compound indexes for common query patterns
MentionSchema.index({ projectId: 1, 'temporal.publishedAt': -1 })
MentionSchema.index({ projectId: 1, 'analysis.sentiment': 1 })
MentionSchema.index({ projectId: 1, 'source.platform': 1 })
MentionSchema.index({ projectId: 1, 'analysis.influenceScore': -1 })
MentionSchema.index({ 'content.url': 1 }, { unique: true })
MentionSchema.index(
  { 'content.text': 'text', 'author.username': 'text' },
  { default_language: 'none', language_override: 'noLanguageOverride' }
)

export const Mention = mongoose.model<IMention>('Mention', MentionSchema)
