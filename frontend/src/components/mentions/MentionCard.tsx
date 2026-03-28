import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { Mention } from '@/types'
import SentimentBadge from '@/components/common/SentimentBadge'
import InfluenceScore from '@/components/common/InfluenceScore'
import PlatformIcon from '@/components/common/PlatformIcon'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { toggleStarMention } from '@/store/slices/mentionSlice'

interface Props {
  mention: Mention
  projectId: string
  onOpen: (mention: Mention) => void
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export default function MentionCard({ mention, projectId, onOpen }: Props) {
  const dispatch = useAppDispatch()
  const [expanded, setExpanded] = useState(false)
  const maxLen = 280

  const text = mention.text
  const isLong = text.length > maxLen
  const displayText = isLong && !expanded ? text.slice(0, maxLen) + '…' : text

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <PlatformIcon platform={mention.source.platform} />
          <div className="min-w-0">
            <a
              href={mention.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-brand-600 truncate block"
            >
              {mention.source.domain}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SentimentBadge
            sentiment={mention.analysis.sentiment}
            confidence={mention.analysis.sentimentConfidence}
          />
          <button
            onClick={() =>
              dispatch(
                toggleStarMention({
                  projectId,
                  mentionId: mention.id,
                  isStarred: !mention.isStarred,
                })
              )
            }
            className={`text-lg transition-colors ${mention.isStarred ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300'}`}
          >
            ★
          </button>
        </div>
      </div>

      {/* Author row */}
      <div className="flex items-center gap-2 mt-3">
        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 shrink-0">
          {mention.author.username && mention.author.username !== 'unknown'
            ? mention.author.username[0].toUpperCase()
            : mention.author.displayName && mention.author.displayName !== 'Unknown'
              ? mention.author.displayName[0].toUpperCase()
              : mention.source.platform[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <span className="text-xs font-semibold text-slate-800">
            {mention.author.username && mention.author.username !== 'unknown'
              ? `@${mention.author.username}`
              : mention.author.displayName && mention.author.displayName !== 'Unknown'
                ? mention.author.displayName
                : `@${mention.source.platform}_user`}
          </span>
          {mention.author.isVerified && (
            <span className="ml-1 text-blue-500 text-xs">✓</span>
          )}
          <span className="ml-2 text-xs text-slate-400">
            {formatCount(mention.author.followerCount)} followers
          </span>
        </div>
        <span className="ml-auto text-xs text-slate-400 shrink-0">
          {formatDistanceToNow(new Date(mention.publishedAt), { addSuffix: true })}
        </span>
      </div>

      {/* Content */}
      {mention.title && (
        <p className="mt-2 text-sm font-semibold text-slate-800 line-clamp-2">{mention.title}</p>
      )}
      <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
        {displayText}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-1 text-brand-600 hover:underline text-xs"
          >
            {expanded ? 'show less' : 'read more'}
          </button>
        )}
      </p>

      {/* Hashtags */}
      {mention.analysis.hashtags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {mention.analysis.hashtags.slice(0, 5).map((tag) => (
            <span key={tag} className="text-xs text-brand-500 hover:underline cursor-pointer">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom row */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span>♥</span> {formatCount(mention.engagement.likes)}
          </span>
          <span className="flex items-center gap-1">
            <span>💬</span> {formatCount(mention.engagement.comments)}
          </span>
          <span className="flex items-center gap-1">
            <span>↩</span> {formatCount(mention.engagement.shares)}
          </span>
          {mention.engagement.views > 0 && (
            <span className="flex items-center gap-1">
              <span>👁</span> {formatCount(mention.engagement.views)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <InfluenceScore score={mention.analysis.influenceScore} showBar />
          <button
            onClick={() => onOpen(mention)}
            className="ml-2 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            View
          </button>
          <a
            href={mention.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Source ↗
          </a>
        </div>
      </div>
    </div>
  )
}
