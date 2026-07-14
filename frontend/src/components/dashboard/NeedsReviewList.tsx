import { useNavigate } from 'react-router-dom'
import { categoryColor, type NeedsReviewItem } from '../../data/mockDashboard'

interface NeedsReviewListProps {
  items: NeedsReviewItem[]
}

export default function NeedsReviewList({ items }: NeedsReviewListProps) {
  const navigate = useNavigate()

  return (
    <div style={{ background: '#ffffff', border: '2px solid #14213D', boxShadow: '4px 4px 0px #14213D', padding: 24, height: '100%' }}>
      <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#14213D', margin: '0 0 8px' }}>
        NEEDS REVIEW
      </h2>
      <div style={{ width: 48, height: 3, background: '#DC2626', marginBottom: 20 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {items.length === 0 && (
          <p style={{ padding: '24px 0', textAlign: 'center', color: '#6B7280', fontFamily: "'Inter', sans-serif", fontSize: 14, margin: 0 }}>
            Nothing needs review yet — start practicing to build your first scores!
          </p>
        )}
        {items.map((item) => (
          <div key={item.sign} style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700, color: '#14213D' }}>{item.sign}</span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', background: categoryColor(item.category), border: '1px solid #14213D' }}>
                  {item.category}
                </span>
              </div>
              <div style={{ height: 8, width: 140, background: '#F3F4F6', border: '1px solid #14213D' }}>
                <div style={{ width: `${item.mastery}%`, height: '100%', background: '#DC2626' }} />
              </div>
            </div>
            <button
              onClick={() => navigate('/practice')}
              style={{
                background: '#14213D', color: '#ffffff', border: '2px solid #14213D', padding: '8px 16px',
                fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              PRACTICE NOW
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
