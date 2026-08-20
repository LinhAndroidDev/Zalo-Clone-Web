import { Plus, Users } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserAvatar } from '@/components/UserAvatar'
import { useInboxQuery } from '@/hooks/useInboxQuery'
import { inboxRoomId } from '@/lib/roomId'
import { formatInboxTime } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

export function InboxList() {
  const userId = useSessionStore((s) => s.userId)
  const { pathname } = useLocation()
  const { data: conversations = [] } = useInboxQuery()

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <h1 className="text-lg font-semibold">Tin nhắn</h1>
        <Button variant="ghost" size="icon" asChild>
          <Link to="/chat/new-group" title="Tạo nhóm">
            <Plus />
          </Link>
        </Button>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        {conversations.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Chưa có cuộc trò chuyện. Kết bạn ở tab Danh bạ rồi nhắn tin.
          </p>
        ) : (
          <ul className="p-2">
            {conversations.map((c) => {
              const roomId = inboxRoomId(c, userId)
              const to = `/chat/${encodeURIComponent(roomId)}`
              const active = pathname === to
              const unread = !c.seen && c.numberUnSeen > 0
              return (
                <li key={c.roomDocId}>
                  <Link
                    to={to}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors',
                      active ? 'bg-primary/10' : 'hover:bg-muted/70',
                    )}
                  >
                    <div className="relative">
                      <UserAvatar name={c.person} src={c.friendImage} />
                      {c.isGroup ? (
                        <span className="absolute -right-0.5 -bottom-0.5 rounded-full bg-background p-0.5">
                          <Users className="size-3 text-primary" />
                        </span>
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium">{c.person}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatInboxTime(c.time)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            'truncate text-sm',
                            unread
                              ? 'font-medium text-foreground'
                              : 'text-muted-foreground',
                          )}
                        >
                          {c.typing && !c.isGroup ? 'Đang nhập...' : c.message}
                        </p>
                        {unread ? (
                          <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5">
                            {c.numberUnSeen}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}
