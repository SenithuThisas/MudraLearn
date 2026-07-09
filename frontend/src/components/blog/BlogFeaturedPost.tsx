import { motion } from 'framer-motion';
import { slideLeft, slideRight, viewportConfig } from '../../hooks/useScrollAnimation';

/** Flat calendar + hand-sign illustration — NO fake browser chrome */
function FeaturedIllustration() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 360 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Calendar showing 23rd beside a hand making a sign language gesture"
      style={{ display: 'block' }}
    >
      {/* ── Calendar ── */}
      {/* Calendar body */}
      <rect x="30" y="50" width="140" height="120" fill="#ffffff" stroke="#1a2744" strokeWidth="3" />
      {/* Calendar header bar */}
      <rect x="30" y="50" width="140" height="32" fill="#6025B8" stroke="#1a2744" strokeWidth="3" />
      {/* Header text label */}
      <text x="100" y="71" textAnchor="middle" fontFamily="'Press Start 2P', monospace" fontSize="9" fill="#ffffff">SEP</text>
      {/* Hanger pegs */}
      <rect x="64" y="40" width="8" height="18" fill="#1a2744" />
      <rect x="98" y="40" width="8" height="18" fill="#1a2744" />
      <rect x="132" y="40" width="8" height="18" fill="#1a2744" />
      {/* Big "23" number */}
      <text x="100" y="145" textAnchor="middle" fontFamily="'Press Start 2P', monospace" fontSize="44" fill="#1a2744">23</text>
      {/* Calendar grid dots */}
      {[55, 72, 89, 106, 123, 140].map((cx) =>
        [175, 188].map((cy) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" fill="#c8e6ff" />
        ))
      )}

      {/* ── Connecting lines ── */}
      <line x1="180" y1="150" x2="205" y2="150" stroke="#6025B8" strokeWidth="2.5" strokeDasharray="6 4" />

      {/* ── Hand sign ── */}
      {/* Wrist */}
      <rect x="210" y="210" width="70" height="36" fill="#FFF3B0" stroke="#1a2744" strokeWidth="3" />
      {/* Palm */}
      <rect x="196" y="120" width="100" height="96" fill="#FFF3B0" stroke="#1a2744" strokeWidth="3" />
      {/* Thumb */}
      <rect x="170" y="130" width="30" height="52" fill="#FFF3B0" stroke="#1a2744" strokeWidth="3" />
      {/* Index — raised */}
      <rect x="198" y="54" width="22" height="70" fill="#FFF3B0" stroke="#1a2744" strokeWidth="3" />
      {/* Middle — raised */}
      <rect x="224" y="44" width="22" height="80" fill="#FFF3B0" stroke="#1a2744" strokeWidth="3" />
      {/* Ring — half raised */}
      <rect x="250" y="74" width="22" height="50" fill="#FFF3B0" stroke="#1a2744" strokeWidth="3" />
      {/* Pinky — curled */}
      <rect x="276" y="104" width="18" height="22" fill="#FFF3B0" stroke="#1a2744" strokeWidth="3" />

      {/* AI landmark dots */}
      <circle cx="209" cy="54" r="5" fill="#6025B8" stroke="#1a2744" strokeWidth="2" />
      <circle cx="235" cy="44" r="5" fill="#6025B8" stroke="#1a2744" strokeWidth="2" />
      <circle cx="261" cy="74" r="5" fill="#6025B8" stroke="#1a2744" strokeWidth="2" />
      <circle cx="285" cy="104" r="5" fill="#C8E6FF" stroke="#1a2744" strokeWidth="2" />

      {/* AI detection lines */}
      <line x1="209" y1="54" x2="235" y2="44" stroke="#6025B8" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="235" y1="44" x2="261" y2="74" stroke="#6025B8" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* Corner scan markers */}
      <path d="M18 28 L18 44 M18 28 L34 28" stroke="#6025B8" strokeWidth="3" />
      <path d="M342 28 L342 44 M342 28 L326 28" stroke="#6025B8" strokeWidth="3" />
      <path d="M18 272 L18 256 M18 272 L34 272" stroke="#6025B8" strokeWidth="3" />
      <path d="M342 272 L342 256 M342 272 L326 272" stroke="#6025B8" strokeWidth="3" />
    </svg>
  );
}

export default function BlogFeaturedPost() {
  return (
    <div
      style={{
        margin: '40px 80px 80px',
        border: 'var(--border)',
        boxShadow: '6px 6px 0px var(--primary)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        minHeight: 340,
      }}
      className="blog-featured-card"
    >
      {/* Left — text content */}
      <motion.div
        variants={slideLeft}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        style={{
          background: '#ffffff',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        {/* LATEST pill */}
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              background: '#ede8ff',
              border: 'var(--border)',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 11,
              color: 'var(--accent)',
              letterSpacing: 1,
            }}
          >
            — LATEST
          </span>
        </div>

        {/* Meta */}
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 13,
            color: '#4a5568',
            letterSpacing: 1,
          }}
        >
          SEP 15 | AWARENESS
        </div>

        {/* Title */}
        <h2
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: 'clamp(13px, 1.6vw, 18px)',
            color: 'var(--primary)',
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          September 23: International Day of Sign Languages — Why It Matters for Sri Lanka
        </h2>

        {/* Description */}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            color: '#4a5568',
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          Exploring the cultural significance of SSL and the technological barriers we're breaking
          to ensure every Sri Lankan has a voice in the digital era.
        </p>

        {/* Read link */}
        <a
          href="#"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 14,
            color: 'var(--accent)',
            textDecoration: 'none',
            borderBottom: '2px solid transparent',
            alignSelf: 'flex-start',
            transition: 'border-color 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
        >
          READ ARTICLE →
        </a>
      </motion.div>

      {/* Right — flat illustration, NO fake browser chrome */}
      <motion.div
        variants={slideRight}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        style={{
          background: 'var(--pastel-yellow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          minHeight: 300,
        }}
      >
        <FeaturedIllustration />
      </motion.div>
    </div>
  );
}
