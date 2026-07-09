import { useMemo } from 'react'

export interface PasswordChecks {
  length: boolean       // 8+ characters
  uppercase: boolean    // one uppercase letter
  number: boolean       // one digit
  special: boolean      // one special character
}

export interface PasswordStrength {
  checks: PasswordChecks
  /** Number of requirements met, 0–4. */
  score: number
  /** Human label for the score, tied to the meter. */
  label: 'Empty' | 'Weak' | 'Fair' | 'Good' | 'Strong'
  /** All four requirements satisfied. */
  allMet: boolean
}

const LABELS: PasswordStrength['label'][] = ['Empty', 'Weak', 'Fair', 'Good', 'Strong']

/**
 * Derive password requirement checks and a 0–4 strength score from a password.
 * Pure/memoised — the single source of truth for both the requirement checklist
 * and the strength meter on the password step.
 */
export function usePasswordStrength(password: string): PasswordStrength {
  return useMemo(() => {
    const checks: PasswordChecks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }
    const score = Object.values(checks).filter(Boolean).length
    return {
      checks,
      score,
      label: password.length === 0 ? 'Empty' : LABELS[score],
      allMet: score === 4,
    }
  }, [password])
}
