import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/hooks/useAppSelector'

export default function Header() {
  const navigate = useNavigate()
  const currentProject = useAppSelector((s) => s.projects.currentProject)
  const newMentions = currentProject?.newMentionsCount ?? 0

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        {currentProject ? (
          <>
            <button
              onClick={() => navigate('/projects')}
              className="text-slate-400 hover:text-slate-600 transition-colors font-medium"
            >
              Projects
            </button>
            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-800 font-semibold">{currentProject.name}</span>
          </>
        ) : (
          <span className="text-slate-800 font-semibold">Projects</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          Live
        </div>

        {/* New mentions badge */}
        {newMentions > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-brand-600 text-white rounded-full">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {newMentions} new
          </span>
        )}
      </div>
    </header>
  )
}
