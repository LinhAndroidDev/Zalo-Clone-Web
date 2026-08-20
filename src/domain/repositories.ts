import type {
  Conversation,
  Friend,
  FriendRequest,
  FriendshipStatus,
  Message,
  Unsubscribe,
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
}

export interface SendMessageParams {
  roomId: string
  senderId: string
  senderName: string
  senderAvatar: string
  receiverId: string
  receiverName: string
  receiverAvatar: string
  text: string
}

export interface ChatRepository {
  messageThreadDocumentId(friendId: string, userId: string): string
  observeMessages(
    roomId: string,
    onData: (messages: Message[]) => void,
  ): Unsubscribe
  sendMessage(params: SendMessageParams): Promise<void>
  markSeen(userId: string, friendId: string): Promise<void>
}
