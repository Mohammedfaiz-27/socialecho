import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { subDays, formatISO, format } from 'date-fns'
import { useAppSelector } from '@/hooks/useAppSelector'
import { analyticsService } from '@/services/analyticsService'
import clsx from 'clsx'

const PERIODS = [
  { label: 'Last 7 days',  days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

export default function AISummaryPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const currentProject = useAppSelector((s) => s.projects.currentProject)

  const [period, setPeriod] = useState(30)
  const [summary, setSummary] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null)

  const from = formatISO(subDays(new Date(), period))
  const to = formatISO(new Date())

  const generate = useCallback(async () => {
    if (!projectId || isLoading) return
    setIsLoading(true)
    setError(null)
    setSummary('')
    try {
      const result = await analyticsService.generateAiSummary(projectId, from, to)
      setSummary(result)
      setGeneratedAt(new Date())
    } catch {
      setError('Failed to generate summary. Please check your Gemini API key in the server .env file.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, from, to, isLoading])

  const paragraphs = summary.split('\n').filter((p) => p.trim().length > 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">AI Summary</h1>
            <span className="text-[10px] px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-bold tracking-wide">
              Gemini
            </span>
          </div>
          {currentProject && (
            <p className="text-sm text-slate-400">{currentProject.name}</p>
          )}
        </div>
      </div>

      {/* Config card */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Time Period</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {PERIODS.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => { setPeriod(days); setSummary(''); setError(null) }}
              className={clsx(
                'px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
                period === days
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <div className="flex-1 text-xs text-slate-400">
            Analyzing mentions from{' '}
            <span className="font-medium text-slate-600">
              {format(subDays(new Date(), period), 'MMM d, yyyy')}
            </span>
            {' '}to{' '}
            <span className="font-medium text-slate-600">{format(new Date(), 'MMM d, yyyy')}</span>
          </div>
          <button
            onClick={generate}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {summary ? 'Regenerate' : 'Generate Summary'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="card p-6 space-y-3 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-5/6" />
          <div className="h-4 bg-slate-200 rounded w-4/6" />
          <div className="h-4 bg-slate-100 rounded w-full mt-4" />
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
          <div className="h-4 bg-slate-200 rounded w-full mt-4" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
        </div>
      )}

      {/* Summary result */}
      {!isLoading && summary && (
        <div className="card p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                AI-Generated Analysis
              </span>
            </div>
            {generatedAt && (
              <span className="text-xs text-slate-400">
                Generated at {format(generatedAt, 'HH:mm, MMM d')}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="space-y-4">
            {paragraphs.map((para, i) => (
              <p key={i} className="text-sm text-slate-700 leading-relaxed">
                {para}
              </p>
            ))}
          </div>

          {/* Footer actions */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(summary)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy to clipboard
            </button>
            <button
              onClick={generate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !summary && !error && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-slate-700 font-semibold">Ready to analyze</p>
          <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
            Select a time period and click Generate Summary to get an AI-powered brand monitoring report.
          </p>
        </div>
      )}
    </div>
  )
}
