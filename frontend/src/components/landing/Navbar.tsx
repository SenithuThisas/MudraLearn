import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '../ui/Button';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { pathname } = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'About',     href: '/about' },
    { label: 'Blog',      href: '/blog' },
    { label: 'Lessons',   href: '#how-it-works' },
    { label: 'Community', href: '#community' },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        fontFamily: 'var(--font-body)',
        transition: shouldReduceMotion
          ? 'none'
          : 'box-shadow 300ms ease, border-bottom-color 300ms ease, background-color 300ms ease, backdrop-filter 300ms ease',
        backgroundColor: scrolled
          ? 'rgba(240, 236, 251, 0.90)'
          : 'rgba(255, 255, 255, 0.70)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '3px solid var(--primary)',
        boxShadow: scrolled
          ? '0 4px 12px rgba(26, 39, 68, 0.15)'
          : 'none',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}
      >
        {/* Logo mark */}
        <a
          href="/"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 12 }}
          aria-label="MudraLearn home"
        >
          {/* Pixel hand icon box — hard border + offset shadow */}
          <div
            style={{
              width: 36,
              height: 36,
              border: '2.5px solid var(--primary)',
              boxShadow: '3px 3px 0px 0px var(--primary)',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {!shouldReduceMotion && (
              <div
                className="ml-scanline"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0, bottom: 0, left: 0,
                  width: '60%',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%)',
                  pointerEvents: 'none',
                }}
              />
            )}
            <svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden="true">
              <rect x="3" y="9" width="12" height="9" fill="#f3eeff" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="0" y="10" width="4" height="6" fill="#f3eeff" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="3" y="2" width="3" height="8" fill="#f3eeff" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="7" y="0" width="3" height="10" fill="#f3eeff" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="11" y="3" width="3" height="7" fill="#f3eeff" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="14" y="6" width="2" height="5" fill="#f3eeff" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Wordmark — single-line, bold, same pixel font as hero headline */}
          <span
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: 'clamp(16px, 2.2vw, 22px)',
              lineHeight: 1,
              color: 'var(--primary)',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            MudraLearn
          </span>
        </a>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="desktop-nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              href={link.href}
              label={link.label}
              isActive={
                link.href.startsWith('#')
                  ? false
                  : pathname === link.href
              }
              reduceMotion={!!shouldReduceMotion}
            />
          ))}
          <div style={{ width: 12 }} aria-hidden="true" />
          <Button variant="primary" onClick={() => (window.location.href = '/signin')} style={{ borderRadius: 0 }}>
            Get Started
          </Button>
        </div>

        {/* Mobile hamburger */}
        <motion.button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: 'none',
            background: 'var(--pastel-yellow)',
            border: 'var(--border)',
            boxShadow: '3px 3px 0px var(--primary)',
            borderRadius: 0,
            width: 44, height: 44,
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
          whileHover={{ x: -2, y: -2, boxShadow: '5px 5px 0px var(--primary)' }}
          whileTap={{ x: 2, y: 2, boxShadow: '1px 1px 0px var(--primary)' }}
          aria-label="Toggle mobile menu"
          aria-expanded={mobileOpen}
          onFocus={(e) => { e.currentTarget.style.outline = '2px solid var(--accent)'; e.currentTarget.style.outlineOffset = '2px'; }}
          onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
        >
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden="true">
            <rect y="0"  width="20" height="2.5" fill="var(--primary)" />
            <rect y="7"  width={mobileOpen ? 14 : 20} height="2.5" fill="var(--primary)" />
            <rect y="14" width={mobileOpen ? 8  : 20} height="2.5" fill="var(--primary)" />
          </svg>
        </motion.button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: 'easeInOut' }}
            style={{
              overflow: 'hidden',
              borderTop: '2px solid var(--primary)',
              backgroundColor: 'rgba(240,236,251,0.96)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ padding: '16px 40px 24px' }}>
              {navLinks.map((link, i) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15,
                    color: pathname === link.href ? 'var(--accent)' : 'var(--primary)',
                    textDecoration: 'none',
                    padding: '12px 0',
                    borderBottom: i < navLinks.length - 1 ? '1px solid rgba(26,39,68,0.15)' : 'none',
                    transition: shouldReduceMotion ? 'none' : 'color 150ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = pathname === link.href ? 'var(--accent)' : 'var(--primary)')}
                >
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 8, color: 'var(--accent)', opacity: 0.6 }}>▶</span>
                  {link.label}
                </a>
              ))}
              <div style={{ marginTop: 20 }}>
                <Button
                  variant="primary"
                  onClick={() => { setMobileOpen(false); window.location.href = '/signin'; }}
                  className="w-full"
                  style={{ borderRadius: 0 }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

/* ─── NavLink sub-component ──────────────────────────────── */

function NavLink({
  href,
  label,
  isActive,
  reduceMotion,
}: {
  href: string;
  label: string;
  isActive: boolean;
  reduceMotion: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const showUnderline = isActive || hovered;

  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 14,
        color: showUnderline ? 'var(--accent)' : 'var(--primary)',
        textDecoration: 'none',
        padding: '6px 12px',
        transition: reduceMotion ? 'none' : 'color 200ms ease',
        outline: 'none',
      }}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}

      {/* Animated underline — absolutely positioned, no layout shift */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 2,
          left: 12,
          right: 12,
          height: 2.5,
          background: 'var(--accent)',
          transformOrigin: 'left',
          transform: showUnderline ? 'scaleX(1)' : 'scaleX(0)',
          transition: reduceMotion ? 'none' : 'transform 200ms ease',
        }}
      />
    </a>
  );
}
