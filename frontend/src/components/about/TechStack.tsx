import { motion } from 'framer-motion';
import { fadeUp, slideLeft, slideRight, viewportConfig } from '../../hooks/useScrollAnimation';

const techBadges = [
  {
    icon: '👁️',
    name: 'MediaPipe',
    desc: 'Hand landmark extraction',
    color: 'var(--pastel-blue)',
  },
  {
    icon: '🧠',
    name: 'BiGRU + Attention',
    desc: 'Gesture classification model',
    color: 'var(--pastel-yellow)',
  },
  {
    icon: '⚡',
    name: 'FastAPI',
    desc: 'Backend API layer',
    color: 'var(--pastel-mint)',
  },
  {
    icon: '⚛️',
    name: 'React (TypeScript)',
    desc: 'Web application frontend',
    color: 'var(--pastel-pink)',
  },
];

export default function TechStack() {
  return (
    <section
      style={{
        background: '#ffffff',
        padding: '80px 80px',
        fontFamily: 'var(--font-body)',
      }}
      className="tech-section"
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'start',
        }}
        className="tech-inner"
      >
        {/* Left — tech badges */}
        <motion.div
          variants={slideLeft}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <h2
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: 'clamp(14px, 1.8vw, 20px)',
              color: 'var(--primary)',
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            THE TECH STACK
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
            className="tech-badges-grid"
          >
            {techBadges.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -3 }}
                style={{
                  background: t.color,
                  border: 'var(--border)',
                  boxShadow: '4px 4px 0px var(--primary)',
                  padding: '20px 18px',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 800,
                      fontSize: 13,
                      color: 'var(--primary)',
                      marginBottom: 4,
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 12,
                      color: '#4a5568',
                    }}
                  >
                    {t.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right — privacy card */}
        <motion.div
          variants={slideRight}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <div
            style={{
              background: 'var(--pastel-mint)',
              border: 'var(--border)',
              boxShadow: '5px 5px 0px var(--primary)',
              padding: '36px 32px',
              height: '100%',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 16 }}>🔒</div>
            <h3
              style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: 11,
                color: 'var(--primary)',
                lineHeight: 1.7,
                marginBottom: 16,
              }}
            >
              PRIVACY FIRST
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: '#4a5568',
                lineHeight: 1.8,
                marginBottom: 20,
              }}
            >
              All gesture recognition runs entirely in your browser — your webcam feed never leaves
              your device. No video is recorded, stored, or transmitted. Only anonymised
              performance metrics are used to personalise your learning path.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                '✓ On-device inference only',
                '✓ No video storage or upload',
                '✓ GDPR-aligned data minimisation',
              ].map((point) => (
                <div
                  key={point}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: 13,
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .tech-section {
            padding: 60px 24px !important;
          }
          .tech-inner {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .tech-badges-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .tech-badges-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
