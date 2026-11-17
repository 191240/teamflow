import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../lib/api'
import { useAuthStore } from '../store/auth'
import type { AuthResponse } from '../types'

const schema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码')
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: 'admin', password: 'admin123' }
  })

  const onSubmit = async (values: FormValues) => {
    const auth = await apiPost<AuthResponse>('/auth/login', values)
    setAuth(auth)
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-8">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">TF</div>
          <h1 className="text-2xl font-bold text-slate-900">登录 TeamFlow</h1>
          <p className="mt-1 text-sm text-slate-500">团队协作与任务看板系统</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">用户名</label>
            <input className="input" placeholder="admin" {...register('username')} />
            {errors.username && <p className="mt-1 text-xs text-rose-600">{errors.username.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">密码</label>
            <input className="input" type="password" placeholder="admin123" {...register('password')} />
            {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>}
          </div>
          <button className="btn-primary w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-xs leading-6 text-slate-600">
          <p className="font-semibold text-slate-700">演示账号</p>
          <button type="button" className="text-brand-600 hover:underline" onClick={() => { setValue('username', 'admin'); setValue('password', 'admin123') }}>
            admin / admin123（管理员）
          </button>
          <br />
          <button type="button" className="text-brand-600 hover:underline" onClick={() => { setValue('username', 'member'); setValue('password', 'member123') }}>
            member / member123（成员）
          </button>
        </div>
      </div>
    </div>
  )
}
