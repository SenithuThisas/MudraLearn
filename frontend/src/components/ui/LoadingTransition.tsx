import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoadingTransitionProps {
  /** Route to navigate to after loading completes */
  destination: string;
  /** Minimum time (ms) the screen is shown — prevents flicker on fast connections */
  minDuration?: number;
  /** Optional promise to await before navigating. Loading ends when BOTH minDuration AND task resolve. */
  task?: Promise<unknown>;
  /** Called once the screen fades out and navigation happens */
  onComplete?: () => void;
}

// ─── Logo Mark ────────────────────────────────────────────────────────────────

function LogoMark() {
  return (
    <div
      style={{
        width: 88,
        height: 88,
        background: '#ffffff',
        border: '5px solid #6D28D9',
        boxShadow: '6px 6px 0px #6D28D9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        imageRendering: 'pixelated',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {/* Inner square — pixel-art nested square motif matching reference image */}
      <div
        style={{
          width: 44,
          height: 44,
          background: '#ffffff',
          border: '4px solid #6D28D9',
        }}
      />
    </div>
  );
}

// ─── Pixel Progress Bar ───────────────────────────────────────────────────────

interface ProgressBarProps {
  progress: number; // 0–1
}

function PixelProgressBar({ progress }: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        width: 280,
        height: 20,
        border: '2px solid #ffffff',
        background: 'transparent',
        position: 'relative',
        imageRendering: 'pixelated',
        flexShrink: 0,
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          background: '#6D28D9',
          originX: 0,
        }}
        animate={{ width: `${progress * 100}%` }}
        transition={{ ease: 'easeOut', duration: 0.25 }}
      />
    </div>
  );
}

// ─── Blinking Cursor ──────────────────────────────────────────────────────────

function BlinkingCursor() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 9,
        height: 14,
        background: '#6D28D9',
        marginLeft: 6,
        verticalAlign: 'middle',
        animation: 'ml-cursor-blink 0.85s step-end infinite',
      }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LoadingTransition({
  destination,
  minDuration = 1400,
  task,
  onComplete,
}: LoadingTransitionProps) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const doneRef = useRef(false);

  useEffect(() => {
    const startTime = Date.now();
    let animFrame: number;
    let taskDone = false;
    let timerDone = false;

    // Simulated progress phases:
    // Phase 1 (0–60% of minDuration): fills 0→70%  (fast start)
    // Phase 2 (60–100% of minDuration): fills 70→95% (slows before done)
    // Completion: jumps to 100% when both timer + task resolve
    function tick() {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / minDuration, 1);

      const simulated =
        t < 0.6
          ? (t / 0.6) * 0.7
          : 0.7 + ((t - 0.6) / 0.4) * 0.25;

      setProgress(simulated);

      if (t < 1) {
        animFrame = requestAnimationFrame(tick);
      } else {
        timerDone = true;
        maybeComplete();
      }
    }

    function maybeComplete() {
      if (doneRef.current) return;
      if (!timerDone || !taskDone) return;
      doneRef.current = true;

      // Snap to 100% then begin fade-out
      setProgress(1);
      setTimeout(() => setVisible(false), 280);
    }

    animFrame = requestAnimationFrame(tick);

    const taskPromise = task ?? Promise.resolve();
    taskPromise.finally(() => {
      taskDone = true;
      maybeComplete();
    });

    return () => cancelAnimationFrame(animFrame);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleExitComplete() {
    onComplete?.();
    navigate(destination, { replace: true });
  }

  return (
    <>
      <style>{`
        @keyframes ml-cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ml-cursor { animation: none !important; opacity: 1 !important; }
        }
      `}</style>

      <AnimatePresence onExitComplete={handleExitComplete}>
        {visible && (
          <motion.div
            key="loading-transition"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: '#14213D',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 28,
            }}
            role="status"
            aria-live="polite"
            aria-label="Loading, please wait"
          >
            {/* Logo mark */}
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <LogoMark />
            </motion.div>

            {/* Wordmark */}
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 'clamp(16px, 3.5vw, 26px)',
                color: '#ffffff',
                textShadow: '4px 4px 0px #6D28D9',
                letterSpacing: 2,
                margin: 0,
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              MUDRALEARN
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                color: '#6B7280',
                letterSpacing: 5,
                textTransform: 'uppercase' as const,
                margin: 0,
                textAlign: 'center',
              }}
            >
              SIGN LANGUAGE, REIMAGINED.
            </motion.p>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <PixelProgressBar progress={progress} />
            </motion.div>

            {/* Status text + blinking cursor */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 9,
                color: '#6B7280',
                letterSpacing: 2,
              }}
            >
              LOADING...
              <BlinkingCursor />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
