import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/UserAvatar'
import { userRepository } from '@/data/repositories/userRepository'
import { useSessionStore } from '@/stores/sessionStore'

export function ProfilePage() {
  const userId = useSessionStore((s) => s.userId)
  const displayName = useSessionStore((s) => s.displayName)
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userRepository.getUserById(userId),
    enabled: !!userId,
  })

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <h1 className="text-lg font-semibold">Cá nhân</h1>
        <Button variant="ghost" size="icon" asChild className="lg:hidden">
          <Link to="/settings">
            <Settings />
          </Link>
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 lg:flex-row lg:items-center lg:gap-6 lg:p-8">
            <UserAvatar
              className="size-24 lg:size-28"
              name={user?.name || displayName}
              src={user?.avatar}
            />
            <div className="text-center lg:text-left">
              <h2 className="text-xl font-semibold lg:text-2xl">
                {user?.name || displayName}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Link
            to="/settings"
            className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted/60"
          >
            Cài đặt
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </div>
  )
}
