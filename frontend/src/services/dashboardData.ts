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

export interface DashboardGamificationData {
  xp: {
    total: number
    currentLevelXp: number
    xpToNextLevel: number
  }
  level: {
    current: number
    title: string
  }
  // dayStreak itself is real (see DashboardPage, sourced from
  // useDashboardSummary) — these two fields have no backend equivalent yet,
  // so StreakCounter renders them as explicitly-labeled estimates.
  streakExtras: {
    active: boolean
    longestDays: number
  }
  categories: CategoryProgress[]
  difficultyTiers: DifficultyTierThreshold[]
}

const mockGamificationData: DashboardGamificationData = {
  xp: { total: 3240, currentLevelXp: 340, xpToNextLevel: 660 },
  level: { current: 7, title: 'Sign Apprentice' },
  streakExtras: { active: true, longestDays: 21 },
  categories: [
    { name: 'Basics', totalSigns: 40, completedSigns: 40, badgeEarned: true },
    { name: 'Numbers', totalSigns: 20, completedSigns: 20, badgeEarned: true },
    { name: 'Family', totalSigns: 30, completedSigns: 22, badgeEarned: false },
    { name: 'Places', totalSigns: 35, completedSigns: 10, badgeEarned: false },
    { name: 'Professions', totalSigns: 25, completedSigns: 3, badgeEarned: false },
  ],
  difficultyTiers: [
    { name: 'Novice', requiredMasteryPercent: 0 },
    { name: 'Beginner', requiredMasteryPercent: 50 },
    { name: 'Intermediate', requiredMasteryPercent: 70 },
    { name: 'Advanced', requiredMasteryPercent: 70 },
    { name: 'Master', requiredMasteryPercent: 80 },
  ],
}

export function getDashboardGamificationData(): DashboardGamificationData {
  return mockGamificationData
}
