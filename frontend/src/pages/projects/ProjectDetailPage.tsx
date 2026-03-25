import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchProject } from '@/store/slices/projectSlice'
import { fetchAnalytics } from '@/store/slices/analyticsSlice'
import PresenceScore from '@/components/common/PresenceScore'
import MetricCard from '@/components/analytics/MetricCard'
import MentionsChart from '@/components/analytics/MentionsChart'
import SentimentChart from '@/components/analytics/SentimentChart'
import { subDays, formatISO } from 'date-fns'

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const dispatch = useAppDispatch()
  const project = useAppSelector((s) => s.projects.currentProject)
  const { metrics, isLoading: analyticsLoading } = useAppSelector((s) => s.analytics)

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProject(projectId))
      const to = formatISO(new Date())
      const from = formatISO(subDays(new Date(), 30))
      dispatch(fetchAnalytics({ projectId, from, to }))
    }
  }, [projectId, dispatch])

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Project header */}
      <div className="card p-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <PresenceScore score={project.presenceScore} size={64} />
          <div>
            <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-slate-500 mt-1">{project.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
              <span>{project.keywords.length} keywords</span>
              <span>{project.teamMembers.length} members</span>
              {project.lastMentionAt && (
                <span>
                  Last mention:{' '}
                  {new Date(project.lastMentionAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/projects/${projectId}/mentions`}
            className="btn-primary text-sm"
          >
            View Mentions
          </Link>
          <Link
            to={`/projects/${projectId}/settings`}
            className="btn-secondary text-sm"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Metrics */}
      {analyticsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : metrics ? (
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
                : metrics.totalReach >= 1000
                ? `${(metrics.totalReach / 1000).toFixed(1)}K`
                : metrics.totalReach
            }
            icon={<span className="text-xl">📡</span>}
          />
          <MetricCard
            label="Avg Engagement"
            value={`${metrics.avgEngagementRate.toFixed(1)}%`}
            icon={<span className="text-xl">⚡</span>}
          />
          <MetricCard
            label="Presence Score"
            value={metrics.presenceScore}
            sub="out of 100"
            icon={<span className="text-xl">🎯</span>}
          />
        </div>
      ) : null}

      {/* Charts */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <MentionsChart
              mentionsTrend={metrics.mentionsTrend}
              reachTrend={metrics.reachTrend}
            />
          </div>
          <SentimentChart breakdown={metrics.sentimentBreakdown} />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Monitor Mentions', desc: 'View & filter real-time mentions', to: 'mentions', icon: '💬' },
          { label: 'Deep Analytics', desc: 'Charts, trends & insights', to: 'analytics', icon: '📊' },
          { label: 'Top Influencers', desc: "Who's talking about you", to: 'influencers', icon: '⭐' },
        ].map(({ label, desc, to, icon }) => (
          <Link
            key={label}
            to={`/projects/${projectId}/${to}`}
            className="card p-5 hover:shadow-md transition-shadow flex items-start gap-3"
          >
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
