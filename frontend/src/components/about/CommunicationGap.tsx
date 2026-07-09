import { motion } from 'framer-motion';
import { slideLeft, slideRight, viewportConfig } from '../../hooks/useScrollAnimation';

export default function CommunicationGap() {
  return (
    <section
      style={{
        background: '#ffffff',
        padding: '80px 80px',
        fontFamily: 'var(--font-body)',
      }}
      className="comm-gap-section"
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'center',
        }}
        className="comm-gap-inner"
      >
        {/* Left — text */}
        <motion.div
          variants={slideLeft}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <h2
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: 'clamp(16px, 2vw, 22px)',
              color: 'var(--primary)',
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            THE COMMUNICATION GAP
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 1.8,
              marginBottom: 32,
            }}
          >
            An estimated 300,000 deaf and hard-of-hearing people in Sri Lanka rely on Sinhala Sign
            Language as their primary means of communication. Yet resources for hearing individuals
            to learn SSL remain scarce — creating a real barrier in healthcare, education, and
            everyday life.
          </p>

          {/* Pull quote */}
          <div
            style={{
              background: 'var(--pastel-yellow)',
              border: 'var(--border)',
              borderLeft: '4px solid var(--accent)',
              boxShadow: '5px 5px 0px var(--primary)',
              padding: '20px 24px',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontStyle: 'italic',
                fontSize: 15,
                color: 'var(--primary)',
                lineHeight: 1.7,
                margin: 0,
                fontWeight: 600,
              }}
            >
              "The SSL400 dataset has existed publicly since 2022. No one built a consumer app from
              it — until now."
            </p>
          </div>
        </motion.div>

        {/* Right — hand illustration */}
        <motion.div
          variants={slideRight}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              border: 'var(--border)',
              boxShadow: '5px 5px 0px var(--primary)',
              background: 'var(--pastel-blue)',
              padding: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: 400,
              minHeight: 320,
              position: 'relative',
            }}
          >
            {/* Flat hand gesture illustration with AI detection dots */}
            <svg
              width="240"
              height="280"
              viewBox="0 0 240 280"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Stylised hand mid-gesture with AI landmark detection points"
            >
              {/* Wrist */}
              <rect x="80" y="220" width="80" height="40" fill="#FFF3B0" stroke="var(--primary)" strokeWidth="3" />

              {/* Palm */}
              <rect x="60" y="120" width="120" height="110" fill="#FFF3B0" stroke="var(--primary)" strokeWidth="3" />

              {/* Thumb */}
              <rect x="28" y="130" width="36" height="60" rx="0" fill="#FFF3B0" stroke="var(--primary)" strokeWidth="3" />

              {/* Index finger */}
              <rect x="64" y="40" width="28" height="86" fill="#FFF3B0" stroke="var(--primary)" strokeWidth="3" />

              {/* Middle finger */}
              <rect x="96" y="24" width="28" height="100" fill="#FFF3B0" stroke="var(--primary)" strokeWidth="3" />

              {/* Ring finger */}
              <rect x="128" y="40" width="28" height="86" fill="#FFF3B0" stroke="var(--primary)" strokeWidth="3" />

              {/* Pinky */}
              <rect x="160" y="70" width="22" height="58" fill="#FFF3B0" stroke="var(--primary)" strokeWidth="3" />

              {/* AI landmark dots — fingertips */}
              <circle cx="78" cy="40" r="6" fill="var(--accent)" stroke="var(--primary)" strokeWidth="2" />
              <circle cx="110" cy="24" r="6" fill="var(--accent)" stroke="var(--primary)" strokeWidth="2" />
              <circle cx="142" cy="40" r="6" fill="var(--accent)" stroke="var(--primary)" strokeWidth="2" />
              <circle cx="171" cy="70" r="6" fill="var(--accent)" stroke="var(--primary)" strokeWidth="2" />
              <circle cx="34" cy="130" r="6" fill="var(--accent)" stroke="var(--primary)" strokeWidth="2" />

              {/* AI landmark dots — knuckles */}
              <circle cx="78" cy="82" r="4" fill="#C8E6FF" stroke="var(--primary)" strokeWidth="2" />
              <circle cx="110" cy="68" r="4" fill="#C8E6FF" stroke="var(--primary)" strokeWidth="2" />
              <circle cx="142" cy="82" r="4" fill="#C8E6FF" stroke="var(--primary)" strokeWidth="2" />
              <circle cx="171" cy="104" r="4" fill="#C8E6FF" stroke="var(--primary)" strokeWidth="2" />

              {/* AI detection lines connecting landmarks */}
              <line x1="78" y1="40" x2="78" y2="82" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="110" y1="24" x2="110" y2="68" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="142" y1="40" x2="142" y2="82" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="171" y1="70" x2="171" y2="104" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="78" y1="82" x2="110" y2="68" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
              <line x1="110" y1="68" x2="142" y2="82" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
              <line x1="142" y1="82" x2="171" y2="104" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />

              {/* Wrist landmark */}
              <circle cx="120" cy="220" r="5" fill="var(--accent)" stroke="var(--primary)" strokeWidth="2" />

              {/* Scan corner marks */}
              <path d="M8 8 L8 28 M8 8 L28 8" stroke="var(--accent)" strokeWidth="3" />
              <path d="M232 8 L232 28 M232 8 L212 8" stroke="var(--accent)" strokeWidth="3" />
              <path d="M8 272 L8 252 M8 272 L28 272" stroke="var(--accent)" strokeWidth="3" />
              <path d="M232 272 L232 252 M232 272 L212 272" stroke="var(--accent)" strokeWidth="3" />
            </svg>

            {/* AI label badge */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'var(--primary)',
                color: '#C3F5E8',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: 1,
                padding: '4px 10px',
                border: '2px solid var(--accent)',
              }}
            >
              MEDIAPIPE ✦ LANDMARKS
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .comm-gap-section {
            padding: 60px 24px !important;
          }
          .comm-gap-inner {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  );
}
