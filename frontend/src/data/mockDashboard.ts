export interface DashboardStats {
  signsMastered: number
  dayStreak: number
  minutesPracticed: number
}

export type Tier = 'Novice' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Master'

export interface TierProgress {
  tier: Tier
  percent: number // 0-100
}

export interface NeedsReviewItem {
  sign: string
  category: string
  mastery: number // 0-100
}

export interface ActivityItem {
  id: string
  type: 'practiced' | 'mastered'
  sign: string
  timestamp: string
}

export interface SignMasteryRow {
  sign: string
  category: string
  tier: Tier
  mastery: number // 0-100
}

export const TIERS: Tier[] = ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Master']

const CATEGORY_COLORS = ['#FBE24A', '#A8F0CE', '#F9A8C4']

export function categoryColor(category: string): string {
  let hash = 0
  for (let i = 0; i < category.length; i++) hash = (hash + category.charCodeAt(i)) % CATEGORY_COLORS.length
  return CATEGORY_COLORS[hash]
}

export const mockStats: DashboardStats = {
  signsMastered: 124,
  dayStreak: 12,
  minutesPracticed: 45,
}

export const mockMasteryOverall = 47

export const mockTierBreakdown: TierProgress[] = [
  { tier: 'Novice', percent: 100 },
  { tier: 'Beginner', percent: 85 },
  { tier: 'Intermediate', percent: 40 },
  { tier: 'Advanced', percent: 0 },
  { tier: 'Master', percent: 0 },
]

export const mockNeedsReview: NeedsReviewItem[] = [
  { sign: 'Family', category: 'Basics', mastery: 22 },
  { sign: 'Hospital', category: 'Places', mastery: 18 },
  { sign: 'Doctor', category: 'Professions', mastery: 15 },
]

export const mockRecentActivity: ActivityItem[] = [
  { id: '1', type: 'mastered', sign: 'School', timestamp: '2 hours ago' },
  { id: '2', type: 'practiced', sign: 'Numbers 1-10', timestamp: 'Yesterday' },
  { id: '3', type: 'practiced', sign: 'Colours', timestamp: 'Yesterday' },
  { id: '4', type: 'practiced', sign: 'Family', timestamp: '3 days ago' },
  { id: '5', type: 'mastered', sign: 'Greetings', timestamp: '1 week ago' },
]

export const mockSignMastery: SignMasteryRow[] = [
  { sign: 'Hello', category: 'Basics', tier: 'Novice', mastery: 100 },
  { sign: 'Thank You', category: 'Basics', tier: 'Novice', mastery: 95 },
  { sign: 'Mother', category: 'Family', tier: 'Beginner', mastery: 82 },
  { sign: 'Father', category: 'Family', tier: 'Beginner', mastery: 74 },
  { sign: 'House', category: 'Places', tier: 'Intermediate', mastery: 48 },
  { sign: 'School', category: 'Places', tier: 'Intermediate', mastery: 35 },
  { sign: 'Numbers 1-10', category: 'Numbers', tier: 'Advanced', mastery: 60 },
  { sign: 'Colours', category: 'Basics', tier: 'Beginner', mastery: 68 },
  { sign: 'Doctor', category: 'Professions', tier: 'Novice', mastery: 15 },
  { sign: 'Hospital', category: 'Places', tier: 'Novice', mastery: 18 },
  { sign: 'Family', category: 'Basics', tier: 'Novice', mastery: 22 },
  { sign: 'Greetings', category: 'Basics', tier: 'Master', mastery: 91 },
]
