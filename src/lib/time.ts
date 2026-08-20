/** Android SimpleDateFormat "yyyy_MM_dd_HH_mm_ss" */
export function formatMessageTime(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('_')
}

export function parseMessageTime(time: string): Date | null {
  const parts = time.split('_').map(Number)
  if (parts.length !== 6 || parts.some((n) => Number.isNaN(n))) return null
  const [y, m, d, h, min, s] = parts
  return new Date(y, m - 1, d, h, min, s)
}

export function formatInboxTime(time: string): string {
  const date = parseMessageTime(time)
  if (!date) return ''
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  if (sameDay) {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export function formatChatTime(time: string): string {
  const date = parseMessageTime(time)
  if (!date) return ''
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
