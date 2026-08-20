import { BookOpen, Compass, MessageCircle, User, Users } from 'lucide-react'

export const tabs = [
  { to: '/home', label: 'Tin nhắn', icon: MessageCircle },
  { to: '/contacts', label: 'Danh bạ', icon: Users },
  { to: '/discover', label: 'Khám phá', icon: Compass },
  { to: '/diary', label: 'Nhật ký', icon: BookOpen },
  { to: '/profile', label: 'Cá nhân', icon: User },
] as const

export function isTabActive(pathname: string, to: string): boolean {
  if (to === '/home') {
    return pathname === '/home' || pathname.startsWith('/chat')
  }
  if (to === '/profile') {
    return pathname.startsWith('/profile') || pathname === '/settings'
  }
  return pathname === to || pathname.startsWith(`${to}/`)
}
