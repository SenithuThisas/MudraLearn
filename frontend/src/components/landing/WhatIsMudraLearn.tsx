import { motion } from 'framer-motion';
import { slideLeft, viewportConfig } from '../../hooks/useScrollAnimation';
import { Card } from '../ui/Card';

export default function WhatIsMudraLearn() {
  return (
    <section
      id="about"
      style={{
        background: '#ffffff',
        padding: '80px 80px',
        fontFamily: 'var(--font-body)',
      }}
      className="what-section"
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Section heading row */}
        <motion.div
          variants={slideLeft}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}
        >
          <div
            style={{
              width: 4,
              height: 32,
              background: 'var(--accent)',
              flexShrink: 0,
            }}
          />
          <h2
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 800,
              fontSize: 36,
              color: 'var(--primary)',
              margin: 0,
              letterSpacing: 'normal',
              lineHeight: 1.2,
            }}
          >
            What is MudraLearn?
          </h2>
        </motion.div>

        {/* Content card */}
        <motion.div
          variants={slideLeft}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          transition={{ delay: 0.2 }}
        >
          <Card bg="var(--pastel-blue)" hover={false} className="p-0">
            <div style={{ display: 'flex', minHeight: 200 }}>
              {/* Accent stripe */}
              <div
                style={{
                  width: 4,
                  background: 'var(--accent)',
                  flexShrink: 0,
                }}
              />
              {/* Content */}
              <div style={{ padding: 32 }}>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 16,
                    color: '#4a5568',
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  MudraLearn is a dedicated platform designed to bridge the communication gap between the hearing and deaf communities in Sri Lanka. By utilising cutting-edge AI gesture recognition, we provide a gamified, real-time feedback loop that makes learning Sinhala Sign Language (SSL) intuitive and effective.
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 16,
                    color: '#4a5568',
                    lineHeight: 1.7,
                    marginTop: 16,
                  }}
                >
                  Our curriculum is built from the ground up with local educators to ensure cultural accuracy and linguistic precision, enabling users to speak with their hands and listen with their eyes.
                </p>
                <a
                  href="#learn-more"
                  style={{
                    display: 'inline-block',
                    marginTop: 20,
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: 14,
                    color: 'var(--accent)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'text-decoration 200ms ease',
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
                  Learn more about our approach →
                </a>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .what-section {
            padding: 48px 24px !important;
          }
        }
      `}</style>
    </section>
  );
}
