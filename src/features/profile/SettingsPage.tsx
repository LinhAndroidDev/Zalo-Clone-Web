import { useNavigate } from 'react-router-dom'
import { queryClient } from '@/app/queryClient'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/stores/sessionStore'

export function SettingsPage() {
  const logout = useSessionStore((s) => s.logout)
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center border-b px-4">
        <h1 className="text-lg font-semibold">Cài đặt</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="mx-auto w-full max-w-2xl rounded-xl border bg-card p-4 lg:p-6">
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={() => {
              queryClient.clear()
              logout()
              navigate('/login', { replace: true })
            }}
          >
            Đăng xuất
          </Button>
        </div>
      </div>
    </div>
  )
}
