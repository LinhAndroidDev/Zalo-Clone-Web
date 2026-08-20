import type { Message } from '@/domain/models'

export function messagePhotoUrls(message: Message): string[] {
  if (message.photos?.length) return message.photos
  if (message.singlePhoto?.length) return message.singlePhoto
  return []
}

export function firstPhotoUrl(message: Message): string | undefined {
  return messagePhotoUrls(message)[0]
}

export function formatLastSeen(lastSeen: number): string {
  if (!lastSeen) return 'Ngoại tuyến'
  const date = new Date(lastSeen)
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  const time = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  if (sameDay) return `Hoạt động lúc ${time}`
  return `Hoạt động ${date.toLocaleDateString('vi-VN')} ${time}`
}
