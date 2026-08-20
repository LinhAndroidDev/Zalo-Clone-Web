export interface User {
  userId: string
  name: string
  email: string
  avatar: string
  imageCover?: string
}

export interface Friend {
  keyAuth: string
  name: string
  avatar: string
  since?: string
}

export interface FriendRequest {
  requestId: string
  fromId: string
  toId: string
  fromName: string
  fromAvatar: string
  toName: string
  toAvatar: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt?: Date
}

export type FriendshipStatus =
  | 'friend'
  | 'pending_sent'
  | 'pending_received'
  | 'none'

export interface Conversation {
  roomDocId: string
  friendId: string
  friendImage: string
  message: string
  name: string
  person: string
  sender: string
  time: string
  seen: boolean
  numberUnSeen: number
  typing: boolean
  isGroup: boolean
}

export interface Message {
  time: string
  message: string
  sender: string
  receiver: string
  type: number
}

export type Unsubscribe = () => void
