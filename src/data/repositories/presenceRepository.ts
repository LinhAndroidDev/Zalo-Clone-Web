import {
  onDisconnect,
  onValue,
  ref,
  set,
} from 'firebase/database'
import { rtdb } from '@/data/firebase/app'
import type { PresenceRepository } from '@/domain/repositories'
import type { PresenceStatus } from '@/domain/models'

let connectedUnsub: (() => void) | undefined

export const presenceRepository: PresenceRepository = {
  connect(userId) {
    if (!rtdb) return
    this.disconnect(userId)
    const connectedRef = ref(rtdb, '.info/connected')
    const statusRef = ref(rtdb, `status/${userId}`)
    connectedUnsub = onValue(connectedRef, (snap) => {
      if (snap.val() !== true) return
      void onDisconnect(statusRef).set({
        online: false,
        lastSeen: Date.now(),
      })
      void set(statusRef, { online: true, lastSeen: Date.now() })
    })
  },

  disconnect(userId) {
    connectedUnsub?.()
    connectedUnsub = undefined
    if (!rtdb) return
    void set(ref(rtdb, `status/${userId}`), {
      online: false,
      lastSeen: Date.now(),
    })
  },

  observePresence(userId, onData) {
    if (!rtdb) {
      onData({ online: false, lastSeen: 0 })
      return () => undefined
    }
    return onValue(ref(rtdb, `status/${userId}`), (snap) => {
      const val = snap.val() as PresenceStatus | null
      onData({
        online: Boolean(val?.online),
        lastSeen: Number(val?.lastSeen ?? 0),
      })
    })
  },
}
