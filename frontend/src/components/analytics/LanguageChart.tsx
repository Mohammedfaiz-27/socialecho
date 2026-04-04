import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { LanguageItem } from '@/types'

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16']

const LANG_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese',
  it: 'Italian', ja: 'Japanese', zh: 'Chinese', ar: 'Arabic', hi: 'Hindi',
  ru: 'Russian', ko: 'Korean', nl: 'Dutch', tr: 'Turkish', unknown: 'Unknown',
}

interface Props { languages: LanguageItem[] }

export default function LanguageChart({ languages }: Props) {
  if (!languages.length) return (
    <p className="text-sm text-slate-400 text-center py-8">No language data</p>
  )
  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={languages} dataKey="count" nameKey="language" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
            {languages.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [v.toLocaleString(), 'Mentions']} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5">
        {languages.map((l, i) => (
          <div key={l.language} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-xs text-slate-600 flex-1 capitalize">
              {LANG_NAMES[l.language] ?? l.language}
            </span>
            <span className="text-xs font-semibold text-slate-700">{l.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
