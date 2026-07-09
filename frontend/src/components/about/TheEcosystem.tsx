import { motion } from 'framer-motion';
import { fadeUp, viewportConfig } from '../../hooks/useScrollAnimation';

const cards = [
  {
    emoji: '🧠',
    pastel: 'var(--pastel-yellow)',
    title: 'Gesture Recognition Engine',
    body: 'A Bidirectional GRU network with Multi-Head Attention, trained on hand-landmark sequences from the SSL400 dataset — classifying 384 signs in real time, entirely in your browser.',
  },
  {
    emoji: '📈',
    pastel: 'var(--pastel-mint)',
    title: 'Adaptive Learning',
    body: 'Personalised curriculum that focuses on the signs you struggle with most, using spaced repetition.',
  },
  {
    emoji: '🏆',
    pastel: 'var(--pastel-pink)',
    title: 'Gamified Loop',
    body: 'Streaks, XP, and badges turn the challenge of learning a new language into a rewarding daily habit.',
  },
];

export default function TheEcosystem() {
  return (
    <section
      style={{
        background: '#f9f9f9',
        padding: '80px 80px',
        fontFamily: 'var(--font-body)',
      }}
      className="ecosystem-section"
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Heading */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: 'clamp(16px, 2vw, 22px)',
              color: 'var(--primary)',
              lineHeight: 1.6,
            }}
          >
            THE ECOSYSTEM
          </h2>
        </motion.div>

        {/* Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}
          className="ecosystem-cards"
        >
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              style={{
                background: card.pastel,
                border: 'var(--border)',
                boxShadow: '5px 5px 0px var(--primary)',
                padding: '32px 28px',
                transition: 'box-shadow 150ms ease',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 16 }}>{card.emoji}</div>
              <h3
                style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: 11,
                  color: 'var(--primary)',
                  lineHeight: 1.7,
                  marginBottom: 16,
                }}
              >
                {card.title}
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
                {card.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .ecosystem-section {
            padding: 60px 24px !important;
          }
          .ecosystem-cards {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
