import type { Tier } from '../data/mockDashboard'

export interface CategoryProgress {
  name: string
  totalSigns: number
  completedSigns: number
  badgeEarned: boolean
}

export interface DifficultyTierThreshold {
  name: Tier
  // Mastery % required in the PRECEDING tier to unlock this one. Ignored for
  // the first tier, which is always unlocked.
  requiredMasteryPercent: number
}

// Named constants — not a mock of user progress. Unlock thresholds stay here
// until the batch/tier curriculum (Phase 2) owns them.
export const DIFFICULTY_TIER_THRESHOLDS: DifficultyTierThreshold[] = [
  { name: 'Novice', requiredMasteryPercent: 0 },
  { name: 'Beginner', requiredMasteryPercent: 50 },
  { name: 'Intermediate', requiredMasteryPercent: 70 },
  { name: 'Advanced', requiredMasteryPercent: 70 },
  { name: 'Master', requiredMasteryPercent: 80 },
]

