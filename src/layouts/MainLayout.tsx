import { Outlet, useLocation } from 'react-router-dom'
import { ContactsList } from '@/features/contacts/ContactsList'
import { InboxList } from '@/features/inbox/InboxList'
import { useIncomingRequestsQuery } from '@/hooks/useFriendsQuery'
import { useInboxQuery } from '@/hooks/useInboxQuery'
import { BottomNav } from '@/layouts/BottomNav'
import { NavRail } from '@/layouts/NavRail'

function sidePanelFor(pathname: string) {
  if (pathname === '/home' || pathname.startsWith('/chat')) {
    return <InboxList />
  }
  if (pathname.startsWith('/contacts') || pathname.startsWith('/profile/')) {
    return <ContactsList />
  }
  return null
}

export function MainLayout() {
  const { pathname } = useLocation()
  const { data: conversations = [] } = useInboxQuery()
  const { data: incoming = [] } = useIncomingRequestsQuery()

  const unreadCount = conversations.filter(
    (c) => !c.seen && c.numberUnSeen > 0,
  ).length
  const sidePanel = sidePanelFor(pathname)
  const hideBottomNav = pathname.startsWith('/chat')

  return (
    <div className="flex h-dvh bg-background">
      <NavRail unreadCount={unreadCount} requestCount={incoming.length} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1">
          {sidePanel ? (
            <aside className="hidden w-80 shrink-0 border-r xl:w-96 lg:block">
              {sidePanel}
            </aside>
          ) : null}
          <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
        {!hideBottomNav && (
          <BottomNav
            unreadCount={unreadCount}
            requestCount={incoming.length}
          />
        )}
      </div>
    </div>
  )
}
