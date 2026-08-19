import { useAuth } from '../contexts/AuthContext'
import { useDashboardSummary } from '../hooks/useDashboardSummary'
import { useDashboardSigns } from '../hooks/useDashboardSigns'
import DashboardShell from '../components/dashboard/DashboardShell'
import StatsHeader from '../components/dashboard/StatsHeader'
import MasteryDonut from '../components/dashboard/MasteryDonut'
import TierBreakdown from '../components/dashboard/TierBreakdown'
import NeedsReviewList from '../components/dashboard/NeedsReviewList'
import RecentActivityFeed from '../components/dashboard/RecentActivityFeed'
import SignMasteryTable from '../components/dashboard/SignMasteryTable'
import XPLevelCard from '../components/dashboard/XPLevelCard'
import StreakCounter from '../components/dashboard/StreakCounter'
import CategoryBadgeGrid from '../components/dashboard/CategoryBadgeGrid'
import DifficultyTierList, { type DifficultyTierEntry } from '../components/dashboard/DifficultyTierList'
import { TIERS, type DashboardStats, type TierProgress } from '../data/mockDashboard'
import { DIFFICULTY_TIER_THRESHOLDS } from '../services/dashboardData'

// ─── Loading / error placeholders ──────────────────────────────────────────
// The six dashboard components are pure presentational (props only, no
// loading/error awareness of their own), so in-flight and failed queries are
// represented at this level instead — as stand-ins that match each section's
// visual footprint, never as a flash of 0/empty real-shaped data.

function StatsHeaderPlaceholder({
  firstName,
  username,
  state,
}: {
  firstName?: string
  username?: string
  state: 'loading' | 'error'
}) {
  const displayName = username ? `@${username}` : firstName ?? 'SIGNER'
  return (
    <div style={{ background: '#1B2340', borderBottom: '4px solid #6D28D9' }}>
      <div
        style={{
          maxWidth: 1440, width: '100%', margin: '0 auto', padding: 40,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 32, flexWrap: 'wrap',
        }}
      >
        <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 22, color: '#ffffff', lineHeight: 1.5, margin: 0 }}>
          WELCOME BACK, {displayName.toUpperCase()}!
        </h1>
        {state === 'loading' ? (
          <span role="status" aria-live="polite" className="animate-pulse" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#D1D5DB' }}>
            Loading your stats…
          </span>
        ) : (
          <span role="alert" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#F87171' }}>
            Couldn&rsquo;t load your stats.
          </span>
        )}
      </div>
    </div>
  )
}

function CardPlaceholder({ title, accent, bg = '#ffffff', state }: { title: string; accent: string; bg?: string; state: 'loading' | 'error' }) {
  return (
    <div style={{ background: bg, border: '2px solid #14213D', boxShadow: '4px 4px 0px #14213D', padding: 24, height: '100%' }}>
      <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#14213D', margin: '0 0 8px' }}>{title}</h2>
      <div style={{ width: 48, height: 3, background: accent, marginBottom: 20 }} />
      {state === 'loading' ? (
        <span role="status" aria-live="polite" className="animate-pulse" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#6B7280' }}>
          Loading…
        </span>
      ) : (
        <p role="alert" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#DC2626', margin: 0 }}>
          Couldn&rsquo;t load this right now.
        </p>
      )}
    </div>
  )
}

// Stand-in for MasteryDonut when the user has zero Progress rows — an empty
// grey ring + em dash reads as "no data" without touching MasteryDonut.tsx,
// which has no notion of an undefined/no-data percent.
function NoDataMasteryDonut({ size = 140 }: { size?: number }) {
  const stroke = 16
  const radius = (size - stroke) / 2
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 22, color: '#9CA3AF' }}>—</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: 1, marginTop: 4 }}>
          MASTERY
        </span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const summaryQuery = useDashboardSummary()
  const signsQuery = useDashboardSigns()

  // ProtectedRoute guarantees a resolved, authenticated user before this
  // page renders, so no loading state or redirect is needed here. This guard
  // is purely a type-narrowing safety net.
  if (!user) return null

  const summary = summaryQuery.data
  const level = summary?.level
  const xp = summary?.xp
  const summaryStats = summary?.stats

  const stats: DashboardStats | undefined = summaryStats && {
    signsMastered: summaryStats.signsMastered,
    dayStreak: summaryStats.dayStreak,
    minutesPracticed: summaryStats.minutesPracticedEstimate,
  }

  const tierBreakdownData: TierProgress[] | undefined = summary
    ? TIERS.map((tier) => ({ tier, percent: summary.tierBreakdown[tier] ?? 0 }))
    : undefined

  const difficultyTierEntries: DifficultyTierEntry[] | undefined = tierBreakdownData
    ? DIFFICULTY_TIER_THRESHOLDS.map((threshold, i) => {
        const currentMasteryPercent = i === 0 ? 100 : tierBreakdownData[i - 1].percent
        return {
          name: threshold.name,
          requiredMasteryPercent: threshold.requiredMasteryPercent,
          currentMasteryPercent,
          unlocked: i === 0 || currentMasteryPercent >= threshold.requiredMasteryPercent,
        }
      })
    : undefined

  return (
    <DashboardShell>
        {stats ? (
          <StatsHeader firstName={user.first_name} username={user.username} stats={stats} />
        ) : (
          <StatsHeaderPlaceholder firstName={user.first_name} username={user.username} state={summaryQuery.isError ? 'error' : 'loading'} />
        )}

        <div className="dashboard-content">
          <div className="dashboard-grid-2">
            {level && xp ? (
              <XPLevelCard
                level={level.current}
                title={level.title}
                currentLevelXp={xp.currentLevelXp}
                xpToNextLevel={xp.xpToNextLevel}
                totalXp={xp.total}
              />
            ) : (
              <CardPlaceholder title="LEVEL" accent="#6D28D9" state={summaryQuery.isError ? 'error' : 'loading'} />
            )}
            {summaryStats ? (
              <StreakCounter
                currentDays={summaryStats.dayStreak}
                active={summaryStats.practicedToday}
                longestDays={summaryStats.longestStreak}
              />
            ) : (
              <CardPlaceholder title="STREAK" accent="#6D28D9" state={summaryQuery.isError ? 'error' : 'loading'} />
            )}
          </div>

          {summary?.categories ? (
            <CategoryBadgeGrid categories={summary.categories} />
          ) : (
            <CardPlaceholder title="CATEGORY BADGES" accent="#6D28D9" state={summaryQuery.isError ? 'error' : 'loading'} />
          )}

          {difficultyTierEntries ? (
            <DifficultyTierList tiers={difficultyTierEntries} />
          ) : (
            <CardPlaceholder title="DIFFICULTY TIERS" accent="#6D28D9" state={summaryQuery.isError ? 'error' : 'loading'} />
          )}

          <div className="dashboard-grid-2">
          {summary ? (
              <div style={{ background: '#ffffff', border: '2px solid #14213D', boxShadow: '4px 4px 0px #14213D', padding: 24 }}>
                <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#14213D', margin: '0 0 8px' }}>
                  OVERALL PROGRESS
                </h2>
                <div style={{ width: 48, height: 3, background: '#6D28D9', marginBottom: 20 }} />
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                  {summary.hasProgress ? <MasteryDonut percent={summary.masteryOverall} /> : <NoDataMasteryDonut />}
                  <p style={{ flex: 1, minWidth: 200, maxWidth: '60ch', fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                    {summary.hasProgress
                      ? "Keep practicing to raise your mastery score. Focus on ‘Needs Review’ signs to make the fastest progress."
                      : "You haven’t practiced any signs yet. Start a session to build your first mastery score."}
                  </p>
                </div>
              </div>
            ) : (
              <CardPlaceholder title="OVERALL PROGRESS" accent="#6D28D9" state={summaryQuery.isError ? 'error' : 'loading'} />
            )}

            {tierBreakdownData ? (
              <TierBreakdown data={tierBreakdownData} />
            ) : (
              <CardPlaceholder title="TIER BREAKDOWN" accent="#6D28D9" bg="#FEF7D6" state={summaryQuery.isError ? 'error' : 'loading'} />
            )}
          </div>

          <div className="dashboard-grid-2">
          {summary?.needsReview ? (
            <NeedsReviewList items={summary.needsReview} />
          ) : (
            <CardPlaceholder title="NEEDS REVIEW" accent="#DC2626" state={summaryQuery.isError ? 'error' : 'loading'} />
          )}

            {summary?.recentActivity ? (
            <RecentActivityFeed items={summary.recentActivity} />
            ) : (
              <CardPlaceholder title="RECENT ACTIVITY" accent="#6D28D9" state={summaryQuery.isError ? 'error' : 'loading'} />
            )}
          </div>

          {signsQuery.data ? (
            <SignMasteryTable rows={signsQuery.data} />
          ) : (
            <CardPlaceholder title="SIGN MASTERY" accent="#6D28D9" state={signsQuery.isError ? 'error' : 'loading'} />
          )}
        </div>
    </DashboardShell>
  )
}
