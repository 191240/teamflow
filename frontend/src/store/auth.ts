import { create } from 'zustand'
import type { AuthResponse } from '../types'

interface AuthState {
  token: string | null
  user: AuthResponse | null
  setAuth: (auth: AuthResponse) => void
  logout: () => void
}

const storedToken = localStorage.getItem('teamflow_token')
const storedUser = localStorage.getItem('teamflow_user')

export const useAuthStore = create<AuthState>((set) => ({
  token: storedToken,
  user: storedUser ? JSON.parse(storedUser) as AuthResponse : null,
  setAuth: (auth) => {
    if (auth.token) localStorage.setItem('teamflow_token', auth.token)
    localStorage.setItem('teamflow_user', JSON.stringify(auth))
    set({ token: auth.token ?? storedToken, user: auth })
  },
  logout: () => {
    localStorage.removeItem('teamflow_token')
    localStorage.removeItem('teamflow_user')
    set({ token: null, user: null })
  }
}))
