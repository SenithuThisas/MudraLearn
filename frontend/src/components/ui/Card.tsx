import { motion } from 'framer-motion';
import type { CardProps } from '../../types/landing';

export const Card = ({ bg = '#ffffff', children, className, hover = true }: CardProps) => (
  <motion.div
    className={`p-7 ${className ?? ''}`}
    style={{
      background: bg,
      border: 'var(--border)',
      boxShadow: 'var(--shadow)',
      borderRadius: 0,
      willChange: 'transform',
    }}
    whileHover={hover ? { x: -3, y: -3, boxShadow: '8px 8px 0px #1a2744' } : {}}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    {children}
  </motion.div>
);

export default Card;
