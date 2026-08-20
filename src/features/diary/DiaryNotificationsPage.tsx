import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserAvatar } from '@/components/UserAvatar'
import { diaryRepository } from '@/data/repositories/diaryRepository'
import { useDiaryNotificationsQuery } from '@/hooks/useDiaryQuery'
import { useSessionStore } from '@/stores/sessionStore'

const LABELS: Record<string, string> = {
  POST_REACTION: 'đã bày tỏ cảm xúc bài viết của bạn',
  POST_COMMENT: 'đã bình luận bài viết của bạn',
  COMMENT_LIKE: 'đã thích bình luận của bạn',
  COMMENT_REPLY: 'đã trả lời bình luận của bạn',
  REPLY_LIKE: 'đã thích trả lời của bạn',
}

export function DiaryNotificationsPage() {
  const userId = useSessionStore((s) => s.userId)
  const { data: items = [] } = useDiaryNotificationsQuery()

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/diary">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Thông báo</h1>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-full max-w-2xl">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Chưa có thông báo.
            </p>
          ) : (
            items.map((n) => (
              <Link
                key={n.id}
                to={`/diary/post/${n.postId}`}
                onClick={() => {
                  if (!n.read) {
                    void diaryRepository.markNotificationRead(userId, n.id)
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/60 ${n.read ? '' : 'bg-primary/5'}`}
              >
                <UserAvatar
                  name={n.actorName}
                  src={n.actorAvatarUrl}
                  className="size-10"
                />
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{n.actorName}</span>{' '}
                    {LABELS[n.type] ?? n.type}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
