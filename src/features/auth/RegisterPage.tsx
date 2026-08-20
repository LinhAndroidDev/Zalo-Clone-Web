import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authRepository } from '@/data/repositories/authRepository'
import { useSessionStore } from '@/stores/sessionStore'

export function RegisterPage() {
  const navigate = useNavigate()
  const login = useSessionStore((s) => s.login)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const exists = await authRepository.isEmailRegistered(email.trim())
      if (exists) throw new Error('EMAIL_TAKEN')
      return authRepository.registerUser(
        { name: name.trim(), email: email.trim(), avatar: '' },
        password,
      )
    },
    onSuccess: (userId) => {
      login(userId, name.trim())
      navigate('/home', { replace: true })
    },
    onError: (err) => {
      if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
        toast.error('Email đã được đăng ký')
        return
      }
      toast.error('Không đăng ký được. Kiểm tra kết nối Firebase.')
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
        <h1 className="text-xl font-semibold">Đăng ký</h1>
        <p className="text-sm text-muted-foreground">
          Tạo tài khoản dùng chung với app Android.
        </p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="name">
          Tên hiển thị
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={4}
          required
        />
      </div>
      <Button className="w-full" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{' '}
        <Link className="text-primary" to="/login">
          Đăng nhập
        </Link>
      </p>
    </form>
  )
}
