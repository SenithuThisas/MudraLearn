interface MasteryDonutProps {
  percent: number // 0-100
  size?: number
}

export default function MasteryDonut({ percent, size = 140 }: MasteryDonutProps) {
  const stroke = 16
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#6D28D9"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="square"
        />
      </svg>
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 22, color: '#6D28D9' }}>{percent}%</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: 1, marginTop: 4 }}>
          MASTERY
        </span>
      </div>
    </div>
  )
}
