import type { MouseEvent } from 'react'
import { getSignTier, TIER_META } from '../utils/signTiers'

interface SignCardProps {
  name: string
  category: string
  has_clip: boolean
  recognizable: boolean
  onOpen: (e: MouseEvent<HTMLButtonElement>) => void
}

export default function SignCard({ name, category, has_clip, recognizable, onOpen }: SignCardProps) {
  const tier = getSignTier({ has_clip, recognizable })
  const { label, badgeClass } = TIER_META[tier]

  return (
    <button
      type='button'
      onClick={onOpen}
      className='flex w-full flex-col items-start gap-2 border-2 border-ink bg-white p-3 text-left shadow-hard-sm transition-[transform,box-shadow] duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
    >
      <span className={`border border-ink px-1.5 py-0.5 font-pixel text-[8px] leading-4 ${badgeClass}`}>
        {label}
      </span>
      <span className='font-pixel text-[9px] uppercase leading-4 tracking-wide text-muted'>
        {category}
      </span>
      <span className='font-body text-sm font-semibold text-ink'>{name}</span>
    </button>
  )
}