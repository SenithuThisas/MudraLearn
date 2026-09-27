import type { Variants } from 'framer-motion';

// Snappy, production-ready entrance animations (250-300ms)
// Designed for clean screen recording and responsive feel without sluggishness
const snappyEase = [0.16, 1, 0.3, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: snappyEase } }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } }
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: snappyEase } }
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: snappyEase } }
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04
    }
  }
};

export const floatBadge = {
  animate: { y: [0, -5, 0] },
  transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' as const }
};

// Replays cleanly if page is scrolled up and down during video demo or browsing
export const viewportConfig = {
  once: false,
  amount: 0.15,
  margin: '-20px' as const
};

