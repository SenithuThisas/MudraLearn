export interface TieredSign {
  name: string
  category: string
  has_clip: boolean
  recognizable: boolean
}

export type SignTier = 'has_clip' | 'practiceable_no_clip' | 'catalogue_only'

// Nesting is has_clip ⊆ recognizable ⊆ catalogue (DICTIONARY_CLIPS_AUDIT_2026-08-23.md),
// so this order is exhaustive: a clip implies recognizable, recognizable-but-no-clip is
// the middle tier, and everything else is catalogue-only.
export function getSignTier(sign: Pick<TieredSign, 'has_clip' | 'recognizable'>): SignTier {
  if (sign.has_clip) return 'has_clip'
  if (sign.recognizable) return 'practiceable_no_clip'
  return 'catalogue_only'
}

export const TIER_META: Record<SignTier, { label: string; badgeClass: string }> = {
  has_clip: { label: '▶ CLIP', badgeClass: 'bg-sticker-mint text-ink' },
  practiceable_no_clip: { label: '◐ PRACTICE', badgeClass: 'bg-sticker-yellow text-ink' },
  catalogue_only: { label: '◇ REFERENCE', badgeClass: 'bg-hairline text-muted' },
}
