import { useQuery } from '@tanstack/react-query'
import { groupChatRepository } from '@/data/repositories/groupChatRepository'
import { userRepository } from '@/data/repositories/userRepository'
import type { GroupChat, MemberRead, User } from '@/domain/models'
import { useFirestoreSubscription } from '@/hooks/useFirestoreSubscription'

export function useGroupQuery(groupId: string | undefined, enabled = true) {
  useFirestoreSubscription<GroupChat>(
    ['group', groupId],
    (onData) => groupChatRepository.observeGroup(groupId!, onData),
    enabled && !!groupId,
  )

  return useQuery({
    queryKey: ['group', groupId],
    enabled: enabled && !!groupId,
    queryFn: () => groupChatRepository.getGroup(groupId!),
    staleTime: Infinity,
  })
}

export function useGroupMembersQuery(
  groupId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ['group-members', groupId],
    enabled: enabled && !!groupId,
    queryFn: () => groupChatRepository.loadGroupMembers(groupId!),
  })
}

export function useGroupTypingQuery(
  groupId: string | undefined,
  myUserId: string,
  enabled = true,
) {
  useFirestoreSubscription<string[]>(
    ['group-typing', groupId],
    (onData) =>
      groupChatRepository.observeGroupTyping(groupId!, myUserId, onData),
    enabled && !!groupId,
  )

  return useQuery({
    queryKey: ['group-typing', groupId],
    enabled: enabled && !!groupId,
    queryFn: async () => [] as string[],
    staleTime: Infinity,
  })
}

export function useGroupReadQuery(groupId: string | undefined, enabled = true) {
  useFirestoreSubscription<MemberRead[]>(
    ['group-read', groupId],
    (onData) => groupChatRepository.observeGroupMemberRead(groupId!, onData),
    enabled && !!groupId,
  )

  return useQuery({
    queryKey: ['group-read', groupId],
    enabled: enabled && !!groupId,
    queryFn: async () => [] as MemberRead[],
    staleTime: Infinity,
  })
}

export function useUsersMap(userIds: string[]) {
  return useQuery({
    queryKey: ['users-map', ...userIds.slice().sort()],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        userIds.map(async (id) => {
          try {
            const user = await userRepository.getUserById(id)
            return [id, user] as const
          } catch {
            const fallback: User = {
              userId: id,
              name: id,
              email: '',
              avatar: '',
            }
            return [id, fallback] as const
          }
        }),
      )
      return Object.fromEntries(entries) as Record<string, User>
    },
  })
}
