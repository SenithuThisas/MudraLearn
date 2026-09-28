import { motion, useReducedMotion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

interface PixelButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  fullWidth?: boolean
}

export default function PixelButton({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  style,
  fullWidth = false,
  ...rest
}: PixelButtonProps) {
  const isPrimary = variant === 'primary'
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.button
      type={type}
      disabled={disabled}
      {...rest}
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: '14px 28px',
        /* Primary uses the bold saturated accent purple — same as landing "Get Started" */
        background: isPrimary ? '#6025B8' : '#ffffff',
        color: isPrimary ? '#ffffff' : '#14213D',
        border: '2px solid #000000',
        /* 6px hard ink offset shadow matching the landing page spec */
        boxShadow: disabled ? '0px 0px 0px #000000' : '6px 6px 0px 0px #000000',
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
        transition: shouldReduceMotion ? 'none' : 'transform 150ms ease, box-shadow 150ms ease',
        ...style,
      }}
      /* Hover-lift: -2px/-2px translate, shadow grows to 8px */
      whileHover={disabled || shouldReduceMotion ? {} : { x: -2, y: -2, boxShadow: '8px 8px 0px 0px #000000' }}
      whileTap={disabled || shouldReduceMotion ? {} : { x: 2, y: 2, boxShadow: '4px 4px 0px 0px #000000' }}
      onFocus={(e) => {
        e.currentTarget.style.outline = '2px solid #6025B8';
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
