import { useQuery } from '@tanstack/react-query'
import { conversationRepository } from '@/data/repositories/conversationRepository'
import type { Conversation } from '@/domain/models'
import { useFirestoreSubscription } from '@/hooks/useFirestoreSubscription'
import { useSessionStore } from '@/stores/sessionStore'

export function useInboxQuery() {
  const userId = useSessionStore((s) => s.userId)

  useFirestoreSubscription<Conversation[]>(
    ['inbox', userId],
    (onData) => conversationRepository.observeInbox(userId, onData),
    !!userId,
  )

  return useQuery({
    queryKey: ['inbox', userId],
    enabled: !!userId,
    queryFn: async () => [] as Conversation[],
    staleTime: Infinity,
  })
}
