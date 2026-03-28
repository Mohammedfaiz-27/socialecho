import { useAppSelector } from '@/hooks/useAppSelector'

export default function ReportsPage() {
  const currentProject = useAppSelector((s) => s.projects.currentProject)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        {currentProject && (
          <p className="text-sm text-slate-500 mt-1">{currentProject.name}</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-700 mb-1">Reports coming soon</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Export and schedule reports for this project. This feature is under development.
        </p>
      </div>
    </div>
  )
}
