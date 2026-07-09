import { motion } from 'framer-motion';
import { slideLeft, slideRight, viewportConfig } from '../../hooks/useScrollAnimation';
import { Button } from '../ui/Button';

const audiences = [
  {
    icon: '👨‍👩‍👧',
    title: 'FAMILIES',
    desc: 'Connecting parents and siblings with their Deaf family members through Sinhala sign language.',
  },
  {
    icon: '🏥',
    title: 'HEALTHCARE',
    desc: 'Helping doctors and nurses provide better care with more inclusive patient interactions.',
  },
  {
    icon: '🎓',
    title: 'EDUCATORS',
    desc: 'Providing tools for teachers to create inclusive classrooms for all students.',
  },
];

export default function WhoIsThisFor() {
  return (
    <section
      style={{
        background: 'var(--primary)',
        padding: '80px 80px',
        fontFamily: 'var(--font-body)',
      }}
      className="who-section"
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
        className="who-inner"
      >
        {/* Left — audience cards */}
        <motion.div
          variants={slideLeft}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {audiences.map((a) => (
            <div
              key={a.title}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '5px 5px 0px rgba(255,255,255,0.1)',
                padding: '20px 24px',
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: 24, flexShrink: 0 }}>{a.icon}</span>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 800,
                    fontSize: 11,
                    letterSpacing: 2,
                    color: '#ffffff',
                    marginBottom: 6,
                  }}
                >
                  {a.title}
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    color: '#9ca3af',
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {a.desc}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Right — description + CTA */}
        <motion.div
          variants={slideRight}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <h2
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: 'clamp(16px, 2vw, 22px)',
              color: '#ffffff',
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            WHO IS THIS FOR?
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              color: '#9ca3af',
              lineHeight: 1.8,
              marginBottom: 32,
            }}
          >
            MudraLearn is designed to serve a diverse ecosystem of users: whether you are a
            professional building rapport or a relative seeking closer bonds, our platform meets you
            at your specific needs.
          </p>

          <Button
            variant="white"
            onClick={() => (window.location.href = '/signin')}
          >
            <span
              style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: 10,
                padding: '2px 8px',
              }}
            >
              START LEARNING FREE →
            </span>
          </Button>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .who-section {
            padding: 60px 24px !important;
          }
          .who-inner {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  );
}
