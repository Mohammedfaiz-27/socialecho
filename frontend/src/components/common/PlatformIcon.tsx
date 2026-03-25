import type { SocialPlatform } from '@/types'
import clsx from 'clsx'

const PLATFORM_CONFIG: Record<
  SocialPlatform,
  { label: string; bg: string; text: string; letter: string }
> = {
  twitter:   { label: 'X',         bg: 'bg-black',      text: 'text-white',      letter: 'X' },
  facebook:  { label: 'Facebook',  bg: 'bg-blue-600',   text: 'text-white',      letter: 'f' },
  instagram: { label: 'Instagram', bg: 'bg-pink-500',   text: 'text-white',      letter: 'IG' },
  tiktok:    { label: 'TikTok',    bg: 'bg-slate-900',  text: 'text-white',      letter: 'TT' },
  youtube:   { label: 'YouTube',   bg: 'bg-red-600',    text: 'text-white',      letter: 'YT' },
  linkedin:  { label: 'LinkedIn',  bg: 'bg-blue-700',   text: 'text-white',      letter: 'in' },
  reddit:    { label: 'Reddit',    bg: 'bg-orange-500', text: 'text-white',      letter: 'r/' },
  telegram:  { label: 'Telegram',  bg: 'bg-sky-500',    text: 'text-white',      letter: 'TG' },
  bluesky:   { label: 'Bluesky',   bg: 'bg-sky-400',    text: 'text-white',      letter: 'BS' },
  news:      { label: 'News',      bg: 'bg-amber-500',  text: 'text-white',      letter: 'N' },
  blog:      { label: 'Blog',      bg: 'bg-emerald-500',text: 'text-white',      letter: 'B' },
  podcast:   { label: 'Podcast',   bg: 'bg-purple-600', text: 'text-white',      letter: 'P' },
  web:       { label: 'Web',       bg: 'bg-slate-500',  text: 'text-white',      letter: 'W' },
  other:     { label: 'Other',     bg: 'bg-slate-400',  text: 'text-white',      letter: '?' },
}

interface Props {
  platform: SocialPlatform
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function PlatformIcon({ platform, size = 'sm', showLabel = false }: Props) {
  const cfg = PLATFORM_CONFIG[platform] ?? PLATFORM_CONFIG.other
  const sizeClass =
    size === 'sm' ? 'w-6 h-6 text-[9px]' : size === 'md' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={clsx(
          'inline-flex items-center justify-center rounded-md font-bold shrink-0',
          cfg.bg,
          cfg.text,
          sizeClass
        )}
      >
        {cfg.letter}
      </span>
      {showLabel && (
        <span className="text-xs text-slate-600 font-medium">{cfg.label}</span>
      )}
    </span>
  )
}
