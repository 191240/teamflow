import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, CheckCircle2, FolderKanban, Plus, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiGet, apiPost } from '../lib/api'
import { formatDateTime } from '../lib/format'
import type { Overview, Project } from '../types'

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' })

  const overviewQuery = useQuery({
    queryKey: ['overview'],
    queryFn: () => apiGet<Overview>('/dashboard/overview')
  })
  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiGet<Project[]>('/projects')
  })

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => apiPost<Project>('/projects', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
      setShowCreate(false)
      setForm({ name: '', description: '', color: '#6366f1' })
    }
  })

  const overview = overviewQuery.data
  const charts = overview
    ? Object.entries(overview.tasksByStatus).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">工作台</h1>
          <p className="mt-1 text-sm text-slate-500">团队任务进展与项目概览</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" /> 新建项目
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<FolderKanban size={20} />} label="项目总数" value={overview?.totalProjects ?? '-'} color="bg-brand-50 text-brand-600" />
        <StatCard icon={<CheckCircle2 size={20} />} label="任务总数" value={overview?.totalTasks ?? '-'} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={<Users size={20} />} label="团队成员" value={overview?.totalUsers ?? '-'} color="bg-amber-50 text-amber-600" />
        <StatCard icon={<Activity size={20} />} label="完成率" value={`${overview?.completionRate ?? 0}%`} color="bg-rose-50 text-rose-600" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card p-6 xl:col-span-2">
          <h2 className="mb-5 font-semibold text-slate-900">任务状态分布</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mb-5 font-semibold text-slate-900">最近动态</h2>
          <div className="space-y-4">
            {overview?.recentActivities.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                <div className="min-w-0">
                  <p className="text-sm text-slate-700">{item.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card p-6">
        <h2 className="mb-5 font-semibold text-slate-900">我的项目</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projectsQuery.data?.map((project) => (
            <Link key={project.id} to={`/board/${project.id}`} className="group rounded-xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <span className="h-3 w-3 rounded-full" style={{ background: project.color }} />
                <span className="text-xs text-slate-400">#{project.id}</span>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-brand-600">{project.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">{project.description}</p>
              <p className="mt-4 text-xs font-medium text-brand-600">进入看板 →</p>
            </Link>
          ))}
        </div>
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="card w-full max-w-lg p-6">
            <h2 className="mb-5 text-lg font-semibold">新建项目</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">项目名称</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">项目描述</label>
                <textarea className="input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">主题色</label>
                <input type="color" className="h-10 w-20 cursor-pointer rounded border border-slate-300" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-ghost" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn-primary" disabled={!form.name.trim() || createMutation.isPending} onClick={() => createMutation.mutate(form)}>
                {createMutation.isPending ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: ReactNode, label: string, value: string | number, color: string }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}
