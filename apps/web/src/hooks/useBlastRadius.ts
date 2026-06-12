import { useState } from 'react'
import { calculateBlastRadius } from '../utils/blastRadius'
import type { BlastRadiusResult } from '../utils/blastRadius'

interface RawNode {
  id: string
  type?: string
  data?: {
    type?: string
    label?: string
    config?: {
      circuitBreakerEnabled?: boolean
      weight?: number
    }
  }
  label?: string
}

interface RawEdge {
  id: string
  source: string
  target: string
  data?: {
    config?: {
      circuitBreakerEnabled?: boolean
      timeoutMs?: number
      weight?: number
    }
  }
}

export type { BlastRadiusResult }

export function useBlastRadius() {
  const [result, setResult] = useState<BlastRadiusResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = async (nodes: RawNode[], edges: RawEdge[], rootNodeId: string) => {
    setLoading(true)
    setError(null)
    try {
      // Pure client-side graph algorithm — works offline, no API needed
      const res = calculateBlastRadius(nodes, edges, rootNodeId)
      setResult(res)
      return res
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
