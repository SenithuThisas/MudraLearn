/**
 * Segmented wizard progress bar + "STEP X OF Y" label.
 *
 * Renders `total` hard-edged segments; the first `current` are filled with the
 * primary purple, the rest are hairline grey. Exposed to AT as a progressbar.
 */
export default function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Step ${current} of ${total}`}
        style={{ display: 'flex', gap: 10, marginBottom: 10 }}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            style={{
              flex: 1,
              height: 10,
              background: i < current ? '#6025B8' : '#E5E7EB',
              border: '2px solid #14213D',
              borderRadius: 0,
              boxShadow: i < current ? '2px 2px 0px #14213D' : 'none',
              display: 'block',
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 10,
          color: '#6B7280',
          letterSpacing: 1,
        }}
      >
        STEP {current} OF {total}
      </div>
    </div>
  )
}
