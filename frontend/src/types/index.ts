// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  role: 'owner' | 'admin' | 'analyst' | 'viewer'
  subscriptionTier: 'trial' | 'standard' | 'professional' | 'enterprise'
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────────────────────────────────
export type MatchType = 'exact' | 'phrase' | 'broad'

export interface Keyword {
  id: string
  projectId: string
  keyword: string
  matchType: MatchType
  excludeKeywords: string[]
  mentionCount: number
  isActive: boolean
  createdAt: string
}

export interface SocialConnection {
  platform: SocialPlatform
  isConnected: boolean
  accountName?: string
  accountUrl?: string
  connectedAt?: string
}

export interface TeamMember {
  id: string
  userId: string
  name: string
  email: string
  avatarUrl?: string
  role: 'admin' | 'project_manager' | 'analyst' | 'viewer'
  joinedAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  presenceScore: number
  newMentionsCount: number
  totalMentionsCount: number
  mentionLimit: number
  mentionUsage: number
  keywords: Keyword[]
  socialConnections: SocialConnection[]
  teamMembers: TeamMember[]
  createdAt: string
  updatedAt: string
  lastMentionAt?: string
}

export interface ProjectsState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null
  totalCount: number
  page: number
  pageSize: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Mentions
// ─────────────────────────────────────────────────────────────────────────────
export type SentimentType = 'positive' | 'negative' | 'neutral'
export type SocialPlatform =
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'reddit'
  | 'telegram'
  | 'bluesky'
  | 'news'
  | 'blog'
  | 'podcast'
  | 'web'
  | 'other'

export interface MentionAuthor {
  username: string
  displayName: string
  profileUrl: string
  profilePictureUrl?: string
  followerCount: number
  isVerified: boolean
  accountAgeDays: number
  bio?: string
  location?: string
  websiteUrl?: string
}

export interface MentionSource {
  platform: SocialPlatform
  domain: string
  domainAuthority: number
  monthlyVisitors: number
  isNewsSite: boolean
  tier: 1 | 2 | 3 | 4 | 5
}

export interface MentionEngagement {
  likes: number
  comments: number
  shares: number
  views: number
  engagementRate: number
  capturedAt: string
}

export interface MentionAnalysis {
  sentiment: SentimentType
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

export interface Mention {
  id: string
  projectId: string
  text: string
  title?: string
  url: string
  author: MentionAuthor
  source: MentionSource
  engagement: MentionEngagement
  analysis: MentionAnalysis
  publishedAt: string
  collectedAt: string
  tags: string[]
  notes?: string
  status: 'new' | 'reviewed' | 'assigned' | 'archived'
  isStarred: boolean
}

export interface MentionsState {
  mentions: Mention[]
  currentMention: Mention | null
  isLoading: boolean
  error: string | null
  totalCount: number
  totalPages: number
  page: number
  pageSize: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Filters
// ─────────────────────────────────────────────────────────────────────────────
export type DatePreset =
  | 'last_hour'
  | 'last_24h'
  | 'last_7d'
  | 'last_30d'
  | 'last_90d'
  | 'last_year'
  | 'custom'

export interface DateRange {
  preset: DatePreset
  from?: string
  to?: string
}

export interface MentionFilters {
  search: string
  dateRange: DateRange
  sentiments: SentimentType[]
  sources: SocialPlatform[]
  languages: string[]
  minFollowers?: number
  minEngagement?: number
  keywords: string[]
  tags: string[]
  sortBy: 'relevance' | 'date_desc' | 'date_asc' | 'engagement' | 'reach'
}

export interface SavedFilter {
  id: string
  name: string
  filters: MentionFilters
  createdAt: string
}

export interface FiltersState {
  active: MentionFilters
  saved: SavedFilter[]
  isFilterPanelOpen: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────────────
export interface TimeSeriesPoint {
  date: string
  value: number
}

export interface SentimentBreakdown {
  positive: number
  negative: number
  neutral: number
  positivePercent: number
  negativePercent: number
  neutralPercent: number
}

export interface SourceBreakdown {
  platform: SocialPlatform
  count: number
  reach: number
  sentiment: SentimentBreakdown
}

export interface TopMention {
  mention: Mention
  rank: number
}

export interface Influencer {
  id: string
  username: string
  displayName: string
  profilePictureUrl?: string
  platform: SocialPlatform
  followerCount: number
  influenceScore: number
  mentionCount: number
  totalReach: number
  engagementRate: number
  sentimentDistribution: SentimentBreakdown
  trend: 'rising' | 'stable' | 'declining'
}

export interface AnalyticsMetrics {
  totalMentions: number
  totalReach: number
  avgEngagementRate: number
  sentimentBreakdown: SentimentBreakdown
  mentionsTrend: TimeSeriesPoint[]
  reachTrend: TimeSeriesPoint[]
  sourceBreakdown: SourceBreakdown[]
  topMentions: TopMention[]
  topInfluencers: Influencer[]
  presenceScore: number
  growthRate: number
}

// ─────────────────────────────────────────────────────────────────────────────
// API Helpers
// ─────────────────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code: string
  statusCode: number
}
