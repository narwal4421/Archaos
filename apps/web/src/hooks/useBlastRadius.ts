import { useState } from 'react'
import { api } from '../lib/api'
import type { BlastRadiusResult } from '../types/simulation'
import type { NodeType } from '../types/topology'

interface RawNode {
  id: string
  type?: string
  data?: {
    type?: string
    label?: string
    replicas?: number
    processingTimeMs?: number
  }
  label?: string
}

interface RawEdge {
  id: string
  source: string
  target: string
  data?: {
    circuitBreakerEnabled?: boolean
    timeoutMs?: number
  }
}

export function useBlastRadius() {
  const [result, setResult] = useState<BlastRadiusResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = async (nodes: RawNode[], edges: RawEdge[], rootNodeId: string) => {
    setLoading(true)
    setError(null)
    try {
      // Format nodes and edges to match backend requirements
      const formattedNodes = nodes.map(n => ({
        id: n.id,
        type: (n.type || n.data?.type || 'SERVICE') as NodeType,
        label: n.data?.label || n.label || '',
        replicas: n.data?.replicas ?? 1,
        processingTimeMs: n.data?.processingTimeMs ?? 50,
        x: 0,
        y: 0,
      }))

      const formattedEdges = edges.map(e => ({
        id: e.id,
        type: 'HTTP' as const,
        sourceId: e.source,
        targetId: e.target,
        circuitBreakerEnabled: !!e.data?.circuitBreakerEnabled,
        timeoutMs: e.data?.timeoutMs ?? 1000,
      }))

      const res = await api.blast.analyze({
        nodes: formattedNodes,
        edges: formattedEdges,
        rootNodeId,
      })
      setResult(res as BlastRadiusResult)
      return res as BlastRadiusResult
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Blast radius analysis failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  const clearResult = () => setResult(null)

  return {
    result,
    loading,
    error,
    analyze,
    clearResult,
  }
}
