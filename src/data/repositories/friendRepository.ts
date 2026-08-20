import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/data/firebase/app'
import {
  mapFriend,
  mapFriendRequest,
} from '@/data/firebase/mappers/firestoreMappers'
import { seedFriendshipInbox } from '@/data/repositories/chatRepository'
import type { FriendRepository } from '@/domain/repositories'
import type { FriendshipStatus } from '@/domain/models'

function friendsCol(userId: string) {
  return collection(db, 'users', userId, 'friends')
}

export const friendRepository: FriendRepository = {
  observeFriends(userId, onData) {
    return onSnapshot(friendsCol(userId), (snap) => {
      onData(snap.docs.map((d) => mapFriend(d.id, d.data())))
    })
  },

  async sendFriendRequest(from, to) {
    const existing = await getDocs(
      query(
        collection(db, 'friendRequests'),
        where('fromId', '==', from.userId),
        where('toId', '==', to.userId),
        where('status', '==', 'pending'),
      ),
    )
    if (!existing.empty) return
    await addDoc(collection(db, 'friendRequests'), {
      fromId: from.userId,
      toId: to.userId,
      fromName: from.name,
      fromAvatar: from.avatar,
      toName: to.name,
      toAvatar: to.avatar,
      status: 'pending',
      createdAt: serverTimestamp(),
    })
  },

  async getIncomingFriendRequests(userId) {
    const q = query(
      collection(db, 'friendRequests'),
      where('toId', '==', userId),
      where('status', '==', 'pending'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => mapFriendRequest(d.id, d.data()))
  },

  async getOutgoingFriendRequests(userId) {
    const q = query(
      collection(db, 'friendRequests'),
      where('fromId', '==', userId),
      where('status', '==', 'pending'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => mapFriendRequest(d.id, d.data()))
  },

  observeIncomingFriendRequests(userId, onData) {
    const q = query(
      collection(db, 'friendRequests'),
      where('toId', '==', userId),
      where('status', '==', 'pending'),
    )
    return onSnapshot(q, (snap) => {
      onData(snap.docs.map((d) => mapFriendRequest(d.id, d.data())))
    })
  },

  observeOutgoingFriendRequests(userId, onData) {
    const q = query(
      collection(db, 'friendRequests'),
      where('fromId', '==', userId),
      where('status', '==', 'pending'),
    )
    return onSnapshot(q, (snap) => {
      onData(snap.docs.map((d) => mapFriendRequest(d.id, d.data())))
    })
  },

  async acceptFriendRequest(request, myName, myAvatar) {
    const batch = writeBatch(db)
    batch.update(doc(db, 'friendRequests', request.requestId), {
      status: 'accepted',
    })
    batch.set(doc(db, 'users', request.toId, 'friends', request.fromId), {
      name: request.fromName,
      avatar: request.fromAvatar,
      keyAuth: request.fromId,
      since: new Date().toISOString(),
    })
    batch.set(doc(db, 'users', request.fromId, 'friends', request.toId), {
      name: myName,
      avatar: myAvatar,
      keyAuth: request.toId,
      since: new Date().toISOString(),
    })
    await batch.commit()

    await seedFriendshipInbox(
      { id: request.toId, name: myName, avatar: myAvatar },
      {
        id: request.fromId,
        name: request.fromName,
        avatar: request.fromAvatar,
      },
    )
  },

  async rejectFriendRequest(requestId) {
    await updateDoc(doc(db, 'friendRequests', requestId), {
      status: 'rejected',
    })
  },

  async cancelFriendRequest(fromId, toId) {
    const q = query(
      collection(db, 'friendRequests'),
      where('fromId', '==', fromId),
      where('toId', '==', toId),
      where('status', '==', 'pending'),
    )
    const snap = await getDocs(q)
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
  },

  async getFriendshipStatus(userId, otherId): Promise<FriendshipStatus> {
    if (userId === otherId) return 'friend'
    const friendSnap = await getDoc(
      doc(db, 'users', userId, 'friends', otherId),
    )
    if (friendSnap.exists()) return 'friend'

    const sent = await getDocs(
      query(
        collection(db, 'friendRequests'),
        where('fromId', '==', userId),
        where('toId', '==', otherId),
        where('status', '==', 'pending'),
      ),
    )
    if (!sent.empty) return 'pending_sent'

    const received = await getDocs(
      query(
        collection(db, 'friendRequests'),
        where('fromId', '==', otherId),
        where('toId', '==', userId),
        where('status', '==', 'pending'),
      ),
    )
    if (!received.empty) return 'pending_received'
    return 'none'
  },
}
