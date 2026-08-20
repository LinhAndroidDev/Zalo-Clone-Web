import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import {
  EMOTION_TYPES,
  FRIENDSHIP_SEED_MESSAGE,
  MAX_PINNED_MESSAGES,
  MESSAGE_TYPE,
} from '@/config/constants'
import { inboxPreviewForType } from '@/data/cloudinary/upload'
import { db } from '@/data/firebase/app'
import {
  mapMessage,
  mapPinnedMessages,
} from '@/data/firebase/mappers/firestoreMappers'
import { inboxCollection } from '@/data/repositories/conversationRepository'
import type { ChatRepository, SendMessageParams } from '@/domain/repositories'
import type { Message, PinnedMessage } from '@/domain/models'
import { roomId1v1 } from '@/lib/roomId'
import { formatMessageTime } from '@/lib/time'

function chatsCollection(roomId: string) {
  return collection(db, 'messages', roomId, 'chats')
}

export async function upsertInbox(
  ownerId: string,
  otherId: string,
  payload: Record<string, unknown>,
  unreadIncrement: boolean,
) {
  const ref = doc(db, inboxCollection(ownerId), otherId)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const next = { ...payload }
    if (unreadIncrement) {
      next.numberUnSeen = increment(1)
      next.seen = false
    } else {
      next.numberUnSeen = 0
      next.seen = true
    }
    await setDoc(ref, next, { merge: true })
    return
  }
  await setDoc(ref, {
    friendId: otherId,
    typing: false,
    isGroup: Boolean(payload.isGroup),
    numberUnSeen: unreadIncrement ? 1 : 0,
    seen: !unreadIncrement,
    ...payload,
  })
}

function resolveMessageType(params: SendMessageParams): number {
  if (params.audioUrl) return MESSAGE_TYPE.AUDIO
  const photoCount = params.photos?.length ?? 0
  if (photoCount > 1) return MESSAGE_TYPE.PHOTOS
  if (photoCount === 1) return MESSAGE_TYPE.SINGLE_PHOTO
  return MESSAGE_TYPE.TEXT
}

function photoUrlOf(message: Message): string | undefined {
  return message.singlePhoto?.[0] ?? message.photos?.[0]
}

export function replyPreviewOf(message: Message): string {
  return inboxPreviewForType(message.type, message.message)
}

export const chatRepository: ChatRepository = {
  messageThreadDocumentId(friendId, userId) {
    return roomId1v1(friendId, userId)
  },

  observeMessages(roomId, onData) {
    const q = query(chatsCollection(roomId), orderBy('time', 'asc'))
    return onSnapshot(q, (snap) => {
      onData(snap.docs.map((d) => mapMessage(d.id, d.data())))
    })
  },

  observePinnedMessages(roomId, onData) {
    return onSnapshot(doc(db, 'messages', roomId), (snap) => {
      onData(mapPinnedMessages(snap.data()))
    })
  },

  async sendMessage(params: SendMessageParams) {
    const time = formatMessageTime()
    const type = resolveMessageType(params)
    const text = params.text?.trim() ?? ''
    const preview = inboxPreviewForType(type, text)
    const urls = params.photos?.map((p) => p.url) ?? []
    const sizes = params.photos?.map((p) => p.size) ?? []

    const body: Record<string, unknown> = {
      message: text,
      sender: params.senderId,
      receiver: params.receiverId,
      time,
      type,
    }
    if (urls.length === 1) body.singlePhoto = urls
    if (urls.length > 1) {
      body.photos = urls
      body.photoSizes = sizes
    }
    if (urls.length === 1 && sizes[0]) body.photoSizes = sizes
    if (params.audioUrl) body.audio = params.audioUrl
    if (params.replyTo) body.replyTo = params.replyTo
    if (params.mentions?.length) body.mentions = params.mentions

    await setDoc(doc(db, 'messages', params.roomId, 'chats', time), body)

    const memberIds = params.isGroup
      ? params.memberIds ?? []
      : [params.senderId, params.receiverId]

    if (params.isGroup) {
      await Promise.all(
        memberIds.map((memberId) =>
          upsertInbox(
            memberId,
            params.receiverId,
            {
              friendId: params.receiverId,
              friendImage: params.receiverAvatar,
              message: preview,
              name: params.senderName,
              person: params.receiverName,
              sender: params.senderId,
              time,
              typing: false,
              isGroup: true,
            },
            memberId !== params.senderId,
          ),
        ),
      )
      return
    }

    await upsertInbox(
      params.senderId,
      params.receiverId,
      {
        friendId: params.receiverId,
        friendImage: params.receiverAvatar,
        message: preview,
        name: params.senderName,
        person: params.receiverName,
        sender: params.senderId,
        time,
        typing: false,
        isGroup: false,
      },
      false,
    )

    await upsertInbox(
      params.receiverId,
      params.senderId,
      {
        friendId: params.senderId,
        friendImage: params.senderAvatar,
        message: preview,
        name: params.senderName,
        person: params.senderName,
        sender: params.senderId,
        time,
        typing: false,
        isGroup: false,
      },
      true,
    )
  },

  async removeMessage(roomId, time) {
    await deleteDoc(doc(db, 'messages', roomId, 'chats', time))
  },

  async pinMessage(message, roomId, userId, userName) {
    const ref = doc(db, 'messages', roomId)
    const snap = await getDoc(ref)
    const current = mapPinnedMessages(snap.data())
    if (current.some((p) => p.messageTime === message.time)) return
    if (current.length >= MAX_PINNED_MESSAGES) {
      throw new Error('MAX_PINNED')
    }
    const next: PinnedMessage = {
      messageTime: message.time,
      pinnedBy: userId,
      pinnedByName: userName,
      previewText: replyPreviewOf(message),
      messageType: message.type,
      photoUrl: photoUrlOf(message),
    }
    await setDoc(ref, { pinnedMessages: [...current, next] }, { merge: true })
  },

  async unpinMessage(roomId, messageTime) {
    const ref = doc(db, 'messages', roomId)
    const snap = await getDoc(ref)
    const current = mapPinnedMessages(snap.data())
    await setDoc(
      ref,
      {
        pinnedMessages: current.filter((p) => p.messageTime !== messageTime),
      },
      { merge: true },
    )
  },

  async toggleMessageReaction(roomId, time, userId, type) {
    const ref = doc(db, 'messages', roomId, 'chats', time)
    const snap = await getDoc(ref)
    const data = snap.data() ?? {}
    const emotion = (data.emotion ?? {}) as Record<
      string,
      Record<string, number>
    >
    const already = Boolean(emotion[type]?.[userId])
    const updates: Record<string, unknown> = {}
    for (const key of EMOTION_TYPES) {
      updates[`emotion.${key}.${userId}`] = deleteField()
    }
    if (!already) {
      updates[`emotion.${type}.${userId}`] = 1
    }
    await updateDoc(ref, updates)
  },

  async updateTyping(myUserId, peerId, typing) {
    const ref = doc(db, inboxCollection(peerId), myUserId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    await setDoc(ref, { typing }, { merge: true })
  },

  observeTyping(myUserId, peerId, onData) {
    return onSnapshot(doc(db, inboxCollection(myUserId), peerId), (snap) => {
      onData(Boolean(snap.data()?.typing))
    })
  },

  async markSeen(userId, friendId) {
    const ref = doc(db, inboxCollection(userId), friendId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    await setDoc(ref, { seen: true, numberUnSeen: 0 }, { merge: true })
  },
}

export async function seedFriendshipInbox(
  userA: { id: string; name: string; avatar: string },
  userB: { id: string; name: string; avatar: string },
) {
  const roomId = roomId1v1(userA.id, userB.id)
  const time = formatMessageTime()
  const aRef = doc(db, inboxCollection(userA.id), userB.id)
  const bRef = doc(db, inboxCollection(userB.id), userA.id)
  const [aSnap, bSnap] = await Promise.all([getDoc(aRef), getDoc(bRef)])
  if (aSnap.exists() && bSnap.exists()) return

  await setDoc(doc(db, 'messages', roomId, 'chats', time), {
    message: FRIENDSHIP_SEED_MESSAGE,
    sender: userA.id,
    receiver: userB.id,
    time,
    type: MESSAGE_TYPE.SYSTEM,
  })

  const base = {
    message: FRIENDSHIP_SEED_MESSAGE,
    sender: userA.id,
    time,
    seen: true,
    numberUnSeen: 0,
    typing: false,
    isGroup: false,
  }

  if (!aSnap.exists()) {
    await setDoc(aRef, {
      ...base,
      friendId: userB.id,
      friendImage: userB.avatar,
      name: userA.name,
      person: userB.name,
    })
  }
  if (!bSnap.exists()) {
    await setDoc(bRef, {
      ...base,
      friendId: userA.id,
      friendImage: userA.avatar,
      name: userA.name,
      person: userA.name,
    })
  }
}
