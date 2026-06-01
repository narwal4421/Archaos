import { useAuthStore } from '../stores/authStore'

const BASE_URL = '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token
  const headers = new Headers(options.headers)

  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const api = {
  auth: {
    login: (credentials: { email: string; passwordHash: string }) =>
      request<{ user: { id: string; name: string; email: string }; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (data: { email: string; passwordHash: string; name: string }) =>
      request<{ user: { id: string; name: string; email: string }; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  topologies: {
    list: () => request<any[]>('/topologies'),
    get: (id: string) => request<any>(`/topologies/${id}`),
    create: (data: any) =>
      request<any>('/topologies', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/topologies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<any>(`/topologies/${id}`, {
        method: 'DELETE',
      }),
  },
  scenarios: {
    list: () => request<any[]>('/scenarios'),
    get: (id: string) => request<any>(`/scenarios/${id}`),
  },
  sessions: {
    create: (data: any) =>
      request<any>('/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  blast: {
    analyze: (data: { nodes: any[]; edges: any[]; rootNodeId: string }) =>
      request<any>('/blast/analyze', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
}
