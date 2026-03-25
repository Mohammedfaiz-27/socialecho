import { useEffect, useState } from 'react'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchProjects } from '@/store/slices/projectSlice'
import ProjectCard from '@/components/projects/ProjectCard'
import CreateProjectModal from '@/components/projects/CreateProjectModal'
import Pagination from '@/components/common/Pagination'

export default function ProjectsPage() {
  const dispatch = useAppDispatch()
  const { projects, isLoading, totalCount, page, pageSize } = useAppSelector((s) => s.projects)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    dispatch(fetchProjects({ page: 1, pageSize: 12 }))
  }, [dispatch])

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {totalCount} monitoring project{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + Add New Project
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects…"
          className="input max-w-xs"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-full mb-2" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-slate-600 font-medium text-lg">No projects yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-5">
            Create your first project to start monitoring your brand.
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            Create First Project
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => dispatch(fetchProjects({ page: p, pageSize }))}
          />
        </>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
