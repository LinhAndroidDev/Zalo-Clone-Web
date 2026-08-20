import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { mediaUploadRepository } from '@/data/repositories/mediaUploadRepository'
import { diaryRepository } from '@/data/repositories/diaryRepository'
import { userRepository } from '@/data/repositories/userRepository'
import { useSessionStore } from '@/stores/sessionStore'

export function CreatePostPage() {
  const navigate = useNavigate()
  const userId = useSessionStore((s) => s.userId)
  const displayName = useSessionStore((s) => s.displayName)
  const { data: me } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userRepository.getUserById(userId),
    enabled: !!userId,
  })
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])

  const publish = useMutation({
    mutationFn: async () => {
      if (!me) throw new Error('NO_USER')
      const imageUrls: string[] = []
      for (const file of files) {
        imageUrls.push(await mediaUploadRepository.uploadImage(file, 'images'))
      }
      return diaryRepository.createPost({
        author: { ...me, name: displayName || me.name },
        content: content.trim(),
        imageUrls,
      })
    },
    onSuccess: () => navigate('/diary', { replace: true }),
    onError: () => toast.error('Không đăng được bài'),
  })

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/diary">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Đăng bài</h1>
      </header>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 p-4">
        <textarea
          className="min-h-32 w-full rounded-md border bg-background p-3 text-sm"
          placeholder="Bạn đang nghĩ gì?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
        <Button
          disabled={publish.isPending || (!content.trim() && files.length === 0)}
          onClick={() => publish.mutate()}
        >
          {publish.isPending ? 'Đang đăng...' : 'Đăng'}
        </Button>
      </div>
    </div>
  )
}
