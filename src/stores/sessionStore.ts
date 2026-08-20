import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SessionState {
  userId: string
  displayName: string
  isLoggedIn: boolean
  language: 'VI' | 'EN'
  login: (userId: string, displayName: string) => void
  logout: () => void
  setLanguage: (lang: 'VI' | 'EN') => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      userId: '',
      displayName: '',
      isLoggedIn: false,
      language: 'VI',
      login: (userId, displayName) =>
        set({ userId, displayName, isLoggedIn: true }),
      logout: () =>
        set({ userId: '', displayName: '', isLoggedIn: false }),
      setLanguage: (language) => set({ language }),
    }),
    { name: 'zalo-clone-session' },
  ),
)
