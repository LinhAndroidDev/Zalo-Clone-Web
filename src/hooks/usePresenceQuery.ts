import { useQuery } from '@tanstack/react-query'
import { presenceRepository } from '@/data/repositories/presenceRepository'
import type { PresenceStatus } from '@/domain/models'
import { useFirestoreSubscription } from '@/hooks/useFirestoreSubscription'

export function usePresenceQuery(userId: string | undefined, enabled = true) {
  useFirestoreSubscription<PresenceStatus>(
    ['presence', userId],
    (onData) => presenceRepository.observePresence(userId!, onData),
    enabled && !!userId,
  )

  return useQuery({
    queryKey: ['presence', userId],
    enabled: enabled && !!userId,
    queryFn: async (): Promise<PresenceStatus> => ({
      online: false,
      lastSeen: 0,
    }),
    staleTime: Infinity,
  })
}
