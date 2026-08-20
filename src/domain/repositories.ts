import type { EmotionType } from '@/config/constants'
import type {
  Conversation,
  DiaryComment,
  DiaryNotification,
  DiaryPost,
  DiaryReply,
  Friend,
  FriendRequest,
  FriendshipStatus,
  GroupChat,
  MemberRead,
  Message,
  MessageMention,
  MessageReply,
  PinnedMessage,
  PresenceStatus,
  StoryPrivacy,
  StoryRing,
  Unsubscribe,
  UploadedPhoto,
  User,
} from '@/domain/models'

export interface AuthRepository {
  checkLogin(email: string, password: string): Promise<User[]>
  registerUser(user: Omit<User, 'userId'>, password: string): Promise<string>
  isEmailRegistered(email: string): Promise<boolean>
}

export interface UserRepository {
  getInfoUser(userId: string): Promise<User>
  getUserById(userId: string): Promise<User>
}

export interface FriendRepository {
  observeFriends(
    userId: string,
    onData: (friends: Friend[]) => void,
  ): Unsubscribe
  sendFriendRequest(from: User, to: User): Promise<void>
  getIncomingFriendRequests(userId: string): Promise<FriendRequest[]>
  getOutgoingFriendRequests(userId: string): Promise<FriendRequest[]>
  observeIncomingFriendRequests(
    userId: string,
    onData: (requests: FriendRequest[]) => void,
  ): Unsubscribe
  observeOutgoingFriendRequests(
    userId: string,
    onData: (requests: FriendRequest[]) => void,
  ): Unsubscribe
  acceptFriendRequest(
    request: FriendRequest,
    myName: string,
    myAvatar: string,
  ): Promise<void>
  rejectFriendRequest(requestId: string): Promise<void>
  cancelFriendRequest(fromId: string, toId: string): Promise<void>
  getFriendshipStatus(
    userId: string,
    otherId: string,
  ): Promise<FriendshipStatus>
}

export interface ConversationRepository {
  observeInbox(
    userId: string,
    onData: (conversations: Conversation[]) => void,
  ): Unsubscribe
  observeConversation(
    ownerId: string,
    otherId: string,
    onData: (row: Conversation | null) => void,
  ): Unsubscribe
}

export interface SendMessageParams {
  roomId: string
  senderId: string
  senderName: string
  senderAvatar: string
  receiverId: string
  receiverName: string
  receiverAvatar: string
  text?: string
  photos?: UploadedPhoto[]
  audioUrl?: string
  replyTo?: MessageReply
  mentions?: MessageMention[]
  isGroup?: boolean
  memberIds?: string[]
  memberProfiles?: Record<string, { name: string; avatar: string }>
}

export interface ChatRepository {
  messageThreadDocumentId(friendId: string, userId: string): string
  observeMessages(
    roomId: string,
    onData: (messages: Message[]) => void,
  ): Unsubscribe
  observePinnedMessages(
    roomId: string,
    onData: (pinned: PinnedMessage[]) => void,
  ): Unsubscribe
  sendMessage(params: SendMessageParams): Promise<void>
  removeMessage(roomId: string, time: string): Promise<void>
  pinMessage(
    message: Message,
    roomId: string,
    userId: string,
    userName: string,
  ): Promise<void>
  unpinMessage(roomId: string, messageTime: string): Promise<void>
  toggleMessageReaction(
    roomId: string,
    time: string,
    userId: string,
    type: EmotionType,
  ): Promise<void>
  updateTyping(
    myUserId: string,
    peerId: string,
    typing: boolean,
  ): Promise<void>
  observeTyping(
    myUserId: string,
    peerId: string,
    onData: (typing: boolean) => void,
  ): Unsubscribe
  markSeen(userId: string, friendId: string): Promise<void>
}

export interface CreateGroupParams {
  name: string
  photoUrl: string
  memberIds: string[]
  creator: User
  memberProfiles: Record<string, { name: string; avatar: string }>
}

export interface GroupChatRepository {
  createGroup(
    params: CreateGroupParams,
  ): Promise<{ groupId: string }>
  getGroup(groupId: string): Promise<GroupChat>
  loadGroupMembers(groupId: string): Promise<User[]>
  addGroupMembers(
    groupId: string,
    newMemberIds: string[],
    inviter: User,
    memberProfiles: Record<string, { name: string; avatar: string }>,
  ): Promise<void>
  removeGroupMember(
    groupId: string,
    memberId: string,
    actor: User,
    memberName: string,
  ): Promise<void>
  leaveGroup(groupId: string, user: User): Promise<void>
  observeGroup(
    groupId: string,
    onData: (group: GroupChat) => void,
  ): Unsubscribe
  observeGroupTyping(
    groupId: string,
    myUserId: string,
    onData: (typingUserIds: string[]) => void,
  ): Unsubscribe
  setGroupTyping(groupId: string, userId: string, typing: boolean): Promise<void>
  observeGroupMemberRead(
    groupId: string,
    onData: (reads: MemberRead[]) => void,
  ): Unsubscribe
  markGroupMessageRead(
    userId: string,
    groupId: string,
    lastReadTime: string,
  ): Promise<void>
}

export interface PresenceRepository {
  connect(userId: string): void
  disconnect(userId: string): void
  observePresence(
    userId: string,
    onData: (status: PresenceStatus) => void,
  ): Unsubscribe
}

export interface MediaUploadRepository {
  uploadPhotos(
    files: File[],
    roomId: string,
    onProgress?: (pct: number) => void,
  ): Promise<UploadedPhoto[]>
  uploadAudio(
    file: File,
    roomId: string,
    onProgress?: (pct: number) => void,
  ): Promise<string>
  uploadImage(file: File, folder: string): Promise<string>
  uploadStoryMedia(
    file: File,
    authorId: string,
    onProgress?: (pct: number) => void,
  ): Promise<string>
}

export interface CreatePostParams {
  author: User
  content: string
  imageUrls: string[]
}

export interface DiaryRepository {
  observeFeed(
    userId: string,
    onPosts: (posts: DiaryPost[]) => void,
  ): Unsubscribe
  getPost(postId: string): Promise<DiaryPost>
  createPost(params: CreatePostParams): Promise<string>
  updatePost(postId: string, authorId: string, content: string): Promise<void>
  deletePost(postId: string, authorId: string): Promise<void>
  setPostReaction(
    postId: string,
    user: User,
    type: EmotionType | null,
    postAuthorId: string,
  ): Promise<void>
  observeComments(
    postId: string,
    userId: string,
    onData: (comments: DiaryComment[]) => void,
  ): Unsubscribe
  addComment(postId: string, author: User, text: string, postAuthorId: string): Promise<void>
  deleteComment(postId: string, commentId: string, authorId: string): Promise<void>
  toggleCommentLike(
    postId: string,
    commentId: string,
    user: User,
    commentAuthorId: string,
  ): Promise<void>
  observeReplies(
    postId: string,
    commentId: string,
    userId: string,
    onData: (replies: DiaryReply[]) => void,
  ): Unsubscribe
  addReply(
    postId: string,
    commentId: string,
    author: User,
    text: string,
    commentAuthorId: string,
    mentioned?: { userId: string; name: string },
  ): Promise<void>
  toggleReplyLike(
    postId: string,
    commentId: string,
    replyId: string,
    user: User,
    replyAuthorId: string,
  ): Promise<void>
  observeNotifications(
    userId: string,
    onData: (items: DiaryNotification[]) => void,
  ): Unsubscribe
  markNotificationRead(userId: string, notificationId: string): Promise<void>
}

export interface CreateStoryParams {
  author: User
  mediaUrl: string
  mediaType: 'image' | 'video'
  privacy: StoryPrivacy
  visibleToUserIds?: string[]
}

export interface StoryRepository {
  observeStoryRings(
    userId: string,
    friendIds: string[],
    onRings: (rings: StoryRing[]) => void,
  ): Unsubscribe
  createStory(params: CreateStoryParams): Promise<string>
  markStoryViewed(storyId: string, viewerId: string): Promise<void>
  deleteStory(storyId: string, authorId: string): Promise<void>
}

