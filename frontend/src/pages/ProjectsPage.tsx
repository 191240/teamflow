import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { apiDelete, apiGet, apiPost } from '../lib/api'
import { formatDateTime } from '../lib/format'
import { useAuthStore } from '../store/auth'
import type { Project } from '../types'

const emptyForm = { name: '', description: '', color: '#6366f1' }

export default function ProjectsPage() {
  const queryClient = useQueryClient()
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiGet<Project[]>('/projects')
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] })
    queryClient.invalidateQueries({ queryKey: ['overview'] })
  }

  const createMutation = useMutation({
    mutationFn: () => apiPost<Project>('/projects', form),
    onSuccess: () => {
      setShowCreate(false)
      setForm(emptyForm)
      refresh()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete<void>(`/projects/${id}`),
    onSuccess: refresh
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">项目看板</h1>
          <p className="mt-1 text-sm text-slate-500">选择一个项目进入任务看板</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} className="mr-2" /> 新建项目
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">项目</th>
              <th className="px-6 py-3 font-medium">描述</th>
              <th className="px-6 py-3 font-medium">创建时间</th>
              <th className="px-6 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projectsQuery.data?.map((project) => (
              <tr key={project.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ background: project.color }} />
                    <span className="font-medium text-slate-800">{project.name}</span>
                  </div>
                </td>
                <td className="max-w-md px-6 py-4 text-slate-500">{project.description}</td>
                <td className="px-6 py-4 text-slate-500">{formatDateTime(project.createdAt)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <Link to={`/board/${project.id}`} className="text-sm font-medium text-brand-600 hover:underline">进入看板</Link>
                    {isAdmin && (
                      <button
                        className="inline-flex items-center gap-1 text-sm text-rose-600 hover:underline"
                        disabled={deleteMutation.isPending}
                        onClick={() => { if (window.confirm(`确认删除项目「${project.name}」？`)) deleteMutation.mutate(project.id) }}
                      >
                        <Trash2 size={14} /> 删除
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                <label className="mb-1.5 block text-sm font-medium">描述</label>
                <textarea className="input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">颜色</label>
                <input type="color" className="h-10 w-20 cursor-pointer rounded border border-slate-200" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-ghost" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn-primary" disabled={!form.name.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>
                {createMutation.isPending ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
