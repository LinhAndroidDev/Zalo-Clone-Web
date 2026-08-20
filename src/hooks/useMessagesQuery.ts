import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { chatRepository } from '@/data/repositories/chatRepository'
import { groupChatRepository } from '@/data/repositories/groupChatRepository'
import type { Message, PinnedMessage } from '@/domain/models'
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

export function usePinnedQuery(roomId: string | undefined) {
  useFirestoreSubscription<PinnedMessage[]>(
    ['pinned', roomId],
    (onData) => chatRepository.observePinnedMessages(roomId!, onData),
    !!roomId,
  )

  return useQuery({
    queryKey: ['pinned', roomId],
    enabled: !!roomId,
    queryFn: async () => [] as PinnedMessage[],
    staleTime: Infinity,
  })
}

export function useSendMessageMutation() {
  return useMutation({
    mutationFn: (params: SendMessageParams) =>
      chatRepository.sendMessage(params),
  })
}

export function useMarkSeen(friendId: string | undefined, enabled = true) {
  const userId = useSessionStore((s) => s.userId)

  useEffect(() => {
    if (!enabled || !userId || !friendId) return
    void chatRepository.markSeen(userId, friendId)
  }, [userId, friendId, enabled])
}

export function useMarkGroupRead(
  groupId: string | undefined,
  lastReadTime: string | undefined,
  enabled = true,
) {
  const userId = useSessionStore((s) => s.userId)

  useEffect(() => {
    if (!enabled || !userId || !groupId || !lastReadTime) return
    void groupChatRepository.markGroupMessageRead(userId, groupId, lastReadTime)
  }, [userId, groupId, lastReadTime, enabled])
}
