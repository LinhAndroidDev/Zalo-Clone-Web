import { Pin } from 'lucide-react'
import type { PinnedMessage } from '@/domain/models'

export function PinnedBar({
  pinned,
  onSelect,
}: {
  pinned: PinnedMessage[]
  onSelect: (messageTime: string) => void
}) {
  if (pinned.length === 0) return null
  const last = pinned[pinned.length - 1]
  return (
    <button
      type="button"
      onClick={() => onSelect(last.messageTime)}
      className="flex w-full items-center gap-2 border-b bg-primary/5 px-4 py-2 text-left text-sm"
    >
      <Pin className="size-4 shrink-0 text-primary" />
      <span className="truncate">
        {pinned.length > 1 ? `${pinned.length} tin ghim · ` : ''}
        {last.previewText}
      </span>
    </button>
  )
}
