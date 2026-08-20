import { useSyncExternalStore } from 'react'
import { useSessionStore } from '@/stores/sessionStore'

export function useSessionHydrated() {
  return useSyncExternalStore(
    (onChange) => useSessionStore.persist.onFinishHydration(onChange),
    () => useSessionStore.persist.hasHydrated(),
    () => false,
  )
}

