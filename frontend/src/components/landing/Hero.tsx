import { motion } from 'framer-motion';
import { fadeUp, fadeIn, slideRight, viewportConfig } from '../../hooks/useScrollAnimation';
import { Button } from '../ui/Button';

export default function Hero() {
  return (
    <section
      style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        background: '#ffffff',
        padding: '40px 80px',
        paddingTop: 104,
        fontFamily: 'var(--font-body)',
      }}
      className="hero-section"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 48,
          maxWidth: 1280,
          margin: '0 auto',
          width: '100%',
        }}
        className="hero-inner"
      >
        {/* Left Column */}
        <div style={{ flex: '0 0 55%' }} className="hero-left">
          {/* Pill Badge */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 16px',
                border: '2px solid var(--accent)',
                background: '#B9FBC0',
                borderRadius: 10,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 12,
                boxShadow: '4px 4px 0px var(--primary)',
                color: 'var(--primary)',
              }}
            >
              Now with AI Gesture Recognition →
            </span>
          </motion.div>

          {/* Headline */}
          <div style={{ marginTop: 24 }}>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: 'clamp(28px, 4vw, 52px)',
                lineHeight: 1.3,
                color: 'var(--primary)',
              }}
            >
              SIGN
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
              style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: 'clamp(28px, 4vw, 52px)',
                lineHeight: 1.3,
                color: 'var(--primary)',
              }}
            >
              LANGUAGE,
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
              style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: 'clamp(28px, 4vw, 52px)',
                lineHeight: 1.3,
                color: 'var(--accent)',
              }}
            >
              REIMAGINED.
            </motion.div>
          </div>

          {/* Subtext */}
          <motion.p
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              color: '#4a5568',
              maxWidth: 420,
              lineHeight: 1.7,
              marginTop: 24,
            }}
          >
            A smarter way to connect with Sri Lanka's deaf community — powered by real-time AI. Master Sinhala Sign Language through interactive visual feedback.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.6 }}
            style={{ display: 'flex', gap: 16, marginTop: 32 }}
            className="hero-cta"
          >
            <Button variant="primary"
              style={{ borderRadius: 10 }}
              onClick={() => (window.location.href = '/practice')}>
              Start Learning Free ⚡
            </Button>
            <Button
              variant="secondary"
              style={{ borderRadius: 10 }}
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}>
              See How It Works ◎
            </Button>
          </motion.div>
        </div>

        {/* Right Column */}
        <div style={{ flex: '0 0 45%', position: 'relative' }} className="hero-right">
          {/* Main Card */}
          <div
            style={{
              minHeight: 380,
              border: 'var(--border)',
              boxShadow: '6px 6px 0px var(--primary)',
              background: '#ffffff',
              borderRadius: 0,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'visible',
            }}
          >
            {/* Hand illustration SVG */}
            <svg width="220" height="240" viewBox="0 0 220 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Left hand */}
              <g transform="translate(10, 20)">
                {/* Palm */}
                <rect x="20" y="80" width="60" height="80" fill="var(--accent)" stroke="var(--primary)" strokeWidth="3" />
                {/* Thumb */}
                <rect x="0" y="90" width="24" height="40" fill="var(--accent)" stroke="var(--primary)" strokeWidth="3" />
                {/* Index finger */}
                <rect x="22" y="20" width="16" height="64" fill="var(--accent)" stroke="var(--primary)" strokeWidth="3" />
                {/* Middle finger */}
                <rect x="42" y="10" width="16" height="74" fill="var(--accent)" stroke="var(--primary)" strokeWidth="3" />
                {/* Ring finger */}
                <rect x="62" y="25" width="16" height="60" fill="var(--accent)" stroke="var(--primary)" strokeWidth="3" />
                {/* Pinky */}
                <rect x="78" y="50" width="14" height="40" fill="var(--accent)" stroke="var(--primary)" strokeWidth="3" />
                {/* Wrist */}
                <rect x="30" y="158" width="40" height="30" fill="var(--accent)" stroke="var(--primary)" strokeWidth="3" />
              </g>
              {/* Right hand */}
              <g transform="translate(120, 30)">
                {/* Palm */}
                <rect x="10" y="70" width="60" height="80" fill="#f3eeff" stroke="var(--primary)" strokeWidth="3" />
                {/* Thumb */}
                <rect x="66" y="80" width="24" height="40" fill="#f3eeff" stroke="var(--primary)" strokeWidth="3" />
                {/* Index finger */}
                <rect x="52" y="12" width="16" height="62" fill="#f3eeff" stroke="var(--primary)" strokeWidth="3" />
                {/* Middle finger */}
                <rect x="32" y="2" width="16" height="72" fill="#f3eeff" stroke="var(--primary)" strokeWidth="3" />
                {/* Ring finger */}
                <rect x="12" y="16" width="16" height="58" fill="#f3eeff" stroke="var(--primary)" strokeWidth="3" />
                {/* Pinky */}
                <rect x="0" y="42" width="14" height="38" fill="#f3eeff" stroke="var(--primary)" strokeWidth="3" />
                {/* Wrist */}
                <rect x="22" y="148" width="40" height="30" fill="#f3eeff" stroke="var(--primary)" strokeWidth="3" />
              </g>
              {/* Gesture lines */}
              <line x1="100" y1="60" x2="115" y2="50" stroke="var(--accent)" strokeWidth="3" />
              <line x1="108" y1="70" x2="120" y2="60" stroke="var(--accent)" strokeWidth="2" />
              <line x1="95" y1="55" x2="110" y2="40" stroke="var(--primary)" strokeWidth="2" />
            </svg>
          </div>

          {/* Floating Badges */}
          <motion.div
            variants={slideRight}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.7 }}
            style={{
              position: 'absolute',
              top: 20,
              right: -20,
              willChange: 'transform',
            }}
            className="hero-badge hero-badge-1"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  border: 'var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  background: 'var(--pastel-yellow)',
                  borderRadius: 0,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: 12,
                  color: 'var(--primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                📚 384 Signs
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            variants={slideRight}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.8 }}
            style={{
              position: 'absolute',
              top: '50%',
              right: -30,
              transform: 'translateY(-50%)',
              willChange: 'transform',
            }}
            className="hero-badge hero-badge-2"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  border: 'var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  background: 'var(--pastel-mint)',
                  borderRadius: 0,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: 12,
                  color: 'var(--primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                ⚡ Real-Time AI
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            variants={slideRight}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.9 }}
            style={{
              position: 'absolute',
              bottom: 30,
              right: -15,
              willChange: 'transform',
            }}
            className="hero-badge hero-badge-3"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  border: 'var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  background: 'var(--pastel-pink)',
                  borderRadius: 0,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: 12,
                  color: 'var(--primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                ✓ Free to Use
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hero-section {
            padding: 100px 24px 40px !important;
          }
          .hero-inner {
            flex-direction: column !important;
          }
          .hero-left {
            flex: 1 1 auto !important;
            text-align: left;
          }
          .hero-right {
            flex: 1 1 auto !important;
            width: 100%;
            margin-top: 40px;
          }
          .hero-cta {
            flex-direction: column !important;
          }
          .hero-badge {
            position: relative !important;
            top: auto !important;
            right: auto !important;
            bottom: auto !important;
            transform: none !important;
          }
          .hero-right {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }
          .hero-right > div:first-child {
            width: 100%;
          }
          .hero-badge-1, .hero-badge-2, .hero-badge-3 {
            position: static !important;
          }
          .hero-right::after {
            content: '';
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
          }
        }
      `}</style>
    </section>
  );
}
