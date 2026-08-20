import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { chatRepository } from '@/data/repositories/chatRepository'
import type { Message } from '@/domain/models'
import type { SendMessageParams } from '@/domain/repositories'
import { useFirestoreSubscription } from '@/hooks/useFirestoreSubscription'
import { useSessionStore } from '@/stores/sessionStore'

export function useMessagesQuery(roomId: string | undefined) {
  useFirestoreSubscription<Message[]>(
    ['messages', roomId],
    (onData) => chatRepository.observeMessages(roomId!, onData),
    !!roomId,
  )

  return useQuery({
    queryKey: ['messages', roomId],
    enabled: !!roomId,
    queryFn: async () => [] as Message[],
    staleTime: Infinity,
  })
}

export function useSendMessageMutation() {
  return useMutation({
    mutationFn: (params: SendMessageParams) =>
      chatRepository.sendMessage(params),
  })
}

export function useMarkSeen(friendId: string | undefined) {
  const userId = useSessionStore((s) => s.userId)

  useEffect(() => {
    if (!userId || !friendId) return
    void chatRepository.markSeen(userId, friendId)
  }, [userId, friendId])
}
