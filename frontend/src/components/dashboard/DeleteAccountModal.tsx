import { useEffect, useRef, useState, type RefObject } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import PixelButton from '../auth/PixelButton'
import PixelInput from '../auth/PixelInput'
import { useAuth } from '../../contexts/AuthContext'
import { authErrorMessage, type UserProfile } from '../../services/auth'

interface DeleteAccountModalProps {
  open: boolean
  user: UserProfile
  onClose: () => void
  /** Called once the account is confirmed gone — caller handles the redirect. */
  onDeleted: () => void
  triggerRef: RefObject<HTMLElement | null>
}

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Deliberately not a reuse of LogoutConfirmModal: this is irreversible, needs
 * its own re-auth input (password or, for a Google account with no password,
 * a typed confirmation phrase), and can fail with a server-side error that
 * the logout modal never has to handle.
 */
export default function DeleteAccountModal({ open, user, onClose, onDeleted, triggerRef }: DeleteAccountModalProps) {
  const { deleteAccount } = useAuth()
  const panelRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  // Matches the backend's own re-auth branch (delete_me() in auth.py): the
  // fact that decides which input to show is whether the account has a
  // password, not how it originated. auth_provider stays purely descriptive
  // (see google_callback()'s account-linking, which can leave a Google-
  // linked account with auth_provider='email' and a password_hash intact).
  const needsConfirmationPhrase = !user.has_password
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset the form fields whenever `open` flips (in either direction) — done
  // during render, not in an effect, to avoid the extra cascading render an
  // effect-based reset would cause (see react-hooks/set-state-in-effect).
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    setInputValue('')
    setError('')
    setSubmitting(false)
  }

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

  const handleConfirm = async () => {
    setError('')
    setSubmitting(true)
    try {
      if (needsConfirmationPhrase) {
        await deleteAccount({ confirmation: inputValue })
      } else {
        await deleteAccount({ password: inputValue })
      }
      onDeleted()
    } catch (err) {
      setError(authErrorMessage(err, 'Could not delete your account. Please try again.'))
      setSubmitting(false)
    }
  }

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
          onClick={submitting ? undefined : onClose}
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
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-body"
            onClick={(e) => e.stopPropagation()}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{
              background: '#ffffff', border: '2px solid #DC2626', boxShadow: '6px 6px 0px #DC2626',
              padding: 32, maxWidth: 420, width: '100%', fontFamily: "'Inter', sans-serif", outline: 'none',
            }}
          >
            <h2
              id="delete-modal-title"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 15, color: '#DC2626', margin: '0 0 16px', lineHeight: 1.6 }}
            >
              Delete your account?
            </h2>
            <p id="delete-modal-body" style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: '0 0 20px' }}>
              This permanently deletes your account and all progress, mastery scores, XP, and streak history.
              This action <strong>cannot be undone.</strong>
            </p>

            <div style={{ marginBottom: 20 }}>
              {needsConfirmationPhrase ? (
                <PixelInput
                  label={`Type your username ("${user.username}") to confirm`}
                  placeholder={user.username ?? ''}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  autoComplete="off"
                  autoFocus
                  disabled={submitting}
                  error={error || undefined}
                />
              ) : (
                <PixelInput
                  label="Enter your password to confirm"
                  type="password"
                  placeholder="Password"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  autoComplete="current-password"
                  autoFocus
                  disabled={submitting}
                  error={error || undefined}
                />
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <PixelButton variant="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </PixelButton>
              <PixelButton
                variant="primary"
                onClick={handleConfirm}
                disabled={submitting || !inputValue.trim()}
                style={{ background: '#DC2626' }}
              >
                {submitting ? 'Deleting…' : 'Delete my account'}
              </PixelButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
