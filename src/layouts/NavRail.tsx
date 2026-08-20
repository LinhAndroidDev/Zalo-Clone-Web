import { Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { isTabActive, tabs } from '@/layouts/navTabs'
import { cn } from '@/lib/utils'

export function NavRail({
  unreadCount,
  requestCount,
  diaryCount,
}: {
  unreadCount: number
  requestCount: number
  diaryCount: number
}) {
  const { pathname } = useLocation()

  return (
    <aside className="hidden w-20 shrink-0 flex-col items-center gap-1 border-r bg-muted/30 py-4 lg:flex">
      <Link
        to="/home"
        className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground"
      >
        Z
      </Link>
      {tabs.map((tab) => {
        const active = isTabActive(pathname, tab.to)
        const count =
          tab.to === '/home'
            ? unreadCount
            : tab.to === '/contacts'
              ? requestCount
              : tab.to === '/diary'
                ? diaryCount
                : 0
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              'relative flex w-16 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <tab.icon className="size-5" />
            <span className="w-full truncate text-center">{tab.label}</span>
            {count > 0 ? (
              <Badge className="absolute top-1 right-3 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
                {count > 99 ? '99+' : count}
              </Badge>
            ) : null}
          </Link>
        )
      })}
      <Link
        to="/settings"
        className={cn(
          'mt-auto flex w-16 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] transition-colors',
          pathname === '/settings'
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <Settings className="size-5" />
        Cài đặt
      </Link>
    </aside>
  )
}
