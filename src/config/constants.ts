export const MESSAGE_TYPE = {
  TEXT: 0,
  PHOTOS: 1,
  SINGLE_PHOTO: 2,
  AUDIO: 3,
  SYSTEM: 4,
} as const

export type MessageTypeValue = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE]

export const MESSAGE_GROUP_GAP_MS = 3 * 60 * 1000

export const FRIENDSHIP_SEED_MESSAGE = 'Hai bạn đã trở thành bạn bè'
