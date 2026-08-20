import { useQuery } from '@tanstack/react-query'
import { friendRepository } from '@/data/repositories/friendRepository'
import type { Friend, FriendRequest } from '@/domain/models'
import { useFirestoreSubscription } from '@/hooks/useFirestoreSubscription'
import { useSessionStore } from '@/stores/sessionStore'

export function useFriendsQuery() {
  const userId = useSessionStore((s) => s.userId)

  useFirestoreSubscription<Friend[]>(
    ['friends', userId],
    (onData) => friendRepository.observeFriends(userId, onData),
    !!userId,
  )

  return useQuery({
    queryKey: ['friends', userId],
    enabled: !!userId,
    queryFn: async () => [] as Friend[],
    staleTime: Infinity,
  })
}

export function useIncomingRequestsQuery() {
  const userId = useSessionStore((s) => s.userId)

  useFirestoreSubscription<FriendRequest[]>(
    ['friend-requests', userId, 'in'],
    (onData) =>
      friendRepository.observeIncomingFriendRequests(userId, onData),
    !!userId,
  )

  return useQuery({
    queryKey: ['friend-requests', userId, 'in'],
    enabled: !!userId,
    queryFn: async () => [] as FriendRequest[],
    staleTime: Infinity,
  })
}

export function useOutgoingRequestsQuery() {
  const userId = useSessionStore((s) => s.userId)

  useFirestoreSubscription<FriendRequest[]>(
    ['friend-requests', userId, 'out'],
    (onData) =>
      friendRepository.observeOutgoingFriendRequests(userId, onData),
    !!userId,
  )

  return useQuery({
    queryKey: ['friend-requests', userId, 'out'],
    enabled: !!userId,
    queryFn: async () => [] as FriendRequest[],
    staleTime: Infinity,
  })
}
