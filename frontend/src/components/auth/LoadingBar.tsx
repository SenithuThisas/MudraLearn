import { motion } from 'framer-motion'

export default function LoadingBar() {
  return (
    <div
      style={{
        width: 320,
        height: 28,
        border: '2px solid #000000',
        background: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 1.8, ease: 'easeInOut' }}
        style={{
          height: '100%',
          background: '#6D28D9',
        }}
      />
    </div>
  )
}
