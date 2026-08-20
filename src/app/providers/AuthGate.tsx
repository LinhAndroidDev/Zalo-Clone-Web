import { Navigate } from 'react-router-dom'
import { useSessionHydrated } from '@/hooks/useSessionHydrated'
import { useSessionStore } from '@/stores/sessionStore'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const hydrated = useSessionHydrated()
  const isLoggedIn = useSessionStore((s) => s.isLoggedIn)

  if (!hydrated) {
    return <div className="flex h-dvh items-center justify-center text-sm text-muted-foreground">Đang tải...</div>
  }
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <>{children}</>
}
