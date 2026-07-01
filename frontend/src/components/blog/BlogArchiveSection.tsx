import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, viewportConfig } from '../../hooks/useScrollAnimation';

/* ── Card 1: Hand-landmark dot/line diagram (pastel mint) ── */
function LandmarkIllustration() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
      {/* Palm */}
      <rect x="90" y="50" width="100" height="70" fill="#C3F5E8" stroke="#1a2744" strokeWidth="3" />
      {/* Fingers */}
      <rect x="92" y="10" width="18" height="42" fill="#C3F5E8" stroke="#1a2744" strokeWidth="3" />
      <rect x="114" y="4" width="18" height="48" fill="#C3F5E8" stroke="#1a2744" strokeWidth="3" />
      <rect x="136" y="18" width="18" height="34" fill="#C3F5E8" stroke="#1a2744" strokeWidth="3" />
      <rect x="158" y="34" width="18" height="18" fill="#C3F5E8" stroke="#1a2744" strokeWidth="3" />
      {/* Thumb */}
      <rect x="74" y="56" width="18" height="34" fill="#C3F5E8" stroke="#1a2744" strokeWidth="3" />
      {/* Landmark dots */}
      <circle cx="101" cy="10" r="4" fill="#6025B8" stroke="#1a2744" strokeWidth="2" />
      <circle cx="123" cy="4" r="4" fill="#6025B8" stroke="#1a2744" strokeWidth="2" />
      <circle cx="145" cy="18" r="4" fill="#6025B8" stroke="#1a2744" strokeWidth="2" />
      <circle cx="167" cy="34" r="4" fill="#6025B8" stroke="#1a2744" strokeWidth="2" />
      <circle cx="83" cy="56" r="4" fill="#6025B8" stroke="#1a2744" strokeWidth="2" />
      {/* Connection lines */}
      <line x1="101" y1="10" x2="123" y2="4" stroke="#6025B8" strokeWidth="2" strokeDasharray="4 3" />
      <line x1="123" y1="4" x2="145" y2="18" stroke="#6025B8" strokeWidth="2" strokeDasharray="4 3" />
      <line x1="145" y1="18" x2="167" y2="34" stroke="#6025B8" strokeWidth="2" strokeDasharray="4 3" />
      {/* Wrist */}
      <rect x="98" y="118" width="84" height="20" fill="#C3F5E8" stroke="#1a2744" strokeWidth="3" />
    </svg>
  );
}

/* ── Card 2: Two arrows merging into one node (pastel blue) ── */
function MergeArchitectureIllustration() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
      {/* Left input arrow */}
      <rect x="20" y="20" width="60" height="24" fill="#C8E6FF" stroke="#1a2744" strokeWidth="3" rx="0" />
      <text x="50" y="36" textAnchor="middle" fontFamily="'Press Start 2P', monospace" fontSize="7" fill="#1a2744">LSTM</text>
      {/* Right input arrow */}
      <rect x="20" y="96" width="60" height="24" fill="#C8E6FF" stroke="#1a2744" strokeWidth="3" rx="0" />
      <text x="50" y="112" textAnchor="middle" fontFamily="'Press Start 2P', monospace" fontSize="7" fill="#1a2744">BiGRU</text>
      {/* Arrow lines merging */}
      <line x1="80" y1="32" x2="140" y2="58" stroke="#1a2744" strokeWidth="3" />
      <line x1="80" y1="108" x2="140" y2="82" stroke="#1a2744" strokeWidth="3" />
      {/* Arrowheads */}
      <polygon points="140,56 134,48 134,64" fill="#1a2744" />
      <polygon points="140,84 134,76 134,92" fill="#1a2744" />
      {/* Merge point / attention node */}
      <circle cx="160" cy="70" r="28" fill="#C8E6FF" stroke="#1a2744" strokeWidth="3" />
      <text x="160" y="74" textAnchor="middle" fontFamily="'Press Start 2P', monospace" fontSize="7" fill="#1a2744">ATTN</text>
      {/* Output arrow */}
      <line x1="188" y1="70" x2="240" y2="70" stroke="#1a2744" strokeWidth="3" />
      <polygon points="240,68 232,62 232,76" fill="#1a2744" />
    </svg>
  );
}

/* ── Card 3: Simplified grouped figures (pastel pink) ── */
function CommunityIllustration() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
      {/* Figure 1 - left */}
      <circle cx="60" cy="38" r="14" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />
      <rect x="46" y="54" width="28" height="36" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />
      {/* Arms */}
      <rect x="32" y="58" width="16" height="8" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />
      <rect x="72" y="58" width="16" height="8" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />
      {/* Legs */}
      <rect x="48" y="88" width="10" height="26" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />
      <rect x="62" y="88" width="10" height="26" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />

      {/* Figure 2 - center */}
      <circle cx="140" cy="34" r="14" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />
      <rect x="126" y="50" width="28" height="36" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />
      <rect x="112" y="54" width="16" height="8" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />
      <rect x="152" y="54" width="16" height="8" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />
      <rect x="128" y="84" width="10" height="26" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />
      <rect x="142" y="84" width="10" height="26" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />

      {/* Figure 3 - right */}
      <circle cx="220" cy="38" r="14" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />
      <rect x="206" y="54" width="28" height="36" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />
      <rect x="192" y="58" width="16" height="8" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />
      <rect x="232" y="58" width="16" height="8" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />
      <rect x="208" y="88" width="10" height="26" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />
      <rect x="222" y="88" width="10" height="26" fill="#FFD6E0" stroke="#1a2744" strokeWidth="3" />

      {/* Connecting lines between figures */}
      <line x1="88" y1="72" x2="112" y2="72" stroke="#6025B8" strokeWidth="2" strokeDasharray="4 3" />
      <line x1="168" y1="72" x2="192" y2="72" stroke="#6025B8" strokeWidth="2" strokeDasharray="4 3" />
    </svg>
  );
}

/* ── Card 4: Phone icon beside dictionary/book icon (pastel yellow) ── */
function ToolsIllustration() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
      {/* Phone */}
      <rect x="24" y="14" width="72" height="112" rx="8" fill="#FFF3B0" stroke="#1a2744" strokeWidth="3" />
      <rect x="32" y="22" width="56" height="8" rx="2" fill="#FFF3B0" stroke="#1a2744" strokeWidth="2" />
      <rect x="32" y="38" width="56" height="64" rx="2" fill="#FFF3B0" stroke="#1a2744" strokeWidth="2" />
      {/* Phone screen content - hand gesture icon */}
      <circle cx="60" cy="60" r="8" fill="#6025B8" stroke="#1a2744" strokeWidth="2" />
      <circle cx="60" cy="80" r="6" fill="#6025B8" stroke="#1a2744" strokeWidth="2" />
      <line x1="60" y1="60" x2="60" y2="74" stroke="#1a2744" strokeWidth="2" />
      <rect x="48" y="108" width="24" height="6" rx="3" fill="#FFF3B0" stroke="#1a2744" strokeWidth="2" />

      {/* Plus sign between */}
      <text x="112" y="78" textAnchor="middle" fontFamily="'Press Start 2P', monospace" fontSize="16" fill="#1a2744">+</text>

      {/* Dictionary / Book */}
      <rect x="134" y="18" width="56" height="104" fill="#FFF3B0" stroke="#1a2744" strokeWidth="3" />
      <rect x="134" y="18" width="56" height="12" fill="#6025B8" stroke="#1a2744" strokeWidth="3" />
      {/* Book spine */}
      <line x1="162" y1="30" x2="162" y2="122" stroke="#1a2744" strokeWidth="2" />
      {/* Text lines */}
      <rect x="146" y="40" width="28" height="3" fill="#1a2744" opacity="0.4" />
      <rect x="146" y="50" width="24" height="3" fill="#1a2744" opacity="0.4" />
      <rect x="146" y="60" width="32" height="3" fill="#1a2744" opacity="0.4" />
      <rect x="146" y="70" width="20" height="3" fill="#1a2744" opacity="0.4" />
      <rect x="146" y="80" width="28" height="3" fill="#1a2744" opacity="0.4" />
      <rect x="168" y="40" width="10" height="3" fill="#1a2744" opacity="0.4" />
      <rect x="168" y="50" width="10" height="3" fill="#1a2744" opacity="0.4" />
      <rect x="168" y="60" width="10" height="3" fill="#1a2744" opacity="0.4" />
      <rect x="168" y="70" width="10" height="3" fill="#1a2744" opacity="0.4" />
      <rect x="168" y="80" width="10" height="3" fill="#1a2744" opacity="0.4" />

      {/* Second book */}
      <rect x="200" y="22" width="52" height="100" fill="#FFF3B0" stroke="#1a2744" strokeWidth="3" />
      <rect x="200" y="22" width="52" height="12" fill="#6025B8" stroke="#1a2744" strokeWidth="3" />
      <rect x="210" y="42" width="28" height="3" fill="#1a2744" opacity="0.4" />
      <rect x="210" y="52" width="24" height="3" fill="#1a2744" opacity="0.4" />
      <rect x="210" y="62" width="32" height="3" fill="#1a2744" opacity="0.4" />
      <rect x="210" y="72" width="20" height="3" fill="#1a2744" opacity="0.4" />
      <rect x="210" y="82" width="28" height="3" fill="#1a2744" opacity="0.4" />
    </svg>
  );
}

/* ── Card 5: Simplified Sri Lanka map with pin markers (pastel mint) ── */
function MapIllustration() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
      {/* Sri Lanka simplified outline */}
      <path
        d="M140 12 C120 14 96 24 88 44 C82 58 84 72 78 84 C72 96 68 106 74 116 C80 126 96 130 110 128 C124 126 136 120 148 122 C160 124 170 130 180 126 C190 122 194 112 196 100 C198 88 196 74 190 62 C184 50 174 38 162 26 C154 18 148 12 140 12Z"
        fill="#C3F5E8"
        stroke="#1a2744"
        strokeWidth="3"
      />
      {/* Pin markers */}
      {/* Northern pin */}
      <circle cx="108" cy="44" r="5" fill="#6025B8" stroke="#1a2744" strokeWidth="2" />
      <line x1="108" y1="49" x2="108" y2="58" stroke="#1a2744" strokeWidth="2" />
      <polygon points="108,60 104,54 112,54" fill="#1a2744" />
      {/* Central pin */}
      <circle cx="148" cy="64" r="5" fill="#6025B8" stroke="#1a2744" strokeWidth="2" />
      <line x1="148" y1="69" x2="148" y2="78" stroke="#1a2744" strokeWidth="2" />
      <polygon points="148,80 144,74 152,74" fill="#1a2744" />
      {/* Southern pin */}
      <circle cx="162" cy="108" r="5" fill="#6025B8" stroke="#1a2744" strokeWidth="2" />
      <line x1="162" y1="113" x2="162" y2="122" stroke="#1a2744" strokeWidth="2" />
      <polygon points="162,124 158,118 166,118" fill="#1a2744" />
      {/* Eastern pin */}
      <circle cx="186" cy="78" r="5" fill="#6025B8" stroke="#1a2744" strokeWidth="2" />
      <line x1="186" y1="83" x2="186" y2="92" stroke="#1a2744" strokeWidth="2" />
      <polygon points="186,94 182,88 190,88" fill="#1a2744" />
    </svg>
  );
}

const archivePosts = [
  {
    meta: 'AUG 30 | RESEARCH',
    pastel: 'var(--pastel-mint)',
    Illustration: LandmarkIllustration,
    title: 'Inside the SSL400 Dataset: The Research That Made This Possible',
  },
  {
    meta: 'AUG 12 | ENGINEERING',
    pastel: 'var(--pastel-blue)',
    Illustration: MergeArchitectureIllustration,
    title: 'Why We Moved From LSTM to BiGRU with Attention',
  },
  {
    meta: 'JUL 28 | COMMUNITY',
    pastel: 'var(--pastel-pink)',
    Illustration: CommunityIllustration,
    title: "300,000 Voices: What the Research Says About Sri Lanka's Deaf Community",
  },
  {
    meta: 'JUL 10 | LANDSCAPE',
    pastel: 'var(--pastel-yellow)',
    Illustration: ToolsIllustration,
    title: 'Sanvaadha, Palmingo, and the Existing SSL Tools in Sri Lanka',
  },
  {
    meta: 'JUN 22 | LANGUAGE',
    pastel: 'var(--pastel-mint)',
    Illustration: MapIllustration,
    title: "One Language, Many Dialects: Regional Variation Across Sri Lanka's Deaf Schools",
  },
];

function ArchiveCard({
  meta,
  pastel,
  Illustration,
  title,
  index,
}: {
  meta: string;
  pastel: string;
  Illustration: React.ComponentType;
  title: string;
  index: number;
}) {
  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportConfig}
      transition={{ delay: index * 0.08 }}
      style={{
        border: 'var(--border)',
        boxShadow: 'var(--shadow)',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translate(-3px, -3px)';
        e.currentTarget.style.boxShadow = '8px 8px 0px #1a2744';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translate(0, 0)';
        e.currentTarget.style.boxShadow = 'var(--shadow)';
      }}
    >
      {/* Top illustration block */}
      <div
        style={{
          height: 140,
          background: pastel,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          borderBottom: 'var(--border)',
        }}
      >
        <Illustration />
      </div>

      {/* Bottom content block */}
      <div
        style={{
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flex: 1,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 11,
            color: '#4a5568',
            letterSpacing: 1,
          }}
        >
          {meta}
        </div>
        <h3
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: 'clamp(10px, 1.2vw, 13px)',
            color: 'var(--primary)',
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          {title}
        </h3>
        <div style={{ marginTop: 'auto' }}>
          <a
            href="#"
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 13,
              color: 'var(--accent)',
              textDecoration: 'none',
              borderBottom: '2px solid transparent',
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
          >
            READ ARTICLE →
          </a>
        </div>
      </div>
    </motion.article>
  );
}

export default function BlogArchiveSection() {
  return (
    <section
      style={{
        padding: '0 80px 100px',
        fontFamily: 'var(--font-body)',
      }}
      className="blog-archive-section"
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Section label row */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 40,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: 'clamp(16px, 2vw, 22px)',
              color: 'var(--primary)',
              whiteSpace: 'nowrap',
              margin: 0,
            }}
          >
            ARCHIVES
          </h2>
          <div
            style={{
              flex: 1,
              borderTop: '2px solid #1a2744',
            }}
          />
        </motion.div>

        {/* Grid: 3 columns */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}
          className="archive-grid"
        >
          {/* First 5 cards */}
          {archivePosts.map((post, i) => (
            <ArchiveCard key={post.meta} {...post} index={i} />
          ))}

          {/* Sixth slot — End of Feed card */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={{ delay: 5 * 0.08 }}
            style={{
              border: '2px dashed #1a2744',
              background: '#f0f0f0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 32,
              gap: 16,
              minHeight: 300,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: 'clamp(11px, 1.2vw, 14px)',
                color: 'var(--primary)',
                textAlign: 'center',
              }}
            >
              END OF FEED
            </span>
            <a
              href="#"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--accent)',
                textDecoration: 'underline',
              }}
            >
              SUBSCRIBE TO RSS
            </a>
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .archive-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .blog-archive-section {
            padding: 0 24px 64px !important;
          }
          .archive-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
