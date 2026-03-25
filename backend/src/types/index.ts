import type { Request } from 'express'

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface JwtPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export interface AuthRequest extends Request {
  user?: JwtPayload
}

// ── Enums ────────────────────────────────────────────────────────────────────
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

export type MatchType = 'exact' | 'phrase' | 'broad'
export type SubscriptionTier = 'trial' | 'standard' | 'professional' | 'enterprise'

// ── API Helpers ───────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  data?: T
  error?: { code: string; message: string; details?: unknown }
  metadata?: { page?: number; pageSize?: number; total?: number; totalPages?: number }
}
