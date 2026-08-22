import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authErrorMessage } from '../services/auth'
import DashboardShell from '../components/dashboard/DashboardShell'
import DeleteAccountModal from '../components/dashboard/DeleteAccountModal'
import PixelInput from '../components/auth/PixelInput'
import PixelButton from '../components/auth/PixelButton'

const CARD_STYLE: React.CSSProperties = {
  background: '#ffffff', border: '2px solid #14213D', boxShadow: '4px 4px 0px #14213D', padding: 24,
}
const CARD_TITLE_STYLE: React.CSSProperties = {
  fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#14213D', margin: '0 0 8px',
}
const CARD_DIVIDER_STYLE: React.CSSProperties = { width: 48, height: 3, background: '#6D28D9', marginBottom: 20 }

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()

  // Hooks must run unconditionally (rules-of-hooks) — the `!user` guard below
  // is purely for TS narrowing, so every hook has to sit above it, same
  // ordering DashboardPage uses with its query hooks.
  const [firstName, setFirstName] = useState(user?.first_name ?? '')
  const [lastName, setLastName] = useState(user?.last_name ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const deleteButtonWrapperRef = useRef<HTMLDivElement>(null)

  // ProtectedRoute guarantees a resolved, authenticated user before this page
  // renders — same guard used in DashboardPage, purely for type-narrowing.
  if (!user) return null

  const nameChanged = firstName.trim() !== (user.first_name ?? '') || lastName.trim() !== (user.last_name ?? '')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaveError('')
    setSaved(false)
    if (!firstName.trim() || !lastName.trim()) {
      setSaveError('First and last name are required.')
      return
    }
    setSaving(true)
    try {
      await updateProfile(firstName.trim(), lastName.trim())
      setSaved(true)
    } catch (err) {
      setSaveError(authErrorMessage(err, 'Could not save your changes. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardShell>
      <div className="dashboard-content" style={{ maxWidth: 640 }}>
        <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 20, color: '#14213D', margin: '8px 0 0' }}>
          ACCOUNT
        </h1>

        <div style={CARD_STYLE}>
          <h2 style={CARD_TITLE_STYLE}>EDIT PROFILE</h2>
          <div style={CARD_DIVIDER_STYLE} />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <PixelInput
              label="First Name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                setSaved(false)
              }}
              autoComplete="given-name"
            />
            <PixelInput
              label="Last Name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
                setSaved(false)
              }}
              autoComplete="family-name"
            />

            <PixelInput label="Email" value={user.email} disabled />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#6B7280', margin: '-12px 0 0' }}>
              Your email can&rsquo;t be changed.
            </p>

            <PixelInput label="Username" value={user.username ?? ''} disabled />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#6B7280', margin: '-12px 0 0' }}>
              Your username can&rsquo;t be changed.
            </p>

            {saveError && (
              <p role="alert" style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#DC2626', margin: 0 }}>
                {saveError}
              </p>
            )}
            {saved && !saveError && (
              <p role="status" aria-live="polite" style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#059669', margin: 0 }}>
                Saved.
              </p>
            )}

            <div>
              <PixelButton type="submit" variant="primary" disabled={saving || !nameChanged}>
                {saving ? 'Saving…' : 'Save Changes'}
              </PixelButton>
            </div>
          </form>
        </div>

        <div style={{ ...CARD_STYLE, border: '2px solid #DC2626', boxShadow: '4px 4px 0px #DC2626' }}>
          <h2 style={{ ...CARD_TITLE_STYLE, color: '#DC2626' }}>DANGER ZONE</h2>
          <div style={{ ...CARD_DIVIDER_STYLE, background: '#DC2626' }} />
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#374151', lineHeight: 1.6, margin: '0 0 20px' }}>
            Deleting your account permanently removes your progress, mastery scores, XP, and streak history.
            This cannot be undone.
          </p>
          {/* tabIndex so this wrapper is a valid programmatic focus target for
              the modal to return focus to on close — PixelButton isn't ref-
              forwarding, so the ref goes on the nearest focusable ancestor. */}
          <div ref={deleteButtonWrapperRef} tabIndex={-1} style={{ display: 'inline-block', outline: 'none' }}>
            <PixelButton
              variant="primary"
              style={{ background: '#DC2626' }}
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete Account
            </PixelButton>
          </div>
        </div>
      </div>

      <DeleteAccountModal
        open={deleteModalOpen}
        user={user}
        onClose={() => setDeleteModalOpen(false)}
        onDeleted={() => navigate('/signin', { replace: true })}
        triggerRef={deleteButtonWrapperRef}
      />
    </DashboardShell>
  )
}
