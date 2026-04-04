import clsx from 'clsx'

interface Props {
  label: string
  value: string | number
  sub?: string
  trend?: number
  icon?: React.ReactNode
  accent?: 'blue' | 'green' | 'red' | 'purple' | 'amber'
}

const ACCENT = {
  blue:   { bar: 'bg-brand-500',  icon: 'bg-brand-50 text-brand-600' },
  green:  { bar: 'bg-emerald-500', icon: 'bg-emerald-50 text-emerald-600' },
  red:    { bar: 'bg-red-500',    icon: 'bg-red-50 text-red-600' },
  purple: { bar: 'bg-purple-500', icon: 'bg-purple-50 text-purple-600' },
  amber:  { bar: 'bg-amber-500',  icon: 'bg-amber-50 text-amber-600' },
}

export default function MetricCard({ label, value, sub, trend, icon, accent = 'blue' }: Props) {
  const a = ACCENT[accent]
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
      {/* Top accent bar */}
      <div className={clsx('h-1 w-full', a.bar)} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">{label}</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums leading-none">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
          {icon && (
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg', a.icon)}>
              {icon}
            </div>
          )}
        </div>
        {trend !== undefined && (
          <div className={clsx(
            'mt-3 flex items-center gap-1 text-xs font-semibold',
            trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-slate-400'
          )}>
            {trend > 0 ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : trend < 0 ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
              </svg>
            )}
            <span>{Math.abs(trend)}% vs prev period</span>
          </div>
        )}
      </div>
    </div>
  )
}
