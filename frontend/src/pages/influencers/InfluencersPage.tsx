import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchAnalytics } from '@/store/slices/analyticsSlice'
import InfluenceScore from '@/components/common/InfluenceScore'
import SentimentBadge from '@/components/common/SentimentBadge'
import PlatformIcon from '@/components/common/PlatformIcon'
import { subDays, formatISO } from 'date-fns'
import type { Influencer } from '@/types'

type SortKey = 'influenceScore' | 'mentionCount' | 'totalReach' | 'followerCount'

export default function InfluencersPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const dispatch = useAppDispatch()
  const { metrics, isLoading } = useAppSelector((s) => s.analytics)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('influenceScore')

  useEffect(() => {
    if (projectId) {
      const to = formatISO(new Date())
      const from = formatISO(subDays(new Date(), 30))
      dispatch(fetchAnalytics({ projectId, from, to }))
    }
  }, [projectId, dispatch])

  const influencers: Influencer[] = metrics?.topInfluencers ?? []

  const filtered = influencers
    .filter(
      (inf) =>
        inf.displayName.toLowerCase().includes(search.toLowerCase()) ||
        inf.username.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b[sortBy] - a[sortBy])

  const dominantSentiment = (inf: Influencer) => {
    const { positivePercent, negativePercent } = inf.sentimentDistribution
    if (positivePercent >= negativePercent && positivePercent >= (100 - positivePercent - negativePercent))
      return 'positive' as const
    if (negativePercent > positivePercent) return 'negative' as const
    return 'neutral' as const
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Influencers</h1>
        <p className="text-sm text-slate-500">{filtered.length} profiles</p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search influencers…"
          className="input max-w-xs"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="input w-48"
        >
          <option value="influenceScore">Sort: Influence</option>
          <option value="mentionCount">Sort: Mentions</option>
          <option value="totalReach">Sort: Reach</option>
          <option value="followerCount">Sort: Followers</option>
        </select>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-400 uppercase tracking-wider border-b border-slate-200">
                {['Profile', 'Platform', 'Followers', 'Mentions', 'Reach', 'Engagement', 'Sentiment', 'Score'].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inf) => (
                <tr key={inf.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold shrink-0">
                        {inf.displayName[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{inf.displayName}</p>
                        <p className="text-xs text-slate-400">@{inf.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PlatformIcon platform={inf.platform} showLabel />
                  </td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">
                    {inf.followerCount >= 1_000_000
                      ? `${(inf.followerCount / 1_000_000).toFixed(1)}M`
                      : inf.followerCount >= 1000
                      ? `${(inf.followerCount / 1000).toFixed(0)}K`
                      : inf.followerCount}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-semibold">{inf.mentionCount}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {inf.totalReach >= 1000
                      ? `${(inf.totalReach / 1000).toFixed(0)}K`
                      : inf.totalReach}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {inf.engagementRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">
                    <SentimentBadge sentiment={dominantSentiment(inf)} />
                  </td>
                  <td className="px-4 py-3">
                    <InfluenceScore score={inf.influenceScore} showBar />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
