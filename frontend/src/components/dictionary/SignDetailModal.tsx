import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ReferencePlaceholder, ReferenceVideo } from '../practice/PracticeUi'
import { getSignTier, TIER_META, type TieredSign } from '../../utils/signTiers'

interface SignDetailModalProps {
  sign: TieredSign | null
  onClose: () => void
  triggerRef: RefObject<HTMLElement | null>
}

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Modal, not a route: keeps DictionaryPage's search/category-filter state intact
 * while browsing several signs in a row. Follows the same focus-trap/Escape/
 * backdrop-close pattern as DeleteAccountModal.tsx rather than a new one.
 */
export default function SignDetailModal({ sign, onClose, triggerRef }: SignDetailModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const open = sign !== null

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

  const tier = sign ? getSignTier(sign) : null
  const tierMeta = tier ? TIER_META[tier] : null

  return (
    <AnimatePresence>
      {open && sign && (
        <motion.div
          role="presentation"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/60 p-5"
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-detail-title"
            onClick={(e) => e.stopPropagation()}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="w-full max-w-md border-2 border-ink bg-white p-6 shadow-hard-lg outline-none"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 font-pixel text-[9px] uppercase leading-4 tracking-wide text-muted">
                  {sign.category}
                </p>
                <h2 id="sign-detail-title" className="font-pixel text-sm leading-6 text-ink">
                  {sign.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 border-2 border-ink bg-white px-2 py-1 font-pixel text-[10px] leading-4 shadow-hard-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                X
              </button>
            </div>

            {tierMeta && (
              <span className={`mb-4 inline-block border border-ink px-2 py-1 font-pixel text-[8px] leading-4 ${tierMeta.badgeClass}`}>
                {tierMeta.label}
              </span>
            )}

            {tier === 'has_clip' && <ReferenceVideo signId={sign.name} label={sign.name} />}
            {tier === 'practiceable_no_clip' && (
              <ReferencePlaceholder label="NO REFERENCE CLIP YET — RECOGNIZABLE IN PRACTICE" />
            )}
            {/* catalogue_only: no video, no fallback — name/category/badge above is the full view */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
