/** Matches Android `listOf(a, b).sorted().toString()` → `[idA, idB]` */
export function roomId1v1(userA: string, userB: string): string {
  return `[${[userA, userB].sort().join(', ')}]`
}

export function isPairRoomId(roomId: string): boolean {
  return roomId.startsWith('[') && roomId.endsWith(']')
}

export function otherUserIdFromRoom(roomId: string, myUserId: string): string {
  if (!isPairRoomId(roomId)) return ''
  const inner = roomId.replace(/^\[/, '').replace(/\]$/, '')
  const ids = inner.split(', ').map((id) => id.trim()).filter(Boolean)
  return ids.find((id) => id !== myUserId) ?? ids[0] ?? ''
}

export function inboxRoomId(
  conversation: { friendId: string; isGroup: boolean },
  userId: string,
): string {
  if (conversation.isGroup) return conversation.friendId
  return roomId1v1(conversation.friendId, userId)
}
