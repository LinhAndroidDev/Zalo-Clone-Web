import { INBOX_PREVIEW, MESSAGE_TYPE } from '@/config/constants'

export async function uploadToCloudinary(
  file: File,
  folder: string,
): Promise<{ url: string; width?: number; height?: number }> {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  if (!cloud || !preset) {
    throw new Error('Cloudinary chưa được cấu hình')
  }

  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', preset)
  form.append('folder', folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    throw new Error('Upload thất bại')
  }
  const data = (await res.json()) as {
    secure_url?: string
    width?: number
    height?: number
  }
  if (!data.secure_url) {
    throw new Error('Upload thất bại')
  }
  return { url: data.secure_url, width: data.width, height: data.height }
}

export function inboxPreviewForType(type: number, text = ''): string {
  if (type === MESSAGE_TYPE.PHOTOS || type === MESSAGE_TYPE.SINGLE_PHOTO) {
    return INBOX_PREVIEW.PHOTO
  }
  if (type === MESSAGE_TYPE.AUDIO) {
    return INBOX_PREVIEW.AUDIO
  }
  return text
}
