import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { STORY_IMAGE_MS, STORY_VIDEO_MAX_MS } from '@/config/constants'
import { storyRepository } from '@/data/repositories/storyRepository'
import { useStoryRingsQuery } from '@/hooks/useStoryRingsQuery'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

export function StoryViewerPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const userId = useSessionStore((s) => s.userId)
  const { data: rings = [] } = useStoryRingsQuery()
  const startAuthor = params.get('authorId') ?? ''
  const derivedOuter = Math.max(
    0,
    rings.findIndex((r) => r.authorId === startAuthor),
  )
  const [outerNav, setOuterNav] = useState<number | null>(null)
  const outer = outerNav ?? derivedOuter
  const [innerByOuter, setInnerByOuter] = useState<Record<number, number>>({})
  const inner = innerByOuter[outer] ?? 0

  const ring = rings[outer]
  const story = ring?.stories[inner]
  const pointerX = useRef(0)
  const storyId = story?.storyId

  useEffect(() => {
    if (!storyId) return
    void storyRepository.markStoryViewed(storyId, userId)
  }, [storyId, userId])

  function goNext() {
    if (!ring) return
    if (inner < ring.stories.length - 1) {
      setInnerByOuter((m) => ({ ...m, [outer]: inner + 1 }))
      return
    }
    if (outer < rings.length - 1) {
      setOuterNav(outer + 1)
      return
    }
    navigate('/diary')
  }

  function goPrev() {
    if (inner > 0) {
      setInnerByOuter((m) => ({ ...m, [outer]: inner - 1 }))
      return
    }
    if (outer > 0) setOuterNav(outer - 1)
  }

  useEffect(() => {
    if (!story || story.mediaType === 'video') return
    const t = window.setTimeout(() => {
      goNext()
    }, STORY_IMAGE_MS)
    return () => window.clearTimeout(t)
    // advance when the current image story changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId])

  if (!ring || !story) {
    return (
      <div className="flex h-full items-center justify-center gap-3 bg-black text-white">
        <p>Không có tin để xem.</p>
        <Button onClick={() => navigate('/diary')}>Về nhật ký</Button>
      </div>
    )
  }

  return (
    <div
      className="relative flex h-full flex-col bg-black text-white"
      onPointerDown={(e) => {
        pointerX.current = e.clientX
      }}
      onPointerUp={(e) => {
        const dx = e.clientX - pointerX.current
        if (dx > 60) goPrev()
        else if (dx < -60) goNext()
      }}
    >
      <div className="flex gap-1 px-3 pt-3">
        {ring.stories.map((s, i) => (
          <div
            key={s.storyId}
            className="h-1 flex-1 overflow-hidden rounded bg-white/30"
          >
            <div
              className={cn(
                'h-full bg-white',
                i < inner ? 'w-full' : i === inner ? 'w-full' : 'w-0',
              )}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <p className="truncate font-medium">{ring.authorName}</p>
        <div className="flex items-center gap-1">
          {ring.isMe ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={() => {
                void storyRepository.deleteStory(story.storyId, userId)
                navigate('/diary')
              }}
            >
              <Trash2 />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="text-white"
            onClick={() => navigate('/diary')}
          >
            <X />
          </Button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <button
          type="button"
          className="absolute inset-y-0 left-0 z-10 w-1/3"
          onClick={goPrev}
          aria-label="Trước"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 z-10 w-1/3"
          onClick={goNext}
          aria-label="Sau"
        />
        {story.mediaType === 'video' ? (
          <video
            src={story.mediaUrl}
            className="h-full w-full object-contain"
            autoPlay
            playsInline
            onLoadedMetadata={(e) => {
              const ms = Math.min(
                e.currentTarget.duration * 1000,
                STORY_VIDEO_MAX_MS,
              )
              window.setTimeout(goNext, ms)
            }}
            onEnded={goNext}
          />
        ) : (
          <img
            src={story.mediaUrl}
            alt=""
            className="h-full w-full object-contain"
          />
        )}
      </div>
      <div className="flex justify-between px-4 py-3 lg:hidden">
        <Button variant="secondary" size="icon" onClick={goPrev}>
          <ChevronLeft />
        </Button>
        <Button variant="secondary" size="icon" onClick={goNext}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
