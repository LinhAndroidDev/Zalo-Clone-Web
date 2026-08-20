import { Link, useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { isTabActive, tabs } from '@/layouts/navTabs'
import { cn } from '@/lib/utils'

export function BottomNav({
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
    <nav className="grid shrink-0 grid-cols-5 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
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
              'relative flex flex-col items-center gap-0.5 py-2 text-[11px]',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <tab.icon className="size-5" />
            <span>{tab.label}</span>
            {count > 0 ? (
              <Badge className="absolute top-1 right-1/2 h-4 min-w-4 translate-x-4 justify-center rounded-full px-1 text-[10px]">
                {count > 99 ? '99+' : count}
              </Badge>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
