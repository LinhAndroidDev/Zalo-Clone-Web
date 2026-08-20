import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/data/firebase/app'

export async function fetchStickerPack(packName: string): Promise<string[]> {
  const snap = await getDoc(doc(db, 'sticker', packName))
  if (!snap.exists()) return []
  const data = snap.data()
  return Object.values(data)
    .filter((v): v is string => typeof v === 'string' && v.startsWith('http'))
}
