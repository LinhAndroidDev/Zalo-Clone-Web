import { useMutation } from '@tanstack/react-query'
import { MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  EMOTION_EMOJI,
  EMOTION_TYPES,
  type EmotionType,
} from '@/config/constants'
import { chatRepository, replyPreviewOf } from '@/data/repositories/chatRepository'
import type { Message, MessageReply } from '@/domain/models'
import { firstPhotoUrl, messagePhotoUrls } from '@/lib/messageMedia'
import { formatChatTime } from '@/lib/time'
import { cn } from '@/lib/utils'

export function MessageBubble({
  message,
  mine,
  showTime,
  showSender,
  senderName,
  isGroup,
  userId,
  userName,
  roomId,
  onReply,
}: {
  message: Message
  mine: boolean
  showTime: boolean
  showSender: boolean
  senderName: string
  isGroup: boolean
  userId: string
  userName: string
  roomId: string
  onReply: (reply: MessageReply) => void
}) {
  const photos = messagePhotoUrls(message)
  const reaction = useMutation({
    mutationFn: (type: EmotionType) =>
      chatRepository.toggleMessageReaction(roomId, message.time, userId, type),
  })
  const pin = useMutation({
    mutationFn: () =>
      chatRepository.pinMessage(message, roomId, userId, userName),
    onError: (err) => {
      if (err instanceof Error && err.message === 'MAX_PINNED') {
        toast.error('Tối đa 10 tin ghim')
        return
      }
      toast.error('Không ghim được')
    },
  })
  const remove = useMutation({
    mutationFn: () => chatRepository.removeMessage(roomId, message.time),
    onError: () => toast.error('Không xóa được tin'),
  })

  const emotionCounts = EMOTION_TYPES.map((type) => {
    const map = message.emotion?.[type] ?? {}
    const count = Object.values(map).reduce((sum, n) => sum + n, 0)
    return { type, count }
  }).filter((row) => row.count > 0)

  return (
    <div
      id={`msg-${message.time}`}
      className={cn('flex scroll-mt-16', mine ? 'justify-end' : 'justify-start')}
    >
      <div className={cn('max-w-[85%] sm:max-w-[70%]', showTime ? 'mt-2' : '')}>
        {showSender && isGroup && !mine ? (
          <p className="mb-0.5 px-1 text-xs text-muted-foreground">
            {senderName}
          </p>
        ) : null}
        <div className="group relative flex items-end gap-1">
          {mine ? (
            <Menu
              mine={mine}
              onReply={() =>
                onReply({
                  messageTime: message.time,
                  senderId: message.sender,
                  senderName,
                  previewText: replyPreviewOf(message),
                  type: message.type,
                  photoUrl: firstPhotoUrl(message),
                })
              }
              onPin={() => pin.mutate()}
              onRemove={mine ? () => remove.mutate() : undefined}
              onReact={(t) => reaction.mutate(t)}
            />
          ) : null}
          <div
            className={cn(
              'rounded-2xl px-3 py-2 text-sm',
              mine ? 'bg-primary text-primary-foreground' : 'bg-muted',
            )}
          >
            {message.replyTo ? (
              <div
                className={cn(
                  'mb-1 rounded-md border-l-2 px-2 py-1 text-xs',
                  mine
                    ? 'border-primary-foreground/50 bg-primary-foreground/10'
                    : 'border-primary/50 bg-background/60',
                )}
              >
                <p className="font-medium">{message.replyTo.senderName}</p>
                <p className="truncate opacity-80">
                  {message.replyTo.previewText}
                </p>
              </div>
            ) : null}
            {photos.length > 0 ? (
              <div
                className={cn(
                  'mb-1 grid gap-1',
                  photos.length > 1 ? 'grid-cols-2' : 'grid-cols-1',
                )}
              >
                {photos.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt=""
                      className="max-h-56 w-full rounded-lg object-cover"
                    />
                  </a>
                ))}
              </div>
            ) : null}
            {message.audio ? (
              <audio className="mb-1 max-w-full" controls src={message.audio} />
            ) : null}
            {message.message ? (
              <p className="whitespace-pre-wrap break-words">
                {renderMentions(message.message, mine)}
              </p>
            ) : null}
            {showTime ? (
              <p
                className={cn(
                  'mt-1 text-[10px]',
                  mine
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground',
                )}
              >
                {formatChatTime(message.time)}
              </p>
            ) : null}
          </div>
          {!mine ? (
            <Menu
              mine={mine}
              onReply={() =>
                onReply({
                  messageTime: message.time,
                  senderId: message.sender,
                  senderName,
                  previewText: replyPreviewOf(message),
                  type: message.type,
                  photoUrl: firstPhotoUrl(message),
                })
              }
              onPin={() => pin.mutate()}
              onRemove={undefined}
              onReact={(t) => reaction.mutate(t)}
            />
          ) : null}
        </div>
        {emotionCounts.length > 0 ? (
          <div className={cn('mt-1 flex gap-1', mine ? 'justify-end' : '')}>
            {emotionCounts.map((row) => (
              <button
                key={row.type}
                type="button"
                className="rounded-full bg-background px-1.5 text-xs shadow-sm ring-1 ring-border"
                onClick={() => reaction.mutate(row.type)}
              >
                {EMOTION_EMOJI[row.type]} {row.count}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function renderMentions(text: string, mine: boolean) {
  const parts = text.split(/(@[\w\s]+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span
          key={`${part}-${i}`}
          className={mine ? 'font-semibold underline' : 'font-semibold text-primary'}
        >
          {part}
        </span>
      )
    }
    return <span key={`${part}-${i}`}>{part}</span>
  })
}

function Menu({
  mine,
  onReply,
  onPin,
  onRemove,
  onReact,
}: {
  mine: boolean
  onReply: () => void
  onPin: () => void
  onRemove?: () => void
  onReact: (type: EmotionType) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={mine ? 'end' : 'start'}>
        <div className="flex gap-1 px-1 py-1">
          {EMOTION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className="rounded-md px-1 text-base hover:bg-muted"
              onClick={() => onReact(type)}
            >
              {EMOTION_EMOJI[type]}
            </button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onReply}>Trả lời</DropdownMenuItem>
        <DropdownMenuItem onClick={onPin}>Ghim</DropdownMenuItem>
        {onRemove ? (
          <DropdownMenuItem variant="destructive" onClick={onRemove}>
            Xóa
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
