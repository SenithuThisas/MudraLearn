import { useEffect, useState } from 'react'
import { checkUsername } from '../services/auth'

export type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken'

export interface UsernameAvailability {
  status: AvailabilityStatus
  /** Error/constraint message when status is 'taken' (or a format error). */
  error?: string
}

const MIN_LENGTH = 3
const DEBOUNCE_MS = 400

/**
 * Debounced (400ms) username availability check against /username-available.
 * Returns idle until the username reaches the minimum length, then checking,
 * then available/taken. Stale responses are ignored via a per-effect flag so a
 * fast typist never sees an out-of-order result.
 */
export function useUsernameAvailability(username: string): UsernameAvailability {
  const [state, setState] = useState<UsernameAvailability>({ status: 'idle' })

  useEffect(() => {
    if (username.length < MIN_LENGTH) {
      setState({ status: 'idle' })
      return
    }

    setState({ status: 'checking' })
    let cancelled = false

    const timer = setTimeout(async () => {
      try {
        const { available, error } = await checkUsername(username)
        if (cancelled) return
        setState(
          available ? { status: 'available' } : { status: 'taken', error: error ?? 'Username is already taken' },
        )
      } catch {
        if (cancelled) return
        setState({ status: 'taken', error: 'Could not check availability. Please try again.' })
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [username])

  return state
}
