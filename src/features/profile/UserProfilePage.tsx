import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/UserAvatar'
import { chatRepository } from '@/data/repositories/chatRepository'
import { friendRepository } from '@/data/repositories/friendRepository'
import { userRepository } from '@/data/repositories/userRepository'
import { useSessionStore } from '@/stores/sessionStore'

export function UserProfilePage() {
  const { userId: otherId } = useParams()
  const myId = useSessionStore((s) => s.userId)
  const displayName = useSessionStore((s) => s.displayName)

  const { data: user } = useQuery({
    queryKey: ['user', otherId],
    queryFn: () => userRepository.getUserById(otherId!),
    enabled: !!otherId,
  })

  const { data: status, refetch } = useQuery({
    queryKey: ['friendship', myId, otherId],
    queryFn: () => friendRepository.getFriendshipStatus(myId, otherId!),
    enabled: !!otherId && !!myId,
  })

  const send = useMutation({
    mutationFn: async () => {
      if (!user) return
      const me = await userRepository.getUserById(myId)
      await friendRepository.sendFriendRequest(
        { ...me, name: displayName || me.name },
        user,
      )
    },
    onSuccess: () => {
      toast.success('Đã gửi lời mời kết bạn')
      void refetch()
    },
    onError: () => toast.error('Không gửi được lời mời'),
  })

  if (!otherId) return null

  const roomId = chatRepository.messageThreadDocumentId(otherId, myId)
  const isMe = otherId === myId

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2 lg:px-4">
        <Button variant="ghost" size="icon" asChild className="lg:hidden">
          <Link to="/contacts">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Hồ sơ</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-xl border bg-card p-6 lg:p-8">
          <UserAvatar
            className="size-24 lg:size-28"
            name={user?.name ?? ''}
            src={user?.avatar}
          />
          <h2 className="text-xl font-semibold lg:text-2xl">{user?.name}</h2>
          {!isMe && status === 'friend' ? (
            <Button asChild>
              <Link to={`/chat/${encodeURIComponent(roomId)}`}>Nhắn tin</Link>
            </Button>
          ) : null}
          {!isMe && status === 'none' ? (
            <Button onClick={() => send.mutate()} disabled={send.isPending}>
              Kết bạn
            </Button>
          ) : null}
          {!isMe && status === 'pending_sent' ? (
            <p className="text-sm text-muted-foreground">Đã gửi lời mời</p>
          ) : null}
          {!isMe && status === 'pending_received' ? (
            <Button asChild variant="outline">
              <Link to="/contacts/requests">Xem lời mời</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
