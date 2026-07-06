import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { UserProfile } from '../services/auth'
import * as auth from '../services/auth'

interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  signInWithGoogle: (idToken: string) => Promise<UserProfile>
  signInWithOTP: (email: string, otp: string) => Promise<UserProfile>
  completeProfile: (firstName: string, lastName: string) => Promise<void>
  completeUsername: (username: string) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const { user: profile } = await auth.getMe()
      setUser(profile)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const signInWithGoogle = useCallback(async (idToken: string) => {
    const { user: profile } = await auth.googleCallback(idToken)
    setUser(profile)
    return profile
  }, [])

  const signInWithOTP = useCallback(async (email: string, otp: string) => {
    const { user: profile } = await auth.verifyOTP(email, otp)
    setUser(profile)
    return profile
  }, [])

  const completeProfile = useCallback(async (firstName: string, lastName: string) => {
    const { user: profile } = await auth.saveProfile(firstName, lastName)
    setUser(profile)
  }, [])

  const completeUsername = useCallback(async (username: string) => {
    const { user: profile } = await auth.saveUsername(username)
    setUser(profile)
  }, [])

  const signOut = useCallback(async () => {
    try {
      await auth.logout()
    } catch {
      // ignore
    }
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithOTP,
        completeProfile,
        completeUsername,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
