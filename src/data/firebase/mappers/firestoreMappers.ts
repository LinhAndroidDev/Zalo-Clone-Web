import type { DocumentData } from 'firebase/firestore'
import type {
  Conversation,
  Friend,
  FriendRequest,
  Message,
  User,
} from '@/domain/models'

export function mapUser(userId: string, data: DocumentData): User {
  return {
    userId,
    name: String(data.name ?? ''),
    email: String(data.email ?? ''),
    avatar: String(data.avatar ?? ''),
    imageCover: data.imageCover ? String(data.imageCover) : undefined,
  }
}

export function mapFriend(id: string, data: DocumentData): Friend {
  return {
    keyAuth: String(data.keyAuth ?? id),
    name: String(data.name ?? ''),
    avatar: String(data.avatar ?? ''),
    since: data.since ? String(data.since) : undefined,
  }
}

export function mapFriendRequest(
  requestId: string,
  data: DocumentData,
): FriendRequest {
  const createdAt = data.createdAt?.toDate?.() as Date | undefined
  return {
    requestId,
    fromId: String(data.fromId ?? ''),
    toId: String(data.toId ?? ''),
    fromName: String(data.fromName ?? ''),
    fromAvatar: String(data.fromAvatar ?? ''),
    toName: String(data.toName ?? ''),
    toAvatar: String(data.toAvatar ?? ''),
    status: (data.status as FriendRequest['status']) ?? 'pending',
    createdAt,
  }
}

export function mapConversation(
  roomDocId: string,
  data: DocumentData,
): Conversation {
  return {
    roomDocId,
    friendId: String(data.friendId ?? roomDocId),
    friendImage: String(data.friendImage ?? ''),
    message: String(data.message ?? ''),
    name: String(data.name ?? ''),
    person: String(data.person ?? ''),
    sender: String(data.sender ?? ''),
    time: String(data.time ?? ''),
    seen: Boolean(data.seen),
    numberUnSeen: Number(data.numberUnSeen ?? 0),
    typing: Boolean(data.typing),
    isGroup: Boolean(data.isGroup),
  }
}

export function mapMessage(time: string, data: DocumentData): Message {
  return {
    time: String(data.time ?? time),
    message: String(data.message ?? ''),
    sender: String(data.sender ?? ''),
    receiver: String(data.receiver ?? ''),
    type: Number(data.type ?? 0),
  }
}
