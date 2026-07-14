import { useAuth } from '../contexts/AuthContext'
import SidebarNav from '../components/dashboard/SidebarNav'
import StatsHeader from '../components/dashboard/StatsHeader'
import MasteryDonut from '../components/dashboard/MasteryDonut'
import TierBreakdown from '../components/dashboard/TierBreakdown'
import NeedsReviewList from '../components/dashboard/NeedsReviewList'
import RecentActivityFeed from '../components/dashboard/RecentActivityFeed'
import SignMasteryTable from '../components/dashboard/SignMasteryTable'
import {
  mockStats,
  mockMasteryOverall,
  mockTierBreakdown,
  mockNeedsReview,
  mockRecentActivity,
  mockSignMastery,
} from '../data/mockDashboard'

export default function DashboardPage() {
  const { user } = useAuth()

  // ProtectedRoute guarantees a resolved, authenticated user before this
  // page renders, so no loading state or redirect is needed here. This guard
  // is purely a type-narrowing safety net.
  if (!user) return null

  return (
    <div className="dashboard-shell">
      <SidebarNav />

      <div className="dashboard-main">
        <StatsHeader firstName={user.first_name} username={user.username} stats={mockStats} />

        <div className="dashboard-content">
          <div className="dashboard-grid-2">
            <div style={{ background: '#ffffff', border: '2px solid #14213D', boxShadow: '4px 4px 0px #14213D', padding: 24 }}>
              <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#14213D', margin: '0 0 8px' }}>
                OVERALL PROGRESS
              </h2>
              <div style={{ width: 48, height: 3, background: '#6D28D9', marginBottom: 20 }} />
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <MasteryDonut percent={mockMasteryOverall} />
                <p style={{ flex: 1, minWidth: 200, fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                  You are almost halfway to full mastery of the current syllabus. Focus on
                  &lsquo;Needs Review&rsquo; signs to bump up your score.
                </p>
              </div>
            </div>

            <TierBreakdown data={mockTierBreakdown} />
          </div>

          <div className="dashboard-grid-2">
            <NeedsReviewList items={mockNeedsReview} />
            <RecentActivityFeed items={mockRecentActivity} />
          </div>

          <SignMasteryTable rows={mockSignMastery} />
        </div>
      </div>

      <style>{`
        .dashboard-shell {
          display: flex;
          min-height: 100vh;
          background: #F7F6F3;
          font-family: 'Inter', sans-serif;
        }
        .dashboard-main {
          flex: 1;
          min-width: 0;
        }
        .dashboard-content {
          padding: 32px 40px 60px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .dashboard-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: stretch;
        }
        @media (max-width: 900px) {
          .dashboard-shell {
            flex-direction: column;
          }
          .dashboard-content {
            padding: 24px 20px 40px;
          }
          .dashboard-grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
