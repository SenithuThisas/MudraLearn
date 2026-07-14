import type { ActivityItem } from '../../data/mockDashboard'

interface RecentActivityFeedProps {
  items: ActivityItem[]
}

export default function RecentActivityFeed({ items }: RecentActivityFeedProps) {
  return (
    <div style={{ background: '#ffffff', border: '2px solid #14213D', boxShadow: '4px 4px 0px #14213D', padding: 24, height: '100%' }}>
      <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#14213D', margin: '0 0 8px' }}>
        RECENT ACTIVITY
      </h2>
      <div style={{ width: 48, height: 3, background: '#6D28D9', marginBottom: 20 }} />

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((item, i) => (
          <div key={item.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span
                style={{
                  width: 10, height: 10, flexShrink: 0, marginTop: 4,
                  background: item.type === 'mastered' ? '#6D28D9' : '#A8F0CE',
                  border: '2px solid #14213D',
                }}
              />
              {i < items.length - 1 && <span style={{ flex: 1, width: 2, background: '#E5E7EB', minHeight: 24 }} />}
            </div>
            <div style={{ paddingBottom: 18 }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: '#14213D', margin: 0 }}>
                {item.type === 'mastered' ? `Mastered "${item.sign}"` : `Practiced "${item.sign}"`}
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
                {item.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.5 }}>
        VIEW FULL HISTORY →
      </span>
    </div>
  )
}
