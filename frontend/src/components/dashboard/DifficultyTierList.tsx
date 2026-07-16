import type { Tier } from '../../data/mockDashboard'

export interface DifficultyTierEntry {
  name: Tier
  unlocked: boolean
  requiredMasteryPercent: number
  currentMasteryPercent: number
}

interface DifficultyTierListProps {
  tiers: DifficultyTierEntry[]
}

export default function DifficultyTierList({ tiers }: DifficultyTierListProps) {
  return (
    <div style={{ background: '#ffffff', border: '2px solid #14213D', boxShadow: '4px 4px 0px #14213D', padding: 24 }}>
      <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#14213D', margin: '0 0 8px' }}>
        DIFFICULTY TIERS
      </h2>
      <div style={{ width: 48, height: 3, background: '#6D28D9', marginBottom: 20 }} />

      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tiers.map((tier) => (
          <li
            key={tier.name}
            tabIndex={0}
            style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              padding: '14px 16px',
              background: tier.unlocked ? '#ffffff' : '#F3F4F6',
              border: '2px solid #14213D',
              outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.outline = '2px solid #6D28D9'; e.currentTarget.style.outlineOffset = '2px' }}
            onBlur={(e) => { e.currentTarget.style.outline = 'none' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, color: '#14213D', textTransform: 'uppercase' }}>
                {tier.name}
              </span>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: "'Press Start 2P', monospace", fontSize: 8, letterSpacing: 0.5,
                  color: '#14213D',
                  background: tier.unlocked ? '#A8F0CE' : '#FBE24A',
                  border: '1px solid #14213D', padding: '4px 8px',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {tier.unlocked
                    ? <path d="M20 6L9 17l-5-5" />
                    : (
                      <>
                        <rect x="4" y="10" width="16" height="10" rx="1" />
                        <path d="M7 10V7a5 5 0 0 1 10 0v3" />
                      </>
                    )}
                </svg>
                {tier.unlocked ? 'UNLOCKED' : 'LOCKED'}
              </span>
            </div>

            {!tier.unlocked && (
              <div>
                <div style={{ height: 10, background: '#ffffff', border: '1px solid #14213D', marginBottom: 4 }}>
                  <div style={{ width: `${Math.min(100, tier.currentMasteryPercent)}%`, height: '100%', background: '#6D28D9' }} />
                </div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                  Needs {tier.requiredMasteryPercent}% mastery in the previous tier — currently at {tier.currentMasteryPercent}%
                </span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
