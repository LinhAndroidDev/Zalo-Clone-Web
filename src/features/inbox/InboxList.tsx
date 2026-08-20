import { Link, useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserAvatar } from '@/components/UserAvatar'
import { chatRepository } from '@/data/repositories/chatRepository'
import { useInboxQuery } from '@/hooks/useInboxQuery'
import { formatInboxTime } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

export function InboxList() {
  const userId = useSessionStore((s) => s.userId)
  const { pathname } = useLocation()
  const { data: conversations = [] } = useInboxQuery()

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center border-b px-4">
        <h1 className="text-lg font-semibold">Tin nhắn</h1>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        {conversations.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Chưa có cuộc trò chuyện. Kết bạn ở tab Danh bạ rồi nhắn tin.
          </p>
        ) : (
          <ul className="p-2">
            {conversations.map((c) => {
              const roomId = chatRepository.messageThreadDocumentId(
                c.friendId,
                userId,
              )
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
                    <UserAvatar name={c.person} src={c.friendImage} />
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
                          {c.message}
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
