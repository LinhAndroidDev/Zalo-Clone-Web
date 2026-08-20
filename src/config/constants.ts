export const MESSAGE_TYPE = {
  TEXT: 0,
  PHOTOS: 1,
  SINGLE_PHOTO: 2,
  AUDIO: 3,
  SYSTEM: 4,
} as const

export type MessageTypeValue = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE]

export const EMOTION_TYPE = {
  FAVOURITE: 'favourite',
  LIKE: 'like',
  LAUGH: 'laugh',
  CRY: 'cry',
  ANGRY: 'angry',
} as const

export type EmotionType = (typeof EMOTION_TYPE)[keyof typeof EMOTION_TYPE]

export const EMOTION_TYPES = Object.values(EMOTION_TYPE)

export const EMOTION_EMOJI: Record<EmotionType, string> = {
  favourite: '❤️',
  like: '👍',
  laugh: '😆',
  cry: '😢',
  angry: '😡',
}

export const MESSAGE_GROUP_GAP_MS = 3 * 60 * 1000
export const MAX_PINNED_MESSAGES = 10
export const GROUP_TYPING_TTL_MS = 8_000
export const TYPING_IDLE_MS = 8_000
export const ALL_MENTION_ID = '__all__'
export const FRIENDSHIP_SEED_MESSAGE = 'Hai bạn đã trở thành bạn bè'

export const STICKER_PACKS = [
  'hello',
  'love',
  'congatulation',
  'angry',
  'sad',
  'sorry',
] as const

export const INBOX_PREVIEW = {
  PHOTO: '[Hình ảnh]',
  AUDIO: '[Tin nhắn thoại]',
} as const

export const DIARY_AUTHOR_CHUNK = 10
export const DIARY_FEED_QUERY_LIMIT = 80
export const DIARY_FEED_MAX_POSTS = 50
export const DIARY_NOTIFY_TRUNCATE = 200
export const STORY_TTL_MS = 24 * 60 * 60 * 1000
export const STORY_IMAGE_MS = 5_000
export const STORY_VIDEO_MAX_MS = 30_000
export const STORY_QUERY_LIMIT = 150

export function emotionToFirestore(type: EmotionType): string {
  return type.toUpperCase()
}

export function emotionFromFirestore(raw: string): EmotionType {
  const lower = raw.toLowerCase()
  if ((EMOTION_TYPES as string[]).includes(lower)) {
    return lower as EmotionType
  }
  return EMOTION_TYPE.LIKE
}

