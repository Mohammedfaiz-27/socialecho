import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { subDays, formatISO, format } from 'date-fns'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchAnalytics } from '@/store/slices/analyticsSlice'
import MetricCard from '@/components/analytics/MetricCard'
import MentionsChart from '@/components/analytics/MentionsChart'
import SentimentChart from '@/components/analytics/SentimentChart'
import { analyticsService } from '@/services/analyticsService'
import type { HashtagItem, KeywordPerformance, SpikeEvent } from '@/types'
import clsx from 'clsx'

const PERIODS: { label: string; days: number }[] = [
  { label: '7d',  days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export default function AnalyticsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const dispatch = useAppDispatch()
  const { metrics, isLoading } = useAppSelector((s) => s.analytics)
  const [period, setPeriod] = useState(30)

  const [hashtags, setHashtags] = useState<HashtagItem[]>([])
  const [keywords, setKeywords] = useState<KeywordPerformance[]>([])
  const [spikes, setSpikes] = useState<SpikeEvent[]>([])

  const from = formatISO(subDays(new Date(), period))
  const to = formatISO(new Date())

  useEffect(() => {
    if (!projectId) return
    dispatch(fetchAnalytics({ projectId, from, to }))

    Promise.all([
      analyticsService.getTopHashtags(projectId, from, to),
      analyticsService.getKeywordPerformance(projectId, from, to),
      analyticsService.getSpikes(projectId, from, to),
    ]).then(([h, k, s]) => {
      setHashtags(h)
      setKeywords(k)
      setSpikes(s)
    }).catch(() => {})
  }, [projectId, period]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Analytics</h1>
        <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-lg">
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
      </div>

      {/* Spike alerts */}
      {spikes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-amber-500 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {spikes.length} mention spike{spikes.length > 1 ? 's' : ''} detected
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {spikes.map((s) => (
                  <span key={s.date} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {format(new Date(s.date), 'MMM d')} — {s.count} mentions ({s.ratio}× avg)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
        </div>
      )}

      {!isLoading && metrics && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Mentions"
              value={metrics.totalMentions}
              trend={metrics.growthRate}
              accent="blue"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              }
            />
            <MetricCard
              label="Total Reach"
              value={fmt(metrics.totalReach)}
              accent="purple"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9 10h.01M15 10h.01M12 20h.01" />
                </svg>
              }
            />
            <MetricCard
              label="Media Value (AVE)"
              value={`$${fmt(metrics.mediaValue ?? 0)}`}
              accent="amber"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <MetricCard
              label="Positive Rate"
              value={`${metrics.sentimentBreakdown.positivePercent}%`}
              accent="green"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <MentionsChart mentionsTrend={metrics.mentionsTrend} reachTrend={metrics.reachTrend} />
            </div>
            <SentimentChart breakdown={metrics.sentimentBreakdown} />
          </div>

          {/* Keyword performance + Hashtags */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Keyword performance */}
            <div className="lg:col-span-2 card p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Keyword Performance</h3>
              {keywords.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No keyword data for this period</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-3 pr-4">Keyword</th>
                        <th className="pb-3 pr-4 text-right">Mentions</th>
                        <th className="pb-3 pr-4 text-right">Reach</th>
                        <th className="pb-3">Sentiment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {keywords.map((kw) => (
                        <tr key={kw.keyword} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 pr-4">
                            <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                              {kw.keyword}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-right font-semibold text-slate-700">{kw.mentions.toLocaleString()}</td>
                          <td className="py-2.5 pr-4 text-right text-slate-500">{fmt(kw.reach)}</td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-1">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                <div className="h-full bg-emerald-400 rounded-l-full" style={{ width: `${kw.positivePercent}%` }} />
                                <div className="h-full bg-red-400" style={{ width: `${kw.negativePercent}%` }} />
                              </div>
                              <span className="text-xs text-emerald-600 font-medium w-8 text-right">{kw.positivePercent}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top hashtags */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Top Hashtags</h3>
              {hashtags.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No hashtags found</p>
              ) : (
                <div className="space-y-2">
                  {hashtags.slice(0, 12).map((h, i) => {
                    const maxCount = hashtags[0].count
                    const pct = Math.round((h.count / maxCount) * 100)
                    return (
                      <div key={h.tag} className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-4 tabular-nums">{i + 1}</span>
                        <span className="text-xs font-medium text-brand-600 truncate flex-1">#{h.tag}</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{h.count}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Top Influencers */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Top Influencers</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-3 pr-4">Profile</th>
                    <th className="pb-3 pr-4">Followers</th>
                    <th className="pb-3 pr-4">Mentions</th>
                    <th className="pb-3 pr-4">Reach</th>
                    <th className="pb-3">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {metrics.topInfluencers.map((inf) => (
                    <tr key={inf.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                            {(inf.displayName || inf.username || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{inf.displayName}</p>
                            <p className="text-xs text-slate-400">@{inf.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">{fmt(inf.followerCount)}</td>
                      <td className="py-2.5 pr-4 text-slate-600">{inf.mentionCount}</td>
                      <td className="py-2.5 pr-4 text-slate-600">{fmt(inf.totalReach)}</td>
                      <td className="py-2.5">
                        <span className="font-semibold text-brand-700">{inf.influenceScore.toFixed(1)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Source breakdown */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Source Breakdown</h3>
            <div className="space-y-2.5">
              {metrics.sourceBreakdown.map((src) => {
                const pct = metrics.totalMentions ? Math.round((src.count / metrics.totalMentions) * 100) : 0
                return (
                  <div key={src.platform} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-20 capitalize font-medium">{src.platform}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-12 text-right tabular-nums">{src.count.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
