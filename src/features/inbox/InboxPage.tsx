import { MessageCircle } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { InboxList } from '@/features/inbox/InboxList'

export function InboxPage() {
  return (
    <>
      <div className="h-full lg:hidden">
        <InboxList />
      </div>
      <div className="hidden h-full lg:block">
        <EmptyState
          icon={MessageCircle}
          title="Chọn một cuộc trò chuyện"
          description="Chọn bạn bè ở danh sách bên trái để bắt đầu nhắn tin."
        />
      </div>
    </>
  )
}
