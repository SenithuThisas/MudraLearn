import { motion } from 'framer-motion';
import { fadeUp, slideLeft, slideRight, viewportConfig } from '../../hooks/useScrollAnimation';

const stats = [
  { number: '384', label: 'SSL SIGNS' },
  { number: '2022', label: 'DATASET PUBLISHED' },
  { number: '80–90%', label: 'TARGET ACCURACY' },
];

export default function AboutHero() {
  return (
    <section
      style={{
        background: 'var(--primary)',
        padding: '120px 80px 80px',
        textAlign: 'center',
        fontFamily: 'var(--font-body)',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="about-hero-section"
    >
      {/* Background pixel grid decoration */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(96,37,184,0.12) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
        {/* Eyebrow badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {/* <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 18px',
              border: '2px solid var(--accent)',
              background: 'rgba(96,37,184,0.25)',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 2,
              color: '#C3F5E8',
              marginBottom: 32,
            }}
          >
            
          </span> */}
        </motion.div>

        {/* Pixel headline */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          transition={{ delay: 0.1 }}
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: 'clamp(22px, 3.5vw, 42px)',
            color: '#ffffff',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          SIGN LANGUAGE
          <br />
          <span style={{ color: 'var(--accent)' }}>FOR EVERYONE.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            color: '#9ca3af',
            maxWidth: 560,
            margin: '24px auto 0',
            lineHeight: 1.8,
          }}
        >
          MudraLearn is a browser-based learning platform for Sinhala Sign Language — powered by
          real-time AI gesture recognition, built from a dataset that existed for years with no
          consumer app.
        </motion.p>

        {/* Stat cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            marginTop: 56,
          }}
          className="about-hero-stats"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              transition={{ delay: 0.3 + i * 0.1 }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '5px 5px 0px rgba(255,255,255,0.15)',
                padding: '32px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: 'clamp(20px, 2.5vw, 32px)',
                  color: i === 1 ? '#FFF3B0' : i === 2 ? '#C3F5E8' : '#FFD6E0',
                  lineHeight: 1.2,
                }}
              >
                {s.number}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: 2,
                  color: '#9ca3af',
                  marginTop: 12,
                }}
              >
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-hero-section {
            padding: 100px 24px 60px !important;
          }
          .about-hero-stats {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
