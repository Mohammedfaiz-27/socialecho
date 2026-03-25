import clsx from 'clsx'

interface Props {
  score: number // 0–10
  showBar?: boolean
  size?: 'sm' | 'md'
}

function scoreColor(score: number) {
  if (score >= 8) return 'text-purple-700'
  if (score >= 6) return 'text-brand-700'
  if (score >= 4) return 'text-amber-600'
  return 'text-slate-500'
}

function barColor(score: number) {
  if (score >= 8) return 'bg-purple-500'
  if (score >= 6) return 'bg-brand-500'
  if (score >= 4) return 'bg-amber-400'
  return 'bg-slate-300'
}

export default function InfluenceScore({ score, showBar = true, size = 'sm' }: Props) {
  const clamped = Math.min(10, Math.max(0, score))
  return (
    <div className={clsx('flex items-center gap-1.5', size === 'sm' ? 'text-xs' : 'text-sm')}>
      <span className={clsx('font-semibold tabular-nums', scoreColor(clamped))}>
        {clamped.toFixed(1)}
      </span>
      {showBar && (
        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all', barColor(clamped))}
            style={{ width: `${(clamped / 10) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
