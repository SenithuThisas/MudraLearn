import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fadeUp, fadeIn, slideRight } from '../../hooks/useScrollAnimation';
import { Button } from '../ui/Button';

export default function Hero() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(240, 236, 251, 0.55)',
        padding: '40px 80px',
        paddingTop: 104,
        fontFamily: 'var(--font-body)',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '2px solid var(--primary)',
      }}
      className="hero-section"
    >
      {/* Visible colour blobs — "coloured spotlight through fog" */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: '-60px', right: '-60px',
          width: 520, height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96, 37, 184, 0.32) 0%, rgba(96, 37, 184, 0) 70%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: '-80px', left: '-60px',
          width: 480, height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(163, 230, 53, 0.28) 0%, rgba(195, 245, 232, 0.20) 50%, transparent 70%)',
          filter: 'blur(70px)',
        }}
        aria-hidden="true"
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 48,
          maxWidth: 1280,
          margin: '0 auto',
          width: '100%',
          position: 'relative',
          zIndex: 1,
        }}
        className="hero-inner"
      >
        {/* Decorative floating pixel shapes in the hero gap */}
        <div className="pointer-events-none" aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          {/* Square — accent purple */}
          <div className="ml-float-a" style={{ position: 'absolute', top: '18%', left: '50%', width: 10, height: 10, background: 'var(--accent)', border: '2px solid var(--primary)', opacity: 0.75 }} />
          {/* Plus sign — yellow */}
          <div className="ml-float-b" style={{ position: 'absolute', top: '38%', left: '52%' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="5" y="0" width="4" height="14" fill="#FFF3B0" stroke="var(--primary)" strokeWidth="1.2" />
              <rect x="0" y="5" width="14" height="4" fill="#FFF3B0" stroke="var(--primary)" strokeWidth="1.2" />
            </svg>
          </div>
          {/* Dot — mint */}
          <div className="ml-float-c" style={{ position: 'absolute', top: '62%', left: '48%', width: 8, height: 8, borderRadius: '50%', background: '#C3F5E8', border: '2px solid var(--primary)', opacity: 0.80 }} />
          {/* Small square — pink */}
          <div className="ml-float-d" style={{ position: 'absolute', top: '25%', left: '54%', width: 7, height: 7, background: '#FFD6E0', border: '2px solid var(--primary)', opacity: 0.70 }} />
          {/* Plus sign — accent */}
          <div className="ml-float-e" style={{ position: 'absolute', top: '55%', left: '51%' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="4" y="0" width="4" height="12" fill="var(--accent)" stroke="var(--primary)" strokeWidth="1" />
              <rect x="0" y="4" width="12" height="4" fill="var(--accent)" stroke="var(--primary)" strokeWidth="1" />
            </svg>
          </div>
          {/* Diamond dot — yellow */}
          <div className="ml-float-f" style={{ position: 'absolute', top: '74%', left: '53%', width: 9, height: 9, background: '#FFF3B0', border: '2px solid var(--primary)', opacity: 0.75, transform: 'rotate(45deg)' }} />
        </div>
        {/* Left Column */}
        <div style={{ flex: '0 0 55%' }} className="hero-left">
          {/* Pill Badge */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.08 }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 16px',
                border: '2px solid var(--primary)',
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
              transition={{ delay: 0.15 }}
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
              transition={{ delay: 0.22 }}
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
              transition={{ delay: 0.29 }}
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
            transition={{ delay: 0.36 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              color: '#374151',
              maxWidth: 440,
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
            transition={{ delay: 0.43 }}
            style={{ display: 'flex', gap: 16, marginTop: 32 }}
            className="hero-cta"
          >
            <Button
              variant="primary"
              style={{ borderRadius: 10 }}
              onClick={() => navigate('/splash?to=/signin')}
            >
              Start Learning Free ⚡
            </Button>
            <Button
              variant="secondary"
              style={{ borderRadius: 10 }}
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See How It Works ◎
            </Button>
          </motion.div>
        </div>

        {/* Right Column */}
        <div style={{ flex: '0 0 45%', position: 'relative' }} className="hero-right">
          {/* Main Illustration Frame — Hard offset brutalist shadow & coordinate canvas */}
          <div
            style={{
              minHeight: 380,
              border: '2px solid var(--primary)',
              boxShadow: '8px 8px 0px var(--primary)',
              background: '#ffffff',
              borderRadius: 0,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'visible',
            }}
          >
            {/* Retro terminal header strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                borderBottom: '2px solid var(--primary)',
                background: '#F7F6F3',
                userSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: '#FFD6E0',
                    border: '1.5px solid var(--primary)',
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: '#FFF3B0',
                    border: '1.5px solid var(--primary)',
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: '#C3F5E8',
                    border: '1.5px solid var(--primary)',
                    display: 'inline-block',
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: 9,
                  color: 'var(--primary)',
                  letterSpacing: '0.04em',
                }}
              >
                AI VISION // 30 FPS
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: 8,
                  color: 'var(--accent)',
                  fontWeight: 'bold',
                }}
              >
                ● LIVE
              </div>
            </div>

            {/* Canvas body with coordinate grid + glow + scan-line */}
            <div
              className="bg-canvas-grid"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '28px 20px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <video
                src="/media/hero-demo.mp4"
                autoPlay={!shouldReduceMotion}
                loop
                muted
                playsInline
                preload="metadata"
                poster="/media/hero-poster.jpg"
                aria-label="Demonstration of MudraLearn recognising a Sinhala Sign Language gesture"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          </div>

          {/* Floating Stat Badges — Layered physical sticker styling */}
          {/* Badge 1: 384 Signs */}
          <motion.div
            variants={slideRight}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.48 }}
            style={{
              position: 'absolute',
              top: 24,
              right: -24,
              willChange: 'transform',
              zIndex: 3,
            }}
            className="hero-badge hero-badge-1"
          >
            <motion.div
              initial={{ rotate: -2 }}
              animate={shouldReduceMotion ? { rotate: -2 } : { rotate: -2, y: [0, -5, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{
                scale: 1.05,
                rotate: 0,
                y: -2,
                x: -2,
                boxShadow: '8px 8px 0px var(--primary)',
                transition: { duration: 0.15 },
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                border: '2px solid var(--primary)',
                boxShadow: '6px 6px 0px var(--primary)',
                background: 'var(--pastel-yellow)',
                borderRadius: 0,
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 12,
                color: 'var(--primary)',
                whiteSpace: 'nowrap',
                cursor: 'default',
                userSelect: 'none',
              }}
            >
              📚 384 Signs
            </motion.div>
          </motion.div>

          {/* Badge 2: Real-Time AI */}
          <motion.div
            variants={slideRight}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.56 }}
            style={{
              position: 'absolute',
              top: '52%',
              right: -32,
              transform: 'translateY(-50%)',
              willChange: 'transform',
              zIndex: 3,
            }}
            className="hero-badge hero-badge-2"
          >
            <motion.div
              initial={{ rotate: 1.5 }}
              animate={shouldReduceMotion ? { rotate: 1.5 } : { rotate: 1.5, y: [0, -5, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              whileHover={{
                scale: 1.05,
                rotate: 0,
                y: -2,
                x: -2,
                boxShadow: '8px 8px 0px var(--primary)',
                transition: { duration: 0.15 },
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                border: '2px solid var(--primary)',
                boxShadow: '6px 6px 0px var(--primary)',
                background: 'var(--pastel-mint)',
                borderRadius: 0,
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 12,
                color: 'var(--primary)',
                whiteSpace: 'nowrap',
                cursor: 'default',
                userSelect: 'none',
              }}
            >
              ⚡ Real-Time AI
            </motion.div>
          </motion.div>

          {/* Badge 3: Free to Use */}
          <motion.div
            variants={slideRight}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.64 }}
            style={{
              position: 'absolute',
              bottom: 24,
              right: -18,
              willChange: 'transform',
              zIndex: 3,
            }}
            className="hero-badge hero-badge-3"
          >
            <motion.div
              initial={{ rotate: -1.5 }}
              animate={shouldReduceMotion ? { rotate: -1.5 } : { rotate: -1.5, y: [0, -5, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              whileHover={{
                scale: 1.05,
                rotate: 0,
                y: -2,
                x: -2,
                boxShadow: '8px 8px 0px var(--primary)',
                transition: { duration: 0.15 },
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                border: '2px solid var(--primary)',
                boxShadow: '6px 6px 0px var(--primary)',
                background: 'var(--pastel-pink)',
                borderRadius: 0,
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 12,
                color: 'var(--primary)',
                whiteSpace: 'nowrap',
                cursor: 'default',
                userSelect: 'none',
              }}
            >
              ✓ Free to Use
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

