import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { UserProfile } from '../services/auth'
import * as auth from '../services/auth'

interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  signInWithGoogle: (idToken: string) => Promise<UserProfile>
  signInWithPassword: (email: string, password: string) => Promise<UserProfile>
  completeSignup: (
    signupToken: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string,
  ) => Promise<UserProfile>
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

  // Returning-user login: password only, establishes the cookie session.
  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { user: profile } = await auth.login(email, password)
    setUser(profile)
    return profile
  }, [])

  // Final signup step: exchanges the signup_token from verifyOTP for a real
  // account + cookie session. This is the point the user becomes signed in.
  const completeSignup = useCallback(
    async (signupToken: string, password: string, firstName: string, lastName: string, username: string) => {
      const { user: profile } = await auth.completeSignup(signupToken, password, firstName, lastName, username)
      setUser(profile)
      return profile
    },
    [],
  )

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
        signInWithPassword,
        completeSignup,
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
