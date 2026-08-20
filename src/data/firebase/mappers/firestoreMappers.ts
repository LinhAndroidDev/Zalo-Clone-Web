import type { DocumentData } from 'firebase/firestore'
import type {
  Conversation,
  EmotionDoc,
  Friend,
  FriendRequest,
  GroupChat,
  Message,
  MessageMention,
  MessageReply,
  PinnedMessage,
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

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.map((v) => String(v))
}

function mapEmotion(raw: unknown): EmotionDoc | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const data = raw as Record<string, Record<string, number>>
  const map = (key: string): Record<string, number> => {
    const entry = data[key]
    if (!entry || typeof entry !== 'object') return {}
    return Object.fromEntries(
      Object.entries(entry).map(([k, v]) => [k, Number(v) || 0]),
    )
  }
  return {
    favourite: map('favourite'),
    like: map('like'),
    laugh: map('laugh'),
    cry: map('cry'),
    angry: map('angry'),
  }
}

function mapReply(raw: unknown): MessageReply | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const data = raw as Record<string, unknown>
  return {
    messageTime: String(data.messageTime ?? ''),
    senderId: String(data.senderId ?? ''),
    senderName: String(data.senderName ?? ''),
    previewText: String(data.previewText ?? ''),
    type: Number(data.type ?? 0),
    photoUrl: data.photoUrl ? String(data.photoUrl) : undefined,
  }
}

function mapMentions(raw: unknown): MessageMention[] | undefined {
  if (!Array.isArray(raw)) return undefined
  return raw.map((item) => {
    const data = (item ?? {}) as Record<string, unknown>
    return {
      userId: String(data.userId ?? ''),
      token: String(data.token ?? ''),
      displayName: String(data.displayName ?? ''),
    }
  })
}

export function mapMessage(time: string, data: DocumentData): Message {
  const event = data.systemEvent
  return {
    time: String(data.time ?? time),
    message: String(data.message ?? ''),
    sender: String(data.sender ?? ''),
    receiver: String(data.receiver ?? ''),
    type: Number(data.type ?? 0),
    photos: asStringArray(data.photos),
    photoSizes: asStringArray(data.photoSizes),
    singlePhoto: asStringArray(data.singlePhoto),
    audio: data.audio ? String(data.audio) : undefined,
    emotion: mapEmotion(data.emotion),
    mentions: mapMentions(data.mentions),
    replyTo: mapReply(data.replyTo),
    forwardFromId: data.forwardFromId ? String(data.forwardFromId) : undefined,
    forwardFromName: data.forwardFromName
      ? String(data.forwardFromName)
      : undefined,
    systemEvent:
      event === 'add' || event === 'remove' || event === 'leave'
        ? event
        : undefined,
    systemActorId: data.systemActorId ? String(data.systemActorId) : undefined,
    systemActorName: data.systemActorName
      ? String(data.systemActorName)
      : undefined,
    systemTargetIds: asStringArray(data.systemTargetIds),
    systemTargetNames: asStringArray(data.systemTargetNames),
  }
}

export function mapPinnedMessages(data: DocumentData | undefined): PinnedMessage[] {
  const list = data?.pinnedMessages
  if (!Array.isArray(list)) return []
  return list.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>
    return {
      messageTime: String(row.messageTime ?? ''),
      pinnedBy: String(row.pinnedBy ?? ''),
      pinnedByName: String(row.pinnedByName ?? ''),
      previewText: String(row.previewText ?? ''),
      messageType: Number(row.messageType ?? 0),
      photoUrl: row.photoUrl ? String(row.photoUrl) : undefined,
    }
  })
}

export function mapGroup(groupId: string, data: DocumentData): GroupChat {
  const typingUsers = data.typingUsers
  return {
    groupId,
    name: String(data.name ?? ''),
    photoUrl: String(data.photoUrl ?? ''),
    memberIds: asStringArray(data.memberIds) ?? [],
    createdBy: String(data.createdBy ?? ''),
    typing: Boolean(data.typing),
    typingUserId: data.typingUserId ? String(data.typingUserId) : undefined,
    typingUsers:
      typingUsers && typeof typingUsers === 'object'
        ? (typingUsers as Record<string, boolean>)
        : undefined,
  }
}
