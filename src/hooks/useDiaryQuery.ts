import { useQuery } from '@tanstack/react-query'
import { diaryRepository } from '@/data/repositories/diaryRepository'
import type {
  DiaryComment,
  DiaryNotification,
  DiaryPost,
  DiaryReply,
} from '@/domain/models'
import { useFirestoreSubscription } from '@/hooks/useFirestoreSubscription'
import { useSessionStore } from '@/stores/sessionStore'

export function useDiaryFeedQuery() {
  const userId = useSessionStore((s) => s.userId)
  useFirestoreSubscription<DiaryPost[]>(
    ['diary-feed', userId],
    (onData) => diaryRepository.observeFeed(userId, onData),
    !!userId,
  )
  return useQuery({
    queryKey: ['diary-feed', userId],
    enabled: !!userId,
    queryFn: async () => [] as DiaryPost[],
    staleTime: Infinity,
  })
}

export function useDiaryPostQuery(postId: string | undefined) {
  return useQuery({
    queryKey: ['post', postId],
    enabled: !!postId,
    queryFn: () => diaryRepository.getPost(postId!),
  })
}

export function useCommentsQuery(postId: string | undefined) {
  const userId = useSessionStore((s) => s.userId)
  useFirestoreSubscription<DiaryComment[]>(
    ['comments', postId],
    (onData) => diaryRepository.observeComments(postId!, userId, onData),
    !!postId && !!userId,
  )
  return useQuery({
    queryKey: ['comments', postId],
    enabled: !!postId && !!userId,
    queryFn: async () => [] as DiaryComment[],
    staleTime: Infinity,
  })
}

export function useRepliesQuery(
  postId: string | undefined,
  commentId: string | undefined,
  enabled: boolean,
) {
  const userId = useSessionStore((s) => s.userId)
  useFirestoreSubscription<DiaryReply[]>(
    ['replies', postId, commentId],
    (onData) =>
      diaryRepository.observeReplies(postId!, commentId!, userId, onData),
    enabled && !!postId && !!commentId && !!userId,
  )
  return useQuery({
    queryKey: ['replies', postId, commentId],
    enabled: enabled && !!postId && !!commentId,
    queryFn: async () => [] as DiaryReply[],
    staleTime: Infinity,
  })
}

export function useDiaryNotificationsQuery() {
  const userId = useSessionStore((s) => s.userId)
  useFirestoreSubscription<DiaryNotification[]>(
    ['diary-notifications', userId],
    (onData) => diaryRepository.observeNotifications(userId, onData),
    !!userId,
  )
  return useQuery({
    queryKey: ['diary-notifications', userId],
    enabled: !!userId,
    queryFn: async () => [] as DiaryNotification[],
    staleTime: Infinity,
  })
}
