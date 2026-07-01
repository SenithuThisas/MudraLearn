import { motion } from 'framer-motion';
import { fadeUp, slideLeft, slideRight, viewportConfig } from '../../hooks/useScrollAnimation';

interface Milestone {
  id: 'moment' | 'gap' | 'attempt' | 'pivot';
  tag: string;
  subtitle: string;
  body: string;
  side: 'left' | 'right';
  isCurrent?: boolean;
}

const milestones: Milestone[] = [
  {
    id: 'moment',
    tag: 'THE MOMENT',
    subtitle: 'A Pizza Hut on Thimbirigasyaya Road',
    body: 'While placing an order at a branch staffed entirely by deaf employees, a simple transaction became impossible with no shared means of communication. A search for a Sri Lankan app to learn SSL turned up nothing built for adults.',
    side: 'left',
  },
  {
    id: 'gap',
    tag: 'THE GAP',
    subtitle: 'A Dataset Nobody Used',
    body: 'SSL400 — 384 signs across 4,236 videos — had been published by IIT Colombo researchers since 2022. Freely available. Never built into a consumer app.',
    side: 'right',
  },
  {
    id: 'attempt',
    tag: 'THE FIRST ATTEMPT',
    subtitle: 'When the First Model Failed',
    body: 'An LSTM trained on full-body pose landmarks reached 59.5% validation accuracy — but only 33% on the real test set. A textbook overfitting failure.',
    side: 'left',
  },
  {
    id: 'pivot',
    tag: 'THE PIVOT',
    subtitle: 'Rebuilding From the Hands Up',
    body: 'Hand-specific landmarks, 5× data augmentation, and a shift to Bidirectional GRU with Multi-Head Attention. New target: 80–90% top-1 accuracy.',
    side: 'right',
    isCurrent: true,
  },
];

export default function OurJourney() {
  return (
    <section
      style={{
        background: '#f9f9f9',
        padding: '80px 80px',
        fontFamily: 'var(--font-body)',
      }}
      className="journey-section"
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Heading */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          style={{ marginBottom: 64 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 6,
                height: 40,
                background: 'var(--accent)',
                flexShrink: 0,
              }}
            />
            <h2
              style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: 'clamp(16px, 2vw, 22px)',
                color: 'var(--primary)',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              OUR JOURNEY
            </h2>
          </div>
        </motion.div>

        {/* Timeline */}
        <div style={{ position: 'relative' }} className="timeline-container">
          {/* Central vertical line */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 3,
              background: 'var(--primary)',
              transform: 'translateX(-50%)',
            }}
            className="timeline-line"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {milestones.map((m, i) => {
              const isLeft = m.side === 'left';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 60px 1fr',
                    alignItems: 'center',
                    gap: 0,
                  }}
                  className="timeline-row"
                >
                  {/* Left card slot */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 32 }}>
                    {isLeft && (
                      <motion.div
                        variants={slideLeft}
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewportConfig}
                        transition={{ delay: i * 0.1 }}
                        style={{
                          background: '#ffffff',
                          border: 'var(--border)',
                          boxShadow: '5px 5px 0px var(--primary)',
                          padding: '24px 28px',
                          maxWidth: 380,
                          width: '100%',
                        }}
                      >
                        <CardContent milestone={m} />
                      </motion.div>
                    )}
                  </div>

                  {/* Center node */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        background: m.isCurrent ? 'var(--accent)' : 'var(--primary)',
                        border: '3px solid var(--primary)',
                        boxShadow: m.isCurrent
                          ? '0 0 0 4px rgba(96,37,184,0.25)'
                          : 'none',
                        flexShrink: 0,
                        transition: 'box-shadow 300ms ease',
                      }}
                    />
                  </div>

                  {/* Right card slot */}
                  <div style={{ paddingLeft: 32 }}>
                    {!isLeft && (
                      <motion.div
                        variants={slideRight}
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewportConfig}
                        transition={{ delay: i * 0.1 }}
                        style={{
                          background: '#ffffff',
                          border: 'var(--border)',
                          boxShadow: '5px 5px 0px var(--primary)',
                          padding: '24px 28px',
                          maxWidth: 380,
                        }}
                      >
                        <CardContent milestone={m} />
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .journey-section {
            padding: 60px 24px !important;
          }
          .timeline-line {
            left: 20px !important;
          }
          .timeline-row {
            grid-template-columns: 40px 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function CardContent({ milestone }: { milestone: Milestone }) {
  return (
    <>
      <div
        style={{
          display: 'inline-block',
          fontFamily: 'var(--font-body)',
          fontWeight: 800,
          fontSize: 9,
          letterSpacing: 2,
          color: milestone.isCurrent ? '#ffffff' : '#ffffff',
          background: milestone.isCurrent ? 'var(--accent)' : 'var(--primary)',
          padding: '4px 10px',
          marginBottom: 12,
        }}
      >
        {milestone.tag}
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: 10,
          color: 'var(--primary)',
          lineHeight: 1.7,
          marginBottom: 12,
        }}
      >
        {milestone.subtitle}
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: '#4a5568',
          lineHeight: 1.75,
          margin: 0,
        }}
      >
        {milestone.body}
      </p>
    </>
  );
}
