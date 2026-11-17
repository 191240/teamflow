import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import { formatDateTime } from '../lib/format'
import type { User } from '../types'

export default function MembersPage() {
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => apiGet<User[]>('/users')
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">团队成员</h1>
        <p className="mt-1 text-sm text-slate-500">当前系统中已注册的成员</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {usersQuery.data?.map((user) => (
          <div key={user.id} className="card flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
              {user.displayName.slice(0, 1)}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user.displayName}</p>
              <p className="text-sm text-slate-500">@{user.username}</p>
              <p className="mt-1 text-xs text-slate-400">
                {user.role === 'ADMIN' ? '管理员' : '成员'} · {formatDateTime(undefined)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
