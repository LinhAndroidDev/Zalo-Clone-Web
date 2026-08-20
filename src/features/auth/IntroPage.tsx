import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function IntroPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
          Z
        </div>
        <h1 className="text-2xl font-semibold">Zalo Clone</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nhắn tin với bạn bè trên web, cùng dữ liệu với app Android.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button asChild className="w-full">
          <Link to="/login">Đăng nhập</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link to="/register">Đăng ký</Link>
        </Button>
      </div>
    </div>
  )
}
