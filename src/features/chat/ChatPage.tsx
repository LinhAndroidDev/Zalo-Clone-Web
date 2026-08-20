import { ArrowLeft, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserAvatar } from '@/components/UserAvatar'
import { MESSAGE_GROUP_GAP_MS, MESSAGE_TYPE, TYPING_IDLE_MS } from '@/config/constants'
import { mediaUploadRepository } from '@/data/repositories/mediaUploadRepository'
import { chatRepository } from '@/data/repositories/chatRepository'
import { groupChatRepository } from '@/data/repositories/groupChatRepository'
import { userRepository } from '@/data/repositories/userRepository'
import { ChatComposer } from '@/features/chat/ChatComposer'
import { GroupMembersSheet } from '@/features/chat/GroupMembersSheet'
import { MessageBubble } from '@/features/chat/MessageBubble'
import { PinnedBar } from '@/features/chat/PinnedBar'
import { useInboxQuery } from '@/hooks/useInboxQuery'
import {
  useGroupMembersQuery,
  useGroupQuery,
  useGroupReadQuery,
  useGroupTypingQuery,
} from '@/hooks/useGroupQuery'
import {
  useMarkGroupRead,
  useMarkSeen,
  useMessagesQuery,
  usePinnedQuery,
  useSendMessageMutation,
} from '@/hooks/useMessagesQuery'
import { usePresenceQuery } from '@/hooks/usePresenceQuery'
import { usePeerSeenQuery, useTypingQuery } from '@/hooks/useTypingQuery'
import { inboxRoomId, isPairRoomId, otherUserIdFromRoom } from '@/lib/roomId'
import { formatLastSeen } from '@/lib/messageMedia'
import { parseMessageTime } from '@/lib/time'
import type { MessageMention, MessageReply, UploadedPhoto } from '@/domain/models'
import { useSessionStore } from '@/stores/sessionStore'

export function ChatPage() {
  const { roomId: encoded } = useParams()
  const roomId = encoded ? decodeURIComponent(encoded) : ''
  const userId = useSessionStore((s) => s.userId)
  const displayName = useSessionStore((s) => s.displayName)
  const { data: inbox = [] } = useInboxQuery()
  const isGroup = !isPairRoomId(roomId)
  const peerId = isGroup ? '' : otherUserIdFromRoom(roomId, userId)
  const inboxRow = inbox.find((c) => inboxRoomId(c, userId) === roomId)

  const { data: messages = [] } = useMessagesQuery(roomId)
  const { data: pinned = [] } = usePinnedQuery(roomId)
  const sendMutation = useSendMessageMutation()
  useMarkSeen(isGroup ? undefined : peerId, !isGroup)
  const lastTime = messages[messages.length - 1]?.time
  useMarkGroupRead(isGroup ? roomId : undefined, lastTime, isGroup)

  const { data: group } = useGroupQuery(isGroup ? roomId : undefined, isGroup)
  const { data: members = [] } = useGroupMembersQuery(
    isGroup ? roomId : undefined,
    isGroup,
  )
  const { data: groupTyping = [] } = useGroupTypingQuery(
    isGroup ? roomId : undefined,
    userId,
    isGroup,
  )
  const { data: reads = [] } = useGroupReadQuery(
    isGroup ? roomId : undefined,
    isGroup,
  )
  const { data: peerTyping = false } = useTypingQuery(peerId, !isGroup)
  const { data: peerSeen } = usePeerSeenQuery(peerId, !isGroup)
  const { data: presence } = usePresenceQuery(peerId, !isGroup)

  const { data: peerUser } = useQuery({
    queryKey: ['user', peerId],
    queryFn: () => userRepository.getUserById(peerId),
    enabled: !!peerId && !isGroup,
  })
  const { data: me } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userRepository.getUserById(userId),
    enabled: !!userId,
  })

  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<MessageReply | null>(null)
  const [membersOpen, setMembersOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  const headerName = isGroup
    ? group?.name || inboxRow?.person || 'Nhóm'
    : peerUser?.name || inboxRow?.person || 'Chat'
  const headerAvatar = isGroup
    ? group?.photoUrl || inboxRow?.friendImage
    : peerUser?.avatar || inboxRow?.friendImage
  const myAvatar = me?.avatar || ''
  const memberProfiles = useMemo(
    () =>
      Object.fromEntries(
        members.map((m) => [m.userId, { name: m.name, avatar: m.avatar }]),
      ),
    [members],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current)
      if (!isGroup && peerId) void chatRepository.updateTyping(userId, peerId, false)
      if (isGroup) void groupChatRepository.setGroupTyping(roomId, userId, false)
    }
  }, [isGroup, peerId, roomId, userId])

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

  function pingTyping() {
    if (isGroup) {
      void groupChatRepository.setGroupTyping(roomId, userId, true)
      return
    }
    if (!peerId) return
    void chatRepository.updateTyping(userId, peerId, true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      void chatRepository.updateTyping(userId, peerId, false)
    }, TYPING_IDLE_MS)
  }

  async function sendPayload(extra: {
    text?: string
    photos?: UploadedPhoto[]
    audioUrl?: string
    mentions?: MessageMention[]
  }) {
    const receiverId = isGroup ? roomId : peerId
    if (!receiverId) return
    await sendMutation.mutateAsync({
      roomId,
      senderId: userId,
      senderName: displayName,
      senderAvatar: myAvatar,
      receiverId,
      receiverName: headerName,
      receiverAvatar: headerAvatar || '',
      text: extra.text,
      photos: extra.photos,
      audioUrl: extra.audioUrl,
      replyTo: replyTo ?? undefined,
      mentions: extra.mentions,
      isGroup,
      memberIds: isGroup ? (group?.memberIds ?? members.map((m) => m.userId)) : undefined,
      memberProfiles: isGroup ? memberProfiles : undefined,
    })
    setText('')
    setReplyTo(null)
    if (!isGroup && peerId) void chatRepository.updateTyping(userId, peerId, false)
    if (isGroup) void groupChatRepository.setGroupTyping(roomId, userId, false)
  }

  const lastMine = [...messages].reverse().find((m) => m.sender === userId)
  const seen1v1 =
    !isGroup &&
    lastMine &&
    peerSeen?.seen &&
    peerSeen.time >= lastMine.time
  const groupSeenCount =
    isGroup && lastMine
      ? reads.filter(
          (r) => r.userId !== userId && r.lastReadTime >= lastMine.time,
        ).length
      : 0

  const typingLabel = isGroup
    ? groupTyping.length
      ? `${groupTyping
          .map((id) => members.find((m) => m.userId === id)?.name ?? 'Ai đó')
          .join(', ')} đang nhập...`
      : ''
    : peerTyping
      ? 'Đang nhập...'
      : ''

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2 lg:px-4">
        <Button variant="ghost" size="icon" asChild className="lg:hidden">
          <Link to="/home">
            <ArrowLeft />
          </Link>
        </Button>
        <UserAvatar className="size-9" name={headerName} src={headerAvatar} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{headerName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {typingLabel ||
              (isGroup
                ? `${group?.memberIds.length ?? members.length} thành viên`
                : presence?.online
                  ? 'Đang hoạt động'
                  : formatLastSeen(presence?.lastSeen ?? 0))}
          </p>
        </div>
        {isGroup ? (
          <Button variant="ghost" size="icon" onClick={() => setMembersOpen(true)}>
            <Users />
          </Button>
        ) : null}
      </header>

      <PinnedBar
        pinned={pinned}
        onSelect={(time) => {
          document.getElementById(`msg-${time}`)?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }}
      />

      <ScrollArea className="min-h-0 flex-1 bg-muted/20 px-3 py-3 lg:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-1">
          {grouped.map(({ msg, showTime }) => {
            if (msg.type === MESSAGE_TYPE.SYSTEM) {
              return (
                <p
                  key={msg.time}
                  id={`msg-${msg.time}`}
                  className="my-2 text-center text-xs text-muted-foreground"
                >
                  {msg.message}
                </p>
              )
            }
            const senderName =
              members.find((m) => m.userId === msg.sender)?.name ||
              (msg.sender === userId ? displayName : headerName)
            return (
              <MessageBubble
                key={msg.time}
                message={msg}
                mine={msg.sender === userId}
                showTime={showTime}
                showSender={showTime}
                senderName={senderName}
                isGroup={isGroup}
                userId={userId}
                userName={displayName}
                roomId={roomId}
                onReply={setReplyTo}
              />
            )
          })}
          {seen1v1 ? (
            <p className="text-right text-[11px] text-muted-foreground">Đã xem</p>
          ) : null}
          {groupSeenCount > 0 ? (
            <p className="text-right text-[11px] text-muted-foreground">
              Đã xem bởi {groupSeenCount}
            </p>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t p-3 lg:px-6 lg:py-4">
        <ChatComposer
          text={text}
          onTextChange={(value) => {
            setText(value)
            pingTyping()
          }}
          replyTo={replyTo}
          onClearReply={() => setReplyTo(null)}
          pending={sendMutation.isPending || uploading}
          members={members}
          isGroup={isGroup}
          onSend={(mentions) => {
            if (!text.trim()) return
            void sendPayload({ text: text.trim(), mentions }).catch(() =>
              toast.error('Không gửi được tin nhắn'),
            )
          }}
          onSendPhotos={(files) => {
            setUploading(true)
            void mediaUploadRepository
              .uploadPhotos(files, roomId)
              .then((photos) => sendPayload({ photos }))
              .catch(() => toast.error('Không gửi được ảnh'))
              .finally(() => setUploading(false))
          }}
          onSendAudio={(file) => {
            setUploading(true)
            void mediaUploadRepository
              .uploadAudio(file, roomId)
              .then((audioUrl) => sendPayload({ audioUrl }))
              .catch(() => toast.error('Không gửi được audio'))
              .finally(() => setUploading(false))
          }}
          onSendSticker={(url) => {
            void sendPayload({
              photos: [{ url, size: '' }],
            }).catch(() => toast.error('Không gửi được sticker'))
          }}
        />
      </div>

      <GroupMembersSheet
        open={membersOpen}
        onOpenChange={setMembersOpen}
        group={group}
        members={members}
        me={me}
      />
    </div>
  )
}
