import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import { useSimulationStore } from '../../../stores/simulationStore'
import type { CircuitBreakerState } from '../../../types/simulation'

const edgeColorByState = (errorRate: number, cbState: CircuitBreakerState, isPartitioned: boolean) => {
  if (isPartitioned) return '#525c72'
  if (cbState === 'OPEN') return '#525c72'
  if (errorRate > 50) return '#ef4444'
  if (errorRate > 10) return '#f97316'
  if (errorRate > 2)  return '#eab308'
  return '#22c55e'
}

interface AnimatedEdgeProps {
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  data?: any
  markerEnd?: string
}

export const AnimatedEdge = memo(({
  id, sourceX, sourceY, targetX, targetY, markerEnd
}: AnimatedEdgeProps) => {
  const edgeState = useSimulationStore((s: any) => s.simState.edges[id])
  const error = edgeState?.errorRatePercent ?? 0
  const cbState = edgeState?.circuitBreakerState ?? 'CLOSED'
  const isPartitioned = edgeState?.isPartitioned ?? false
  const addedLatency = edgeState?.addedLatencyMs ?? 0

  const color = edgeColorByState(error, cbState, isPartitioned)
  const rps = edgeState?.requestsPerSec ?? 0

  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY })

  const isOpen = cbState === 'OPEN'
  const strokeDasharray = isPartitioned || isOpen ? '6 4' : undefined
  const strokeWidth = Math.max(1.5, Math.min(4, 1.5 + rps / 100))

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth,
          strokeDasharray,
          opacity: isPartitioned ? 0.4 : 0.9,
          transition: 'stroke 0.4s ease, stroke-width 0.3s ease',
          filter: rps > 50 ? `drop-shadow(0 0 3px ${color})` : undefined,
        }}
      />
      {/* Animated traffic dots */}
      {rps > 0 && !isOpen && !isPartitioned && (
        <circle r="3" fill={color} style={{ filter: `drop-shadow(0 0 2px ${color})` }}>
          <animateMotion dur={`${Math.max(0.5, 3 - rps / 100)}s`} repeatCount="indefinite">
            <mpath href={`#${id}`} />
          </animateMotion>
        </circle>
      )}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            display: 'flex', gap: 4, alignItems: 'center',
          }}
        >
          {isOpen && (
            <span className="badge badge-gray" style={{ fontSize: 9 }}>⚡ CB OPEN</span>
          )}
          {isPartitioned && (
            <span className="badge badge-gray" style={{ fontSize: 9 }}>✂ PARTITIONED</span>
          )}
          {addedLatency > 0 && (
            <span className="badge badge-orange" style={{ fontSize: 9 }}>+{addedLatency}ms</span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
})

export const edgeTypes = {
  http:          AnimatedEdge,
  grpc:          AnimatedEdge,
  message:       AnimatedEdge,
  database_conn: AnimatedEdge,
}
