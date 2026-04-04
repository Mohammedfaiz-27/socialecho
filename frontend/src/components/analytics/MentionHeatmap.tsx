import { useMemo } from 'react'
import { format, eachWeekOfInterval, subDays } from 'date-fns'
import type { HeatmapDay } from '@/types'

interface Props { days: HeatmapDay[] }

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getColor(count: number, max: number): string {
  if (count === 0) return 'bg-slate-100 dark:bg-slate-800'
  const ratio = count / max
  if (ratio > 0.75) return 'bg-brand-600'
  if (ratio > 0.5)  return 'bg-brand-400'
  if (ratio > 0.25) return 'bg-brand-300'
  return 'bg-brand-200'
}

export default function MentionHeatmap({ days }: Props) {
  const { weeks, max, monthLabels } = useMemo(() => {
    const countMap = new Map(days.map((d) => [d.date, d.count]))
    const max = Math.max(...days.map((d) => d.count), 1)

    const to = new Date()
    const from = subDays(to, 364)
    const weekStarts = eachWeekOfInterval({ start: from, end: to })

    const weeks = weekStarts.map((weekStart) =>
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart.getTime() + i * 86400000)
        const key = format(date, 'yyyy-MM-dd')
        return { date: key, count: countMap.get(key) ?? 0, future: date > to }
      })
    )

    // Month labels — find first week each month appears
    const monthLabels: { label: string; col: number }[] = []
    let lastMonth = -1
    weeks.forEach((week, col) => {
      const month = new Date(week[0].date).getMonth()
      if (month !== lastMonth) {
        monthLabels.push({ label: MONTHS[month], col })
        lastMonth = month
      }
    })

    return { weeks, max, monthLabels }
  }, [days])

  return (
    <div className="overflow-x-auto">
      {/* Month labels */}
      <div className="flex mb-1 ml-8">
        {monthLabels.map(({ label, col }) => (
          <div
            key={`${label}-${col}`}
            className="text-[10px] text-slate-400 absolute"
            style={{ left: `${col * 14 + 32}px`, position: 'relative', minWidth: 0 }}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {DAYS.map((d, i) => (
            <div key={d} className="h-3 text-[9px] text-slate-400 flex items-center" style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}>
              {d}
            </div>
          ))}
        </div>
        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={cell.future ? '' : `${cell.date}: ${cell.count} mention${cell.count !== 1 ? 's' : ''}`}
                className={`w-3 h-3 rounded-sm ${cell.future ? 'opacity-0' : getColor(cell.count, max)} transition-colors`}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[10px] text-slate-400">Less</span>
        {['bg-slate-100','bg-brand-200','bg-brand-300','bg-brand-400','bg-brand-600'].map((c) => (
          <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-[10px] text-slate-400">More</span>
      </div>
    </div>
  )
}
