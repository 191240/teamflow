import axios from 'axios'
import type { ApiResponse } from '../types'

export const api = axios.create({
  baseURL: '/api',
  timeout: 15000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('teamflow_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      const message = error.response.data?.message ?? '无权限执行该操作'
      window.alert(message)
    }
    return Promise.reject(error)
  }
)

async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const response = await promise
  return response.data.data
}

export const apiGet = <T>(url: string) => unwrap<T>(api.get<ApiResponse<T>>(url))
export const apiPost = <T>(url: string, body?: unknown) => unwrap<T>(api.post<ApiResponse<T>>(url, body))
export const apiPut = <T>(url: string, body?: unknown) => unwrap<T>(api.put<ApiResponse<T>>(url, body))
export const apiPatch = <T>(url: string, body?: unknown) => unwrap<T>(api.patch<ApiResponse<T>>(url, body))
export const apiDelete = <T>(url: string) => unwrap<T>(api.delete<ApiResponse<T>>(url))
