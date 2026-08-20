import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserAvatar } from '@/components/UserAvatar'
import { diaryRepository } from '@/data/repositories/diaryRepository'
import { userRepository } from '@/data/repositories/userRepository'
import { PostCard } from '@/features/diary/PostCard'
import {
  useCommentsQuery,
  useDiaryPostQuery,
  useRepliesQuery,
} from '@/hooks/useDiaryQuery'
import type { DiaryComment } from '@/domain/models'
import { useSessionStore } from '@/stores/sessionStore'

export function PostDetailPage() {
  const { postId } = useParams()
  const userId = useSessionStore((s) => s.userId)
  const displayName = useSessionStore((s) => s.displayName)
  const { data: post } = useDiaryPostQuery(postId)
  const { data: comments = [] } = useCommentsQuery(postId)
  const { data: me } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userRepository.getUserById(userId),
    enabled: !!userId,
  })
  const [text, setText] = useState('')

  const add = useMutation({
    mutationFn: async () => {
      if (!postId || !me || !post) return
      await diaryRepository.addComment(
        postId,
        { ...me, name: displayName || me.name },
        text.trim(),
        post.authorId,
      )
    },
    onSuccess: () => setText(''),
    onError: () => toast.error('Không gửi được bình luận'),
  })

  if (!postId) return null

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/diary">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Bài viết</h1>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-full max-w-2xl space-y-4 p-4">
          {post ? <PostCard post={post} /> : null}
          {comments.map((c) => (
            <CommentBlock
              key={c.commentId}
              postId={postId}
              comment={c}
              me={me}
              displayName={displayName}
            />
          ))}
        </div>
      </ScrollArea>
      <form
        className="mx-auto flex w-full max-w-2xl gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) add.mutate()
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Viết bình luận"
        />
        <Button type="submit" disabled={!text.trim() || add.isPending}>
          Gửi
        </Button>
      </form>
    </div>
  )
}

function CommentBlock({
  postId,
  comment,
  me,
  displayName,
}: {
  postId: string
  comment: DiaryComment
  me: { userId: string; name: string; email: string; avatar: string } | undefined
  displayName: string
}) {
  const [open, setOpen] = useState(false)
  const [reply, setReply] = useState('')
  const { data: replies = [] } = useRepliesQuery(postId, comment.commentId, open)

  const like = useMutation({
    mutationFn: () => {
      if (!me) return Promise.resolve()
      return diaryRepository.toggleCommentLike(
        postId,
        comment.commentId,
        { ...me, name: displayName || me.name },
        comment.authorId,
      )
    },
  })

  const sendReply = useMutation({
    mutationFn: () => {
      if (!me) return Promise.resolve()
      return diaryRepository.addReply(
        postId,
        comment.commentId,
        { ...me, name: displayName || me.name },
        reply.trim(),
        comment.authorId,
        { userId: comment.authorId, name: comment.authorName },
      )
    },
    onSuccess: () => setReply(''),
  })

  return (
    <div className="rounded-lg border p-3">
      <div className="flex gap-2">
        <UserAvatar
          className="size-8"
          name={comment.authorName}
          src={comment.authorAvatarUrl}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{comment.authorName}</p>
          <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
          <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
            <button type="button" onClick={() => like.mutate()}>
              {comment.likedByMe ? 'Bỏ thích' : 'Thích'} ({comment.likeCount})
            </button>
            <button type="button" onClick={() => setOpen((v) => !v)}>
              Trả lời ({comment.replyCount})
            </button>
          </div>
          {open ? (
            <div className="mt-2 space-y-2">
              {replies.map((r) => (
                <div key={r.replyId} className="flex gap-2 pl-2">
                  <UserAvatar
                    className="size-7"
                    name={r.authorName}
                    src={r.authorAvatarUrl}
                  />
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{r.authorName}</span>
                      {r.mentionedName ? (
                        <span className="text-primary"> @{r.mentionedName}</span>
                      ) : null}{' '}
                      {r.text}
                    </p>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground"
                      onClick={() => {
                        if (!me) return
                        void diaryRepository.toggleReplyLike(
                          postId,
                          comment.commentId,
                          r.replyId,
                          { ...me, name: displayName || me.name },
                          r.authorId,
                        )
                      }}
                    >
                      {r.likedByMe ? 'Bỏ thích' : 'Thích'} ({r.likeCount})
                    </button>
                  </div>
                </div>
              ))}
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (reply.trim()) sendReply.mutate()
                }}
              >
                <Input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={`Trả lời ${comment.authorName}`}
                />
                <Button type="submit" size="sm">
                  Gửi
                </Button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
