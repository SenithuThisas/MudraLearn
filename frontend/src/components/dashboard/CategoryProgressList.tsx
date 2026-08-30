import { categoryColor } from '../../data/mockDashboard'
import type { CategoryProgress } from '../../services/dashboardData'

interface CategoryProgressListProps {
  categories: CategoryProgress[]
}

export default function CategoryProgressList({ categories }: CategoryProgressListProps) {
  const sorted = [...categories].sort((a, b) => {
    const percentA = a.totalSigns > 0 ? a.completedSigns / a.totalSigns : 0
    const percentB = b.totalSigns > 0 ? b.completedSigns / b.totalSigns : 0
    return percentB - percentA
  })

  return (
    <div style={{ background: '#ffffff', border: '2px solid #14213D', boxShadow: '4px 4px 0px #14213D', padding: 24 }}>
      <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#14213D', margin: '0 0 8px' }}>
        CATEGORY PROGRESS
      </h2>
      <div style={{ width: 48, height: 3, background: '#6D28D9', marginBottom: 20 }} />

      <ul
        style={{
          listStyle: 'none', margin: 0, padding: 0,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          columnGap: 32, rowGap: 12,
        }}
      >
        {sorted.map((cat) => {
          const percent = cat.totalSigns > 0 ? Math.round((cat.completedSigns / cat.totalSigns) * 100) : 0
          const color = categoryColor(cat.name)
          return (
            <li
              key={cat.name}
              aria-label={`${cat.name}, ${cat.badgeEarned ? 'badge earned' : 'in progress'} — ${cat.completedSigns} of ${cat.totalSigns} signs completed`}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <span aria-hidden="true" style={{ display: 'flex', flexShrink: 0 }}>
                {cat.badgeEarned ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17l-6.1 3.5 1.5-6.8L2.2 9l6.9-.7z" />
                  </svg>
                ) : (
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, display: 'block' }} />
                )}
              </span>
              <span
                style={{
                  width: 96, flexShrink: 0, fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700,
                  color: '#14213D', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                {cat.name}
              </span>
              <div style={{ flex: 1, height: 10, background: '#F3F4F6', border: '2px solid #14213D' }}>
                <div style={{ width: `${percent}%`, height: '100%', background: color }} />
              </div>
              <span style={{ width: 52, flexShrink: 0, textAlign: 'right', fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                {cat.completedSigns}/{cat.totalSigns}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
