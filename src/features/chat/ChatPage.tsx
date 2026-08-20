import { ArrowLeft, Send } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserAvatar } from '@/components/UserAvatar'
import { MESSAGE_GROUP_GAP_MS, MESSAGE_TYPE } from '@/config/constants'
import { userRepository } from '@/data/repositories/userRepository'
import { useInboxQuery } from '@/hooks/useInboxQuery'
import {
  useMarkSeen,
  useMessagesQuery,
  useSendMessageMutation,
} from '@/hooks/useMessagesQuery'
import { otherUserIdFromRoom } from '@/lib/roomId'
import { formatChatTime, parseMessageTime } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

export function ChatPage() {
  const { roomId: encoded } = useParams()
  const roomId = encoded ? decodeURIComponent(encoded) : ''
  const userId = useSessionStore((s) => s.userId)
  const displayName = useSessionStore((s) => s.displayName)
  const friendId = otherUserIdFromRoom(roomId, userId)

  const { data: inbox = [] } = useInboxQuery()
  const { data: messages = [] } = useMessagesQuery(roomId)
  const sendMutation = useSendMessageMutation()
  useMarkSeen(friendId)

  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const inboxRow = inbox.find((c) => c.friendId === friendId)
  const { data: peerUser } = useQuery({
    queryKey: ['user', friendId],
    queryFn: () => userRepository.getUserById(friendId),
    enabled: !!friendId,
  })
  const { data: me } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userRepository.getUserById(userId),
    enabled: !!userId,
  })

  const peerName = peerUser?.name || inboxRow?.person || 'Chat'
  const peerAvatar = peerUser?.avatar || inboxRow?.friendImage || ''
  const myAvatar = me?.avatar || ''

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const grouped = useMemo(() => {
    return messages.map((msg, i) => {
      const prev = messages[i - 1]
      const prevMs = prev ? parseMessageTime(prev.time)?.getTime() : undefined
      const curMs = parseMessageTime(msg.time)?.getTime()
      const showTime =
        !prev ||
        prev.sender !== msg.sender ||
        (prevMs != null &&
          curMs != null &&
          curMs - prevMs > MESSAGE_GROUP_GAP_MS)
      return { msg, showTime }
    })
  }, [messages])

  function onSend() {
    const trimmed = text.trim()
    if (!trimmed || !friendId || !roomId) return
    sendMutation.mutate(
      {
        roomId,
        senderId: userId,
        senderName: displayName,
        senderAvatar: myAvatar,
        receiverId: friendId,
        receiverName: peerName,
        receiverAvatar: peerAvatar,
        text: trimmed,
      },
      {
        onSuccess: () => setText(''),
        onError: () => toast.error('Không gửi được tin nhắn'),
      },
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2 lg:px-4">
        <Button variant="ghost" size="icon" asChild className="lg:hidden">
          <Link to="/home">
            <ArrowLeft />
          </Link>
        </Button>
        <UserAvatar
          className="size-9"
          name={peerName}
          src={peerAvatar}
        />
        <div className="min-w-0">
          <p className="truncate font-medium">{peerName}</p>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1 bg-muted/20 px-3 py-3 lg:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-1">
          {grouped.map(({ msg, showTime }) => {
            const mine = msg.sender === userId
            const isSystem = msg.type === MESSAGE_TYPE.SYSTEM
            if (isSystem) {
              return (
                <p
                  key={msg.time}
                  className="my-2 text-center text-xs text-muted-foreground"
                >
                  {msg.message}
                </p>
              )
            }
            return (
              <div
                key={msg.time}
                className={cn('flex', mine ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3 py-2 text-sm sm:max-w-[70%]',
                    mine
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted',
                    showTime ? 'mt-2' : '',
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  {showTime ? (
                    <p
                      className={cn(
                        'mt-1 text-[10px]',
                        mine
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground',
                      )}
                    >
                      {formatChatTime(msg.time)}
                    </p>
                  ) : null}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t p-3 lg:px-6 lg:py-4">
        <form
          className="mx-auto flex w-full max-w-3xl gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            onSend()
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập tin nhắn"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!text.trim() || sendMutation.isPending}
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
