import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, viewportConfig } from '../../hooks/useScrollAnimation';

export default function WhyChoose() {
  return (
    <section
      style={{
        background: '#ffffff',
        padding: '80px 80px',
        fontFamily: 'var(--font-body)',
      }}
      className="why-section"
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Section heading */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          style={{ textAlign: 'center' }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 800,
              fontSize: 40,
              color: 'var(--primary)',
              margin: 0,
              letterSpacing: 'normal',
              lineHeight: 1.2,
            }}
          >
            Why People Choose MudraLearn
          </h2>
          <div
            style={{
              width: 60,
              height: 3,
              background: 'var(--accent)',
              margin: '12px auto 0',
              border: 'none',
            }}
          />
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          style={{ marginTop: 48 }}
        >
          {/* Row 1 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '3fr 2fr',
              gap: 20,
            }}
            className="why-row-1"
          >
            {/* Card A — Real-Time Gesture Recognition */}
            <motion.div
              variants={fadeUp}
              style={{
                background: 'var(--pastel-blue)',
                border: 'var(--border)',
                boxShadow: 'var(--shadow)',
                borderRadius: 0,
                padding: 28,
                willChange: 'transform',
              }}
              whileHover={{ x: -3, y: -3, boxShadow: '8px 8px 0px #1a2744' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="1" width="16" height="16" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="9" cy="9" r="4" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="9" cy="9" r="1.5" fill="#ffffff" />
                </svg>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 18,
                  color: 'var(--primary)',
                  marginTop: 16,
                  letterSpacing: 'normal',
                  lineHeight: 1.3,
                }}
              >
                Real-Time Gesture Recognition
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: '#4a5568',
                  marginTop: 8,
                  lineHeight: 1.6,
                }}
              >
                Our proprietary neural network processes 30 frames per second to ensure your signs are tracked accurately in any lighting condition.
              </p>
              <a
                href="#ai"
                style={{
                  display: 'inline-block',
                  marginTop: 20,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: 13,
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                onFocus={(e) => {
                  e.currentTarget.style.outline = '2px solid var(--accent)';
                  e.currentTarget.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                }}
              >
                LEARN ABOUT OUR AI →
              </a>
            </motion.div>

            {/* Card B — Adaptive Learning Engine */}
            <motion.div
              variants={fadeUp}
              style={{
                background: 'var(--pastel-yellow)',
                border: 'var(--border)',
                boxShadow: 'var(--shadow)',
                borderRadius: 0,
                padding: 28,
                willChange: 'transform',
              }}
              whileHover={{ x: -3, y: -3, boxShadow: '8px 8px 0px #1a2744' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2L2 9h5v7h4V9h5L9 2z" fill="#ffffff" />
                </svg>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 18,
                  color: 'var(--primary)',
                  marginTop: 16,
                  letterSpacing: 'normal',
                  lineHeight: 1.3,
                }}
              >
                Adaptive Learning Engine
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: '#4a5568',
                  marginTop: 8,
                  lineHeight: 1.6,
                }}
              >
                Lessons that adjust to your speed, focusing on the signs you find most challenging.
              </p>
            </motion.div>
          </div>

          {/* Row 2 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 2fr',
              gap: 20,
              marginTop: 20,
            }}
            className="why-row-2"
          >
            {/* Card C — Gamified Progress */}
            <motion.div
              variants={fadeUp}
              style={{
                background: 'var(--pastel-pink)',
                border: 'var(--border)',
                boxShadow: 'var(--shadow)',
                borderRadius: 0,
                padding: 28,
                willChange: 'transform',
              }}
              whileHover={{ x: -3, y: -3, boxShadow: '8px 8px 0px #1a2744' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="3" y="8" width="3" height="8" fill="#ffffff" />
                  <rect x="7.5" y="5" width="3" height="11" fill="#ffffff" />
                  <rect x="12" y="2" width="3" height="14" fill="#ffffff" />
                </svg>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 18,
                  color: 'var(--primary)',
                  marginTop: 16,
                  letterSpacing: 'normal',
                  lineHeight: 1.3,
                }}
              >
                Gamified Progress
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: '#4a5568',
                  marginTop: 8,
                  lineHeight: 1.6,
                }}
              >
                Earn badges, climb the leaderboard, and unlock new vocabulary sets as you master levels.
              </p>
            </motion.div>

            {/* Card D — Stat Card */}
            <motion.div
              variants={fadeUp}
              style={{
                background: 'var(--pastel-mint)',
                border: 'var(--border)',
                boxShadow: 'var(--shadow)',
                borderRadius: 0,
                padding: 28,
                willChange: 'transform',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
              whileHover={{ x: -3, y: -3, boxShadow: '8px 8px 0px #1a2744' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: 64,
                  color: 'var(--accent)',
                  lineHeight: 1,
                }}
              >
                384
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  color: '#6b7280',
                  marginTop: 8,
                  letterSpacing: 1,
                }}
              >
                SSL SIGNS
              </div>
            </motion.div>

            {/* Card E — No App Download */}
            <motion.div
              variants={fadeUp}
              style={{
                background: '#ffffff',
                border: 'var(--border)',
                boxShadow: 'var(--shadow)',
                borderRadius: 0,
                padding: 28,
                willChange: 'transform',
              }}
              whileHover={{ x: -3, y: -3, boxShadow: '8px 8px 0px #1a2744' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="4" y="1" width="10" height="16" stroke="#ffffff" strokeWidth="2" rx="0" />
                  <line x1="7" y1="14" x2="11" y2="14" stroke="#ffffff" strokeWidth="1.5" />
                </svg>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 18,
                  color: 'var(--primary)',
                  marginTop: 16,
                  letterSpacing: 'normal',
                  lineHeight: 1.3,
                }}
              >
                No App Download Needed
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: '#4a5568',
                  marginTop: 8,
                  lineHeight: 1.6,
                }}
              >
                Works instantly in your browser on mobile and desktop.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .why-section {
            padding: 48px 24px !important;
          }
          .why-row-1, .why-row-2 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
