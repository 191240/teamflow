import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus } from 'lucide-react'
import TaskCard from '../components/TaskCard'
import TaskDrawer from '../components/TaskDrawer'
import { useProjectSocket } from '../hooks/useProjectSocket'
import { apiGet, apiPatch, apiPost } from '../lib/api'
import type { Project, Task, TaskStatus, User } from '../types'

const COLUMNS: { status: TaskStatus, title: string, dot: string }[] = [
  { status: 'TODO', title: '待办', dot: 'bg-slate-400' },
  { status: 'IN_PROGRESS', title: '进行中', dot: 'bg-blue-500' },
  { status: 'REVIEW', title: '待评审', dot: 'bg-amber-500' },
  { status: 'DONE', title: '已完成', dot: 'bg-emerald-500' }
]

export default function BoardPage() {
  const { projectId } = useParams()
  const id = Number(projectId)
  const queryClient = useQueryClient()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', assigneeId: '', dueDate: '' })

  const queryKey = ['tasks', id] as const

  const projectQuery = useQuery({
    queryKey: ['project', id],
    queryFn: () => apiGet<Project>(`/projects/${id}`),
    enabled: !!id
  })
  const tasksQuery = useQuery({
    queryKey,
    queryFn: () => apiGet<Task[]>(`/projects/${id}/tasks`),
    enabled: !!id
  })
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => apiGet<User[]>('/users')
  })

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey })
    queryClient.invalidateQueries({ queryKey: ['overview'] })
  }, [queryClient, id])

  useProjectSocket(id, refresh)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const tasks = tasksQuery.data ?? []

  const moveMutation = useMutation({
    mutationFn: ({ taskId, status, position }: { taskId: number, status: TaskStatus, position: number }) =>
      apiPatch<Task>(`/tasks/${taskId}/move`, { status, position }),
    onMutate: async ({ taskId, status, position }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Task[]>(queryKey)
      if (previous) {
        const active = previous.find((task) => task.id === taskId)
        if (active) {
          queryClient.setQueryData<Task[]>(queryKey, [
            ...previous.filter((task) => task.id !== taskId),
            { ...active, status, position }
          ])
        }
      }
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSettled: refresh
  })

  const createMutation = useMutation({
    mutationFn: () => apiPost<Task>(`/projects/${id}/tasks`, {
      title: form.title,
      description: form.description,
      priority: form.priority,
      assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
      dueDate: form.dueDate || null
    }),
    onSuccess: () => {
      setShowCreate(false)
      setForm({ title: '', description: '', priority: 'MEDIUM', assigneeId: '', dueDate: '' })
      refresh()
    }
  })

  function handleDragEnd(event: DragEndEvent) {
    const taskId = Number(event.active.id)
    const overId = String(event.over?.id ?? '')
    const activeTask = tasks.find((task) => task.id === taskId)
    if (!activeTask || !overId) return

    let status: TaskStatus = activeTask.status
    if (overId.startsWith('column-')) {
      status = overId.replace('column-', '') as TaskStatus
    } else {
      status = tasks.find((task) => String(task.id) === overId)?.status ?? activeTask.status
    }

    const targetTasks = tasks.filter((task) => task.status === status && task.id !== taskId)
    const overIndex = targetTasks.findIndex((task) => String(task.id) === overId)
    const position = overIndex >= 0 ? overIndex : targetTasks.length

    if (status === activeTask.status && activeTask.position === position) return
    moveMutation.mutate({ taskId, status, position })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
            <ArrowLeft size={15} /> 返回工作台
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{projectQuery.data?.name ?? '项目看板'}</h1>
          <p className="mt-1 text-sm text-slate-500">{projectQuery.data?.description}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" /> 新建任务
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => (
            <BoardColumn
              key={column.status}
              column={column}
              tasks={tasks.filter((task) => task.status === column.status)}
              onSelect={setSelectedTask}
            />
          ))}
        </div>
      </DndContext>

      <TaskDrawer task={selectedTask} users={usersQuery.data ?? []} onClose={() => setSelectedTask(null)} />

      {showCreate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="card w-full max-w-lg p-6">
            <h2 className="mb-5 text-lg font-semibold">新建任务</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">任务标题</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">描述</label>
                <textarea className="input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
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
                    {usersQuery.data?.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">截止日期</label>
                  <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-ghost" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn-primary" disabled={!form.title.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>
                {createMutation.isPending ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BoardColumn({ column, tasks, onSelect }: {
  column: { status: TaskStatus, title: string, dot: string }
  tasks: Task[]
  onSelect: (task: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${column.status}` })
  return (
    <div ref={setNodeRef} className={`rounded-xl border bg-slate-100/70 p-3 transition ${isOver ? 'border-brand-400 bg-brand-50' : 'border-slate-200'}`}>
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${column.dot}`} />
          <h2 className="text-sm font-semibold text-slate-700">{column.title}</h2>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="min-h-40 space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} commentCount={0} onClick={() => onSelect(task)} />
          ))}
          {tasks.length === 0 && <p className="py-8 text-center text-xs text-slate-400">拖拽任务到这里</p>}
        </div>
      </SortableContext>
    </div>
  )
}
