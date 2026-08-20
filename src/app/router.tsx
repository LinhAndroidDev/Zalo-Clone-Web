import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGate } from '@/app/providers/AuthGate'
import { IntroPage } from '@/features/auth/IntroPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { SplashPage } from '@/features/auth/SplashPage'
import { ChatPage } from '@/features/chat/ChatPage'
import { CreateGroupPage } from '@/features/chat/CreateGroupPage'
import { ContactsPage } from '@/features/contacts/ContactsPage'
import { FriendRequestsPage } from '@/features/contacts/FriendRequestsPage'
import { InboxPage } from '@/features/inbox/InboxPage'
import { ComingSoonPage } from '@/features/placeholder/ComingSoonPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { SettingsPage } from '@/features/profile/SettingsPage'
import { UserProfilePage } from '@/features/profile/UserProfilePage'
import { AuthLayout } from '@/layouts/AuthLayout'
import { MainLayout } from '@/layouts/MainLayout'

export const router = createBrowserRouter([
  { path: '/', element: <SplashPage /> },
  { path: '/intro', element: <IntroPage /> },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: (
      <AuthGate>
        <MainLayout />
      </AuthGate>
    ),
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <InboxPage /> },
      { path: 'contacts', element: <ContactsPage /> },
      { path: 'contacts/requests', element: <FriendRequestsPage /> },
      { path: 'discover', element: <ComingSoonPage title="Khám phá" /> },
      { path: 'diary', element: <ComingSoonPage title="Nhật ký" /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'profile/:userId', element: <UserProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'chat/new-group', element: <CreateGroupPage /> },
      { path: 'chat/:roomId', element: <ChatPage /> },
    ],
  },
])
