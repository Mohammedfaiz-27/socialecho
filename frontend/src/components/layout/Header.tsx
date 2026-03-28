import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/hooks/useAppSelector'

export default function Header() {
  const navigate = useNavigate()
  const currentProject = useAppSelector((s) => s.projects.currentProject)
  const newMentions = currentProject?.newMentionsCount ?? 0

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {currentProject && (
          <>
            <span
              className="hover:text-slate-700 cursor-pointer"
              onClick={() => navigate('/projects')}
            >
              Projects
            </span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-900 font-medium">{currentProject.name}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live
        </div>

        {/* New mentions badge */}
        {newMentions > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-brand-100 text-brand-700 rounded-full">
            {newMentions} new
          </span>
        )}

      </div>
    </header>
  )
}
