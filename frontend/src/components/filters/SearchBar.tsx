import { useRef } from 'react'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { setFilter } from '@/store/slices/filterSlice'

export default function SearchBar() {
  const dispatch = useAppDispatch()
  const search = useAppSelector((s) => s.filters.active.search)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(value: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      dispatch(setFilter({ key: 'search', value }))
    }, 300)
  }

  return (
    <div className="relative flex-1">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        defaultValue={search}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search mentions, authors, domains…"
        className="input pl-9"
      />
    </div>
  )
}
