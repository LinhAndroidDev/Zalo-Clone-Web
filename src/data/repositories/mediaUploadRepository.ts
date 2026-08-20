import { uploadToCloudinary } from '@/data/cloudinary/upload'
import type { MediaUploadRepository } from '@/domain/repositories'

export const mediaUploadRepository: MediaUploadRepository = {
  async uploadPhotos(files, roomId, onProgress) {
    const total = files.length
    const out = []
    for (let i = 0; i < files.length; i++) {
      const result = await uploadToCloudinary(files[i], `photo/${roomId}`)
      onProgress?.(Math.round(((i + 1) / total) * 100))
      const w = result.width ?? 0
      const h = result.height ?? 0
      out.push({
        url: result.url,
        size: w && h ? `${w}x${h}` : '',
      })
    }
    return out
  },

  async uploadAudio(file, roomId, onProgress) {
    const result = await uploadToCloudinary(file, `audios/${roomId}`)
    onProgress?.(100)
    return result.url
  },

  async uploadImage(file, folder) {
    const result = await uploadToCloudinary(file, folder)
    return result.url
  },
}
