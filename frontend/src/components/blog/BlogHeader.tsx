import { motion } from 'framer-motion';
import { fadeUp, viewportConfig } from '../../hooks/useScrollAnimation';

export default function BlogHeader() {
  return (
    <section
      style={{
        background: '#ffffff',
        padding: '80px 80px 32px',
        fontFamily: 'var(--font-body)',
      }}
      className="blog-header-section"
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* BLOG heading */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            color: 'var(--primary)',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          BLOG
        </motion.h1>

        {/* Accent bar + subtext */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          transition={{ delay: 0.1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 24,
          }}
        >
          <div
            style={{
              width: 4,
              flexShrink: 0,
              alignSelf: 'stretch',
              background: 'var(--accent)',
            }}
          />
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Research notes, dataset deep-dives, and honest updates on how MudraLearn is built.
          </p>
        </motion.div>

        {/* Full-width divider */}
        <div
          style={{
            borderTop: 'var(--border)',
            marginTop: 32,
          }}
        />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .blog-header-section {
            padding: 100px 24px 24px !important;
          }
        }
      `}</style>
    </section>
  );
}
