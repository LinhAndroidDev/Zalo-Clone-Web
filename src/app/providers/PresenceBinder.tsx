import { useEffect } from 'react'
import { presenceRepository } from '@/data/repositories/presenceRepository'
import { useSessionStore } from '@/stores/sessionStore'

export function PresenceBinder() {
  const userId = useSessionStore((s) => s.userId)
  const isLoggedIn = useSessionStore((s) => s.isLoggedIn)

  useEffect(() => {
    if (!isLoggedIn || !userId) return
    presenceRepository.connect(userId)
    return () => presenceRepository.disconnect(userId)
  }, [isLoggedIn, userId])

  return null
}
