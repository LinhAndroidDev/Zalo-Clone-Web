import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore'
import { STORY_QUERY_LIMIT, STORY_TTL_MS } from '@/config/constants'
import { db } from '@/data/firebase/app'
import type { StoryRepository } from '@/domain/repositories'
import type { Story, StoryPrivacy, StoryRing } from '@/domain/models'

function millisOf(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis()
  if (value && typeof value === 'object' && 'toMillis' in value) {
    return (value as Timestamp).toMillis()
  }
  if (typeof value === 'number') return value
  return 0
}

export function canViewStory(
  story: Story,
  viewerId: string,
  friendIds: Set<string>,
): boolean {
  if (story.authorId === viewerId) return true
  switch (story.privacy) {
    case 'everyone':
      return true
    case 'friends':
      return friendIds.has(story.authorId)
    case 'custom':
      return story.visibleToUserIds?.includes(viewerId) ?? false
    default:
      return false
  }
}

function mapStory(id: string, data: Record<string, unknown>): Story {
  const privacy = String(data.privacy ?? 'friends') as StoryPrivacy
  return {
    storyId: id,
    authorId: String(data.authorId ?? ''),
    authorName: String(data.authorName ?? ''),
    authorAvatarUrl: String(data.authorAvatarUrl ?? ''),
    mediaUrl: String(data.mediaUrl ?? ''),
    mediaType: data.mediaType === 'video' ? 'video' : 'image',
    createdAtMillis: millisOf(data.createdAt),
    expiresAtMillis: millisOf(data.expiresAt),
    privacy:
      privacy === 'everyone' || privacy === 'custom' || privacy === 'friends'
        ? privacy
        : 'friends',
    visibleToUserIds: Array.isArray(data.visibleToUserIds)
      ? data.visibleToUserIds.map(String)
      : undefined,
  }
}

export const storyRepository: StoryRepository = {
  observeStoryRings(userId, friendIds, onRings) {
    const friendSet = new Set(friendIds)
    const q = query(
      collection(db, 'stories'),
      where('expiresAt', '>', Timestamp.now()),
      limit(STORY_QUERY_LIMIT),
    )
    return onSnapshot(
      q,
      async (snap) => {
        const visible = snap.docs
          .map((d) => mapStory(d.id, d.data() as Record<string, unknown>))
          .filter(
            (s) =>
              s.expiresAtMillis > Date.now() &&
              canViewStory(s, userId, friendSet),
          )
        const viewed = new Set<string>()
        await Promise.all(
          visible.map(async (s) => {
            const v = await getDoc(
              doc(db, 'stories', s.storyId, 'views', userId),
            )
            if (v.exists()) viewed.add(s.storyId)
          }),
        )
        const byAuthor = new Map<string, Story[]>()
        for (const story of visible) {
          const list = byAuthor.get(story.authorId) ?? []
          list.push(story)
          byAuthor.set(story.authorId, list)
        }
        const rings: StoryRing[] = Array.from(byAuthor.entries()).map(
          ([authorId, stories]) => {
            const sorted = stories.sort(
              (a, b) => a.createdAtMillis - b.createdAtMillis,
            )
            const first = sorted[0]
            return {
              authorId,
              authorName: first.authorName,
              authorAvatarUrl: first.authorAvatarUrl,
              stories: sorted,
              hasUnseen: sorted.some((s) => !viewed.has(s.storyId)),
              isMe: authorId === userId,
            }
          },
        )
        rings.sort((a, b) => {
          if (a.isMe !== b.isMe) return a.isMe ? -1 : 1
          if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1
          return 0
        })
        onRings(rings)
      },
      async () => {
        const all = await getDocs(query(collection(db, 'stories'), limit(STORY_QUERY_LIMIT)))
        const now = Date.now()
        const visible = all.docs
          .map((d) => mapStory(d.id, d.data() as Record<string, unknown>))
          .filter(
            (s) =>
              s.expiresAtMillis > now && canViewStory(s, userId, friendSet),
          )
        const rings: StoryRing[] = []
        const byAuthor = new Map<string, Story[]>()
        for (const story of visible) {
          const list = byAuthor.get(story.authorId) ?? []
          list.push(story)
          byAuthor.set(story.authorId, list)
        }
        for (const [authorId, stories] of byAuthor) {
          const sorted = stories.sort(
            (a, b) => a.createdAtMillis - b.createdAtMillis,
          )
          rings.push({
            authorId,
            authorName: sorted[0].authorName,
            authorAvatarUrl: sorted[0].authorAvatarUrl,
            stories: sorted,
            hasUnseen: true,
            isMe: authorId === userId,
          })
        }
        onRings(rings)
      },
    )
  },

  async createStory(params) {
    if (
      params.privacy === 'custom' &&
      (!params.visibleToUserIds || params.visibleToUserIds.length < 1)
    ) {
      throw new Error('CUSTOM_PRIVACY')
    }
    const created = Timestamp.now()
    const expires = Timestamp.fromMillis(created.toMillis() + STORY_TTL_MS)
    const ref = await addDoc(collection(db, 'stories'), {
      authorId: params.author.userId,
      authorName: params.author.name,
      authorAvatarUrl: params.author.avatar,
      mediaUrl: params.mediaUrl,
      mediaType: params.mediaType,
      createdAt: created,
      expiresAt: expires,
      privacy: params.privacy,
      visibleToUserIds: params.visibleToUserIds ?? [],
    })
    return ref.id
  },

  async markStoryViewed(storyId, viewerId) {
    await setDoc(doc(db, 'stories', storyId, 'views', viewerId), {
      viewedAt: serverTimestamp(),
    })
  },

  async deleteStory(storyId, authorId) {
    const snap = await getDoc(doc(db, 'stories', storyId))
    if (!snap.exists() || snap.data().authorId !== authorId) {
      throw new Error('NOT_AUTHOR')
    }
    await deleteDoc(doc(db, 'stories', storyId))
  },
}
