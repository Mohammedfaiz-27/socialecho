import type { WordCloudItem } from '@/types'

interface Props { words: WordCloudItem[] }

const COLORS = [
  'text-brand-600','text-violet-600','text-emerald-600','text-amber-600',
  'text-rose-500','text-sky-600','text-indigo-600','text-teal-600',
]

export default function WordCloud({ words }: Props) {
  if (!words.length) return (
    <p className="text-sm text-slate-400 text-center py-8">No text data for this period</p>
  )
  const max = words[0].count
  return (
    <div className="flex flex-wrap gap-2 items-center justify-center py-2">
      {words.map(({ word, count }, i) => {
        const ratio = count / max
        const size = ratio > 0.7 ? 'text-2xl' : ratio > 0.4 ? 'text-xl' : ratio > 0.2 ? 'text-base' : ratio > 0.1 ? 'text-sm' : 'text-xs'
        const weight = ratio > 0.5 ? 'font-bold' : ratio > 0.2 ? 'font-semibold' : 'font-medium'
        const color = COLORS[i % COLORS.length]
        return (
          <span
            key={word}
            className={`${size} ${weight} ${color} opacity-80 hover:opacity-100 transition-opacity cursor-default`}
            title={`${count} mention${count !== 1 ? 's' : ''}`}
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}
