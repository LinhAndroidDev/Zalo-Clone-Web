import { useMutation, useQuery } from '@tanstack/react-query'
import { MessageCircle, MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from '@/components/UserAvatar'
import { EMOTION_EMOJI, EMOTION_TYPES, type EmotionType } from '@/config/constants'
import { diaryRepository } from '@/data/repositories/diaryRepository'
import { userRepository } from '@/data/repositories/userRepository'
import type { DiaryPost } from '@/domain/models'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

export function PostCard({ post }: { post: DiaryPost }) {
  const userId = useSessionStore((s) => s.userId)
  const displayName = useSessionStore((s) => s.displayName)
  const { data: me } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userRepository.getUserById(userId),
    enabled: !!userId,
  })

  const react = useMutation({
    mutationFn: (type: EmotionType) =>
      diaryRepository.setPostReaction(
        post.postId,
        {
          userId,
          name: displayName || me?.name || '',
          email: me?.email || '',
          avatar: me?.avatar || '',
        },
        post.myReaction === type ? null : type,
        post.authorId,
      ),
    onError: () => toast.error('Không thả cảm xúc được'),
  })

  const remove = useMutation({
    mutationFn: () => diaryRepository.deletePost(post.postId, userId),
    onError: () => toast.error('Không xóa được bài'),
  })

  const when = post.createdAtMillis
    ? new Date(post.createdAtMillis).toLocaleString('vi-VN')
    : ''

  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${post.authorId}`}>
          <UserAvatar
            name={post.authorName}
            src={post.authorAvatarUrl}
            className="size-10"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{post.authorName}</p>
          <p className="text-xs text-muted-foreground">{when}</p>
        </div>
        {post.authorId === userId ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => remove.mutate()}
              >
                Xóa bài
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      {post.content ? (
        <p className="mt-3 whitespace-pre-wrap break-words text-sm">
          {post.content}
        </p>
      ) : null}
      {post.linkPreview?.url ? (
        <a
          href={post.linkPreview.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block truncate text-sm text-primary underline"
        >
          {post.linkPreview.url}
        </a>
      ) : null}
      {post.imageUrls.length > 0 ? (
        <div
          className={cn(
            'mt-3 grid gap-1',
            post.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1',
          )}
        >
          {post.imageUrls.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              className="max-h-80 w-full rounded-lg object-cover"
            />
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-1">
        {EMOTION_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={cn(
              'rounded-full px-2 py-0.5 text-sm hover:bg-muted',
              post.myReaction === type ? 'bg-primary/10 ring-1 ring-primary' : '',
            )}
            onClick={() => react.mutate(type)}
          >
            {EMOTION_EMOJI[type]}
            {post.emotionSummary[type] ? (
              <span className="ml-1 text-xs">{post.emotionSummary[type]}</span>
            ) : null}
          </button>
        ))}
        <Link
          to={`/diary/post/${post.postId}`}
          className="ml-auto inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="size-4" />
          {post.commentCount}
        </Link>
      </div>
    </article>
  )
}
