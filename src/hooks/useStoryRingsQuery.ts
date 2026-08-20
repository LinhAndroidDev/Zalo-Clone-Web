import { useQuery } from '@tanstack/react-query'
import { storyRepository } from '@/data/repositories/storyRepository'
import type { StoryRing } from '@/domain/models'
import { useFriendsQuery } from '@/hooks/useFriendsQuery'
import { useFirestoreSubscription } from '@/hooks/useFirestoreSubscription'
import { useSessionStore } from '@/stores/sessionStore'

export function useStoryRingsQuery() {
  const userId = useSessionStore((s) => s.userId)
  const { data: friends = [] } = useFriendsQuery()
  const friendIds = friends.map((f) => f.keyAuth)

  useFirestoreSubscription<StoryRing[]>(
    ['story-rings', userId, friendIds.join(',')],
    (onData) =>
      storyRepository.observeStoryRings(userId, friendIds, onData),
    !!userId,
  )

  return useQuery({
    queryKey: ['story-rings', userId, friendIds.join(',')],
    enabled: !!userId,
    queryFn: async () => [] as StoryRing[],
    staleTime: Infinity,
  })
}
