import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { MESSAGE_TYPE } from '@/config/constants'
import { db } from '@/data/firebase/app'
import { mapGroup } from '@/data/firebase/mappers/firestoreMappers'
import { upsertInbox } from '@/data/repositories/chatRepository'
import { userRepository } from '@/data/repositories/userRepository'
import type { GroupChatRepository } from '@/domain/repositories'
import type { MemberRead, User } from '@/domain/models'
import { formatMessageTime } from '@/lib/time'

const typingTimers = new Map<string, ReturnType<typeof setTimeout>>()

async function writeSystemMessage(
  groupId: string,
  actor: User,
  message: string,
  event: 'add' | 'remove' | 'leave',
  targets?: { ids: string[]; names: string[] },
) {
  const time = formatMessageTime()
  await setDoc(doc(db, 'messages', groupId, 'chats', time), {
    message,
    sender: actor.userId,
    receiver: groupId,
    time,
    type: MESSAGE_TYPE.SYSTEM,
    systemEvent: event,
    systemActorId: actor.userId,
    systemActorName: actor.name,
    systemTargetIds: targets?.ids ?? [],
    systemTargetNames: targets?.names ?? [],
  })
  return time
}

async function fanoutGroupInbox(
  groupId: string,
  memberIds: string[],
  groupName: string,
  groupPhoto: string,
  preview: string,
  senderId: string,
  senderName: string,
  time: string,
  unreadExcept?: string,
) {
  await Promise.all(
    memberIds.map((memberId) =>
      upsertInbox(
        memberId,
        groupId,
        {
          friendId: groupId,
          friendImage: groupPhoto,
          message: preview,
          name: senderName,
          person: groupName,
          sender: senderId,
          time,
          typing: false,
          isGroup: true,
        },
        unreadExcept ? memberId !== unreadExcept : false,
      ),
    ),
  )
}

export const groupChatRepository: GroupChatRepository = {
  async createGroup(params) {
    const groupId = crypto.randomUUID()
    const memberIds = Array.from(
      new Set([params.creator.userId, ...params.memberIds]),
    )
    if (memberIds.length < 2) {
      throw new Error('GROUP_MIN_MEMBERS')
    }
    await setDoc(doc(db, 'groups', groupId), {
      name: params.name,
      photoUrl: params.photoUrl,
      memberIds,
      createdBy: params.creator.userId,
      createdAt: serverTimestamp(),
      typing: false,
      typingUsers: {},
    })
    const time = await writeSystemMessage(
      groupId,
      params.creator,
      `${params.creator.name} đã tạo nhóm`,
      'add',
      {
        ids: memberIds.filter((id) => id !== params.creator.userId),
        names: memberIds
          .filter((id) => id !== params.creator.userId)
          .map((id) => params.memberProfiles[id]?.name ?? ''),
      },
    )
    await fanoutGroupInbox(
      groupId,
      memberIds,
      params.name,
      params.photoUrl,
      'Đã tạo nhóm',
      params.creator.userId,
      params.creator.name,
      time,
    )
    return { groupId }
  },

  async getGroup(groupId) {
    const snap = await getDoc(doc(db, 'groups', groupId))
    if (!snap.exists()) throw new Error('Group not found')
    return mapGroup(snap.id, snap.data())
  },

  async loadGroupMembers(groupId) {
    const group = await this.getGroup(groupId)
    const users = await Promise.all(
      group.memberIds.map((id) =>
        userRepository.getUserById(id).catch(
          (): User => ({
            userId: id,
            name: 'Unknown',
            email: '',
            avatar: '',
          }),
        ),
      ),
    )
    return users
  },

  observeGroup(groupId, onData) {
    return onSnapshot(doc(db, 'groups', groupId), (snap) => {
      if (!snap.exists()) return
      onData(mapGroup(snap.id, snap.data()))
    })
  },

  async addGroupMembers(groupId, newMemberIds, inviter, memberProfiles) {
    const group = await this.getGroup(groupId)
    const unique = newMemberIds.filter((id) => !group.memberIds.includes(id))
    if (unique.length === 0) return
    await updateDoc(doc(db, 'groups', groupId), {
      memberIds: arrayUnion(...unique),
    })
    const names = unique.map((id) => memberProfiles[id]?.name ?? id)
    const time = await writeSystemMessage(
      groupId,
      inviter,
      `${inviter.name} đã thêm ${names.join(', ')}`,
      'add',
      { ids: unique, names },
    )
    const nextMembers = [...group.memberIds, ...unique]
    await fanoutGroupInbox(
      groupId,
      nextMembers,
      group.name,
      group.photoUrl,
      `${inviter.name} đã thêm thành viên`,
      inviter.userId,
      inviter.name,
      time,
      inviter.userId,
    )
  },

  async removeGroupMember(groupId, memberId, actor, memberName) {
    const group = await this.getGroup(groupId)
    if (group.createdBy !== actor.userId) {
      throw new Error('NOT_CREATOR')
    }
    await updateDoc(doc(db, 'groups', groupId), {
      memberIds: arrayRemove(memberId),
    })
    const time = await writeSystemMessage(
      groupId,
      actor,
      `${actor.name} đã xóa ${memberName}`,
      'remove',
      { ids: [memberId], names: [memberName] },
    )
    const remaining = group.memberIds.filter((id) => id !== memberId)
    await fanoutGroupInbox(
      groupId,
      remaining,
      group.name,
      group.photoUrl,
      `${actor.name} đã xóa ${memberName}`,
      actor.userId,
      actor.name,
      time,
      actor.userId,
    )
  },

  async leaveGroup(groupId, user) {
    const group = await this.getGroup(groupId)
    await updateDoc(doc(db, 'groups', groupId), {
      memberIds: arrayRemove(user.userId),
    })
    const time = await writeSystemMessage(
      groupId,
      user,
      `${user.name} đã rời nhóm`,
      'leave',
    )
    const remaining = group.memberIds.filter((id) => id !== user.userId)
    await fanoutGroupInbox(
      groupId,
      remaining,
      group.name,
      group.photoUrl,
      `${user.name} đã rời nhóm`,
      user.userId,
      user.name,
      time,
    )
  },

  observeGroupTyping(groupId, myUserId, onData) {
    return onSnapshot(doc(db, 'groups', groupId), (snap) => {
      const users = (snap.data()?.typingUsers ?? {}) as Record<string, boolean>
      onData(
        Object.entries(users)
          .filter(([id, on]) => on && id !== myUserId)
          .map(([id]) => id),
      )
    })
  },

  async setGroupTyping(groupId, userId, typing) {
    const key = `${groupId}:${userId}`
    const prev = typingTimers.get(key)
    if (prev) clearTimeout(prev)
    const path = `typingUsers.${userId}`
    if (!typing) {
      await updateDoc(doc(db, 'groups', groupId), {
        [path]: deleteField(),
      }).catch(() => undefined)
      return
    }
    await updateDoc(doc(db, 'groups', groupId), { [path]: true })
    typingTimers.set(
      key,
      setTimeout(() => {
        void updateDoc(doc(db, 'groups', groupId), {
          [path]: deleteField(),
        }).catch(() => undefined)
        typingTimers.delete(key)
      }, 8000),
    )
  },

  observeGroupMemberRead(groupId, onData) {
    return onSnapshot(
      collection(db, 'groups', groupId, 'memberRead'),
      (snap) => {
        const reads: MemberRead[] = snap.docs.map((d) => ({
          userId: d.id,
          lastReadTime: String(d.data().lastReadTime ?? ''),
        }))
        onData(reads)
      },
    )
  },

  async markGroupMessageRead(userId, groupId, lastReadTime) {
    await setDoc(doc(db, 'groups', groupId, 'memberRead', userId), {
      lastReadTime,
    })
  },
}
