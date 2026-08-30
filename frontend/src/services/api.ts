import axios from 'axios'
import type { Tier, NeedsReviewItem, ActivityItem, SignMasteryRow } from '../data/mockDashboard'
import type { CategoryProgress } from './dashboardData'

export const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true, // sends the httpOnly session cookie automatically
})

// If a protected data call comes back 401 (session expired mid-use), send the
// user to sign in. Guarded so we never loop while already on an auth page.
// The auth service (getMe) is intentionally NOT wrapped: a 401 there is the
// normal "not logged in yet" signal that AuthContext handles on load.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname
      const onAuthPage = ['/signin', '/verify-email', '/onboarding'].some((p) =>
        path.startsWith(p),
      )
      if (!onAuthPage) {
        window.location.assign('/signin')
      }
    }
    return Promise.reject(error)
  },
)

// ── Predict ──────────────────────────────────────────────────────────────────

export interface SignResult {
  sign:       string
  confidence: number
}

export interface MasteryInfo {
  sign_id:  string
  score:    number
  attempts: number
  tier:     number
}

export interface PredictResponse {
  top_sign:   string
  confidence: number
  correct:    boolean
  feedback:   'great' | 'okay' | 'retry'
  top3:       SignResult[]
  mastery:    MasteryInfo | null
}

export async function predictSign(
  sequence:    number[][],
  targetSign:  string,
  category:    string,
  responseMs:  number = 0,
): Promise<PredictResponse> {
  const { data } = await api.post('/predict', {
    sequence,
    target_sign: targetSign,
    category,
    response_ms: responseMs,
  })
  return data
}

// ── Session / Adaptive Engine ─────────────────────────────────────────────────

export interface NextSignResponse {
  sign:     string | null
  category: string | null
  mode:     'cold_start' | 'review' | 'new' | 'complete'
  mastery:  number | null
}

export async function getNextSign(): Promise<NextSignResponse> {
  const { data } = await api.get('/session/next')
  return data
}

export interface MasteryRow {
  sign_id:   string
  score:     number
  attempts:  number
  tier:      number
  last_seen: string | null
}

export async function getMastery(): Promise<{ signs: MasteryRow[]; total: number }> {
  const { data } = await api.get('/session/mastery')
  return data
}

// ── Progress history ──────────────────────────────────────────────────────────

export async function getProgressHistory(limit = 50) {
  const { data } = await api.get('/progress/history', { params: { limit } })
  return data
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
// Auth is cookie-based (see api instance above), so these calls don't take a
// userId — the backend resolves current_user from the session cookie.

// Wire shape differs slightly from mockDashboard.ts's DashboardStats
// (minutesPracticedEstimate vs minutesPracticed) — left un-named and mapped
// at the call site so we don't touch StatsHeader.tsx's existing prop type.
export interface DashboardSummary {
  stats: {
    signsMastered:            number
    dayStreak:                number
    minutesPracticedEstimate: number
    longestStreak:            number
    practicedToday:           boolean
  }
  xp: {
    total:          number
    currentLevelXp: number
    xpToNextLevel:  number
  }
  level: {
    current: number
    title:   string
  }
  categories: CategoryProgress[]
  masteryOverall: number
  tierBreakdown:  Record<Tier, number>
  needsReview:    NeedsReviewItem[]
  recentActivity: ActivityItem[]
  hasProgress:    boolean
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get('/dashboard/summary')
  const stats = data?.stats ?? {}
  const xp = data?.xp ?? {}
  const level = data?.level ?? {}
  return {
    stats: {
      signsMastered: Number(stats.signsMastered ?? stats.signs_mastered ?? 0),
      dayStreak: Number(stats.dayStreak ?? stats.day_streak ?? 0),
      minutesPracticedEstimate: Number(
        stats.minutesPracticedEstimate ?? stats.minutes_practiced_estimate ?? 0,
      ),
      longestStreak: Number(stats.longestStreak ?? stats.longest_streak ?? 0),
      practicedToday: Boolean(stats.practicedToday ?? stats.practiced_today),
    },
    xp: {
      total: Number(xp.total ?? 0),
      currentLevelXp: Number(xp.currentLevelXp ?? xp.current_level_xp ?? 0),
      xpToNextLevel: Number(xp.xpToNextLevel ?? xp.xp_to_next_level ?? 0),
    },
    level: {
      current: Number(level.current ?? 1),
      title: String(level.title ?? 'Novice'),
    },
    categories: (data?.categories ?? []).map((c: Record<string, unknown>) => ({
      name: String(c.name ?? ''),
      totalSigns: Number(c.totalSigns ?? c.total_signs ?? 0),
      completedSigns: Number(c.completedSigns ?? c.completed_signs ?? 0),
      badgeEarned: Boolean(c.badgeEarned ?? c.badge_earned),
    })),
    masteryOverall: Number(data?.masteryOverall ?? data?.mastery_overall ?? 0),
    tierBreakdown: data?.tierBreakdown ?? data?.tier_breakdown ?? {},
    needsReview: data?.needsReview ?? data?.needs_review ?? [],
    recentActivity: data?.recentActivity ?? data?.recent_activity ?? [],
    hasProgress: Boolean(data?.hasProgress ?? data?.has_progress),
  }
}

export interface SignsPageParams {
  search?:   string
  category?: string
  page?:     number
  pageSize?: number
}

export interface SignsPage {
  signs:      SignMasteryRow[]
  page:       number
  pageSize:   number
  total:      number
  totalPages: number
}

export async function getDashboardSigns(params: SignsPageParams = {}): Promise<SignsPage> {
  const { data } = await api.get('/dashboard/signs', {
    params: {
      search: params.search ?? '',
      category: params.category ?? '',
      page: params.page ?? 1,
      page_size: params.pageSize ?? 100,
    },
  })
  return {
    signs: data.signs ?? [],
    page: data.page ?? 1,
    pageSize: data.pageSize ?? data.page_size ?? 100,
    total: data.total ?? 0,
    totalPages: data.totalPages ?? data.total_pages ?? 1,
  }
}

// Auth lives in services/auth.ts — this app uses the passwordless OTP + Google
// cookie flow, not username/password. The old login()/register() helpers pointed
// at backend routes that do not exist and have been removed.