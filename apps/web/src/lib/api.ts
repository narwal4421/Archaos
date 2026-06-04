import { useAuthStore } from '../stores/authStore'
import type { Topology, Scenario, NodeConfig, EdgeConfig } from '../types/topology'

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
    const errorData = (await response.json().catch(() => ({}))) as { message?: string }
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
    list: () => request<Topology[]>('/topologies'),
    get: (id: string) => request<Topology>(`/topologies/${id}`),
    create: (data: Omit<Topology, 'id'>) =>
      request<Topology>('/topologies', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Topology>) =>
      request<Topology>(`/topologies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/topologies/${id}`, {
        method: 'DELETE',
      }),
  },
  scenarios: {
    list: () => request<Scenario[]>('/scenarios'),
    get: (id: string) => request<Scenario>(`/scenarios/${id}`),
    create: (data: any) => request<Scenario>('/scenarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    upvote: (id: string) => request<Scenario>(`/scenarios/${id}/upvote`, {
      method: 'POST',
    }),
  },
  sessions: {
    create: (data: { topologyId?: string; scenarioId?: string }) =>
      request<{ id: string }>('/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  blast: {
    analyze: (data: { nodes: NodeConfig[]; edges: EdgeConfig[]; rootNodeId: string }) =>
      request<unknown>('/blast/analyze', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
}
