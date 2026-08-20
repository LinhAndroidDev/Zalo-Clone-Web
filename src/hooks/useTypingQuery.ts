import { useQuery } from '@tanstack/react-query'
import { chatRepository } from '@/data/repositories/chatRepository'
import { conversationRepository } from '@/data/repositories/conversationRepository'
import type { Conversation } from '@/domain/models'
import { useFirestoreSubscription } from '@/hooks/useFirestoreSubscription'
import { useSessionStore } from '@/stores/sessionStore'

export function useTypingQuery(peerId: string | undefined, enabled = true) {
  const userId = useSessionStore((s) => s.userId)

  useFirestoreSubscription<boolean>(
    ['typing', userId, peerId],
    (onData) => chatRepository.observeTyping(userId, peerId!, onData),
    enabled && !!userId && !!peerId,
  )

  return useQuery({
    queryKey: ['typing', userId, peerId],
    enabled: enabled && !!userId && !!peerId,
    queryFn: async () => false,
    staleTime: Infinity,
  })
}

export function usePeerSeenQuery(peerId: string | undefined, enabled = true) {
  const userId = useSessionStore((s) => s.userId)

  useFirestoreSubscription<Conversation | null>(
    ['peer-seen', peerId, userId],
    (onData) =>
      conversationRepository.observeConversation(peerId!, userId, onData),
    enabled && !!userId && !!peerId,
  )

  return useQuery({
    queryKey: ['peer-seen', peerId, userId],
    enabled: enabled && !!userId && !!peerId,
    queryFn: async () => null as Conversation | null,
    staleTime: Infinity,
  })
}
