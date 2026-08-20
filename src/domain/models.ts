import type { EmotionType } from '@/config/constants'

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

export interface MessageMention {
  userId: string
  token: string
  displayName: string
}

export interface MessageReply {
  messageTime: string
  senderId: string
  senderName: string
  previewText: string
  type: number
  photoUrl?: string
}

export interface EmotionDoc {
  favourite: Record<string, number>
  like: Record<string, number>
  laugh: Record<string, number>
  cry: Record<string, number>
  angry: Record<string, number>
}

export interface Message {
  time: string
  message: string
  sender: string
  receiver: string
  type: number
  photos?: string[]
  photoSizes?: string[]
  singlePhoto?: string[]
  audio?: string
  emotion?: EmotionDoc
  mentions?: MessageMention[]
  replyTo?: MessageReply
  forwardFromId?: string
  forwardFromName?: string
  systemEvent?: 'add' | 'remove' | 'leave'
  systemActorId?: string
  systemActorName?: string
  systemTargetIds?: string[]
  systemTargetNames?: string[]
}

export interface PinnedMessage {
  messageTime: string
  pinnedBy: string
  pinnedByName: string
  previewText: string
  messageType: number
  photoUrl?: string
}

export interface GroupChat {
  groupId: string
  name: string
  photoUrl: string
  memberIds: string[]
  createdBy: string
  typing?: boolean
  typingUserId?: string
  typingUsers?: Record<string, boolean>
}

export interface MemberRead {
  userId: string
  lastReadTime: string
}

export interface PresenceStatus {
  online: boolean
  lastSeen: number
}

export interface UploadedPhoto {
  url: string
  size: string
}

export interface LinkPreview {
  url: string
  title?: string
  description?: string
  imageUrl?: string
}

export interface DiaryPost {
  postId: string
  authorId: string
  authorName: string
  authorAvatarUrl: string
  content: string
  imageUrls: string[]
  linkPreview?: LinkPreview
  createdAtMillis: number
  likeCount: number
  commentCount: number
  emotionSummary: Record<string, number>
  myReaction?: EmotionType | null
}

export interface DiaryComment {
  commentId: string
  authorId: string
  authorName: string
  authorAvatarUrl: string
  text: string
  createdAtMillis: number
  likeCount: number
  replyCount: number
  likedByMe?: boolean
}

export interface DiaryReply {
  replyId: string
  authorId: string
  authorName: string
  authorAvatarUrl: string
  text: string
  createdAtMillis: number
  likeCount: number
  mentionedUserId?: string
  mentionedName?: string
  likedByMe?: boolean
}

export type DiaryNotificationType =
  | 'POST_REACTION'
  | 'POST_COMMENT'
  | 'COMMENT_LIKE'
  | 'COMMENT_REPLY'
  | 'REPLY_LIKE'

export interface DiaryNotification {
  id: string
  type: DiaryNotificationType
  actorId: string
  actorName: string
  actorAvatarUrl: string
  postId: string
  commentId?: string
  replyId?: string
  reactionType?: string
  read: boolean
  createdAtMillis: number
}

export type StoryPrivacy = 'everyone' | 'friends' | 'custom'

export interface Story {
  storyId: string
  authorId: string
  authorName: string
  authorAvatarUrl: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  createdAtMillis: number
  expiresAtMillis: number
  privacy: StoryPrivacy
  visibleToUserIds?: string[]
}

export interface StoryRing {
  authorId: string
  authorName: string
  authorAvatarUrl: string
  stories: Story[]
  hasUnseen: boolean
  isMe: boolean
}

export type { EmotionType }

export type Unsubscribe = () => void
