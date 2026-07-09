import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface PixelButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  type?: 'button' | 'submit'
  disabled?: boolean
  style?: React.CSSProperties
  fullWidth?: boolean
}

export default function PixelButton({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled = false,
  style,
  fullWidth = false,
}: PixelButtonProps) {
  const isPrimary = variant === 'primary'

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: '14px 28px',
        background: isPrimary ? '#6D28D9' : '#ffffff',
        color: isPrimary ? '#ffffff' : '#14213D',
        border: '2px solid #000000',
        boxShadow: disabled ? '0px 0px 0px #000000' : '5px 5px 0px #000000',
        borderRadius: 0,
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 11,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        outline: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'transform 150ms ease, box-shadow 150ms ease',
        ...style,
      }}
      whileHover={disabled ? {} : { x: 3, y: 3, boxShadow: '2px 2px 0px #000000' }}
      whileTap={disabled ? {} : { x: 5, y: 5, boxShadow: '0px 0px 0px #000000' }}
      onFocus={(e) => {
        e.currentTarget.style.outline = '2px solid #6D28D9';
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
    >
      {children}
    </motion.button>
  )
}
