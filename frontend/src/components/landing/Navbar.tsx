import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'About', href: '/about' },
    { label: 'Lessons', href: '#how-it-works' },
    { label: 'Dictionary', href: '/dictionary' },
    { label: 'Community', href: '#community' }

  ];

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderBottom: 'var(--border)',
        background: scrolled ? 'rgba(255,255,255,0.95)' : '#ffffff',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        transition: 'background 300ms ease',
        fontFamily: 'var(--font-body)',
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
        {/* Wordmark */}
        <a
          href="/"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 20,
            color: 'var(--primary)',
            textDecoration: 'none',
          }}
        >
          MudraLearn
        </a>

        {/* Desktop Nav */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 32 }}
          className="desktop-nav"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 15,
                color: 'var(--primary)',
                textDecoration: 'none',
                transition: 'color 200ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--primary)')}
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
          <Button 
            variant="primary" 
            onClick={() => (window.location.href = '/practice')}
            style={{ borderRadius: 10 }}
          >
            Get Started
          </Button>

        </div>

        {/* Mobile Hamburger */}
        <motion.button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: 'none',
            background: '#ffffff',
            border: 'var(--border)',
            boxShadow: 'var(--shadow-sm)',
            borderRadius: 0,
            width: 44,
            height: 44,
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
          whileHover={{ x: 2, y: 2, boxShadow: '1px 1px 0px #1a2744' }}
          whileTap={{ x: 3, y: 3, boxShadow: '0px 0px 0px #1a2744' }}
          aria-label="Toggle mobile menu"
          onFocus={(e) => {
            e.currentTarget.style.outline = '2px solid var(--accent)';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
        >
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
            <rect y="0" width="20" height="2" fill="var(--primary)" />
            <rect y="7" width="20" height="2" fill="var(--primary)" />
            <rect y="14" width="20" height="2" fill="var(--primary)" />
          </svg>
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              overflow: 'hidden',
              background: '#ffffff',
              borderBottom: 'var(--border)',
            }}
          >
            <div style={{ padding: '16px 40px 24px' }}>
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: 15,
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    padding: '12px 0',
                    borderBottom: 'var(--border)',
                    transition: 'color 200ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                >
                  {link.label}
                </a>
              ))}
              <div style={{ marginTop: 16 }}>
                <Button
                  variant="primary"
                  onClick={() => {
                    setMobileOpen(false);
                    window.location.href = '/practice';
                  }}
                  className="w-full"
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
