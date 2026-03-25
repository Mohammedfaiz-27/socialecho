import clsx from 'clsx'

interface Props {
  label: string
  value: string | number
  sub?: string
  trend?: number // positive = up, negative = down
  icon?: React.ReactNode
}

export default function MetricCard({ label, value, sub, trend, icon }: Props) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
            {icon}
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div
          className={clsx(
            'mt-3 flex items-center gap-1 text-xs font-medium',
            trend >= 0 ? 'text-green-600' : 'text-red-600'
          )}
        >
          <span>{trend >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend)}% vs last period</span>
        </div>
      )}
    </div>
  )
}
