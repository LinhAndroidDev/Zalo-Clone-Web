# Zalo Clone — React Web Specification

> Tài liệu này mô tả **toàn bộ backend, schema, business rules và luồng nghiệp vụ** của app Android hiện tại để team web React có thể xây dựng phiên bản web **tương thích dữ liệu** với mobile.

**Firebase project:** `zalo-clone-45246`  
**App ID Android:** `com.example.messageapp`  
**Nguồn tham chiếu:** module `:domain`, `:data`, `:app` trong repo này.

**Web stack (cố định):**

| | |
|---|---|
| Core | React 18 + TypeScript + Vite |
| Routing | React Router v6 (5 tab bottom nav) |
| Server state | TanStack Query v5 |
| Session | Zustand + persist |
| Backend | Firebase JS SDK (Firestore + RTDB) |
| UI | Tailwind CSS + shadcn/ui |

---

## Mục lục

1. [Tổng quan sản phẩm](#1-tổng-quan-sản-phẩm)
2. [Tech stack & kiến trúc React](#2-tech-stack--kiến-trúc-react)
3. [Xác thực & phiên đăng nhập](#3-xác-thực--phiên-đăng-nhập)
4. [Firebase — Schema chi tiết](#4-firebase--schema-chi-tiết)
5. [Tính năng & màn hình](#5-tính-năng--màn-hình)
6. [Repository contracts (TypeScript)](#6-repository-contracts-typescript)
7. [Real-time vs one-shot](#7-real-time-vs-one-shot)
8. [Upload media (Cloudinary)](#8-upload-media-cloudinary)
9. [Business rules & hằng số](#9-business-rules--hằng-số)
10. [Lộ trình triển khai web](#10-lộ-trình-triển-khai-web)
11. [Bảo mật — lưu ý quan trọng](#11-bảo-mật--lưu-ý-quan-trọng)

---

## 1. Tổng quan sản phẩm

Ứng dụng nhắn tin + mạng xã hội (phong cách Zalo) gồm:

| Module | Mô tả |
|--------|--------|
| **Chat 1-1** | Tin nhắn text, ảnh, video, audio, sticker, reaction, reply, forward, ghim |
| **Chat nhóm** | Tạo nhóm, mention @user / @All, typing, read receipt, tin hệ thống |
| **Danh bạ** | Danh sách bạn, lời mời kết bạn, QR add friend |
| **Nhật ký (Diary)** | Feed bài viết, reaction, comment, reply lồng nhau, thông báo |
| **Story** | Story 24h, nhiều story/user, privacy, nhạc Jamendo |
| **Hồ sơ & Cài đặt** | Avatar, cover, ngôn ngữ, đăng xuất |
| **Khám phá** | Tìm kiếm user, quét QR |

### Stack Android hiện tại (tham chiếu)

```
app (UI) → domain (use case + interface) → data (Firestore / RTDB / Cloudinary / Retrofit FCM)
```

Web React dùng **stack cố định** bên dưới, mirror cùng contract repository và **cùng Firestore paths** với Android.

---

## 2. Tech stack & kiến trúc React

### Stack chính thức

| Layer | Công nghệ | Vai trò |
|-------|-----------|---------|
| **Core** | React 18 + TypeScript + Vite | SPA, build nhanh, type-safe |
| **Routing** | React Router v6 | Layout 5 tab + nested routes (chat, diary, …) |
| **Server state** | TanStack Query v5 | Cache, sync Firestore `onSnapshot`, mutations |
| **Client state** | Zustand | Session (`userId`, tên, login flag), UI ephemeral |
| **Backend** | Firebase JS SDK v10+ | Firestore + Realtime Database (presence) |
| **UI** | Tailwind CSS + shadcn/ui | Component library, theme nhanh |
| **Media** | Cloudinary (fetch API) | Upload ảnh/video/audio (giống Android) |

> **Không dùng** Next.js, MUI, Redux cho dự án này — giữ stack trên để team đồng nhất.

### Dependencies

```bash
npm create vite@latest zalo-clone-web -- --template react-ts
cd zalo-clone-web

# Core
npm install react-router-dom @tanstack/react-query zustand firebase

# Tailwind (theo docs chính thức Vite + Tailwind v4 hoặc v3)
npm install -D tailwindcss postcss autoprefixer

# shadcn/ui — init sau khi có Tailwind
npx shadcn@latest init
```

### Cấu trúc thư mục

```
zalo-clone-web/
├── src/
│   ├── app/
│   │   ├── App.tsx                 # Providers wrapper
│   │   ├── router.tsx              # createBrowserRouter
│   │   └── providers/
│   │       ├── QueryProvider.tsx   # QueryClientProvider
│   │       └── AuthGate.tsx        # Redirect nếu chưa login
│   ├── layouts/
│   │   ├── AuthLayout.tsx          # /login, /register
│   │   └── MainLayout.tsx          # BottomNav 5 tab + <Outlet />
│   ├── features/
│   │   ├── auth/
│   │   ├── inbox/
│   │   ├── chat/
│   │   ├── contacts/
│   │   ├── discover/
│   │   ├── diary/
│   │   ├── stories/
│   │   └── profile/
│   ├── domain/                     # Types + repository interfaces (mirror :domain)
│   ├── data/
│   │   ├── firebase/
│   │   │   ├── app.ts              # initializeApp, db, rtdb
│   │   │   ├── mappers/            # Firestore DTO → domain
│   │   │   └── listeners/          # subscribe helpers
│   │   ├── cloudinary/
│   │   └── repositories/           # *RepositoryImpl
│   ├── hooks/                      # TanStack Query hooks (useInbox, useMessages, …)
│   ├── stores/
│   │   └── sessionStore.ts         # Zustand — userId, displayName, isLoggedIn
│   ├── components/
│   │   └── ui/                     # shadcn/ui (Button, Dialog, Avatar, …)
│   ├── lib/
│   │   └── utils.ts                # cn() helper của shadcn
│   └── config/
│       └── constants.ts
├── components.json                 # shadcn config
├── tailwind.config.ts
└── vite.config.ts
```

### Luồng dữ liệu

```
Page (feature)
  → hook TanStack Query (useInboxQuery, useMessagesQuery)
    → repository impl
      → Firestore onSnapshot / writeBatch / RTDB onValue
        → mapper → domain type → React Query cache → UI

Session (userId)
  → Zustand sessionStore (persist localStorage)
  → AuthGate + queryKey prefix ['inbox', userId]
```

---

### React Router v6 — 5 tab navigation

Dùng **nested routes**: `MainLayout` bọc 5 tab, mỗi tab là child route.

```tsx
// src/app/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AuthGate } from '@/app/providers/AuthGate';

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
      { path: 'discover', element: <DiscoverPage /> },
      { path: 'diary', element: <DiaryPage /> },
      { path: 'profile', element: <ProfilePage /> },
      // Full-screen ngoài bottom nav (vẫn trong AuthGate)
      { path: 'chat/:roomId', element: <ChatPage /> },
      { path: 'chat/new-group', element: <CreateGroupPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'stories/create', element: <CreateStoryPage /> },
      { path: 'stories/view', element: <StoryViewerPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
```

```tsx
// src/layouts/MainLayout.tsx — BottomNav 5 tab
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/home', label: 'Tin nhắn', icon: MessageIcon },
  { to: '/contacts', label: 'Danh bạ', icon: UsersIcon },
  { to: '/discover', label: 'Khám phá', icon: CompassIcon },
  { to: '/diary', label: 'Nhật ký', icon: BookIcon },
  { to: '/profile', label: 'Cá nhân', icon: UserIcon },
];

export function MainLayout() {
  const { pathname } = useLocation();
  const hideNav = pathname.startsWith('/chat') || pathname.startsWith('/stories/view');

  return (
    <div className="flex h-dvh flex-col">
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      {!hideNav && (
        <nav className="border-t bg-background">
          {tabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} className={({ isActive }) => /* … */ ''}>
              {tab.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
```

---

### Zustand — session store

Session **không** đặt trong TanStack Query — dùng Zustand + `persist` (tương đương `SessionRepository` Android).

```typescript
// src/stores/sessionStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionState {
  userId: string;
  displayName: string;
  isLoggedIn: boolean;
  language: 'VI' | 'EN';
  login: (userId: string, displayName: string) => void;
  logout: () => void;
  setLanguage: (lang: 'VI' | 'EN') => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      userId: '',
      displayName: '',
      isLoggedIn: false,
      language: 'VI',
      login: (userId, displayName) =>
        set({ userId, displayName, isLoggedIn: true }),
      logout: () =>
        set({ userId: '', displayName: '', isLoggedIn: false }),
      setLanguage: (language) => set({ language }),
    }),
    { name: 'zalo-clone-session' }, // localStorage key
  ),
);
```

```tsx
// src/app/providers/AuthGate.tsx
export function AuthGate({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useSessionStore((s) => s.isLoggedIn);
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

---

### TanStack Query — sync Firestore listeners

Firestore realtime map vào Query bằng **`queryOptions` + custom `subscribe`**. Pattern chuẩn:

```typescript
// src/hooks/useInboxQuery.ts
import { useQuery } from '@tanstack/react-query';
import { inboxRepository } from '@/data/repositories/inboxRepository';
import { useSessionStore } from '@/stores/sessionStore';

export function useInboxQuery() {
  const userId = useSessionStore((s) => s.userId);

  return useQuery({
    queryKey: ['inbox', userId],
    enabled: !!userId,
    queryFn: () => new Promise<Conversation[]>(() => {}), // placeholder — data từ subscribe
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    // TanStack Query v5: đăng ký listener trong queryFn hoặc dùng helper
  });
}
```

**Helper subscribe (khuyến nghị):**

```typescript
// src/data/firebase/firestoreQuery.ts
import type { QueryClient } from '@tanstack/react-query';

export function subscribeToQuery<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  subscribe: (onData: (data: T) => void, onError: (e: Error) => void) => () => void,
) {
  return subscribe(
    (data) => queryClient.setQueryData(queryKey, data),
    (error) => queryClient.setQueryData(queryKey, (old: unknown) => {
      throw error;
    }),
  );
}
```

```typescript
// src/hooks/useFirestoreSubscription.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useFirestoreSubscription<T>(
  queryKey: unknown[],
  subscribe: (onData: (data: T) => void) => () => void,
  enabled = true,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const unsub = subscribe((data) => {
      queryClient.setQueryData(queryKey, data);
    });
    return unsub;
  }, [queryClient, enabled, ...queryKey]);
}
```

**Ví dụ inbox:**

```typescript
// Trong InboxPage
const userId = useSessionStore((s) => s.userId);

useFirestoreSubscription(
  ['inbox', userId],
  (onData) => inboxRepository.observeInbox(userId, onData),
  !!userId,
);

const { data: conversations = [] } = useQuery<Conversation[]>({
  queryKey: ['inbox', userId],
  enabled: !!userId,
  queryFn: () => [],           // initial empty; listener sẽ setQueryData
  staleTime: Infinity,
});
```

**Mutations (gửi tin, reaction, …):**

```typescript
const sendMessage = useMutation({
  mutationFn: chatRepository.sendMessage,
  onSuccess: () => {
    // Firestore listener tự cập nhật cache — không cần invalidate inbox/messages
  },
});
```

| Query key pattern | Nguồn realtime |
|-------------------|----------------|
| `['inbox', userId]` | `Conversation{userId}` |
| `['messages', roomId]` | `messages/{roomId}/chats` |
| `['typing', roomId]` | conversation doc / `groups/{id}` |
| `['presence', targetUserId]` | RTDB `status/{id}` |
| `['diary-feed', userId]` | friends + posts chunked |
| `['story-rings', userId]` | `stories` + views |
| `['friends', userId]` | `users/{id}/friends` |

**Logout:** `queryClient.clear()` trong `sessionStore.logout()`.

---

### Firebase JS SDK

```typescript
// src/data/firebase/app.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: 'zalo-clone-45246',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL, // RTDB — bắt buộc cho presence
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const rtdb = getDatabase(firebaseApp);
```

Biến môi trường (`.env`):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=zalo-clone-45246
VITE_FIREBASE_APP_ID=
VITE_CLOUDINARY_CLOUD_NAME=dpdzs8jh8
VITE_CLOUDINARY_UPLOAD_PRESET=upload_file
```

---

### Tailwind CSS + shadcn/ui

**Setup shadcn** (sau Tailwind):

```bash
npx shadcn@latest init
# Chọn: New York / Zinc / CSS variables

# Components thường dùng cho app này
npx shadcn@latest add button avatar dialog sheet input scroll-area badge tabs dropdown-menu toast
```

**Quy ước UI:**

| Màn hình | shadcn components |
|----------|-------------------|
| Inbox | `ScrollArea`, `Avatar`, `Badge` (unread) |
| Chat | `Input`, `Button`, `DropdownMenu`, `Dialog` (ảnh/sticker) |
| Diary feed | `Card`, `Avatar`, `Button` |
| Story viewer | Full-screen custom + `Progress` (segments) |
| Friend requests | `Tabs`, `Button` |
| Settings | `Switch`, `Separator` |

**Theme:** dùng CSS variables của shadcn (`--background`, `--primary`, …) — primary màu xanh Zalo `#0068FF` có thể override trong `globals.css`.

```css
/* src/index.css */
:root {
  --primary: 211 100% 50%; /* ~ #0068FF */
}
```

---

### App providers (entry)

```tsx
// src/app/App.tsx
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}
```

---

## 3. Xác thực & phiên đăng nhập

### Cách Android đang làm (cần biết để tương thích)

**Login không dùng Firebase Auth làm chính.** App query Firestore:

```typescript
// Tương đương FireBaseInstance.checkLogin()
const q = query(
  collection(db, 'users'),
  where('email', '==', email),
  where('password', '==', password)  // ⚠️ plaintext trong Firestore
);
const snap = await getDocs(q);
// Document id = userId (keyAuth) dùng xuyên suốt app
```

**Sau login thành công**, lưu session cục bộ:

| Key | Ý nghĩa |
|-----|---------|
| `KEY_AUTH` | User document id (`users/{userId}`) |
| `NAME_USER` | Tên hiển thị cache |
| `STATUS_LOGGED_IN` | `boolean` |
| `LANGUAGE_SELECTED` | `0` = VI, `1` = EN |

Web tương đương: **Zustand persist** (`sessionStore`) — xem §2.

| Key (Android) | Zustand field | Storage |
|---------------|---------------|---------|
| `KEY_AUTH` | `userId` | localStorage qua persist |
| `NAME_USER` | `displayName` | localStorage |
| `STATUS_LOGGED_IN` | `isLoggedIn` | localStorage |
| `LANGUAGE_SELECTED` | `language` | localStorage |

### Đăng ký

1. Kiểm tra email chưa tồn tại (`users where email == ...`)
2. Tạo doc mới trong `users` với fields: `email`, `password`, `name`, `avatar`
3. Document id auto-generated → trở thành `userId`

### Khuyến nghị cho web (production)

| Hiện tại (Android) | Nên làm trên web |
|--------------------|------------------|
| Plaintext password | Firebase Auth (email/password) hoặc API backend |
| Client-side authorization | Firestore Security Rules |
| FCM token từ client | Giữ nguyên; gửi push qua Cloud Functions |

> **Giai đoạn 1 (MVP tương thích):** replicate login Firestore như Android để web/mobile dùng chung data.  
> **Giai đoạn 2:** migrate sang Firebase Auth + Cloud Functions.

### Luồng routing (React Router)

```
/ → SplashPage
  ├─ chưa login (Zustand isLoggedIn=false) → /intro → /login | /register
  └─ đã login → AuthGate → MainLayout
        ├─ /home      (tab Tin nhắn)
        ├─ /contacts  (tab Danh bạ)
        ├─ /discover  (tab Khám phá)
        ├─ /diary     (tab Nhật ký)
        └─ /profile   (tab Cá nhân)
```

Chi tiết route map: §5.1.

---

## 4. Firebase — Schema chi tiết

### 4.1 Firestore Collections

#### `users/{userId}`

```typescript
interface UserDoc {
  name: string;
  email: string;
  password: string;      // ⚠️ plaintext
  avatar: string;        // Cloudinary URL
  imageCover?: string;   // Cloudinary URL
}
```

**Subcollections:**

| Path | Mô tả |
|------|--------|
| `users/{userId}/friends/{friendId}` | `{ name, avatar, keyAuth, since }` |
| `users/{userId}/diaryNotifications/{id}` | Thông báo diary (xem §4.1.6) |

---

#### `friendRequests/{requestId}`

```typescript
interface FriendRequestDoc {
  fromId: string;
  toId: string;
  fromName: string;
  fromAvatar: string;
  toName: string;
  toAvatar: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
}
```

**Accept flow (batch write):**
1. Update request → `accepted`
2. Ghi `users/{A}/friends/{B}` và `users/{B}/friends/{A}`
3. Nếu chưa có inbox → seed row "Hai bạn đã trở thành bạn bè"

**Friendship status API** (logic client):

```typescript
type FriendshipStatus = 'friend' | 'pending_sent' | 'pending_received' | 'none';
```

---

#### `Conversation{userId}/{roomId}` — Inbox row

> ⚠️ Tên collection có prefix `Conversation` + userId (không phải subcollection của `users`).

```typescript
interface ConversationDoc {
  friendId: string;       // userId (1-1) hoặc groupId (nhóm)
  friendImage: string;
  message: string;        // preview tin cuối
  name: string;
  person: string;         // tên hiển thị đối phương / nhóm
  sender: string;         // userId người gửi tin cuối
  time: string;           // format yyyy_MM_dd_HH_mm_ss
  seen: boolean;
  numberUnSeen: number;
  typing: boolean;
  isGroup?: boolean;
}
```

Query inbox: `Conversation{userId}` orderBy `time` DESC.

---

#### `messages/{roomId}/chats/{time}` — Tin nhắn

**Room ID convention:**

```typescript
// Chat 1-1: sorted pair string
function roomId1v1(userA: string, userB: string): string {
  return JSON.stringify([userA, userB].sort());
  // Android dùng listOf(a,b).sorted().toString() → "[userA, userB]"
}

// Chat nhóm: roomId = groupId (UUID)
```

**Message document:**

```typescript
interface MessageDoc {
  message: string;
  sender: string;
  receiver: string;       // userId hoặc groupId
  time: string;           // = document id, format yyyy_MM_dd_HH_mm_ss
  type: MessageType;      // 0=text, 1=photos, 2=single photo, 3=audio, 4=system
  photos?: string[];      // Cloudinary URLs
  photoSizes?: string[];  // "widthxheight" tương ứng photos
  singlePhoto?: string[];
  audio?: string;
  emotion?: EmotionDoc;
  mentions?: MessageMention[];
  replyTo?: MessageReply;
  forwardFromId?: string;
  forwardFromName?: string;
  systemEvent?: 'add' | 'remove' | 'leave';
  systemActorId?: string;
  systemActorName?: string;
  systemTargetIds?: string[];
  systemTargetNames?: string[];
}

interface EmotionDoc {
  favourite: Record<string, number>;  // userId → count
  like: Record<string, number>;
  laugh: Record<string, number>;
  cry: Record<string, number>;
  angry: Record<string, number>;
}

interface MessageMention {
  userId: string;
  token: string;
  displayName: string;
}

interface MessageReply {
  messageTime: string;
  senderId: string;
  senderName: string;
  previewText: string;
  type: number;
  photoUrl?: string;
}
```

**Pinned messages:** doc `messages/{roomId}` (không phải subcollection)

```typescript
interface PinnedMessagesDoc {
  pinnedMessages: Array<{
    messageTime: string;
    pinnedBy: string;
    pinnedByName: string;
    previewText: string;
    messageType: number;
    photoUrl?: string;
  }>;
}
// Max 10 pinned messages / thread
```

---

#### `groups/{groupId}`

```typescript
interface GroupDoc {
  name: string;
  photoUrl: string;
  memberIds: string[];
  createdBy: string;
  createdAt: Timestamp;
  typing?: boolean;
  typingUserId?: string;
  typingUsers?: Record<string, boolean>;  // { [userId]: true }, TTL 8s
}
```

**Subcollection:** `groups/{groupId}/memberRead/{userId}`

```typescript
interface MemberReadDoc {
  lastReadTime: string;  // message time string
}
```

---

#### `posts/{postId}` — Diary

```typescript
interface DiaryPostDoc {
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  content: string;
  imageUrls: string[];          // Cloudinary URLs
  linkPreview?: {
    url: string;
    title: string;
    description: string;
    imageUrl?: string;
  };
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  likeCount: number;
  commentCount: number;
  emotionSummary: Record<string, number>;  // EmotionType name → count
}
```

**Subcollections:**

```
posts/{postId}/likes/{userId}           // legacy
posts/{postId}/reactions/{userId}       // { type: 'LIKE'|'LAUGH'|..., createdAt }
posts/{postId}/comments/{commentId}     // top-level comment
posts/{postId}/comments/{commentId}/likes/{userId}
posts/{postId}/comments/{commentId}/replies/{replyId}
posts/{postId}/comments/{commentId}/replies/{replyId}/likes/{userId}
```

**Comment / Reply:**

```typescript
interface CommentDoc {
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  text: string;
  createdAt: Timestamp;
  likeCount: number;
  replyCount: number;       // chỉ trên top-level comment
  mentionedUserId?: string; // chỉ trên reply
  mentionedName?: string;
}
```

**Feed algorithm (Android — replicate trên web):**

1. Listen `users/{me}/friends`
2. Chunk friend author ids (max **10** per `whereIn` query)
3. Query `posts where authorId in chunk` limit **80**
4. Merge, sort client-side by `createdAtMillis` DESC
5. Hiển thị max **50** posts

---

#### `stories/{storyId}`

Constants: `data/firestore/StoryFirestore.kt`

```typescript
interface StoryDoc {
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: Timestamp;
  expiresAt: Timestamp;           // createdAt + 24h
  privacy: 'everyone' | 'friends' | 'custom';
  visibleToUserIds?: string[];    // khi privacy = custom
  musicTrackId?: string;
  musicName?: string;
  musicArtist?: string;
  musicAudioUrl?: string;
  musicImageUrl?: string;
  musicStickerX?: number;         // 0..1 normalized
  musicStickerY?: number;
  mediaScale?: number;
  mediaRotation?: number;
  mediaTranslationX?: number;
  mediaTranslationY?: number;
}
```

**Views:** `stories/{storyId}/views/{viewerId}` → `{ viewedAt: Timestamp }`

**Story rings (UI grouping):**

```typescript
interface StoryRing {
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  stories: Story[];       // sorted by createdAtMillis ASC
  hasUnseen: boolean;
  isMe: boolean;
}
```

Query: `stories where expiresAt > now()` limit 150, filter privacy client-side.

**Viewer navigation (Android behavior):**
- Outer pager = 1 user/ring
- Inner pager = stories của user đó
- Tap phải: story tiếp theo; story cuối → user kế
- Vuốt ngang: chuyển user (ring) kế tiếp
- Progress: ảnh 5s, video max 30s

---

#### `users/{userId}/diaryNotifications/{id}`

```typescript
type DiaryNotificationType =
  | 'POST_REACTION'
  | 'POST_COMMENT'
  | 'COMMENT_LIKE'
  | 'COMMENT_REPLY'
  | 'REPLY_LIKE';

interface DiaryNotificationDoc {
  type: DiaryNotificationType;
  actorId: string;
  actorName: string;
  actorAvatarUrl: string;
  postId: string;
  commentId?: string;
  replyId?: string;
  reactionType?: string;
  read: boolean;
  createdAt: Timestamp;
}
```

---

#### Khác

| Collection | Mô tả |
|------------|--------|
| `Tokens/{userId}` | `{ token: string }` — FCM device token |
| `searchHistory/{userId}/items/{targetUserId}` | `{ name, avatar, keyAuth, searchedAt }` |
| `sticker/{packName}` | Map URL sticker (packs: hello, love, congatulation, angry, sad, sorry) |

---

### 4.2 Realtime Database (Presence)

| Path | Fields |
|------|--------|
| `.info/connected` | connection state |
| `status/{userId}` | `{ online: boolean, lastSeen: number }` |

Connect on login, disconnect on logout (`PresenceManager.kt`).

---

### 4.3 Firestore Indexes

File: `firestore.indexes.json` — composite indexes cho `stories` (`privacy`, `visibleToUserIds`, `authorId`, `expiresAt`).

---

## 5. Tính năng & màn hình

### 5.1 Route map (React Router v6)

| Route | Page component | Android Fragment | Ghi chú |
|-------|----------------|------------------|---------|
| `/` | `SplashPage` | SplashFragment | Redirect theo Zustand session |
| `/intro` | `IntroPage` | IntroFragment | |
| `/login` | `LoginPage` | LoginFragment | `AuthLayout` |
| `/register` | `RegisterPage` | RegisterFragment | `AuthLayout` |
| `/home` | `InboxPage` | HomeFragment | Tab 1 — `useInboxQuery` |
| `/contacts` | `ContactsPage` | PhoneBookFragment | Tab 2 |
| `/contacts/requests` | `FriendRequestsPage` | FriendRequestFragment | Nested |
| `/discover` | `DiscoverPage` | DiscoverFragment | Tab 3 |
| `/search` | `SearchPage` | SearchFragment | Full-screen |
| `/scan-qr` | `ScanQRPage` | ScanQRFragment | Web: `html5-qrcode` |
| `/diary` | `DiaryPage` | DiaryFragment | Tab 4 — feed + story rings |
| `/diary/post/new` | `CreatePostPage` | StatusFragment | |
| `/diary/post/:postId` | `PostDetailPage` | — | Comments sheet/page |
| `/diary/notifications` | `DiaryNotificationsPage` | DiaryNotificationFragment | |
| `/stories/create` | `CreateStoryPage` | CreateStoryFragment | |
| `/stories/view` | `StoryViewerPage` | StoryViewerFragment | `?authorId=&rings=` |
| `/profile` | `ProfilePage` | PersonalFragment | Tab 5 |
| `/profile/:userId` | `UserProfilePage` | PersonalActivity | |
| `/settings` | `SettingsPage` | SettingFragment | Logout → `queryClient.clear()` |
| `/chat/:roomId` | `ChatPage` | ChatFragment | Ẩn bottom nav |
| `/chat/new-group` | `CreateGroupPage` | CreateGroupFragment | |

### 5.2 Bottom navigation (5 tab — React Router NavLink)

```
Tin nhắn | Danh bạ | Khám phá | Nhật ký | Cá nhân
/home    | /contacts | /discover | /diary | /profile
```

Implement trong `MainLayout` — ẩn bottom nav khi ở `/chat/*`, `/stories/view`.

---

## 6. Repository contracts (TypeScript)

Mirror interfaces từ `domain/src/main/kotlin/.../repository/`. Web implement cùng signature trong `src/data/repositories/`.

> **Session:** Android dùng `SessionRepository` (SharedPreferences). Web thay bằng **`useSessionStore` (Zustand)** — không cần `SessionRepository` impl riêng; các repository khác đọc `userId` từ store.

```typescript
// ─── Session → Zustand (thay SessionRepository) ───
// Xem §2: useSessionStore { userId, displayName, isLoggedIn, language, login, logout }

// ─── Auth ───
interface AuthRepository {
  checkLogin(email: string, password: string): Promise<User[]>;
  registerUser(user: User, password: string): Promise<void>;
  isEmailRegistered(email: string): Promise<boolean>;
}

// ─── User ───
interface UserRepository {
  getInfoUser(userId: string): Promise<User>;
  getUserById(userId: string): Promise<User>;
  updateAvatar(userId: string, avatarUrl: string): Promise<void>;
  updateImageCover(userId: string, url: string): Promise<void>;
  saveFcmToken(userId: string, token: string): Promise<void>;
  uploadProfileImage(file: File, userId: string, isAvatar: boolean): Promise<string>;
}

// ─── Friends ───
interface FriendRepository {
  getFriends(userId: string): Promise<Friend[]>;
  sendFriendRequest(from: UserInfo, to: UserInfo): Promise<void>;
  getIncomingFriendRequests(userId: string): Promise<FriendRequest[]>;
  getOutgoingFriendRequests(userId: string): Promise<FriendRequest[]>;
  acceptFriendRequest(request: FriendRequest, myName: string, myAvatar: string): Promise<void>;
  rejectFriendRequest(requestId: string): Promise<void>;
  cancelFriendRequest(fromId: string, toId: string): Promise<void>;
  searchUsers(query: string): Promise<User[]>;
  getFriendshipStatus(userId: string, otherId: string): Promise<FriendshipStatus>;
}

// ─── Inbox ───
interface ConversationRepository {
  observeInbox(userId: string): Unsubscribe;
  observeConversation(friendId: string, userId: string): Unsubscribe;
  getUnreadCount(userId: string): Promise<number>;
}

// ─── Chat ───
interface ChatRepository {
  messageThreadDocumentId(conversation: Conversation, userId: string): string;
  observeMessages(conversation: Conversation, userId: string): Unsubscribe;
  observePinnedMessages(conversation: Conversation, userId: string): Unsubscribe;
  sendMessage(params: SendMessageParams): Promise<void>;
  removeMessage(conversation: Conversation, userId: string, time: string): Promise<void>;
  pinMessage(message: Message, conversation: Conversation, userId: string, userName: string): Promise<void>;
  unpinMessage(conversation: Conversation, userId: string, messageTime: string): Promise<void>;
  toggleMessageReaction(time: string, conversation: Conversation, userId: string, type: EmotionType): Promise<void>;
  updateTyping(conversation: Conversation, userId: string, typing: boolean): Promise<void>;
  observeTyping(conversation: Conversation, userId: string): Unsubscribe;
  markSeen(message: Message, conversation: Conversation, userId: string): Promise<void>;
}

// ─── Group ───
interface GroupChatRepository {
  createGroup(params: CreateGroupParams): Promise<{ groupId: string; inbox: Conversation }>;
  getGroup(groupId: string): Promise<GroupChat>;
  loadGroupMembers(groupId: string): Promise<User[]>;
  addGroupMembers(groupId: string, newMemberIds: string[], inviterId: string): Promise<void>;
  removeGroupMember(groupId: string, memberId: string, actorId: string): Promise<void>;
  leaveGroup(groupId: string, userId: string): Promise<void>;
  observeGroupTyping(groupId: string, myUserId: string): Unsubscribe;
  observeGroupMemberRead(groupId: string): Unsubscribe;
  markGroupMessageRead(userId: string, groupId: string, lastReadTime: string): Promise<void>;
}

// ─── Diary ───
interface DiaryRepository {
  observeFeed(userId: string, onPosts: (posts: DiaryPost[]) => void, onError?: (e: Error) => void): Unsubscribe;
  createPost(params: CreatePostParams): Promise<string>;  // returns postId
  updatePost(postId: string, ...): Promise<void>;
  deletePost(postId: string): Promise<void>;
  setPostReaction(postId: string, userId: string, type: EmotionType | null): Promise<void>;
  observeComments(postId: string, ...): Unsubscribe;
  addComment / editComment / deleteComment
  observeReplies(postId: string, commentId: string, ...): Unsubscribe;
  addReply / editReply / deleteReply
  toggleCommentLike / toggleReplyLike
}

// ─── Story ───
interface StoryRepository {
  observeStoryRings(userId: string, onRings: (rings: StoryRing[]) => void): Unsubscribe;
  createStory(params: CreateStoryParams, onProgress?: (pct: number) => void): Promise<string>;
  markStoryViewed(storyId: string, viewerId: string): Promise<void>;
  updateStoryPrivacy(storyId: string, authorId: string, privacy: StoryPrivacy, visibleToUserIds: string[]): Promise<void>;
  deleteStory(storyId: string, authorId: string): Promise<void>;
}

// ─── Presence ───
interface PresenceRepository {
  connect(userId: string): void;
  disconnect(userId: string): void;
  observePresence(userId: string): Unsubscribe;
}

// ─── Media ───
interface MediaUploadRepository {
  uploadPhotos(files: File[], roomId: string, onProgress?: (pct: number) => void): Promise<string[]>;
  uploadAudio(file: File, roomId: string, onProgress?: (pct: number) => void): Promise<string>;
}
```

Type `Unsubscribe = () => void` — wrapper cho Firestore listener cleanup.

---

## 7. Real-time vs one-shot

> **Quy ước TanStack Query:** mục **real-time** dùng `useFirestoreSubscription` + `queryKey` (§2). Mục **one-shot** dùng `useQuery` với `queryFn` gọi `getDoc`/`getDocs` hoặc `useMutation`.

### Dùng `onSnapshot` → TanStack Query cache

| Data | Query | TanStack Query key |
|------|-------|-------------------|
| Inbox | `Conversation{userId}` orderBy time DESC | `['inbox', userId]` |
| Messages | `messages/{roomId}/chats` orderBy time ASC | `['messages', roomId]` |
| Pinned | `messages/{roomId}` doc | `['pinned', roomId]` |
| 1-1 typing | `Conversation{friendId}/{userId}` | `['typing', roomId]` |
| Group typing | `groups/{groupId}` | `['group-typing', groupId]` |
| Group read | `groups/{groupId}/memberRead` | `['group-read', groupId]` |
| Friends | `users/{id}/friends` | `['friends', userId]` |
| Friend requests | `friendRequests where toId/fromId == me` | `['friend-requests', userId, 'in'|'out']` |
| Diary feed | friends listener + chunked posts | `['diary-feed', userId]` |
| Comments/replies | subcollection listeners | `['comments', postId]`, `['replies', postId, commentId]` |
| Diary notifications | `users/{id}/diaryNotifications` | `['diary-notifications', userId]` |
| Story rings | `stories where expiresAt > now` | `['story-rings', userId]` |
| Presence | RTDB `status/{userId}` | `['presence', targetUserId]` |

### Dùng `getDoc` / `getDocs` → `useQuery` / `useMutation`

| Data | Query | Hook gợi ý |
|------|-------|------------|
| Login | `users where email+password` | `useMutation` trong `LoginPage` |
| User profile | `users/{id}` | `useQuery(['user', id])` |
| Single post | `posts/{id}` | `useQuery(['post', id])` |
| Friendship status | friends doc + requests | `useQuery(['friendship', me, other])` |
| FCM token (khi gửi) | `Tokens/{friendId}` | server-side only |
| Story view check | `stories/{id}/views/{me}` | trong story repository |
| Search history | `searchHistory/{me}/items` | `useQuery(['search-history', userId])` |
| Sticker pack | `sticker/{pack}` | `useQuery(['stickers', pack])` |
| Group metadata | `groups/{id}` | `useQuery(['group', id])` |

---

## 8. Upload media (Cloudinary)

Android dùng **Cloudinary** (không dùng Firebase Storage).

| Config | Value |
|--------|-------|
| Cloud name | `dpdzs8jh8` |
| Upload preset | `upload_file` (unsigned) |
| Endpoint | `https://api.cloudinary.com/v1_1/dpdzs8jh8/upload` |

### Folder convention

| Use case | Folder |
|----------|--------|
| Avatar / cover | `images/` |
| Diary images | `images/` |
| Chat photos/videos | `photo/{roomId}/` |
| Chat audio | `audios/{roomId}/` |
| Stories | `stories/{authorId}/` |

### Web upload example

```typescript
async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', 'upload_file');
  form.append('folder', folder);

  const res = await fetch('https://api.cloudinary.com/v1_1/dpdzs8jh8/upload', {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  return data.secure_url as string;
}
```

Sau upload, lưu `secure_url` vào Firestore (giống Android).

---

## 9. Business rules & hằng số

### Message types

| Value | Type |
|-------|------|
| 0 | Text |
| 1 | Multiple photos |
| 2 | Single photo |
| 3 | Audio |
| 4 | System event |

### Emotion / Reaction types

```typescript
enum EmotionType {
  FAVOURITE = 'favourite',
  LIKE = 'like',
  LAUGH = 'laugh',
  CRY = 'cry',
  ANGRY = 'angry',
}
```

### Chat rules

| Rule | Value |
|------|-------|
| Max pinned messages | 10 |
| Message group gap (UI) | 3 minutes |
| Group typing TTL | 8 seconds |
| @All user id | `__all__` |

### Group rules

| Rule | Value |
|------|-------|
| Min members | 2 (creator + ≥1) |
| Group id | UUID v4 |

### Diary rules

| Rule | Value |
|------|-------|
| whereIn chunk size | 10 author ids |
| Max displayed posts | 50 |
| Notification preview truncate | 200 chars |
| Không notify chính mình | `recipientId !== actorId` |

### Story rules

| Rule | Value |
|------|-------|
| Storage TTL | 24 hours |
| Image playback duration | 5 seconds |
| Video max playback | 30 seconds |
| Custom privacy | requires ≥1 friend in `visibleToUserIds` |

### Story privacy filter (client-side)

```typescript
function canViewStory(story: StoryDoc, viewerId: string, friendIds: Set<string>): boolean {
  if (story.authorId === viewerId) return true;
  switch (story.privacy) {
    case 'everyone': return true;
    case 'friends': return friendIds.has(story.authorId);
    case 'custom': return story.visibleToUserIds?.includes(viewerId) ?? false;
    default: return false;
  }
}
```

---

## 10. Lộ trình triển khai web

### Phase 0 — Scaffold (tuần 1)

- [ ] `npm create vite@latest` + TypeScript
- [ ] Tailwind + shadcn/ui init, theme primary #0068FF
- [ ] Firebase SDK + `.env` (Firestore + RTDB)
- [ ] React Router: `AuthLayout`, `MainLayout`, bottom nav 5 tab
- [ ] TanStack Query `QueryProvider` + `useFirestoreSubscription` helper
- [ ] Zustand `sessionStore` persist

### Phase 1 — MVP (2–3 tuần)

- [ ] Login/register (Firestore query) + Zustand session
- [ ] `useInboxQuery` + InboxPage (shadcn Avatar, Badge)
- [ ] ChatPage text-only + `useMessagesQuery`
- [ ] ContactsPage + friend requests
- [ ] ProfilePage cơ bản

### Phase 2 — Chat đầy đủ

- [ ] Cloudinary upload hook + mutations
- [ ] Reaction, reply, pin
- [ ] Group chat + mention
- [ ] Typing + presence (`usePresenceQuery` — RTDB)
- [ ] Read receipts

### Phase 3 — Social

- [ ] Diary feed (`useDiaryFeedQuery`) + create post
- [ ] Comments/replies + reactions
- [ ] Diary notifications
- [ ] Stories create + viewer (nested carousel)

### Phase 4 — Polish

- [ ] Search + QR (`html5-qrcode`)
- [ ] FCM web hoặc Cloud Functions
- [ ] i18n VI/EN (Zustand `language`)
- [ ] Responsive mobile web (Tailwind `md:` breakpoints)

---

## 11. Bảo mật — lưu ý quan trọng

| Vấn đề hiện tại | Hành động cho web |
|-----------------|-------------------|
| Password plaintext trong Firestore | **Không replicate lâu dài** — plan migrate Firebase Auth |
| Không có Security Rules trong repo | Viết Firestore Rules trước khi public web |
| Service account key trong Android client (`AccessToken.kt`) | **Không đưa lên browser** — FCM gửi qua Cloud Functions |
| Story/diary privacy filter client-side | Thêm server-side rules hoặc Cloud Functions |

### Firestore Rules tối thiểu (draft)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuth() {
      return request.auth != null;
    }
    // TODO: migrate sang request.auth.uid thay vì client-side userId
    match /users/{userId} {
      allow read: if true;  // tighten in production
      allow write: if false; // chỉ qua Admin SDK / Functions
    }
    // ... rules cho từng collection
  }
}
```

---

## Phụ lục — File tham chiếu Android

| Chủ đề | File |
|--------|------|
| Firebase gateway | `data/legacy/FireBaseInstance.kt` |
| Story schema | `data/firestore/StoryFirestore.kt` |
| Diary schema | `data/firestore/DiaryPostFirestore.kt` |
| Message schema | `data/firestore/Message.kt` |
| Domain models | `domain/src/main/kotlin/.../domain/model/` |
| Repository interfaces | `domain/src/main/kotlin/.../domain/repository/` |
| Navigation | `app/src/main/res/navigation/navigation_main.xml` |
| Cloudinary | `data/legacy/CloudinaryManager.kt` |
| Presence | `data/legacy/PresenceManager.kt` |
| Story viewer UX | `app/.../fragment/StoryViewerFragment.kt` |

---

## Quick start

### 1. Tạo project

```bash
npm create vite@latest zalo-clone-web -- --template react-ts
cd zalo-clone-web
npm install
```

### 2. Cài stack

```bash
npm install react-router-dom @tanstack/react-query zustand firebase
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn@latest init
npx shadcn@latest add button avatar input scroll-area badge dialog sheet toast
```

### 3. Cấu hình alias Vite (`@/`)

```typescript
// vite.config.ts
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
```

```json
// tsconfig.json → compilerOptions.paths
{ "@/*": ["./src/*"] }
```

### 4. Firebase

```typescript
// src/data/firebase/app.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: 'zalo-clone-45246',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const rtdb = getDatabase(firebaseApp);
```

### 5. Entry app

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### 6. Thứ tự implement

1. `sessionStore` (Zustand) + `AuthGate`
2. `router.tsx` + `MainLayout` bottom nav
3. `inboxRepository` + `useInboxQuery`
4. `authRepository` + `LoginPage`
5. Các feature còn lại theo §10

Chi tiết kiến trúc từng layer: **§2 Tech stack & kiến trúc React**.

---

*Tài liệu mô tả web Zalo-Clone dùng **React + TypeScript + Vite + React Router + TanStack Query + Zustand + Firebase JS SDK + Tailwind + shadcn/ui**, tương thích backend Android.*
