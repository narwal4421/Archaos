import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useSimulationStore } from '../../../stores/simulationStore'
import type { SimulationStore } from '../../../stores/simulationStore'
import type { NodeHealthState } from '../../../types/simulation'
import type { NodeConfig } from '../../../types/topology'

const HEALTH_GLOW: Record<NodeHealthState, string> = {
  HEALTHY:    '0 0 12px rgba(16,185,129,0.4)',
  DEGRADED:   '0 0 12px rgba(245,158,11,0.4)',
  UNHEALTHY:  '0 0 16px rgba(249,115,22,0.6)',
  FAILED:     '0 0 20px rgba(239,68,68,0.8)',
  RECOVERING: '0 0 12px rgba(124,58,237,0.4)',
}

const HEALTH_BORDER: Record<NodeHealthState, string> = {
  HEALTHY:    '#10B981',
  DEGRADED:   '#F59E0B',
  UNHEALTHY:  '#F97316',
  FAILED:     '#EF4444',
  RECOVERING: '#7C3AED',
}

const HEALTH_DOT: Record<NodeHealthState, string> = {
  HEALTHY:    '#10B981',
  DEGRADED:   '#F59E0B',
  UNHEALTHY:  '#F97316',
  FAILED:     '#EF4444',
  RECOVERING: '#7C3AED',
}

interface BaseNodeProps {
  id: string
  data: { label: string; config: NodeConfig }
  icon: React.ReactNode
  accentColor?: string
  typeLabel: string
  showReplicas?: boolean
}

export const BaseNode = memo(({
  id,
  data,
  icon,
  accentColor = '#7C3AED',
  typeLabel,
  showReplicas,
}: BaseNodeProps) => {
  const nodeState = useSimulationStore((s: SimulationStore) => s.simState.nodes[id])
  const blastRadius = useSimulationStore((s: SimulationStore) => s.blastRadius[id])
  const isBlastActive = useSimulationStore((s: SimulationStore) => s.isBlastRadiusActive)

  const health: NodeHealthState = nodeState?.health ?? 'HEALTHY'
  const isRunning = !!nodeState
  const isFailed = health === 'FAILED'
  const isUnhealthy = health === 'UNHEALTHY'

  const blastColor = blastRadius !== undefined
    ? blastRadius >= 75 ? '#EF4444'
    : blastRadius >= 50 ? '#F97316'
    : blastRadius >= 25 ? '#F59E0B'
    : '#10B981'
    : undefined

  const borderColor = isBlastActive && blastRadius !== undefined
    ? blastColor!
    : isRunning
    ? HEALTH_BORDER[health]
    : '#222222'

  const shadowValue = isBlastActive && blastRadius !== undefined
    ? `0 0 8px ${blastColor}60`
    : isRunning
    ? HEALTH_GLOW[health]
    : '0 2px 8px rgba(0,0,0,0.6)'

  const animClass = isUnhealthy ? 'animate-pulse-warn' : ''

  return (
    <div
      className={`relative rounded-xl select-none cursor-pointer transition-all duration-500 ${animClass} ${isFailed ? 'grayscale-[50%]' : ''}`}
      style={{
        width: 200,
        background: '#0A0A0A',
        border: `1px solid ${borderColor}`,
        boxShadow: shadowValue,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Source/Target handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: accentColor, borderColor: '#0A0A0A', width: 10, height: 10 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: accentColor, borderColor: '#0A0A0A', width: 10, height: 10 }}
      />

      {/* Health dot (top-right) */}
      <div
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
        style={{
          background: HEALTH_DOT[health],
          border: '2px solid #0A0A0A',
          boxShadow: isRunning ? `0 0 6px ${HEALTH_DOT[health]}80` : 'none',
        }}
      />

      {/* Blast radius badge */}
      {isBlastActive && blastRadius !== undefined && (
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap"
          style={{ background: `${blastColor}22`, color: blastColor, border: `1px solid ${blastColor}` }}
        >
          {blastRadius}% traffic
        </div>
      )}

      <div style={{ padding: '10px 12px' }}>
        {/* Header Row: Icon + Label + Health dot */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${accentColor}20`, color: accentColor }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-xs font-semibold truncate"
              style={{ color: '#FFFFFF', fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {data.label}
            </div>
            <div className="text-[10px]" style={{ color: '#444444' }}>
              {typeLabel}
            </div>
          </div>
        </div>

        {/* Divider — only when running */}
        {isRunning && (
          <div style={{ borderTop: '1px solid #1A1A1A', marginBottom: 6 }} />
        )}

        {/* Replica dots — SERVICE nodes only, during simulation */}
        {isRunning && showReplicas && data.config.replicas && data.config.replicas > 1 && (
          <div className="flex gap-1 mb-2">
            {Array.from({ length: data.config.replicas }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full border transition-all duration-300"
                style={{
                  background: nodeState && i < nodeState.healthyReplicas ? '#10B981' : 'transparent',
                  borderColor: nodeState && i < nodeState.healthyReplicas ? '#10B981' : '#333333',
                }}
              />
            ))}
          </div>
        )}

        {/* Live metrics strip */}
        {isRunning && nodeState && (
          <div
            className="flex items-center gap-1.5 text-[10px] mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <span style={{ color: '#888888' }}>{nodeState.requestsPerSec}rps</span>
            <span style={{ color: '#333333' }}>·</span>
            <span style={{ color: nodeState.p99LatencyMs > 500 ? '#F97316' : '#888888' }}>
              {nodeState.p99LatencyMs}ms
            </span>
            <span style={{ color: '#333333' }}>·</span>
            <span style={{ color: nodeState.errorRatePercent > 10 ? '#EF4444' : '#888888' }}>
              {nodeState.errorRatePercent.toFixed(1)}%
            </span>
          </div>
        )}

        {/* CPU bar */}
        {isRunning && nodeState && (
          <div>
            <div className="flex justify-between text-[9px] mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#444444' }}>
              <span>CPU</span>
              <span>{Math.round(nodeState.cpuPercent)}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1A1A1A' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, nodeState.cpuPercent)}%`,
                  background: nodeState.cpuPercent > 90 ? '#EF4444'
                    : nodeState.cpuPercent > 70 ? '#F97316'
                    : accentColor,
                }}
              />
            </div>
          </div>
        )}

        {/* Failed overlay */}
        {isFailed && (
          <div
            className="absolute inset-0 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.07)', pointerEvents: 'none' }}
          >
            <span className="text-[11px] font-bold tracking-widest" style={{ color: '#EF4444' }}>
              FAILED
            </span>
          </div>
        )}
      </div>
    </div>
  )
})

BaseNode.displayName = 'BaseNode'
