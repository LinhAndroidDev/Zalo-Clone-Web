import { useMutation } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserAvatar } from '@/components/UserAvatar'
import { friendRepository } from '@/data/repositories/friendRepository'
import { userRepository } from '@/data/repositories/userRepository'
import {
  useIncomingRequestsQuery,
  useOutgoingRequestsQuery,
} from '@/hooks/useFriendsQuery'
import { useSessionStore } from '@/stores/sessionStore'

export function FriendRequestsPage() {
  const userId = useSessionStore((s) => s.userId)
  const displayName = useSessionStore((s) => s.displayName)
  const { data: incoming = [] } = useIncomingRequestsQuery()
  const { data: outgoing = [] } = useOutgoingRequestsQuery()

  const accept = useMutation({
    mutationFn: async (requestId: string) => {
      const request = incoming.find((r) => r.requestId === requestId)
      if (!request) return
      const me = await userRepository.getUserById(userId)
      await friendRepository.acceptFriendRequest(
        request,
        displayName || me.name,
        me.avatar,
      )
    },
    onError: () => toast.error('Không chấp nhận được lời mời'),
  })

  const reject = useMutation({
    mutationFn: (requestId: string) =>
      friendRepository.rejectFriendRequest(requestId),
    onError: () => toast.error('Không từ chối được'),
  })

  const cancel = useMutation({
    mutationFn: (toId: string) =>
      friendRepository.cancelFriendRequest(userId, toId),
    onError: () => toast.error('Không hủy được lời mời'),
  })

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2 lg:px-4">
        <Button variant="ghost" size="icon" asChild className="lg:hidden">
          <Link to="/contacts">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Lời mời kết bạn</h1>
      </header>
      <Tabs
        defaultValue="in"
        className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col"
      >
        <TabsList className="mx-4 mt-3">
          <TabsTrigger value="in">Nhận ({incoming.length})</TabsTrigger>
          <TabsTrigger value="out">Đã gửi ({outgoing.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="in" className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            {incoming.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Không có lời mời đến.
              </p>
            ) : (
              incoming.map((r) => (
                <div
                  key={r.requestId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Link to={`/profile/${r.fromId}`}>
                    <UserAvatar name={r.fromName} src={r.fromAvatar} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.fromName}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => accept.mutate(r.requestId)}
                    disabled={accept.isPending}
                  >
                    Đồng ý
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reject.mutate(r.requestId)}
                    disabled={reject.isPending}
                  >
                    Từ chối
                  </Button>
                </div>
              ))
            )}
          </ScrollArea>
        </TabsContent>
        <TabsContent value="out" className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            {outgoing.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Bạn chưa gửi lời mời nào.
              </p>
            ) : (
              outgoing.map((r) => (
                <div
                  key={r.requestId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <UserAvatar name={r.toName} src={r.toAvatar} />
                  <div className="min-h-0 flex-1">
                    <p className="truncate font-medium">{r.toName}</p>
                    <p className="text-xs text-muted-foreground">Đang chờ</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancel.mutate(r.toId)}
                    disabled={cancel.isPending}
                  >
                    Hủy
                  </Button>
                </div>
              ))
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
