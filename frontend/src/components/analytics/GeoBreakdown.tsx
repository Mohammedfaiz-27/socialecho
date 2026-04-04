import type { GeoItem } from '@/types'

const FLAG: Record<string, string> = {
  'United States': '🇺🇸', 'USA': '🇺🇸', 'UK': '🇬🇧', 'United Kingdom': '🇬🇧',
  'India': '🇮🇳', 'Canada': '🇨🇦', 'Australia': '🇦🇺', 'Germany': '🇩🇪',
  'France': '🇫🇷', 'Brazil': '🇧🇷', 'Japan': '🇯🇵', 'China': '🇨🇳',
  'Russia': '🇷🇺', 'Mexico': '🇲🇽', 'Spain': '🇪🇸', 'Italy': '🇮🇹',
  'South Korea': '🇰🇷', 'Netherlands': '🇳🇱', 'Turkey': '🇹🇷', 'Saudi Arabia': '🇸🇦',
  'UAE': '🇦🇪', 'Singapore': '🇸🇬', 'Indonesia': '🇮🇩', 'Pakistan': '🇵🇰',
  'Nigeria': '🇳🇬', 'South Africa': '🇿🇦', 'Argentina': '🇦🇷', 'Egypt': '🇪🇬',
}

interface Props { geo: GeoItem[] }

export default function GeoBreakdown({ geo }: Props) {
  if (!geo.length) return (
    <div className="text-center py-8">
      <p className="text-sm text-slate-400">No geolocation data yet</p>
      <p className="text-xs text-slate-300 mt-1">Geo data populates as mentions with location info are collected</p>
    </div>
  )
  return (
    <div className="space-y-2.5">
      {geo.map((g, i) => (
        <div key={g.country} className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400 w-4 tabular-nums">{i + 1}</span>
          <span className="text-lg w-6 text-center">{FLAG[g.country] ?? '🌐'}</span>
          <span className="text-sm text-slate-700 flex-1 font-medium">{g.country}</span>
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-400 rounded-full" style={{ width: `${g.percent}%` }} />
          </div>
          <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{g.percent}%</span>
          <span className="text-xs text-slate-400 tabular-nums w-10 text-right">{g.count.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}
