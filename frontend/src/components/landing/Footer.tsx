import { motion } from 'framer-motion';

export default function Footer() {
  const platformLinks = [
    { label: 'Lessons', href: '#how-it-works' },
    { label: 'Dictionary', href: '/dictionary' },
    { label: 'Community', href: '#community' },
  ];

  const companyLinks = [
    { label: 'Privacy Policy', href: '#privacy' },
    { label: 'Terms of Service', href: '#terms' },
    { label: 'Contact Us', href: '#contact' },
    { label: 'Accessibility', href: '#accessibility' },
  ];

  return (
    <footer
      style={{
        background: 'var(--primary)',
        borderTop: '2px solid var(--accent)',
        padding: '48px 80px',
        fontFamily: 'var(--font-body)',
      }}
      className="footer-section"
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: 40,
        }}
        className="footer-grid"
      >
        {/* Column 1 — Brand */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 18,
              color: '#ffffff',
            }}
          >
            MudraLearn
          </div>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: '#9ca3af',
              marginTop: 12,
              lineHeight: 1.6,
            }}
          >
            Empowering through Sinhala Sign Language. Built with ❤️ for the Sri Lankan Deaf Community.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            {/* GitHub */}
            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              style={{
                width: 36,
                height: 36,
                border: '2px solid #ffffff',
                boxShadow: 'var(--shadow-white)',
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
              whileHover={{ x: 2, y: 2, boxShadow: '2px 2px 0px #ffffff' }}
              whileTap={{ x: 3, y: 3, boxShadow: '0px 0px 0px #ffffff' }}
              onFocus={(e) => {
                e.currentTarget.style.outline = '2px solid var(--accent)';
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </motion.a>
            {/* Twitter/X */}
            <motion.a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter/X"
              style={{
                width: 36,
                height: 36,
                border: '2px solid #ffffff',
                boxShadow: 'var(--shadow-white)',
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
              whileHover={{ x: 2, y: 2, boxShadow: '2px 2px 0px #ffffff' }}
              whileTap={{ x: 3, y: 3, boxShadow: '0px 0px 0px #ffffff' }}
              onFocus={(e) => {
                e.currentTarget.style.outline = '2px solid var(--accent)';
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </motion.a>
          </div>
        </div>

        {/* Column 2 — Platform */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 12,
              color: '#ffffff',
              letterSpacing: 2,
              marginBottom: 16,
            }}
          >
            PLATFORM
          </div>
          {platformLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                display: 'block',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: '#9ca3af',
                textDecoration: 'none',
                marginTop: 8,
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
              onFocus={(e) => {
                e.currentTarget.style.outline = '2px solid var(--accent)';
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Column 3 — Company */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 12,
              color: '#ffffff',
              letterSpacing: 2,
              marginBottom: 16,
            }}
          >
            COMPANY
          </div>
          {companyLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                display: 'block',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: '#9ca3af',
                textDecoration: 'none',
                marginTop: 8,
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
              onFocus={(e) => {
                e.currentTarget.style.outline = '2px solid var(--accent)';
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.15)',
          marginTop: 40,
          paddingTop: 24,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: '#9ca3af',
            margin: 0,
          }}
        >
          © 2024 MudraLearn. Empowering through Sinhala Sign Language.
        </p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-section {
            padding: 40px 24px !important;
          }
          .footer-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .footer-grid > div:first-child > div:last-child {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
}
