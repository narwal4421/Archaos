import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { useSimulationStore } from '../../../stores/simulationStore'
import type { SimulationStore } from '../../../stores/simulationStore'
import type { NodeHealthState } from '../../../types/simulation'
import type { NodeConfig } from '../../../types/topology'

const healthColors: Record<NodeHealthState, string> = {
  HEALTHY:    '#22c55e',
  DEGRADED:   '#eab308',
  UNHEALTHY:  '#f97316',
  FAILED:     '#ef4444',
  RECOVERING: '#3b82f6',
}

const healthRings: Record<NodeHealthState, string> = {
  HEALTHY:    'animate-pulse-healthy',
  DEGRADED:   'animate-pulse-warn',
  UNHEALTHY:  'animate-pulse-warn',
  FAILED:     'animate-pulse-critical',
  RECOVERING: '',
}

interface BaseNodeProps {
  id: string
  data: { label: string; config: NodeConfig }
  icon: React.ReactNode
  accentColor?: string
  typeLabel: string
  showReplicas?: boolean
}

export const BaseNode = memo(({ id, data, icon, accentColor = '#6366f1', typeLabel, showReplicas }: BaseNodeProps) => {
  const nodeState = useSimulationStore((s: SimulationStore) => s.simState.nodes[id])
  const blastRadius = useSimulationStore((s: SimulationStore) => s.blastRadius[id])
  const isBlastActive = useSimulationStore((s: SimulationStore) => s.isBlastRadiusActive)

  const health: NodeHealthState = nodeState?.health ?? 'HEALTHY'
  const ringColor = healthColors[health]
  const isRunning = !!nodeState
  const isFailed = health === 'FAILED'

  const blastColor = blastRadius !== undefined
    ? blastRadius >= 75 ? '#EF4444'
    : blastRadius >= 50 ? '#F97316'
    : blastRadius >= 25 ? '#F59E0B'
    : '#10B981'
    : undefined

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`relative rounded-xl border transition-all duration-300 select-none cursor-pointer ${
        isFailed ? 'opacity-60' : ''
      }`}
      style={{
        background: 'var(--bg-card)',
        border: isBlastActive && blastRadius !== undefined ? `2px solid ${blastColor}` : `1px solid ${ringColor}55`,
        boxShadow: isBlastActive && blastRadius !== undefined
          ? `0 0 8px ${blastColor}40`
          : isRunning
            ? `0 0 0 1px ${ringColor}33, 0 4px 20px ${ringColor}22`
            : '0 2px 8px rgba(0,0,0,0.4)',
        minWidth: 160,
      }}
    >
      <Handle type="target" position={Position.Left}
        style={{ background: accentColor, borderColor: 'var(--bg-panel)', width: 10, height: 10 }} />

      {/* Health dot */}
      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${healthRings[health]}`}
        style={{ background: ringColor, border: '2px solid var(--bg-panel)' }} />

      {/* Blast radius badge */}
      {isBlastActive && blastRadius !== undefined && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap"
          style={{ background: blastColor + '33', color: blastColor, border: `1px solid ${blastColor}` }}>
          {blastRadius}% traffic
        </div>
      )}

      <div className="p-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: accentColor + '22', color: accentColor }}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {data.label}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{typeLabel}</div>
          </div>
        </div>

        {/* Live metrics strip */}
        {isRunning && nodeState && (
          <div className="flex items-center gap-2 mt-1.5 pt-1.5"
            style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-[10px] mono tabular-nums" style={{ color: 'var(--text-secondary)' }}>
              {nodeState.requestsPerSec} rps
            </span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span className="text-[10px] mono tabular-nums"
              style={{ color: nodeState.p99LatencyMs > 500 ? '#f97316' : 'var(--text-secondary)' }}>
              {nodeState.p99LatencyMs}ms
            </span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span className="text-[10px] mono tabular-nums"
              style={{ color: nodeState.errorRatePercent > 10 ? '#ef4444' : 'var(--text-secondary)' }}>
              {nodeState.errorRatePercent.toFixed(1)}%
            </span>
          </div>
        )}

        {/* CPU bar */}
        {isRunning && nodeState && (
          <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, nodeState.cpuPercent)}%`,
                background: nodeState.cpuPercent > 90 ? '#ef4444'
                  : nodeState.cpuPercent > 70 ? '#f97316'
                  : accentColor,
              }} />
          </div>
        )}

        {/* Replica dots */}
        {showReplicas && data.config.replicas && data.config.replicas > 1 && (
          <div className="flex gap-1 mt-2">
            {Array.from({ length: data.config.replicas }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full border"
                style={{
                  background: nodeState && i < nodeState.healthyReplicas
                    ? '#22c55e' : 'transparent',
                  borderColor: nodeState && i < nodeState.healthyReplicas
                    ? '#22c55e' : 'var(--border-bright)',
                }} />
            ))}
          </div>
        )}

        {/* Failed overlay */}
        {isFailed && (
          <div className="absolute inset-0 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.08)' }}>
            <span className="text-xs font-bold" style={{ color: '#ef4444' }}>FAILED</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right}
        style={{ background: accentColor, borderColor: 'var(--bg-panel)', width: 10, height: 10 }} />
    </motion.div>
  )
})
