import { useState } from 'react'
import { api } from '../lib/api'
import type { BlastRadiusResult } from '../types/simulation'

export function useBlastRadius() {
  const [result, setResult] = useState<BlastRadiusResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = async (nodes: any[], edges: any[], rootNodeId: string) => {
    setLoading(true)
    setError(null)
    try {
      // Format nodes and edges to match backend requirements
      const formattedNodes = nodes.map(n => ({
        id: n.id,
        type: n.type || n.data?.type || 'SERVICE',
        label: n.data?.label || n.label || '',
        replicas: n.data?.replicas ?? 1,
        processingTimeMs: n.data?.processingTimeMs ?? 50,
      }))

      const formattedEdges = edges.map(e => ({
        id: e.id,
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
      setResult(res)
      return res
    } catch (e: any) {
      setError(e.message || 'Blast radius analysis failed')
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
