import { useEffect, useRef, type RefObject } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import PixelButton from '../auth/PixelButton'

interface LogoutConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  triggerRef: RefObject<HTMLElement>
}

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export default function LogoutConfirmModal({ open, onClose, onConfirm, triggerRef }: LogoutConfirmModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return

    const triggerNode = triggerRef.current
    panelRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      triggerNode?.focus()
    }
  }, [open, onClose, triggerRef])

  const panelVariants = {
    hidden: {
      opacity: 0,
      scale: reduceMotion ? 1 : 0.96,
      transition: { duration: reduceMotion ? 0.1 : 0.15, ease: 'easeIn' as const },
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: reduceMotion ? 0.1 : 0.25, ease: [0.16, 1, 0.3, 1] as const },
    },
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="presentation"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(20, 33, 61, 0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20,
          }}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            aria-describedby="logout-modal-body"
            onClick={(e) => e.stopPropagation()}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{
              background: '#ffffff', border: '2px solid #14213D', boxShadow: '6px 6px 0px #14213D',
              padding: 32, maxWidth: 380, width: '100%', fontFamily: "'Inter', sans-serif", outline: 'none',
            }}
          >
            <h2
              id="logout-modal-title"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 15, color: '#14213D', margin: '0 0 16px', lineHeight: 1.6 }}
            >
              Log out of MudraLearn?
            </h2>
            <p id="logout-modal-body" style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: '0 0 28px' }}>
              You&rsquo;ll need to sign back in to continue your streak.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <PixelButton variant="secondary" onClick={onClose}>
                Cancel
              </PixelButton>
              <PixelButton variant="primary" onClick={onConfirm} style={{ background: '#DC2626' }}>
                Log out
              </PixelButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
