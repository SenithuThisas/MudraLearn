import { useNavigate } from 'react-router-dom'
import PixelButton from '../auth/PixelButton'
import type { DashboardStats } from '../../data/mockDashboard'

interface StatsHeaderProps {
  firstName?: string
  username?: string
  stats: DashboardStats
}

function StatCard({ value, label, bg, color }: { value: string | number; label: string; bg: string; color: string }) {
  return (
    <div style={{ background: bg, border: '2px solid #14213D', boxShadow: '4px 4px 0px #14213D', padding: '14px 20px', minWidth: 120 }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 22, color, marginBottom: 6 }}>{value}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: '#14213D', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
    </div>
  )
}

export default function StatsHeader({ firstName, username, stats }: StatsHeaderProps) {
  const navigate = useNavigate()
  const displayName = username ? `@${username}` : firstName ?? 'SIGNER'

  return (
    <div className="dashboard-stats-header">
      <div style={{ maxWidth: 460 }}>
        <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 22, color: '#ffffff', lineHeight: 1.5, margin: '0 0 16px' }}>
          WELCOME BACK, {displayName.toUpperCase()}!
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#D1D5DB', margin: '0 0 20px', lineHeight: 1.6 }}>
          Here's where you left off. Keep going. Consistency is the key to mastery.
        </p>
        <PixelButton variant="primary" onClick={() => navigate('/practice')}>
          JUMP BACK IN →
        </PixelButton>
      </div>

      <div className="dashboard-stats-cards">
        <StatCard value={stats.signsMastered} label="Signs Mastered" bg="#ffffff" color="#6D28D9" />
        <StatCard value={stats.dayStreak} label="Day Streak" bg="#FBE24A" color="#14213D" />
        <StatCard value={stats.minutesPracticed} label="Mins Practiced" bg="#A8F0CE" color="#14213D" />
      </div>

      <style>{`
        .dashboard-stats-header {
          background: #1B2340;
          padding: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 32px;
          flex-wrap: wrap;
          border-bottom: 4px solid #6D28D9;
        }
        .dashboard-stats-cards {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        @media (max-width: 900px) {
          .dashboard-stats-header {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  )
}
