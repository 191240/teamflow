import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, X } from 'lucide-react'
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api'
import { formatDateTime } from '../lib/format'
import { useAuthStore } from '../store/auth'
import type { Task, TaskComment, User } from '../types'

interface FormState {
  title: string
  description: string
  status: string
  priority: string
  assigneeId: string
  dueDate: string
}

export default function TaskDrawer({ task, users, onClose }: {
  task: Task | null
  users: User[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN')
  const [form, setForm] = useState<FormState>(blankForm())
  const [comment, setComment] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (task) setForm(toForm(task))
    else setForm(blankForm())
  }, [task])

  const commentsQuery = useQuery({
    queryKey: ['comments', task?.id],
    queryFn: () => apiGet<TaskComment[]>(`/tasks/${task?.id}/comments`),
    enabled: !!task
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks', task?.projectId] })
    queryClient.invalidateQueries({ queryKey: ['comments', task?.id] })
    queryClient.invalidateQueries({ queryKey: ['overview'] })
  }

  const saveMutation = useMutation({
    mutationFn: () => apiPut<Task>(`/tasks/${task?.id}`, {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
      dueDate: form.dueDate || null
    }),
    onSuccess: refresh
  })

  const commentMutation = useMutation({
    mutationFn: () => apiPost<TaskComment>(`/tasks/${task?.id}/comments`, { content: comment }),
    onSuccess: () => {
      setComment('')
      refresh()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => apiDelete<void>(`/tasks/${task?.id}`),
    onSuccess: () => {
      refresh()
      onClose()
    }
  })

  if (!task) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30">
      <aside className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs text-slate-400">任务详情 #{task.id}</p>
            <h2 className="mt-0.5 text-lg font-semibold text-slate-900">编辑任务</h2>
          </div>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" onClick={onClose}><X size={18} /></button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium">标题</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">描述</label>
            <textarea className="input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">状态</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="TODO">待办</option>
                <option value="IN_PROGRESS">进行中</option>
                <option value="REVIEW">待评审</option>
                <option value="DONE">已完成</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">优先级</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">低</option>
                <option value="MEDIUM">中</option>
                <option value="HIGH">高</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">负责人</label>
              <select className="input" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
                <option value="">未分配</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">截止日期</label>
              <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>

          <button className="btn-primary w-full" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? '保存中...' : '保存修改'}
          </button>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="mb-4 font-semibold text-slate-900">评论</h3>
            <div className="space-y-4">
              {commentsQuery.data?.map((item) => (
                <div key={item.id} className="rounded-lg bg-slate-50 p-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.authorName}</span>
                    <span className="text-slate-400">{formatDateTime(item.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-600">{item.content}</p>
                </div>
              ))}
              {commentsQuery.data?.length === 0 && <p className="text-sm text-slate-400">还没有评论</p>}
            </div>
            <div className="mt-4 flex gap-2">
              <input className="input" placeholder="写下评论，支持 @成员" value={comment} onChange={(e) => setComment(e.target.value)} />
              <button className="btn-primary shrink-0" disabled={!comment.trim() || commentMutation.isPending} onClick={() => commentMutation.mutate()}>
                <Send size={16} />
              </button>
            </div>
          </div>

          {isAdmin && (
            <div className="border-t border-slate-100 pt-5">
              {!confirmDelete ? (
                <button className="text-sm text-rose-600 hover:underline" onClick={() => setConfirmDelete(true)}>删除该任务</button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-rose-600">确认删除？</span>
                  <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>取消</button>
                  <button className="btn-primary bg-rose-600 hover:bg-rose-700" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
                    删除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

function blankForm(): FormState {
  return { title: '', description: '', status: 'TODO', priority: 'MEDIUM', assigneeId: '', dueDate: '' }
}

function toForm(task: Task): FormState {
  return {
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    priority: task.priority,
    assigneeId: task.assigneeId ? String(task.assigneeId) : '',
    dueDate: task.dueDate ?? ''
  }
}
