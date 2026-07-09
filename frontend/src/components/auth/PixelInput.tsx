import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

interface PixelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  /** Static text/element rendered inside the field, before the input (e.g. "@"). */
  leading?: ReactNode
  /** Interactive element rendered inside the field, after the input (e.g. eye toggle). */
  trailing?: ReactNode
  /** Error message; when set, the field is outlined red and announced to AT. */
  error?: string
}

/**
 * Pixel/neo-brutalist text field. Hard offset shadow that collapses on focus.
 * Optional prefix (e.g. "@" for usernames) and trailing slot (e.g. show/hide
 * eye). Error text is tied to the input via aria-describedby.
 */
export default function PixelInput({
  label,
  leading,
  trailing,
  error,
  style,
  id,
  ...props
}: PixelInputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 10,
            color: '#14213D',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </label>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          border: `2px solid ${error ? '#DC2626' : '#14213D'}`,
          boxShadow: `4px 4px 0px ${error ? '#DC2626' : '#14213D'}`,
          borderRadius: 0,
          transition: 'box-shadow 150ms ease, transform 150ms ease, border-color 150ms ease',
        }}
        onFocusCapture={(e) => {
          e.currentTarget.style.boxShadow = `2px 2px 0px ${error ? '#DC2626' : '#14213D'}`
          e.currentTarget.style.transform = 'translate(2px, 2px)'
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.boxShadow = `4px 4px 0px ${error ? '#DC2626' : '#14213D'}`
          e.currentTarget.style.transform = 'translate(0, 0)'
        }}
      >
        {leading != null && (
          <span
            aria-hidden="true"
            style={{
              paddingLeft: 16,
              fontFamily: "'Inter', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: '#6B7280',
            }}
          >
            {leading}
          </span>
        )}
        <input
          {...props}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : props['aria-describedby']}
          style={{
            flex: 1,
            width: '100%',
            padding: '14px 16px',
            paddingLeft: leading != null ? 8 : 16,
            background: 'transparent',
            border: 'none',
            borderRadius: 0,
            fontFamily: "'Inter', sans-serif",
            fontSize: 15,
            color: '#14213D',
            outline: 'none',
            ...style,
          }}
        />
        {trailing != null && (
          <span style={{ display: 'flex', alignItems: 'center', paddingRight: 12 }}>{trailing}</span>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          aria-live="polite"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: '#DC2626',
            margin: 0,
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
