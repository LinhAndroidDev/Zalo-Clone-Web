import { UserPlus } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserAvatar } from '@/components/UserAvatar'
import { chatRepository } from '@/data/repositories/chatRepository'
import {
  useFriendsQuery,
  useIncomingRequestsQuery,
} from '@/hooks/useFriendsQuery'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

export function ContactsList() {
  const userId = useSessionStore((s) => s.userId)
  const { pathname } = useLocation()
  const { data: friends = [] } = useFriendsQuery()
  const { data: incoming = [] } = useIncomingRequestsQuery()

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <h1 className="text-lg font-semibold">Danh bạ</h1>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/contacts/requests">
            <UserPlus className="size-4" />
            Lời mời
            {incoming.length > 0 ? (
              <Badge className="ml-1">{incoming.length}</Badge>
            ) : null}
          </Link>
        </Button>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        {friends.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Chưa có bạn bè. Mở lời mời kết bạn để chấp nhận.
          </p>
        ) : (
          <ul className="p-2">
            {friends.map((f) => {
              const roomId = chatRepository.messageThreadDocumentId(
                f.keyAuth,
                userId,
              )
              const chatTo = `/chat/${encodeURIComponent(roomId)}`
              const active =
                pathname === chatTo || pathname === `/profile/${f.keyAuth}`
              return (
                <li key={f.keyAuth}>
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors',
                      active ? 'bg-primary/10' : 'hover:bg-muted/70',
                    )}
                  >
                    <Link to={`/profile/${f.keyAuth}`} className="shrink-0">
                      <UserAvatar name={f.name} src={f.avatar} />
                    </Link>
                    <Link
                      to={chatTo}
                      className="min-w-0 flex-1 truncate font-medium"
                    >
                      {f.name}
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}
