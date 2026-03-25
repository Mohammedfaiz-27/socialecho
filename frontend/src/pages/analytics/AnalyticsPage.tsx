import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { subDays, formatISO } from 'date-fns'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchAnalytics } from '@/store/slices/analyticsSlice'
import MetricCard from '@/components/analytics/MetricCard'
import MentionsChart from '@/components/analytics/MentionsChart'
import SentimentChart from '@/components/analytics/SentimentChart'
import clsx from 'clsx'

const PERIODS: { label: string; days: number }[] = [
  { label: '7d',  days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

export default function AnalyticsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const dispatch = useAppDispatch()
  const { metrics, isLoading } = useAppSelector((s) => s.analytics)
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    if (projectId) {
      const to = formatISO(new Date())
      const from = formatISO(subDays(new Date(), period))
      dispatch(fetchAnalytics({ projectId, from, to }))
    }
  }, [projectId, period, dispatch])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Analytics</h1>
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
      </div>

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
              icon={<span className="text-xl">💬</span>}
            />
            <MetricCard
              label="Total Reach"
              value={
                metrics.totalReach >= 1_000_000
                  ? `${(metrics.totalReach / 1_000_000).toFixed(1)}M`
                  : `${(metrics.totalReach / 1000).toFixed(1)}K`
              }
              icon={<span className="text-xl">📡</span>}
            />
            <MetricCard
              label="Avg Engagement"
              value={`${metrics.avgEngagementRate.toFixed(1)}%`}
              icon={<span className="text-xl">⚡</span>}
            />
            <MetricCard
              label="Positive Rate"
              value={`${metrics.sentimentBreakdown.positivePercent}%`}
              icon={<span className="text-xl">😊</span>}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <MentionsChart
                mentionsTrend={metrics.mentionsTrend}
                reachTrend={metrics.reachTrend}
              />
            </div>
            <SentimentChart breakdown={metrics.sentimentBreakdown} />
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
                            {inf.displayName[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{inf.displayName}</p>
                            <p className="text-xs text-slate-400">@{inf.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">
                        {inf.followerCount >= 1000
                          ? `${(inf.followerCount / 1000).toFixed(0)}K`
                          : inf.followerCount}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">{inf.mentionCount}</td>
                      <td className="py-2.5 pr-4 text-slate-600">
                        {inf.totalReach >= 1000
                          ? `${(inf.totalReach / 1000).toFixed(0)}K`
                          : inf.totalReach}
                      </td>
                      <td className="py-2.5">
                        <span className="font-semibold text-brand-700">
                          {inf.influenceScore.toFixed(1)}
                        </span>
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
            <div className="space-y-2">
              {metrics.sourceBreakdown.map((src) => {
                const pct = metrics.totalMentions
                  ? Math.round((src.count / metrics.totalMentions) * 100)
                  : 0
                return (
                  <div key={src.platform} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-20 capitalize">{src.platform}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-12 text-right">
                      {src.count.toLocaleString()}
                    </span>
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
