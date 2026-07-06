import axios from 'axios'

const authApi = axios.create({
  baseURL: 'http://localhost:8000/api/auth',
  withCredentials: true,
})

export interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  username?: string
  auth_provider: 'google' | 'email'
  onboarding_complete: boolean
  is_new?: boolean
}

export interface AuthResponse {
  user: UserProfile
  access_token: string
  refresh_token: string
}

export async function googleCallback(idToken: string): Promise<AuthResponse> {
  const { data } = await authApi.post('/google/callback', { id_token: idToken })
  return data
}

export async function requestOTP(email: string): Promise<{ message: string; expires_in_minutes: number }> {
  const { data } = await authApi.post('/email/request-otp', { email })
  return data
}

export async function verifyOTP(email: string, otp: string): Promise<AuthResponse> {
  const { data } = await authApi.post('/email/verify-otp', { email, otp })
  return data
}

export async function checkUsername(u: string): Promise<{ available: boolean; error?: string }> {
  const { data } = await authApi.get('/username-available', { params: { u } })
  return data
}

export async function saveProfile(firstName: string, lastName: string): Promise<{ user: UserProfile }> {
  const { data } = await authApi.post('/onboarding/profile', { first_name: firstName, last_name: lastName })
  return data
}

export async function saveUsername(username: string): Promise<{ user: UserProfile }> {
  const { data } = await authApi.post('/onboarding/username', { username })
  return data
}

export async function refreshToken(token: string): Promise<{ access_token: string; refresh_token: string }> {
  const { data } = await authApi.post('/refresh', { refresh_token: token })
  return data
}

export async function logout(): Promise<void> {
  await authApi.post('/logout')
}

export async function getMe(): Promise<{ user: UserProfile }> {
  const { data } = await authApi.get('/me')
  return data
}
