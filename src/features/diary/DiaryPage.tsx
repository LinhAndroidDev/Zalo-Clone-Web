import { Bell, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserAvatar } from '@/components/UserAvatar'
import { PostCard } from '@/features/diary/PostCard'
import { useDiaryFeedQuery, useDiaryNotificationsQuery } from '@/hooks/useDiaryQuery'
import { useStoryRingsQuery } from '@/hooks/useStoryRingsQuery'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

export function DiaryPage() {
  const userId = useSessionStore((s) => s.userId)
  const { data: posts = [] } = useDiaryFeedQuery()
  const { data: rings = [] } = useStoryRingsQuery()
  const { data: notes = [] } = useDiaryNotificationsQuery()
  const unread = notes.filter((n) => !n.read).length
  const mine = rings.find((r) => r.isMe)

  return (
    <div className="flex h-full flex-col">
      <header className="mx-auto flex h-14 w-full max-w-2xl shrink-0 items-center justify-between px-4">
        <h1 className="text-lg font-semibold">Nhật ký</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/diary/notifications" className="relative">
              <Bell />
              {unread > 0 ? (
                <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />
              ) : null}
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/diary/post/new">Đăng bài</Link>
          </Button>
        </div>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-full max-w-2xl space-y-4 px-4 pb-8">
          <div className="flex gap-3 overflow-x-auto pb-2">
            <Link
              to={mine ? `/stories/view?authorId=${userId}` : '/stories/create'}
              className="flex w-16 shrink-0 flex-col items-center gap-1"
            >
              <div className="relative">
                <UserAvatar
                  name="Bạn"
                  src={mine?.authorAvatarUrl}
                  className={cn(
                    'size-14 ring-2 ring-offset-2',
                    mine?.hasUnseen ? 'ring-primary' : 'ring-muted',
                  )}
                />
                <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Plus className="size-3" />
                </span>
              </div>
              <span className="w-full truncate text-center text-[11px]">
                Của bạn
              </span>
            </Link>
            {rings
              .filter((r) => !r.isMe)
              .map((ring) => (
                <Link
                  key={ring.authorId}
                  to={`/stories/view?authorId=${ring.authorId}`}
                  className="flex w-16 shrink-0 flex-col items-center gap-1"
                >
                  <UserAvatar
                    name={ring.authorName}
                    src={ring.authorAvatarUrl}
                    className={cn(
                      'size-14 ring-2 ring-offset-2',
                      ring.hasUnseen ? 'ring-primary' : 'ring-muted',
                    )}
                  />
                  <span className="w-full truncate text-center text-[11px]">
                    {ring.authorName}
                  </span>
                </Link>
              ))}
          </div>
          {posts.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Chưa có bài viết. Hãy đăng bài hoặc kết bạn để xem nhật ký.
            </p>
          ) : (
            posts.map((post) => <PostCard key={post.postId} post={post} />)
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
