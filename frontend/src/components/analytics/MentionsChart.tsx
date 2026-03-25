import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type { TimeSeriesPoint } from '@/types'
import { format } from 'date-fns'

interface Props {
  mentionsTrend: TimeSeriesPoint[]
  reachTrend: TimeSeriesPoint[]
}

export default function MentionsChart({ mentionsTrend, reachTrend }: Props) {
  const data = mentionsTrend.map((m, i) => ({
    date: format(new Date(m.date), 'MMM d'),
    mentions: m.value,
    reach: reachTrend[i]?.value ?? 0,
  }))

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Mentions & Reach</h3>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="mentions"
            orientation="left"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="reach"
            orientation="right"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar
            yAxisId="mentions"
            dataKey="mentions"
            fill="#e0e7ff"
            radius={[3, 3, 0, 0]}
            name="Mentions"
          />
          <Line
            yAxisId="reach"
            type="monotone"
            dataKey="reach"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            name="Reach"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
