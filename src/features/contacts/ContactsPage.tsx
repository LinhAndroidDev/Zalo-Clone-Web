import { Users } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { ContactsList } from '@/features/contacts/ContactsList'

export function ContactsPage() {
  return (
    <>
      <div className="h-full lg:hidden">
        <ContactsList />
      </div>
      <div className="hidden h-full lg:block">
        <EmptyState
          icon={Users}
          title="Danh bạ"
          description="Chọn một người bạn để xem hồ sơ hoặc nhắn tin."
        />
      </div>
    </>
  )
}
