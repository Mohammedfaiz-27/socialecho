import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { subDays, formatISO, format } from 'date-fns'
import { useAppSelector } from '@/hooks/useAppSelector'
import { analyticsService } from '@/services/analyticsService'
import type { AnalyticsMetrics } from '@/types'
import clsx from 'clsx'

const PERIODS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

const SENTIMENT_BG = {
  positive: 'bg-emerald-50 text-emerald-700',
  negative: 'bg-red-50 text-red-700',
  neutral: 'bg-slate-100 text-slate-600',
}

const SENTIMENT_BAR = {
  positive: 'bg-emerald-500',
  negative: 'bg-red-500',
  neutral: 'bg-slate-400',
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function dominantSentiment(inf: { sentimentDistribution: { positivePercent: number; negativePercent: number } }) {
  if (inf.sentimentDistribution.positivePercent >= 50) return 'positive'
  if (inf.sentimentDistribution.negativePercent >= 50) return 'negative'
  return 'neutral'
}

export default function ReportsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const currentProject = useAppSelector((s) => s.projects.currentProject)
  const [period, setPeriod] = useState(30)
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [aiSummary, setAiSummary] = useState<string>('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const toISO = formatISO(new Date())
  const fromISO = formatISO(subDays(new Date(), period))

  useEffect(() => {
    if (!projectId) return
    setIsLoading(true)
    setError(null)
    analyticsService
      .getMetrics(projectId, fromISO, toISO)
      .then(setMetrics)
      .catch(() => setError('Failed to load report data. Please try again.'))
      .finally(() => setIsLoading(false))
  }, [projectId, period]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleExport() {
    if (!projectId || isExporting) return
    setIsExporting(true)
    try {
      await analyticsService.exportCSV(projectId, fromISO, toISO)
    } finally {
      setIsExporting(false)
    }
  }

  function handlePdfExport() {
    window.print()
  }

  const handleAiSummary = useCallback(async () => {
    if (!projectId || aiLoading) return
    setAiLoading(true)
    setAiError(null)
    try {
      const summary = await analyticsService.generateAiSummary(projectId, fromISO, toISO)
      setAiSummary(summary)
    } catch {
      setAiError('Failed to generate summary. Check your Gemini API key in .env.')
    } finally {
      setAiLoading(false)
    }
  }, [projectId, fromISO, toISO, aiLoading])

  const fromLabel = format(subDays(new Date(), period), 'MMM d, yyyy')
  const toLabel = format(new Date(), 'MMM d, yyyy')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports</h1>
          {currentProject && (
            <p className="text-sm text-slate-500 mt-0.5">{currentProject.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {PERIODS.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  period === days
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={handlePdfExport}
            disabled={!metrics}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors print:hidden"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Export PDF
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !metrics}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors print:hidden"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isExporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 -mt-2">
        {fromLabel} — {toLabel}
      </p>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Report */}
      {!isLoading && metrics && (
        <>
          {/* Summary metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Mentions', value: metrics.totalMentions.toLocaleString(), icon: '💬' },
              { label: 'Total Reach', value: fmt(metrics.totalReach), icon: '📡' },
              { label: 'Media Value (AVE)', value: `$${fmt(metrics.mediaValue ?? 0)}`, icon: '💰' },
              { label: 'Positive Rate', value: `${metrics.sentimentBreakdown.positivePercent}%`, icon: '😊' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span>
                  <span className="text-lg">{icon}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          {/* AI Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 print:break-inside-avoid">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-800">AI-Generated Report Summary</h3>
                <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-semibold">Gemini</span>
              </div>
              <button
                onClick={handleAiSummary}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50 print:hidden"
              >
                {aiLoading ? 'Generating…' : aiSummary ? 'Regenerate' : 'Generate with AI'}
              </button>
            </div>
            {aiError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{aiError}</p>}
            {aiSummary ? (
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{aiSummary}</p>
            ) : !aiLoading && !aiError && (
              <p className="text-sm text-slate-400 text-center py-4">
                Generate an AI summary to include in your report
              </p>
            )}
          </div>

          {/* Sentiment */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Sentiment Breakdown</h3>
            <div className="flex gap-3 mb-4">
              {(['positive', 'negative', 'neutral'] as const).map((s) => (
                <div key={s} className={clsx('flex-1 rounded-lg px-4 py-3 text-center', SENTIMENT_BG[s])}>
                  <p className="text-xl font-bold">{metrics.sentimentBreakdown[s].toLocaleString()}</p>
                  <p className="text-xs font-medium capitalize mt-0.5">{s}</p>
                  <p className="text-xs opacity-70">
                    {metrics.sentimentBreakdown[`${s}Percent` as 'positivePercent' | 'negativePercent' | 'neutralPercent']}%
                  </p>
                </div>
              ))}
            </div>
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
              {(['positive', 'negative', 'neutral'] as const).map((s) => {
                const pct = metrics.sentimentBreakdown[`${s}Percent` as 'positivePercent' | 'negativePercent' | 'neutralPercent']
                return pct > 0 ? (
                  <div key={s} className={clsx('rounded-full', SENTIMENT_BAR[s])} style={{ width: `${pct}%` }} />
                ) : null
              })}
            </div>
          </div>

          {/* Platform breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Platform Breakdown</h3>
            {metrics.sourceBreakdown.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No data for this period</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-3 pr-4">Platform</th>
                    <th className="pb-3 pr-4">Mentions</th>
                    <th className="pb-3 pr-4">Reach</th>
                    <th className="pb-3 w-48">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {metrics.sourceBreakdown.map((src) => {
                    const pct = metrics.totalMentions
                      ? Math.round((src.count / metrics.totalMentions) * 100)
                      : 0
                    return (
                      <tr key={src.platform} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 pr-4 font-medium text-slate-700 capitalize">{src.platform}</td>
                        <td className="py-3 pr-4 text-slate-600">{src.count.toLocaleString()}</td>
                        <td className="py-3 pr-4 text-slate-600">{fmt(src.reach)}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Top influencers */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Top Influencers</h3>
            {metrics.topInfluencers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No data for this period</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-3 pr-4">Profile</th>
                    <th className="pb-3 pr-4">Platform</th>
                    <th className="pb-3 pr-4">Followers</th>
                    <th className="pb-3 pr-4">Mentions</th>
                    <th className="pb-3 pr-4">Sentiment</th>
                    <th className="pb-3">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {metrics.topInfluencers.slice(0, 10).map((inf) => {
                    const sentiment = dominantSentiment(inf)
                    return (
                      <tr key={inf.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                              {(inf.displayName || inf.username || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 leading-tight">{inf.displayName}</p>
                              <p className="text-xs text-slate-400">@{inf.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 text-slate-500 capitalize text-xs">{inf.platform}</td>
                        <td className="py-2.5 pr-4 text-slate-600">{fmt(inf.followerCount)}</td>
                        <td className="py-2.5 pr-4 text-slate-600">{inf.mentionCount}</td>
                        <td className="py-2.5 pr-4">
                          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium capitalize', SENTIMENT_BG[sentiment])}>
                            {sentiment}
                          </span>
                        </td>
                        <td className="py-2.5 font-semibold text-brand-700">
                          {inf.influenceScore.toFixed(1)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Top mentions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Top Mentions by Engagement</h3>
            {metrics.topMentions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No data for this period</p>
            ) : (
              <div className="space-y-3">
                {metrics.topMentions.slice(0, 5).map(({ rank, mention }) => {
                  // Backend returns raw MongoDB doc (nested) — cast to access nested fields
                  const raw = mention as unknown as Record<string, any>
                  const text = raw.content?.text ?? mention.text ?? ''
                  const platform = raw.source?.platform ?? mention.source?.platform ?? ''
                  const username = raw.author?.username ?? mention.author?.username ?? ''
                  const publishedAt = raw.temporal?.publishedAt ?? mention.publishedAt
                  const sentiment = (raw.analysis?.sentiment ?? mention.analysis?.sentiment) as keyof typeof SENTIMENT_BG | undefined
                  const likes = raw.engagement?.likes ?? mention.engagement?.likes ?? 0
                  const comments = raw.engagement?.comments ?? mention.engagement?.comments ?? 0
                  return (
                    <div key={rank} className="flex gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                      <span className="text-xs font-bold text-slate-300 w-5 shrink-0 mt-0.5">#{rank}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 line-clamp-2">{text}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs text-slate-500 capitalize font-medium">{platform}</span>
                          <span className="text-xs text-slate-400">@{username}</span>
                          {publishedAt && (
                            <span className="text-xs text-slate-400">
                              {format(new Date(publishedAt), 'MMM d, yyyy')}
                            </span>
                          )}
                          {sentiment && (
                            <span className={clsx('text-xs px-1.5 py-0.5 rounded-full font-medium', SENTIMENT_BG[sentiment] ?? 'bg-slate-100 text-slate-600')}>
                              {sentiment}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs text-slate-400 space-y-0.5">
                        <p>❤️ {likes.toLocaleString()}</p>
                        <p>💬 {comments.toLocaleString()}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
