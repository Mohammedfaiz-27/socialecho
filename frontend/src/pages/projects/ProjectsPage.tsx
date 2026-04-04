import { useEffect, useState } from 'react'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchProjects } from '@/store/slices/projectSlice'
import ProjectCard from '@/components/projects/ProjectCard'
import CreateProjectModal from '@/components/projects/CreateProjectModal'
import type { Project } from '@/types'

export default function ProjectsPage() {
  const dispatch = useAppDispatch()
  const { projects, isLoading, totalCount } = useAppSelector((s) => s.projects)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    dispatch(fetchProjects({ page: 1, pageSize: 100 }))
  }, [dispatch])

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  )

  const ownProjects = filtered.filter(
    (p) => ((p.settings as Record<string, unknown>)?.projectType ?? 'own') !== 'competitor'
  )
  const competitorProjects = filtered.filter(
    (p) => (p.settings as Record<string, unknown>)?.projectType === 'competitor'
  )

  const loadingSkeletons = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-card p-5 animate-pulse">
          <div className="flex justify-between mb-4">
            <div className="h-5 bg-slate-200 rounded w-2/3" />
            <div className="w-14 h-14 bg-slate-100 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1,2,3].map(j => (
              <div key={j} className="text-center">
                <div className="h-7 bg-slate-200 rounded w-12 mx-auto mb-1" />
                <div className="h-3 bg-slate-100 rounded w-8 mx-auto" />
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full" />
        </div>
      ))}
    </div>
  )

  function SectionHeader({
    label, count, type,
  }: { label: string; count: number; type: 'own' | 'competitor' }) {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          type === 'own' ? 'bg-brand-100' : 'bg-rose-100'
        }`}>
          {type === 'own' ? (
            <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{label}</h2>
          <p className="text-xs text-slate-400">{count} project{count !== 1 ? 's' : ''}</p>
        </div>
        <div className={`ml-1 h-px flex-1 ${type === 'own' ? 'bg-brand-100' : 'bg-rose-100'}`} />
      </div>
    )
  }

  function EmptySection({ type, onAdd }: { type: 'own' | 'competitor'; onAdd: () => void }) {
    const isOwn = type === 'own'
    return (
      <div className={`rounded-xl border-2 border-dashed p-8 text-center ${
        isOwn ? 'border-brand-200 bg-brand-50/30' : 'border-rose-200 bg-rose-50/30'
      }`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
          isOwn ? 'bg-brand-100' : 'bg-rose-100'
        }`}>
          {isOwn ? (
            <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
        <p className="text-sm font-semibold text-slate-700 mb-1">
          {isOwn ? 'No own brand projects yet' : 'No competitors tracked yet'}
        </p>
        <p className="text-xs text-slate-400 mb-4">
          {isOwn
            ? 'Create a project to start monitoring your brand mentions.'
            : 'Add a competitor project to benchmark against others.'}
        </p>
        <button
          onClick={onAdd}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors ${
            isOwn ? 'bg-brand-600 hover:bg-brand-700' : 'bg-rose-500 hover:bg-rose-600'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          {isOwn ? 'Add Own Brand' : 'Add Competitor'}
        </button>
      </div>
    )
  }

  function ProjectGrid({ list }: { list: Project[] }) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {list.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Projects</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {totalCount} monitoring project{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm -mt-2">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {loadingSkeletons}
          {loadingSkeletons}
        </div>
      ) : (
        <>
          {/* Own Brands section */}
          <div className="space-y-4">
            <SectionHeader label="Own Brands" count={ownProjects.length} type="own" />
            {ownProjects.length === 0
              ? <EmptySection type="own" onAdd={() => setShowCreate(true)} />
              : <ProjectGrid list={ownProjects} />
            }
          </div>

          {/* Competitors section */}
          <div className="space-y-4">
            <SectionHeader label="Competitors" count={competitorProjects.length} type="competitor" />
            {competitorProjects.length === 0
              ? <EmptySection type="competitor" onAdd={() => setShowCreate(true)} />
              : <ProjectGrid list={competitorProjects} />
            }
          </div>
        </>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
