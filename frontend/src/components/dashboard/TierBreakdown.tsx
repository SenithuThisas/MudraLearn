import type { TierProgress } from '../../data/mockDashboard'

interface TierBreakdownProps {
  data: TierProgress[]
}

export default function TierBreakdown({ data }: TierBreakdownProps) {
  return (
    <div style={{ background: '#FEF7D6', border: '2px solid #14213D', boxShadow: '4px 4px 0px #14213D', padding: 24, height: '100%' }}>
      <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#14213D', margin: '0 0 8px' }}>
        TIER BREAKDOWN
      </h2>
      <div style={{ width: 48, height: 3, background: '#6D28D9', marginBottom: 20 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {data.map((row) => (
          <div key={row.tier} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 90, fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: '#14213D', textTransform: 'uppercase' }}>
              {row.tier}
            </span>
            <div style={{ flex: 1, height: 18, background: '#ffffff', border: '2px solid #14213D' }}>
              <div style={{ width: `${row.percent}%`, height: '100%', background: '#6D28D9' }} />
            </div>
            <span style={{ width: 40, textAlign: 'right', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: '#14213D' }}>
              {row.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
