import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/data/firebase/app'
import { mapUser } from '@/data/firebase/mappers/firestoreMappers'
import type { UserRepository } from '@/domain/repositories'

async function fetchUser(userId: string) {
  const snap = await getDoc(doc(db, 'users', userId))
  if (!snap.exists()) {
    throw new Error('User not found')
  }
  return mapUser(snap.id, snap.data())
}

export const userRepository: UserRepository = {
  getInfoUser: fetchUser,
  getUserById: fetchUser,
}
