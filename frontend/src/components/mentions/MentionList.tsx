import { useState } from 'react'
import type { Mention } from '@/types'
import MentionCard from './MentionCard'
import MentionDetail from './MentionDetail'
import Pagination from '@/components/common/Pagination'

interface Props {
  mentions: Mention[]
  projectId: string
  isLoading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function MentionList({
  mentions,
  projectId,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: Props) {
  const [selected, setSelected] = useState<Mention | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
            <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-full mb-2" />
            <div className="h-3 bg-slate-100 rounded w-4/5" />
          </div>
        ))}
      </div>
    )
  }

  if (!mentions.length) {
    return (
      <div className="card p-12 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-slate-500 font-medium">No mentions found</p>
        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or date range.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {mentions.map((m) => (
          <MentionCard
            key={m.id}
            mention={m}
            projectId={projectId}
            onOpen={setSelected}
          />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />

      {selected && (
        <MentionDetail
          mention={selected}
          projectId={projectId}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
