import { categoryColor } from '../../data/mockDashboard'
import type { CategoryProgress } from '../../services/dashboardData'

interface CategoryBadgeGridProps {
  categories: CategoryProgress[]
}

export default function CategoryBadgeGrid({ categories }: CategoryBadgeGridProps) {
  return (
    <div style={{ background: '#ffffff', border: '2px solid #14213D', boxShadow: '4px 4px 0px #14213D', padding: 24 }}>
      <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#14213D', margin: '0 0 8px' }}>
        CATEGORY BADGES
      </h2>
      <div style={{ width: 48, height: 3, background: '#6D28D9', marginBottom: 20 }} />

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
        {categories.map((cat) => {
          const earned = cat.badgeEarned
          return (
            <li key={cat.name}>
              <div
                tabIndex={0}
                role="group"
                aria-label={`${cat.name} badge, ${earned ? 'earned' : 'locked'} — ${cat.completedSigns} of ${cat.totalSigns} signs completed`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  padding: '18px 12px',
                  background: earned ? categoryColor(cat.name) : '#F3F4F6',
                  border: '2px solid #14213D',
                  boxShadow: earned ? '4px 4px 0px #14213D' : 'none',
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.outline = '2px solid #6D28D9'; e.currentTarget.style.outlineOffset = '2px' }}
                onBlur={(e) => { e.currentTarget.style.outline = 'none' }}
              >
                <span aria-hidden="true" style={{ display: 'flex', opacity: earned ? 1 : 0.5 }}>
                  {earned ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17l-6.1 3.5 1.5-6.8L2.2 9l6.9-.7z" />
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="10" width="16" height="10" rx="1" />
                      <path d="M7 10V7a5 5 0 0 1 10 0v3" />
                    </svg>
                  )}
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: '#14213D', textTransform: 'uppercase', textAlign: 'center' }}>
                  {cat.name}
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: earned ? '#14213D' : '#6B7280' }}>
                  {earned ? 'EARNED' : `${cat.completedSigns}/${cat.totalSigns}`}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
