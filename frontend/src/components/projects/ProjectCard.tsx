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
      className="bg-white rounded-xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer group flex flex-col"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      {/* Card header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-slate-50">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate leading-tight">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">{project.description}</p>
          )}
        </div>
        <div className="shrink-0">
          <PresenceScore score={project.presenceScore} size={60} />
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-4 grid grid-cols-3 divide-x divide-slate-100">
        <div className="text-center pr-4">
          <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">
            {project.newMentionsCount.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">New</p>
        </div>
        <div className="text-center px-4">
          <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">
            {project.totalMentionsCount.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">Total</p>
        </div>
        <div className="text-center pl-4">
          <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">
            {project.keywords.length}
          </p>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">Keywords</p>
        </div>
      </div>

      {/* Usage bar */}
      <div className="px-5 pb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>Mentions used</span>
          <span className="font-medium">{usagePct}%</span>
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

      {/* Footer */}
      <div className="px-5 pb-4 mt-auto flex items-center justify-between border-t border-slate-50 pt-3">
        <span className="text-xs text-slate-400">
          Created {format(new Date(project.createdAt), 'dd MMM yyyy')}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}/settings`) }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
            title="Settings"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
