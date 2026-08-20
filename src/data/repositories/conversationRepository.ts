import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '@/data/firebase/app'
import { mapConversation } from '@/data/firebase/mappers/firestoreMappers'
import type { ConversationRepository } from '@/domain/repositories'

export function inboxCollection(userId: string) {
  return `Conversation${userId}`
}

export const conversationRepository: ConversationRepository = {
  observeInbox(userId, onData) {
    const q = query(
      collection(db, inboxCollection(userId)),
      orderBy('time', 'desc'),
    )
    return onSnapshot(q, (snap) => {
      onData(snap.docs.map((d) => mapConversation(d.id, d.data())))
    })
  },
}
