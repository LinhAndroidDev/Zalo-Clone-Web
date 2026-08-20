import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { mediaUploadRepository } from '@/data/repositories/mediaUploadRepository'
import { storyRepository } from '@/data/repositories/storyRepository'
import { userRepository } from '@/data/repositories/userRepository'
import { useFriendsQuery } from '@/hooks/useFriendsQuery'
import type { StoryPrivacy } from '@/domain/models'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

export function CreateStoryPage() {
  const navigate = useNavigate()
  const userId = useSessionStore((s) => s.userId)
  const displayName = useSessionStore((s) => s.displayName)
  const { data: me } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userRepository.getUserById(userId),
    enabled: !!userId,
  })
  const { data: friends = [] } = useFriendsQuery()
  const [file, setFile] = useState<File | null>(null)
  const [privacy, setPrivacy] = useState<StoryPrivacy>('friends')
  const [visible, setVisible] = useState<string[]>([])
  const [progress, setProgress] = useState(0)

  const create = useMutation({
    mutationFn: async () => {
      if (!file || !me) throw new Error('NO_FILE')
      const mediaUrl = await mediaUploadRepository.uploadStoryMedia(
        file,
        userId,
        setProgress,
      )
      const mediaType = file.type.startsWith('video') ? 'video' : 'image'
      return storyRepository.createStory({
        author: { ...me, name: displayName || me.name },
        mediaUrl,
        mediaType,
        privacy,
        visibleToUserIds: privacy === 'custom' ? visible : undefined,
      })
    },
    onSuccess: () => navigate('/diary', { replace: true }),
    onError: (err) => {
      if (err instanceof Error && err.message === 'CUSTOM_PRIVACY') {
        toast.error('Chọn ít nhất 1 bạn khi đặt quyền tùy chọn')
        return
      }
      toast.error('Không đăng được story')
    },
  })

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/diary">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Tạo tin</h1>
      </header>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-3 p-4">
        <Input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <div className="flex gap-2">
          {(['everyone', 'friends', 'custom'] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={privacy === p ? 'default' : 'outline'}
              onClick={() => setPrivacy(p)}
            >
              {p === 'everyone' ? 'Mọi người' : p === 'friends' ? 'Bạn bè' : 'Tùy chọn'}
            </Button>
          ))}
        </div>
        {privacy === 'custom' ? (
          <ScrollArea className="h-48 rounded-md border">
            <ul className="p-2">
              {friends.map((f) => {
                const on = visible.includes(f.keyAuth)
                return (
                  <li key={f.keyAuth}>
                    <button
                      type="button"
                      className={cn(
                        'w-full rounded px-2 py-2 text-left text-sm',
                        on ? 'bg-primary/10' : 'hover:bg-muted',
                      )}
                      onClick={() =>
                        setVisible((prev) =>
                          on
                            ? prev.filter((id) => id !== f.keyAuth)
                            : [...prev, f.keyAuth],
                        )
                      }
                    >
                      {f.name}
                    </button>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        ) : null}
        {progress > 0 && progress < 100 ? (
          <p className="text-sm text-muted-foreground">Đăng {progress}%</p>
        ) : null}
        <Button
          disabled={!file || create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending ? 'Đang đăng...' : 'Đăng tin'}
        </Button>
      </div>
    </div>
  )
}
