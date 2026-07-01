import { motion } from 'framer-motion';
import { fadeUp, slideLeft, slideRight, viewportConfig } from '../../hooks/useScrollAnimation';
import { Button } from '../ui/Button';

export default function AboutCTA() {
  return (
    <section
      style={{
        background: 'var(--primary)',
        padding: '80px 40px',
        textAlign: 'center',
        fontFamily: 'var(--font-body)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Pixel grid bg */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(96,37,184,0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
        {/* Heading */}
        <motion.div
          variants={slideLeft}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: 'clamp(20px, 3vw, 36px)',
            color: '#ffffff',
            lineHeight: 1.4,
          }}
        >
          READY TO START
        </motion.div>
        <motion.div
          variants={slideRight}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: 'clamp(20px, 3vw, 36px)',
            color: 'var(--accent)',
            lineHeight: 1.4,
          }}
        >
          SIGNING?
        </motion.div>

        {/* Honest forward-looking line */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          transition={{ delay: 0.3 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            color: '#9ca3af',
            maxWidth: 520,
            margin: '20px auto 0',
            lineHeight: 1.8,
          }}
        >
          This is where MudraLearn stands today — built, tested, and ready to grow.
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: 36,
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="white"
            onClick={() => (window.location.href = '/practice')}
          >
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, padding: '2px 8px' }}>
              START LEARNING FREE
            </span>
          </Button>

          <motion.a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 24px',
              border: '2px solid rgba(255,255,255,0.4)',
              color: '#ffffff',
              fontFamily: 'var(--font-pixel)',
              fontSize: 10,
              textDecoration: 'none',
              boxShadow: '5px 5px 0px rgba(255,255,255,0.15)',
              transition: 'border-color 200ms ease',
            }}
            whileHover={{ x: 3, y: 3, boxShadow: '2px 2px 0px rgba(255,255,255,0.15)' }}
            whileTap={{ x: 5, y: 5, boxShadow: '0px 0px 0px rgba(255,255,255,0.15)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)')}
          >
            BACK TO HOME
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
