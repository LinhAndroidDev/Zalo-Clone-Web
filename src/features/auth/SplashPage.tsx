import { Navigate } from 'react-router-dom'
import { useSessionHydrated } from '@/hooks/useSessionHydrated'
import { useSessionStore } from '@/stores/sessionStore'

export function SplashPage() {
  const hydrated = useSessionHydrated()
  const isLoggedIn = useSessionStore((s) => s.isLoggedIn)

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
          Z
        </div>
      </div>
    )
  }

  return <Navigate to={isLoggedIn ? '/home' : '/intro'} replace />
}
