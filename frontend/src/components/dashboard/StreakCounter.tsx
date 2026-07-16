interface StreakCounterProps {
  currentDays: number
  active: boolean
  longestDays: number
}

export default function StreakCounter({ currentDays, active, longestDays }: StreakCounterProps) {
  return (
    <div style={{ background: active ? '#A8F0CE' : '#ffffff', border: '2px solid #14213D', boxShadow: '4px 4px 0px #14213D', padding: 24, height: '100%' }}>
      <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#14213D', margin: '0 0 8px' }}>
        STREAK
      </h2>
      <div style={{ width: 48, height: 3, background: '#6D28D9', marginBottom: 20 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span aria-hidden="true" style={{ display: 'flex', flexShrink: 0, opacity: active ? 1 : 0.4 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
        </span>
        <div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 28, color: '#14213D' }}>{currentDays}</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: '#14213D', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Day{currentDays === 1 ? '' : 's'} Streak
          </div>
        </div>
      </div>

      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: active ? '#14213D' : '#6B7280', margin: '16px 0 0' }}>
        {active ? 'Practiced today — keep it going!' : 'Not practiced yet today.'}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Longest: {longestDays} days
        </span>
        <span
          title="Estimated — not yet backed by real activity history"
          style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, letterSpacing: 0.5, color: '#14213D', background: '#FBE24A', border: '1px solid #14213D', padding: '3px 5px' }}
        >
          EST.
        </span>
      </div>
    </div>
  )
}
