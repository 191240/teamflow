import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, KanbanSquare, LogOut, Users } from 'lucide-react'
import { useAuthStore } from '../store/auth'

export default function Layout() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">TF</div>
          <div>
            <p className="text-sm font-bold text-slate-900">TeamFlow</p>
            <p className="text-[11px] text-slate-400">团队协作平台</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
            <LayoutDashboard size={18} /> 工作台
          </NavLink>
          <NavLink to="/projects" end className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
            <KanbanSquare size={18} /> 项目看板
          </NavLink>
          <NavLink to="/members" end className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
            <Users size={18} /> 成员
          </NavLink>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {user?.displayName?.slice(0, 1) ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{user?.displayName ?? '未登录'}</p>
              <p className="text-xs text-slate-400">{user?.role === 'ADMIN' ? '管理员' : '成员'}</p>
            </div>
          </div>
          <button className="btn-ghost w-full" onClick={handleLogout}>
            <LogOut size={16} className="mr-2" /> 退出登录
          </button>
        </div>
      </aside>

      <main className="ml-60 min-h-screen">
        <div className="mx-auto max-w-[1400px] px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
