import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import {
  DIARY_AUTHOR_CHUNK,
  DIARY_FEED_MAX_POSTS,
  DIARY_FEED_QUERY_LIMIT,
  emotionFromFirestore,
  emotionToFirestore,
} from '@/config/constants'
import { db } from '@/data/firebase/app'
import type { DiaryRepository } from '@/domain/repositories'
import type {
  DiaryComment,
  DiaryNotification,
  DiaryNotificationType,
  DiaryPost,
  DiaryReply,
  LinkPreview,
} from '@/domain/models'

function millisOf(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis()
  if (value && typeof value === 'object' && 'toMillis' in value) {
    return (value as Timestamp).toMillis()
  }
  return 0
}

function firstUrl(text: string): LinkPreview | undefined {
  const match = text.match(/https?:\/\/[^\s]+/i)
  if (!match) return undefined
  return { url: match[0] }
}

function chunkIds(ids: string[], size: number): string[][] {
  const out: string[][] = []
  for (let i = 0; i < ids.length; i += size) {
    out.push(ids.slice(i, i + size))
  }
  return out
}

function mapPost(id: string, data: Record<string, unknown>): DiaryPost {
  const summary = (data.emotionSummary ?? {}) as Record<string, number>
  return {
    postId: id,
    authorId: String(data.authorId ?? ''),
    authorName: String(data.authorName ?? ''),
    authorAvatarUrl: String(data.authorAvatarUrl ?? ''),
    content: String(data.content ?? ''),
    imageUrls: Array.isArray(data.imageUrls)
      ? data.imageUrls.map(String)
      : [],
    linkPreview: data.linkPreview
      ? { url: String((data.linkPreview as { url?: string }).url ?? '') }
      : undefined,
    createdAtMillis: millisOf(data.createdAt),
    likeCount: Number(data.likeCount ?? 0),
    commentCount: Number(data.commentCount ?? 0),
    emotionSummary: summary,
  }
}

async function attachMyReaction(post: DiaryPost, userId: string): Promise<DiaryPost> {
  const snap = await getDoc(
    doc(db, 'posts', post.postId, 'reactions', userId),
  )
  if (!snap.exists()) return { ...post, myReaction: null }
  return {
    ...post,
    myReaction: emotionFromFirestore(String(snap.data().type ?? 'LIKE')),
  }
}

async function notify(
  recipientId: string,
  payload: Omit<DiaryNotification, 'id' | 'createdAtMillis' | 'read'> & {
    type: DiaryNotificationType
  },
) {
  if (recipientId === payload.actorId) return
  await addDoc(collection(db, 'users', recipientId, 'diaryNotifications'), {
    ...payload,
    read: false,
    createdAt: serverTimestamp(),
  })
}

export const diaryRepository: DiaryRepository = {
  observeFeed(userId, onPosts) {
    const friendUnsubs: Array<() => void> = []
    let postUnsubs: Array<() => void> = []

    const friendsUnsub = onSnapshot(
      collection(db, 'users', userId, 'friends'),
      (friendSnap) => {
        postUnsubs.forEach((u) => u())
        postUnsubs = []
        const authorIds = Array.from(
          new Set([userId, ...friendSnap.docs.map((d) => d.id)]),
        )
        const chunks = chunkIds(authorIds, DIARY_AUTHOR_CHUNK)
        if (chunks.length === 0) {
          onPosts([])
          return
        }
        const buckets: DiaryPost[][] = chunks.map(() => [])
        const emit = () => {
          const merged = buckets
            .flat()
            .sort((a, b) => b.createdAtMillis - a.createdAtMillis)
            .slice(0, DIARY_FEED_MAX_POSTS)
          void Promise.all(
            merged.map((p) => attachMyReaction(p, userId)),
          ).then(onPosts)
        }
        chunks.forEach((chunk, index) => {
          const q = query(
            collection(db, 'posts'),
            where('authorId', 'in', chunk),
            limit(DIARY_FEED_QUERY_LIMIT),
          )
          const unsub = onSnapshot(q, (postSnap) => {
            buckets[index] = postSnap.docs.map((d) =>
              mapPost(d.id, d.data() as Record<string, unknown>),
            )
            emit()
          })
          postUnsubs.push(unsub)
        })
      },
    )
    friendUnsubs.push(friendsUnsub)

    return () => {
      friendUnsubs.forEach((u) => u())
      postUnsubs.forEach((u) => u())
    }
  },

  async getPost(postId) {
    const snap = await getDoc(doc(db, 'posts', postId))
    if (!snap.exists()) throw new Error('Post not found')
    return mapPost(snap.id, snap.data() as Record<string, unknown>)
  },

  async createPost(params) {
    const ref = await addDoc(collection(db, 'posts'), {
      authorId: params.author.userId,
      authorName: params.author.name,
      authorAvatarUrl: params.author.avatar,
      content: params.content,
      imageUrls: params.imageUrls,
      linkPreview: firstUrl(params.content) ?? null,
      createdAt: serverTimestamp(),
      likeCount: 0,
      commentCount: 0,
      emotionSummary: {},
    })
    return ref.id
  },

  async updatePost(postId, authorId, content) {
    const snap = await getDoc(doc(db, 'posts', postId))
    if (!snap.exists() || snap.data().authorId !== authorId) {
      throw new Error('NOT_AUTHOR')
    }
    await updateDoc(doc(db, 'posts', postId), {
      content,
      linkPreview: firstUrl(content) ?? null,
      updatedAt: serverTimestamp(),
    })
  },

  async deletePost(postId, authorId) {
    const snap = await getDoc(doc(db, 'posts', postId))
    if (!snap.exists() || snap.data().authorId !== authorId) {
      throw new Error('NOT_AUTHOR')
    }
    await deleteDoc(doc(db, 'posts', postId))
  },

  async setPostReaction(postId, user, type, postAuthorId) {
    const ref = doc(db, 'posts', postId, 'reactions', user.userId)
    const snap = await getDoc(ref)
    const prev = snap.exists()
      ? emotionFromFirestore(String(snap.data().type ?? ''))
      : null
    const next = type === prev ? null : type
    const updates: Record<string, unknown> = {}
    if (prev) updates[`emotionSummary.${prev}`] = increment(-1)
    if (next) {
      await setDoc(ref, {
        type: emotionToFirestore(next),
        createdAt: serverTimestamp(),
      })
      updates[`emotionSummary.${next}`] = increment(1)
    } else if (snap.exists()) {
      await deleteDoc(ref)
    }
    const likeDelta = (next ? 1 : 0) - (prev ? 1 : 0)
    updates.likeCount = increment(likeDelta)
    await updateDoc(doc(db, 'posts', postId), updates)
    if (next) {
      await notify(postAuthorId, {
        type: 'POST_REACTION',
        actorId: user.userId,
        actorName: user.name,
        actorAvatarUrl: user.avatar,
        postId,
        reactionType: next,
      })
    }
  },

  observeComments(postId, userId, onData) {
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc'),
    )
    return onSnapshot(q, async (snap) => {
      const comments = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data()
          const likeSnap = await getDoc(
            doc(db, 'posts', postId, 'comments', d.id, 'likes', userId),
          )
          const comment: DiaryComment = {
            commentId: d.id,
            authorId: String(data.authorId ?? ''),
            authorName: String(data.authorName ?? ''),
            authorAvatarUrl: String(data.authorAvatarUrl ?? ''),
            text: String(data.text ?? ''),
            createdAtMillis: millisOf(data.createdAt),
            likeCount: Number(data.likeCount ?? 0),
            replyCount: Number(data.replyCount ?? 0),
            likedByMe: likeSnap.exists(),
          }
          return comment
        }),
      )
      onData(comments)
    })
  },

  async addComment(postId, author, text, postAuthorId) {
    await addDoc(collection(db, 'posts', postId, 'comments'), {
      authorId: author.userId,
      authorName: author.name,
      authorAvatarUrl: author.avatar,
      text,
      createdAt: serverTimestamp(),
      likeCount: 0,
      replyCount: 0,
    })
    await updateDoc(doc(db, 'posts', postId), {
      commentCount: increment(1),
    })
    await notify(postAuthorId, {
      type: 'POST_COMMENT',
      actorId: author.userId,
      actorName: author.name,
      actorAvatarUrl: author.avatar,
      postId,
    })
  },

  async deleteComment(postId, commentId, authorId) {
    const ref = doc(db, 'posts', postId, 'comments', commentId)
    const snap = await getDoc(ref)
    if (!snap.exists() || snap.data().authorId !== authorId) {
      throw new Error('NOT_AUTHOR')
    }
    await deleteDoc(ref)
    await updateDoc(doc(db, 'posts', postId), {
      commentCount: increment(-1),
    })
  },

  async toggleCommentLike(postId, commentId, user, commentAuthorId) {
    const ref = doc(
      db,
      'posts',
      postId,
      'comments',
      commentId,
      'likes',
      user.userId,
    )
    const snap = await getDoc(ref)
    if (snap.exists()) {
      await deleteDoc(ref)
      await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
        likeCount: increment(-1),
      })
      return
    }
    await setDoc(ref, { createdAt: serverTimestamp() })
    await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
      likeCount: increment(1),
    })
    await notify(commentAuthorId, {
      type: 'COMMENT_LIKE',
      actorId: user.userId,
      actorName: user.name,
      actorAvatarUrl: user.avatar,
      postId,
      commentId,
    })
  },

  observeReplies(postId, commentId, userId, onData) {
    const q = query(
      collection(db, 'posts', postId, 'comments', commentId, 'replies'),
      orderBy('createdAt', 'asc'),
    )
    return onSnapshot(q, async (snap) => {
      const replies = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data()
          const likeSnap = await getDoc(
            doc(
              db,
              'posts',
              postId,
              'comments',
              commentId,
              'replies',
              d.id,
              'likes',
              userId,
            ),
          )
          const reply: DiaryReply = {
            replyId: d.id,
            authorId: String(data.authorId ?? ''),
            authorName: String(data.authorName ?? ''),
            authorAvatarUrl: String(data.authorAvatarUrl ?? ''),
            text: String(data.text ?? ''),
            createdAtMillis: millisOf(data.createdAt),
            likeCount: Number(data.likeCount ?? 0),
            mentionedUserId: data.mentionedUserId
              ? String(data.mentionedUserId)
              : undefined,
            mentionedName: data.mentionedName
              ? String(data.mentionedName)
              : undefined,
            likedByMe: likeSnap.exists(),
          }
          return reply
        }),
      )
      onData(replies)
    })
  },

  async addReply(
    postId,
    commentId,
    author,
    text,
    commentAuthorId,
    mentioned,
  ) {
    await addDoc(
      collection(db, 'posts', postId, 'comments', commentId, 'replies'),
      {
        authorId: author.userId,
        authorName: author.name,
        authorAvatarUrl: author.avatar,
        text,
        createdAt: serverTimestamp(),
        likeCount: 0,
        mentionedUserId: mentioned?.userId ?? null,
        mentionedName: mentioned?.name ?? null,
      },
    )
    await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
      replyCount: increment(1),
    })
    await notify(commentAuthorId, {
      type: 'COMMENT_REPLY',
      actorId: author.userId,
      actorName: author.name,
      actorAvatarUrl: author.avatar,
      postId,
      commentId,
    })
  },

  async toggleReplyLike(postId, commentId, replyId, user, replyAuthorId) {
    const ref = doc(
      db,
      'posts',
      postId,
      'comments',
      commentId,
      'replies',
      replyId,
      'likes',
      user.userId,
    )
    const snap = await getDoc(ref)
    if (snap.exists()) {
      await deleteDoc(ref)
      await updateDoc(
        doc(db, 'posts', postId, 'comments', commentId, 'replies', replyId),
        { likeCount: increment(-1) },
      )
      return
    }
    await setDoc(ref, { createdAt: serverTimestamp() })
    await updateDoc(
      doc(db, 'posts', postId, 'comments', commentId, 'replies', replyId),
      { likeCount: increment(1) },
    )
    await notify(replyAuthorId, {
      type: 'REPLY_LIKE',
      actorId: user.userId,
      actorName: user.name,
      actorAvatarUrl: user.avatar,
      postId,
      commentId,
      replyId,
    })
  },

  observeNotifications(userId, onData) {
    const q = query(
      collection(db, 'users', userId, 'diaryNotifications'),
      orderBy('createdAt', 'desc'),
      limit(80),
    )
    return onSnapshot(q, (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            type: data.type as DiaryNotification['type'],
            actorId: String(data.actorId ?? ''),
            actorName: String(data.actorName ?? ''),
            actorAvatarUrl: String(data.actorAvatarUrl ?? ''),
            postId: String(data.postId ?? ''),
            commentId: data.commentId ? String(data.commentId) : undefined,
            replyId: data.replyId ? String(data.replyId) : undefined,
            reactionType: data.reactionType
              ? String(data.reactionType)
              : undefined,
            read: Boolean(data.read),
            createdAtMillis: millisOf(data.createdAt),
          }
        }),
      )
    })
  },

  async markNotificationRead(userId, notificationId) {
    await updateDoc(
      doc(db, 'users', userId, 'diaryNotifications', notificationId),
      { read: true },
    )
  },
}
