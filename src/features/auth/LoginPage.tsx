import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authRepository } from '@/data/repositories/authRepository'
import { useSessionStore } from '@/stores/sessionStore'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useSessionStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: () => authRepository.checkLogin(email.trim(), password),
    onSuccess: (users) => {
      const user = users[0]
      if (!user) {
        toast.error('Email hoặc mật khẩu không đúng')
        return
      }
      login(user.userId, user.name)
      navigate('/home', { replace: true })
    },
    onError: () => {
      toast.error('Không đăng nhập được. Kiểm tra kết nối Firebase.')
    },
  })

  return (
    <form
      className="space-y-4 rounded-xl border bg-card p-6 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault()
        mutation.mutate()
      }}
    >
      <div>
        <h1 className="text-xl font-semibold">Đăng nhập</h1>
        <p className="text-sm text-muted-foreground">
          Dùng email đã đăng ký trên app.
        </p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          Mật khẩu
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button className="w-full" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Đang vào...' : 'Đăng nhập'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{' '}
        <Link className="text-primary" to="/register">
          Đăng ký
        </Link>
      </p>
    </form>
  )
}
