import type { InputHTMLAttributes } from 'react'

interface PixelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export default function PixelInput({ label, style, ...props }: PixelInputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 10,
            color: '#14213D',
            letterSpacing: 1,
          }}
        >
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: '#ffffff',
          border: '2px solid #000000',
          boxShadow: '4px 4px 0px #000000',
          borderRadius: 0,
          fontFamily: "'Inter', sans-serif",
          fontSize: 15,
          color: '#14213D',
          outline: 'none',
          transition: 'box-shadow 150ms ease, transform 150ms ease',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '2px 2px 0px #000000';
          e.currentTarget.style.transform = 'translate(2px, 2px)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = '4px 4px 0px #000000';
          e.currentTarget.style.transform = 'translate(0, 0)';
          props.onBlur?.(e);
        }}
      />
    </div>
  )
}
