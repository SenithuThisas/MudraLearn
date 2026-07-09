import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, viewportConfig } from '../../hooks/useScrollAnimation';

const steps = [
  {
    number: '01',
    title: 'Watch the Sign',
    description: 'Follow our high-definition 3D avatars demonstrating SSL gestures with perfect precision.',
    bg: 'var(--pastel-yellow)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="5" stroke="var(--primary)" strokeWidth="2.5" />
        <circle cx="12" cy="12" r="2" fill="var(--primary)" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="var(--primary)" strokeWidth="2" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Perform It',
    description: 'Position your hands in front of your camera and replicate the sign you\'ve just learned.',
    bg: 'var(--pastel-pink)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="10" width="12" height="12" stroke="var(--primary)" strokeWidth="2.5" />
        <rect x="8" y="2" width="4" height="10" stroke="var(--primary)" strokeWidth="2" />
        <rect x="13" y="4" width="4" height="8" stroke="var(--primary)" strokeWidth="2" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Get AI Feedback',
    description: 'Receive instant visual cues on your accuracy and tips on how to improve your finger positions.',
    bg: 'var(--pastel-mint)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" stroke="var(--primary)" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        background: '#ffffff',
        padding: '80px 80px',
        fontFamily: 'var(--font-body)',
      }}
      className="hiw-section"
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
              fontFamily: 'var(--font-pixel)',
              fontSize: 26,
              color: 'var(--primary)',
              margin: 0,
              letterSpacing: 'normal',
              lineHeight: 1.3,
            }}
          >
            HOW IT WORKS
          </h2>
          <div
            style={{
              width: 48,
              height: 2,
              background: 'var(--primary)',
              margin: '12px auto 0',
              border: 'none',
            }}
          />
        </motion.div>

        {/* Step cards grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            marginTop: 48,
          }}
          className="hiw-grid"
        >
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={fadeUp}
              style={{
                background: step.bg,
                border: 'var(--border)',
                boxShadow: 'var(--shadow)',
                borderRadius: 0,
                padding: 32,
                minHeight: 280,
                willChange: 'transform',
              }}
              whileHover={{ x: -3, y: -3, boxShadow: '8px 8px 0px #1a2744' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Step number */}
              <div
                style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: 28,
                  color: 'var(--accent)',
                }}
              >
                {step.number}
              </div>

              {/* Icon box */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  background: '#ffffff',
                  border: 'var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  borderRadius: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 16,
                }}
              >
                {step.icon}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 16,
                  color: 'var(--primary)',
                  marginTop: 20,
                  letterSpacing: 'normal',
                  lineHeight: 1.3,
                }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: '#4a5568',
                  marginTop: 8,
                  lineHeight: 1.6,
                }}
              >
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hiw-section {
            padding: 48px 24px !important;
          }
          .hiw-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
