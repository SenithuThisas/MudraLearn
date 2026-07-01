import { motion } from 'framer-motion';
import type { ButtonProps } from '../../types/landing';

const styles = {
  primary: {
    background: 'var(--accent)',
    color: '#ffffff',
    border: 'var(--border)',
    boxShadow: 'var(--shadow)',
  },
  secondary: {
    background: '#ffffff',
    color: 'var(--primary)',
    border: 'var(--border)',
    boxShadow: 'var(--shadow)',
  },
  white: {
    background: 'var(--accent)',
    color: '#ffffff',
    border: '3px solid #ffffff',
    boxShadow: 'var(--shadow-white)',
  },
};

export const Button = ({ variant, children, onClick, className, type = 'button', style: customStyle }: ButtonProps) => (
  <motion.button
    type={type}
    onClick={onClick}
    className={`font-semibold cursor-pointer px-6 py-3 text-sm ${className ?? ''}`}
    style={{
      ...styles[variant],
      borderRadius: 0,
      fontFamily: 'var(--font-body)',
      outline: 'none',
      ...customStyle,
    }}
    whileHover={{
      x: 3,
      y: 3,
      boxShadow: variant === 'white' ? '2px 2px 0px #ffffff' : '2px 2px 0px #1a2744',
    }}
    whileTap={{ x: 5, y: 5, boxShadow: '0px 0px 0px #1a2744' }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    onFocus={(e) => {
      e.currentTarget.style.outline = '2px solid var(--accent)';
      e.currentTarget.style.outlineOffset = '2px';
    }}
    onBlur={(e) => {
      e.currentTarget.style.outline = 'none';
    }}
  >
    {children}
  </motion.button>
);

export default Button;
