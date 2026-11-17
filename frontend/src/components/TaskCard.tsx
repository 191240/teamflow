import { useSortable } from '@dnd-kit/sortable'
import { CalendarDays, MessageSquare } from 'lucide-react'
import type { Task, TaskPriority } from '../types'

const priorityStyles: Record<TaskPriority, string> = {
  HIGH: 'bg-rose-50 text-rose-600',
  MEDIUM: 'bg-amber-50 text-amber-600',
  LOW: 'bg-slate-100 text-slate-500'
}

const priorityLabels: Record<TaskPriority, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低'
}

export default function TaskCard({ task, commentCount, onClick }: {
  task: Task
  commentCount: number
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1
      }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-card active:cursor-grabbing"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-5 text-slate-800">{task.title}</h4>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityStyles[task.priority]}`}>
          {priorityLabels[task.priority]}
        </span>
      </div>
      {task.description && <p className="mb-3 line-clamp-2 text-xs leading-5 text-slate-500">{task.description}</p>}
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <CalendarDays size={12} /> {task.dueDate.slice(5)}
            </span>
          )}
          {commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare size={12} /> {commentCount}
            </span>
          )}
        </div>
        {task.assigneeName && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{task.assigneeName}</span>
        )}
      </div>
    </div>
  )
}
