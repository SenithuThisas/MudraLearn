import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fadeUp, slideLeft, slideRight, viewportConfig } from '../../hooks/useScrollAnimation';
import { Button } from '../ui/Button';

export default function CTA() {
  const navigate = useNavigate();
  return (
    <section
      style={{
        background: 'var(--primary)',
        padding: '80px 40px',
        textAlign: 'center',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Heading */}
        <motion.div
          variants={slideLeft}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: 'clamp(24px, 3vw, 36px)',
            color: '#ffffff',
            lineHeight: 1.4,
          }}
        >
          START SIGNING
        </motion.div>
        <motion.div
          variants={slideRight}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: 'clamp(24px, 3vw, 36px)',
            color: 'var(--accent)',
            lineHeight: 1.4,
          }}
        >
          TODAY.
        </motion.div>

        {/* Subtext */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          transition={{ delay: 0.3 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            color: '#9ca3af',
            maxWidth: 480,
            margin: '20px auto 0',
            lineHeight: 1.7,
          }}
        >
          Join 5,000+ Sri Lankans learning to connect through gestures. Your first lesson is waiting.
        </motion.p>

        {/* Button */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          transition={{ delay: 0.4 }}
          style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}
        >
          <Button
            variant="white"
            onClick={() => navigate('/splash?to=/signin')}
            className="cta-btn"
          >
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 11, padding: '4px 16px' }}>
              GET STARTED NOW
            </span>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
