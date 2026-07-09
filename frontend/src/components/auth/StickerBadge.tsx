interface StickerBadgeProps {
  icon: string
  label: string
  bg: string
}

export default function StickerBadge({ icon, label, bg }: StickerBadgeProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        background: bg,
        border: '2px solid #000000',
        boxShadow: '4px 4px 0px rgba(0,0,0,0.25)',
        borderRadius: 0,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 700,
        fontSize: 13,
        color: '#14213D',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
    </div>
  )
}
