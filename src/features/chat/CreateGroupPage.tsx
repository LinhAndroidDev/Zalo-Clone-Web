import { useMutation } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserAvatar } from '@/components/UserAvatar'
import { mediaUploadRepository } from '@/data/repositories/mediaUploadRepository'
import { groupChatRepository } from '@/data/repositories/groupChatRepository'
import { userRepository } from '@/data/repositories/userRepository'
import { useFriendsQuery } from '@/hooks/useFriendsQuery'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

export function CreateGroupPage() {
  const navigate = useNavigate()
  const userId = useSessionStore((s) => s.userId)
  const displayName = useSessionStore((s) => s.displayName)
  const { data: friends = [] } = useFriendsQuery()
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [photo, setPhoto] = useState<File | null>(null)

  const create = useMutation({
    mutationFn: async () => {
      if (selected.length < 1) throw new Error('GROUP_MIN_MEMBERS')
      const me = await userRepository.getUserById(userId)
      let photoUrl = ''
      if (photo) {
        photoUrl = await mediaUploadRepository.uploadImage(photo, 'images')
      }
      const memberProfiles = Object.fromEntries(
        friends
          .filter((f) => selected.includes(f.keyAuth))
          .map((f) => [f.keyAuth, { name: f.name, avatar: f.avatar }]),
      )
      return groupChatRepository.createGroup({
        name: name.trim() || 'Nhóm mới',
        photoUrl,
        memberIds: selected,
        creator: { ...me, name: displayName || me.name },
        memberProfiles,
      })
    },
    onSuccess: ({ groupId }) => {
      navigate(`/chat/${encodeURIComponent(groupId)}`, { replace: true })
    },
    onError: (err) => {
      if (err instanceof Error && err.message === 'GROUP_MIN_MEMBERS') {
        toast.error('Chọn ít nhất 1 bạn bè')
        return
      }
      toast.error('Không tạo được nhóm')
    },
  })

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2 lg:px-4">
        <Button variant="ghost" size="icon" asChild className="lg:hidden">
          <Link to="/home">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Tạo nhóm</h1>
      </header>
      <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col gap-4 p-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên nhóm"
        />
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
        />
        <p className="text-sm text-muted-foreground">
          Chọn bạn bè ({selected.length})
        </p>
        <ScrollArea className="min-h-0 flex-1 rounded-md border">
          <ul className="p-2">
            {friends.map((f) => {
              const on = selected.includes(f.keyAuth)
              return (
                <li key={f.keyAuth}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelected((prev) =>
                        on
                          ? prev.filter((id) => id !== f.keyAuth)
                          : [...prev, f.keyAuth],
                      )
                    }
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left',
                      on ? 'bg-primary/10' : 'hover:bg-muted/70',
                    )}
                  >
                    <UserAvatar name={f.name} src={f.avatar} />
                    <span className="font-medium">{f.name}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </ScrollArea>
        <Button
          onClick={() => create.mutate()}
          disabled={create.isPending || selected.length < 1}
        >
          {create.isPending ? 'Đang tạo...' : 'Tạo nhóm'}
        </Button>
      </div>
    </div>
  )
}
