import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/data/firebase/app'
import { mapUser } from '@/data/firebase/mappers/firestoreMappers'
import type { AuthRepository } from '@/domain/repositories'
import type { User } from '@/domain/models'

export const authRepository: AuthRepository = {
  async checkLogin(email, password) {
    const q = query(
      collection(db, 'users'),
      where('email', '==', email),
      where('password', '==', password),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => mapUser(d.id, d.data()))
  },

  async isEmailRegistered(email) {
    const q = query(collection(db, 'users'), where('email', '==', email))
    const snap = await getDocs(q)
    return !snap.empty
  },

  async registerUser(user: Omit<User, 'userId'>, password: string) {
    const ref = await addDoc(collection(db, 'users'), {
      email: user.email,
      password,
      name: user.name,
      avatar: user.avatar || '',
    })
    return ref.id
  },
}
