interface XPLevelCardProps {
  level: number
  title?: string
  currentLevelXp: number
  xpToNextLevel: number
  totalXp: number
}

export default function XPLevelCard({ level, title, currentLevelXp, xpToNextLevel, totalXp }: XPLevelCardProps) {
  const levelTotal = currentLevelXp + xpToNextLevel
  const percent = levelTotal > 0 ? Math.round((currentLevelXp / levelTotal) * 100) : 0

  return (
    <div style={{ background: '#ffffff', border: '2px solid #14213D', boxShadow: '4px 4px 0px #14213D', padding: 24, height: '100%' }}>
      <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#14213D', margin: '0 0 8px' }}>
        LEVEL {level}{title ? ` — ${title.toUpperCase()}` : ''}
      </h2>
      <div style={{ width: 48, height: 3, background: '#6D28D9', marginBottom: 20 }} />

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${currentLevelXp} of ${levelTotal} XP to level ${level + 1}`}
        style={{ height: 20, background: '#ffffff', border: '2px solid #14213D', marginBottom: 12 }}
      >
        <div style={{ width: `${percent}%`, height: '100%', background: '#6D28D9' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: '#14213D' }}>
        <span>{currentLevelXp} / {levelTotal} XP</span>
        <span style={{ color: '#6B7280' }}>{xpToNextLevel} XP to next level</span>
      </div>

      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#6B7280', margin: '12px 0 0' }}>
        {totalXp.toLocaleString()} total XP earned
      </p>
    </div>
  )
}
