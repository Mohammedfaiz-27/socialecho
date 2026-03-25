import type { SentimentType } from '@/types'
import clsx from 'clsx'

interface Props {
  sentiment: SentimentType
  confidence?: number
  size?: 'sm' | 'md'
}

const config: Record<SentimentType, { label: string; className: string; dot: string }> = {
  positive: {
    label: 'Positive',
    className: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
  },
  negative: {
    label: 'Negative',
    className: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
  neutral: {
    label: 'Neutral',
    className: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
  },
}

export default function SentimentBadge({ sentiment, confidence, size = 'sm' }: Props) {
  const { label, className, dot } = config[sentiment]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium',
        className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
      title={confidence !== undefined ? `${confidence}% confidence` : undefined}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', dot)} />
      {label}
      {confidence !== undefined && (
        <span className="opacity-60 text-[10px]">{confidence}%</span>
      )}
    </span>
  )
}
