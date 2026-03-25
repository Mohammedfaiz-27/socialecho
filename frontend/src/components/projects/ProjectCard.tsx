import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import type { Project } from '@/types'
import PresenceScore from '@/components/common/PresenceScore'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { deleteProject } from '@/store/slices/projectSlice'

interface Props {
  project: Project
}

export default function ProjectCard({ project }: Props) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      dispatch(deleteProject(project.id))
    }
  }

  const usagePct = project.mentionLimit
    ? Math.min(100, Math.round((project.mentionUsage / project.mentionLimit) * 100))
    : 0

  return (
    <div
      className="card p-5 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 truncate">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{project.description}</p>
          )}
        </div>
        <PresenceScore score={project.presenceScore} size={52} />
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold text-slate-800">
            {project.newMentionsCount.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">New</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">
            {project.totalMentionsCount.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">Total</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">{project.keywords.length}</p>
          <p className="text-xs text-slate-400">Keywords</p>
        </div>
      </div>

      {/* Usage bar */}
      {project.mentionLimit > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Mentions used</span>
            <span>{usagePct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                usagePct > 90 ? 'bg-red-500' : usagePct > 70 ? 'bg-amber-400' : 'bg-brand-500'
              }`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Created {format(new Date(project.createdAt), 'dd MMM yyyy')}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/projects/${project.id}/settings`)
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
            title="Settings"
          >
            ⚙
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50"
            title="Delete"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  )
}
