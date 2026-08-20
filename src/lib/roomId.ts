/** Matches Android `listOf(a, b).sorted().toString()` → `[idA, idB]` */
export function roomId1v1(userA: string, userB: string): string {
  return `[${[userA, userB].sort().join(', ')}]`
}

export function otherUserIdFromRoom(roomId: string, myUserId: string): string {
  const inner = roomId.replace(/^\[/, '').replace(/\]$/, '')
  const ids = inner.split(', ').map((id) => id.trim()).filter(Boolean)
  return ids.find((id) => id !== myUserId) ?? ids[0] ?? ''
}
