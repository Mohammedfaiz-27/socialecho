import type { SentimentType, SocialPlatform } from '@/types'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { setFilter, resetFilters } from '@/store/slices/filterSlice'
import clsx from 'clsx'

const SENTIMENT_OPTIONS: { value: SentimentType; label: string; color: string }[] = [
  { value: 'positive', label: 'Positive', color: 'text-green-600' },
  { value: 'negative', label: 'Negative', color: 'text-red-600' },
  { value: 'neutral',  label: 'Neutral',  color: 'text-slate-500' },
]

const SOURCE_OPTIONS: { value: SocialPlatform; label: string }[] = [
  { value: 'twitter',   label: 'X (Twitter)' },
  { value: 'facebook',  label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube',   label: 'YouTube' },
  { value: 'news',      label: 'Print News' },
  { value: 'blog',      label: 'Blogs' },
  { value: 'web',       label: 'Web News' },
]

const DATE_PRESETS = [
  { value: 'last_hour', label: 'Last hour' },
  { value: 'last_24h',  label: 'Last 24h' },
  { value: 'last_7d',   label: 'Last 7 days' },
  { value: 'last_30d',  label: 'Last 30 days' },
  { value: 'last_90d',  label: 'Last 90 days' },
  { value: 'last_year', label: 'Last year' },
] as const

export default function FilterPanel() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector((s) => s.filters.active)

  function toggleSentiment(value: SentimentType) {
    const next = filters.sentiments.includes(value)
      ? filters.sentiments.filter((s) => s !== value)
      : [...filters.sentiments, value]
    dispatch(setFilter({ key: 'sentiments', value: next }))
  }

  function toggleSource(value: SocialPlatform) {
    const next = filters.sources.includes(value)
      ? filters.sources.filter((s) => s !== value)
      : [...filters.sources, value]
    dispatch(setFilter({ key: 'sources', value: next }))
  }

  return (
    <aside className="w-56 shrink-0 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Filters</h3>
        <button
          onClick={() => dispatch(resetFilters())}
          className="text-xs text-brand-600 hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Date Range */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
          Date Range
        </p>
        <div className="space-y-1">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() =>
                dispatch(setFilter({ key: 'dateRange', value: { preset: preset.value } }))
              }
              className={clsx(
                'w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors',
                filters.dateRange.preset === preset.value
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sentiment */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
          Sentiment
        </p>
        <div className="space-y-1.5">
          {SENTIMENT_OPTIONS.map(({ value, label, color }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.sentiments.includes(value)}
                onChange={() => toggleSentiment(value)}
                className="w-3.5 h-3.5 rounded accent-brand-600"
              />
              <span className={clsx('text-sm', color)}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sources */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
          Sources
        </p>
        <div className="space-y-1.5">
          {SOURCE_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.sources.includes(value)}
                onChange={() => toggleSource(value)}
                className="w-3.5 h-3.5 rounded accent-brand-600"
              />
              <span className="text-sm text-slate-600">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Sort By</p>
        <select
          value={filters.sortBy}
          onChange={(e) =>
            dispatch(
              setFilter({
                key: 'sortBy',
                value: e.target.value as typeof filters.sortBy,
              })
            )
          }
          className="input text-sm"
        >
          <option value="relevance">Relevance</option>
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="engagement">Most engaged</option>
          <option value="reach">Highest reach</option>
        </select>
      </div>
    </aside>
  )
}
