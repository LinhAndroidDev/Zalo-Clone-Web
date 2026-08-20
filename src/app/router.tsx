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
import { DiaryPage } from '@/features/diary/DiaryPage'
import { CreatePostPage } from '@/features/diary/CreatePostPage'
import { PostDetailPage } from '@/features/diary/PostDetailPage'
import { DiaryNotificationsPage } from '@/features/diary/DiaryNotificationsPage'
import { CreateStoryPage } from '@/features/stories/CreateStoryPage'
import { StoryViewerPage } from '@/features/stories/StoryViewerPage'
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
      { path: 'diary', element: <DiaryPage /> },
      { path: 'diary/post/new', element: <CreatePostPage /> },
      { path: 'diary/post/:postId', element: <PostDetailPage /> },
      { path: 'diary/notifications', element: <DiaryNotificationsPage /> },
      { path: 'stories/create', element: <CreateStoryPage /> },
      { path: 'stories/view', element: <StoryViewerPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'profile/:userId', element: <UserProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'chat/new-group', element: <CreateGroupPage /> },
      { path: 'chat/:roomId', element: <ChatPage /> },
    ],
  },
])
