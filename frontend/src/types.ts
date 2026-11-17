export type Role = 'ADMIN' | 'MEMBER'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface User {
  id: number
  username: string
  displayName: string
  role: Role
}

export interface Project {
  id: number
  name: string
  description: string
  color: string
  ownerId: number
  createdAt: string
}

export interface Task {
  id: number
  projectId: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: number | null
  assigneeName: string | null
  position: number
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export interface TaskComment {
  id: number
  taskId: number
  authorId: number
  authorName: string
  content: string
  createdAt: string
}

export interface Activity {
  id: number
  projectId: number
  taskId: number | null
  message: string
  createdAt: string
}

export interface AuthResponse {
  token: string | null
  username: string
  displayName: string
  role: Role
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface Overview {
  totalProjects: number
  totalTasks: number
  totalUsers: number
  completionRate: number
  tasksByStatus: Record<TaskStatus, number>
  recentActivities: Activity[]
}
