import {
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { FRIENDSHIP_SEED_MESSAGE, MESSAGE_TYPE } from '@/config/constants'
import { db } from '@/data/firebase/app'
import { mapMessage } from '@/data/firebase/mappers/firestoreMappers'
import { inboxCollection } from '@/data/repositories/conversationRepository'
import type { ChatRepository, SendMessageParams } from '@/domain/repositories'
import { roomId1v1 } from '@/lib/roomId'
import { formatMessageTime } from '@/lib/time'

function chatsCollection(roomId: string) {
  return collection(db, 'messages', roomId, 'chats')
}

async function upsertInbox(
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
    isGroup: false,
    numberUnSeen: unreadIncrement ? 1 : 0,
    seen: !unreadIncrement,
    ...payload,
  })
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

  async sendMessage(params: SendMessageParams) {
    const time = formatMessageTime()
    const batch = writeBatch(db)
    const msgRef = doc(db, 'messages', params.roomId, 'chats', time)
    batch.set(msgRef, {
      message: params.text,
      sender: params.senderId,
      receiver: params.receiverId,
      time,
      type: MESSAGE_TYPE.TEXT,
    })
    await batch.commit()

    await upsertInbox(
      params.senderId,
      params.receiverId,
      {
        friendId: params.receiverId,
        friendImage: params.receiverAvatar,
        message: params.text,
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
        message: params.text,
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

  async markSeen(userId, friendId) {
    const ref = doc(db, inboxCollection(userId), friendId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    await setDoc(
      ref,
      { seen: true, numberUnSeen: 0 },
      { merge: true },
    )
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

  const msgRef = doc(db, 'messages', roomId, 'chats', time)
  await setDoc(msgRef, {
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
