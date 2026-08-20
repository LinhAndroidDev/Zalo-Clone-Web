import { ImagePlus, Mic, Send, Smile, Square, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ALL_MENTION_ID,
  STICKER_PACKS,
} from '@/config/constants'
import { fetchStickerPack } from '@/data/repositories/stickerRepository'
import type { MessageMention, MessageReply, User } from '@/domain/models'

export function ChatComposer({
  text,
  onTextChange,
  replyTo,
  onClearReply,
  onSend,
  onSendPhotos,
  onSendAudio,
  onSendSticker,
  pending,
  members,
  isGroup,
}: {
  text: string
  onTextChange: (value: string) => void
  replyTo: MessageReply | null
  onClearReply: () => void
  onSend: (mentions: MessageMention[]) => void
  onSendPhotos: (files: File[]) => void
  onSendAudio: (file: File) => void
  onSendSticker: (url: string) => void
  pending: boolean
  members: User[]
  isGroup: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [stickersOpen, setStickersOpen] = useState(false)
  const [pack, setPack] = useState<(typeof STICKER_PACKS)[number]>('hello')
  const [recording, setRecording] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [mentions, setMentions] = useState<MessageMention[]>([])

  const stickers = useQuery({
    queryKey: ['stickers', pack],
    queryFn: () => fetchStickerPack(pack),
    enabled: stickersOpen,
  })

  const mentionQuery = text.split(/\s/).pop() ?? ''
  const mentionActive = isGroup && mentionQuery.startsWith('@')
  const mentionFilter = mentionQuery.slice(1).toLowerCase()
  const mentionOptions = [
    { userId: ALL_MENTION_ID, name: 'All', avatar: '' },
    ...members,
  ].filter((m) => m.name.toLowerCase().includes(mentionFilter))

  function insertMention(user: { userId: string; name: string }) {
    const token = `@${user.name}`
    const next = text.replace(/@[\w\s]*$/, `${token} `)
    onTextChange(next)
    setMentions((prev) => [
      ...prev.filter((m) => m.userId !== user.userId),
      { userId: user.userId, token, displayName: user.name },
    ])
  }

  async function toggleRecord() {
    if (recording) {
      recorderRef.current?.stop()
      setRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `audio-${Date.now()}.webm`, {
          type: 'audio/webm',
        })
        onSendAudio(file)
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      toast.error('Không dùng được micro')
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
      {replyTo ? (
        <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="font-medium">Trả lời {replyTo.senderName}</p>
            <p className="truncate text-muted-foreground">
              {replyTo.previewText}
            </p>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClearReply}>
            <X />
          </Button>
        </div>
      ) : null}

      {mentionActive && mentionOptions.length > 0 ? (
        <div className="rounded-md border bg-popover p-1 shadow-sm">
          {mentionOptions.slice(0, 8).map((m) => (
            <button
              key={m.userId}
              type="button"
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => insertMention(m)}
            >
              @{m.name}
            </button>
          ))}
        </div>
      ) : null}

      {stickersOpen ? (
        <div className="rounded-md border bg-card p-2">
          <div className="mb-2 flex flex-wrap gap-1">
            {STICKER_PACKS.map((name) => (
              <Button
                key={name}
                size="xs"
                variant={pack === name ? 'default' : 'outline'}
                onClick={() => setPack(name)}
              >
                {name}
              </Button>
            ))}
          </div>
          <div className="grid max-h-40 grid-cols-6 gap-1 overflow-y-auto">
            {(stickers.data ?? []).map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => {
                  onSendSticker(url)
                  setStickersOpen(false)
                }}
              >
                <img src={url} alt="" className="size-12 object-contain" />
              </button>
            ))}
            {stickers.isSuccess && (stickers.data ?? []).length === 0 ? (
              <p className="col-span-6 p-2 text-xs text-muted-foreground">
                Pack trống trên Firestore.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          onSend(mentions)
          setMentions([])
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length) onSendPhotos(files)
            e.target.value = ''
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setStickersOpen((v) => !v)}
        >
          <Smile className="size-4" />
        </Button>
        <Button
          type="button"
          variant={recording ? 'destructive' : 'ghost'}
          size="icon"
          onClick={() => void toggleRecord()}
        >
          {recording ? <Square className="size-4" /> : <Mic className="size-4" />}
        </Button>
        <Input
          value={text}
          onChange={(e) => {
            onTextChange(e.target.value)
          }}
          placeholder={isGroup ? 'Nhắn tin, dùng @ để nhắc' : 'Nhập tin nhắn'}
        />
        <Button
          type="submit"
          size="icon"
          disabled={pending || (!text.trim() && !recording)}
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}
