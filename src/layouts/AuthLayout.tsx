import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/40 lg:flex-row">
      <div className="hidden flex-1 flex-col justify-center gap-4 bg-primary px-16 text-primary-foreground lg:flex">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-foreground/15 text-2xl font-bold">
          Z
        </div>
        <h1 className="text-4xl font-semibold">Zalo Clone Web</h1>
        <p className="max-w-md text-primary-foreground/80">
          Nhắn tin với bạn bè ngay trên trình duyệt, dùng chung dữ liệu với ứng
          dụng Android.
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
