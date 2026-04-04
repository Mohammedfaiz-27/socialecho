import { useState } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, addMonths, subMonths, isSameDay,
  isBefore, isWithinInterval, isSameMonth,
} from 'date-fns'

interface Props {
  from: Date | null
  to: Date | null
  onChange: (from: Date, to: Date) => void
  onClose: () => void
}

export default function DateRangePicker({ from, to, onChange, onClose }: Props) {
  const [viewMonth, setViewMonth] = useState(subMonths(new Date(), 1))
  const [hovered, setHovered] = useState<Date | null>(null)
  const [selecting, setSelecting] = useState<Date | null>(null)

  const nextMonth = addMonths(viewMonth, 1)

  function buildCalendar(month: Date) {
    const start = startOfWeek(startOfMonth(month))
    const end = endOfWeek(endOfMonth(month))
    return eachDayOfInterval({ start, end })
  }

  function handleDay(day: Date) {
    if (!selecting) {
      setSelecting(day)
    } else {
      const [s, e] = isBefore(day, selecting) ? [day, selecting] : [selecting, day]
      onChange(s, e)
      setSelecting(null)
      onClose()
    }
  }

  function dayClass(day: Date, month: Date) {
    const isFrom = from && isSameDay(day, selecting ?? from)
    const isTo   = to && !selecting && isSameDay(day, to)
    const inRange = from && to && !selecting && isWithinInterval(day, { start: from, end: to })
    const inHover = selecting && hovered && isWithinInterval(day, {
      start: isBefore(selecting, hovered) ? selecting : hovered,
      end:   isBefore(selecting, hovered) ? hovered   : selecting,
    })
    const isToday = isSameDay(day, new Date())
    const outside = !isSameMonth(day, month)

    let base = 'w-8 h-8 flex items-center justify-center text-xs rounded-full cursor-pointer transition-colors '
    if (outside)         base += 'text-slate-300 '
    else if (isFrom || isTo) base += 'bg-brand-600 text-white font-bold '
    else if (inRange || inHover) base += 'bg-brand-100 text-brand-700 '
    else if (isToday)    base += 'ring-1 ring-brand-400 text-slate-700 hover:bg-brand-50 '
    else                 base += 'text-slate-700 hover:bg-slate-100 '
    return base
  }

  const DOW = ['Su','Mo','Tu','We','Th','Fr','Sa']

  function CalMonth({ month }: { month: Date }) {
    const days = buildCalendar(month)
    return (
      <div className="w-52">
        <p className="text-xs font-semibold text-slate-700 text-center mb-3">
          {format(month, 'MMMM yyyy')}
        </p>
        <div className="grid grid-cols-7 mb-1">
          {DOW.map((d) => <div key={d} className="text-[10px] text-slate-400 text-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {days.map((day) => (
            <div key={day.toISOString()} className="flex justify-center">
              <div
                className={dayClass(day, month)}
                onClick={() => handleDay(day)}
                onMouseEnter={() => setHovered(day)}
                onMouseLeave={() => setHovered(null)}
              >
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="absolute z-50 top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewMonth(subMonths(viewMonth, 1))} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="flex gap-6">
        <CalMonth month={viewMonth} />
        <CalMonth month={nextMonth} />
      </div>
      <p className="text-xs text-slate-400 text-center mt-3">
        {selecting ? 'Click end date' : 'Click start date'}
      </p>
    </div>
  )
}
