import { Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center border-b px-4">
        <h1 className="text-lg font-semibold">{title}</h1>
      </header>
      <div className="min-h-0 flex-1">
        <EmptyState
          icon={Sparkles}
          title={title}
          description="Tính năng này sẽ có ở phase sau."
        />
      </div>
    </div>
  )
}
