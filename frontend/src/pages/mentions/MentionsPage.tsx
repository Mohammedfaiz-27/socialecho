import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchMentions } from '@/store/slices/mentionSlice'
import { fetchProject } from '@/store/slices/projectSlice'
import MentionList from '@/components/mentions/MentionList'
import FilterPanel from '@/components/filters/FilterPanel'
import SearchBar from '@/components/filters/SearchBar'
import { useSocket } from '@/hooks/useSocket'

export default function MentionsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const dispatch = useAppDispatch()
  const { mentions, isLoading, totalCount, totalPages, page, pageSize } = useAppSelector(
    (s) => s.mentions
  )
  const filters = useAppSelector((s) => s.filters.active)

  useSocket(projectId ?? null)

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProject(projectId))
      dispatch(fetchMentions({ projectId, filters, page: 1, pageSize: 25 }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, dispatch])

  useEffect(() => {
    if (projectId) {
      dispatch(fetchMentions({ projectId, filters, page: 1, pageSize }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  function handlePageChange(newPage: number) {
    if (projectId) {
      dispatch(fetchMentions({ projectId, filters, page: newPage, pageSize }))
    }
  }

  return (
    <div className="flex gap-5">
      {/* Left: filter panel */}
      <FilterPanel />

      {/* Right: mentions */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          <SearchBar />
          <span className="text-sm text-slate-500 shrink-0">
            {totalCount.toLocaleString()} mentions
          </span>
        </div>

        <MentionList
          mentions={mentions}
          projectId={projectId!}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}
