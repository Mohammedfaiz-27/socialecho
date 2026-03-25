import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import type { Mention } from '@/types'
import SentimentBadge from '@/components/common/SentimentBadge'
import InfluenceScore from '@/components/common/InfluenceScore'
import PlatformIcon from '@/components/common/PlatformIcon'

interface Props {
  mention: Mention
  projectId: string
  onClose: () => void
}

export default function MentionDetail({ mention, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <PlatformIcon platform={mention.source.platform} size="md" />
            <div>
              <p className="text-sm font-semibold text-slate-800">{mention.source.domain}</p>
              <p className="text-xs text-slate-400">DA: {mention.source.domainAuthority}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          {/* Author */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg shrink-0">
              {mention.author.displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900">{mention.author.displayName}</span>
                {mention.author.isVerified && <span className="text-blue-500 text-sm">✓</span>}
              </div>
              <a
                href={mention.author.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-brand-600"
              >
                @{mention.author.username}
              </a>
              <p className="text-xs text-slate-400 mt-0.5">
                {mention.author.followerCount.toLocaleString()} followers
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="bg-slate-50 rounded-lg p-4">
            {mention.title && (
              <p className="text-sm font-semibold text-slate-800 mb-2">{mention.title}</p>
            )}
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{mention.text}</p>
          </div>

          {/* Sentiment & Influence */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-3">
              <p className="text-xs text-slate-400 mb-1.5 font-medium">Sentiment</p>
              <SentimentBadge
                sentiment={mention.analysis.sentiment}
                confidence={mention.analysis.sentimentConfidence}
                size="md"
              />
              {mention.analysis.isSarcasm && (
                <p className="text-xs text-amber-600 mt-1">⚠ Sarcasm detected</p>
              )}
            </div>
            <div className="card p-3">
              <p className="text-xs text-slate-400 mb-1.5 font-medium">Influence Score</p>
              <InfluenceScore score={mention.analysis.influenceScore} size="md" />
            </div>
          </div>

          {/* Engagement */}
          <div className="card p-4">
            <p className="text-xs text-slate-400 font-medium mb-3">Engagement</p>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { label: 'Likes', value: mention.engagement.likes },
                { label: 'Comments', value: mention.engagement.comments },
                { label: 'Shares', value: mention.engagement.shares },
                { label: 'Views', value: mention.engagement.views },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-lg font-bold text-slate-800">{value.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="space-y-1.5 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Published</span>
              <span className="text-slate-700">
                {format(new Date(mention.publishedAt), 'PPp')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Collected</span>
              <span className="text-slate-700">
                {format(new Date(mention.collectedAt), 'PPp')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Language</span>
              <span className="text-slate-700 uppercase">{mention.analysis.language}</span>
            </div>
          </div>

          {/* Entities & Hashtags */}
          {mention.analysis.namedEntities.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 font-medium mb-2">Named Entities</p>
              <div className="flex flex-wrap gap-1">
                {mention.analysis.namedEntities.map((e) => (
                  <span key={e} className="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded-full">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex gap-2 shrink-0">
          <a
            href={mention.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm flex-1 text-center"
          >
            Open Source ↗
          </a>
          <button onClick={onClose} className="btn-secondary text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
