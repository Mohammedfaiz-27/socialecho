import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { SentimentBreakdown } from '@/types'

interface Props {
  breakdown: SentimentBreakdown
}

const COLORS = ['#22c55e', '#ef4444', '#94a3b8']

export default function SentimentChart({ breakdown }: Props) {
  const data = [
    { name: 'Positive', value: breakdown.positive, pct: breakdown.positivePercent },
    { name: 'Negative', value: breakdown.negative, pct: breakdown.negativePercent },
    { name: 'Neutral',  value: breakdown.neutral,  pct: breakdown.neutralPercent },
  ]

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Sentiment Distribution</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: { payload?: { pct: number } }) => [
              `${value.toLocaleString()} (${props.payload?.pct ?? 0}%)`,
              name,
            ]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="mt-2 grid grid-cols-3 gap-3 text-center border-t border-slate-100 pt-4">
        {data.map(({ name, pct }, idx) => (
          <div key={name}>
            <p className="text-lg font-bold" style={{ color: COLORS[idx] }}>
              {pct}%
            </p>
            <p className="text-xs text-slate-400">{name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
