import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useSimulationStore } from '../../../stores/simulationStore'
import type { SimulationStore } from '../../../stores/simulationStore'
import type { NodeHealthState } from '../../../types/simulation'
import type { NodeConfig } from '../../../types/topology'

const HEALTH_GLOW: Record<NodeHealthState, string> = {
  HEALTHY:    '0 0 10px rgba(16,185,129,0.35)',
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

// Small 2-px bar
function MiniBar({ value, color, bg = '#1A1A1A' }: { value: number; color: string; bg?: string }) {
  return (
    <div style={{ height: 2, background: bg, borderRadius: 1, overflow: 'hidden', flex: 1 }}>
      <div style={{
        height: '100%', borderRadius: 1,
        width: `${Math.min(100, Math.max(0, value))}%`,
        background: color, transition: 'width 0.4s ease',
      }} />
    </div>
  )
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
    : '#1C2030'

  const shadowValue = isBlastActive && blastRadius !== undefined
    ? `0 0 8px ${blastColor}60`
    : isRunning
    ? HEALTH_GLOW[health]
    : '0 2px 8px rgba(0,0,0,0.5)'

  const animClass = isUnhealthy ? 'animate-pulse-warn' : ''

  // CPU color
  const cpuColor = (nodeState?.cpuPercent ?? 0) > 90 ? '#EF4444'
    : (nodeState?.cpuPercent ?? 0) > 75 ? '#F97316'
    : accentColor

  // Memory color
  const memColor = (nodeState?.memoryPercent ?? 0) > 85 ? '#EF4444'
    : (nodeState?.memoryPercent ?? 0) > 70 ? '#F59E0B'
    : '#06B6D4'

  // Queue color
  const maxQueue = data.config.maxQueueDepth ?? 500
  const queueFill = nodeState ? (nodeState.queueDepth / maxQueue) * 100 : 0
  const queueColor = queueFill > 90 ? '#EF4444' : queueFill > 60 ? '#F97316' : '#F59E0B'

  const showQueue = data.config.type === 'SERVICE' || data.config.type === 'MESSAGE_QUEUE' || data.config.type === 'DATABASE'
  const showConnections = data.config.type === 'DATABASE'
  const poolSize = data.config.connectionPoolSize ?? 20
  const connFill = nodeState ? (nodeState.activeConnections / poolSize) * 100 : 0

  return (
    <div
      className={`relative rounded-xl select-none cursor-pointer transition-all duration-500 ${animClass} ${isFailed ? 'grayscale-[40%]' : ''}`}
      style={{
        width: 200,
        background: '#09090F',
        border: `1px solid ${borderColor}`,
        boxShadow: shadowValue,
        fontFamily: "'Inter', sans-serif",
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}
    >
      {/* Source/Target handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: accentColor, borderColor: '#09090F', width: 10, height: 10 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: accentColor, borderColor: '#09090F', width: 10, height: 10 }}
      />

      {/* Health dot (top-right) */}
      <div
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
        style={{
          background: HEALTH_DOT[health],
          border: '2px solid #09090F',
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

      {/* Saturation badge — shows when overloaded */}
      {isRunning && !isFailed && nodeState && nodeState.saturationPercent > 75 && (
        <div
          className="absolute -top-5 right-3 px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap"
          style={{
            background: nodeState.saturationPercent > 90 ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.12)',
            color: nodeState.saturationPercent > 90 ? '#EF4444' : '#F97316',
            border: `1px solid ${nodeState.saturationPercent > 90 ? '#EF444440' : '#F9731630'}`,
          }}
        >
          {Math.round(nodeState.saturationPercent)}% SAT
        </div>
      )}

      <div style={{ padding: '10px 12px' }}>
        {/* Header Row */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${accentColor}18`, color: accentColor }}
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
            <div className="text-[10px]" style={{ color: '#3A4455' }}>
              {typeLabel}
            </div>
          </div>
        </div>

        {/* Divider */}
        {isRunning && (
          <div style={{ borderTop: '1px solid #141820', marginBottom: 7 }} />
        )}

        {/* Replica dots */}
        {isRunning && showReplicas && data.config.replicas && data.config.replicas > 1 && (
          <div className="flex gap-1 mb-2">
            {Array.from({ length: data.config.replicas }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full border transition-all duration-300"
                style={{
                  background: nodeState && i < nodeState.healthyReplicas ? '#10B981' : 'transparent',
                  borderColor: nodeState && i < nodeState.healthyReplicas ? '#10B981' : '#2A3140',
                }}
              />
            ))}
          </div>
        )}

        {/* Live metrics strip */}
        {isRunning && nodeState && !isFailed && (
          <div
            className="flex items-center gap-1.5 text-[10px] mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <span style={{ color: '#6B7A90' }}>{nodeState.requestsPerSec}<span style={{ color: '#2A3140', fontSize: 8 }}>rps</span></span>
            <span style={{ color: '#1C2030' }}>·</span>
            <span style={{ color: nodeState.p99LatencyMs > 500 ? '#F97316' : '#6B7A90' }}>
              {nodeState.p99LatencyMs}<span style={{ color: '#2A3140', fontSize: 8 }}>ms</span>
            </span>
            <span style={{ color: '#1C2030' }}>·</span>
            <span style={{ color: nodeState.errorRatePercent > 10 ? '#EF4444' : '#6B7A90' }}>
              {nodeState.errorRatePercent.toFixed(1)}<span style={{ color: '#2A3140', fontSize: 8 }}>%</span>
            </span>
            {nodeState.droppedRps > 0 && (
              <>
                <span style={{ color: '#1C2030' }}>·</span>
                <span style={{ color: '#EF4444', fontWeight: 700 }}>
                  ↓{nodeState.droppedRps}<span style={{ fontSize: 8 }}>shed</span>
                </span>
              </>
            )}
          </div>
        )}

        {/* CPU bar */}
        {isRunning && nodeState && !isFailed && (
          <div style={{ marginBottom: 4 }}>
            <div className="flex justify-between text-[8px] mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#2A3140' }}>
              <span>CPU</span>
              <span style={{ color: (nodeState.cpuPercent ?? 0) > 80 ? '#F97316' : '#3A4455' }}>
                {Math.round(nodeState.cpuPercent)}%
              </span>
            </div>
            <MiniBar value={nodeState.cpuPercent} color={cpuColor} />
          </div>
        )}

        {/* Memory bar */}
        {isRunning && nodeState && !isFailed && (
          <div style={{ marginBottom: 4 }}>
            <div className="flex justify-between text-[8px] mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#2A3140' }}>
              <span>MEM</span>
              <span style={{ color: (nodeState.memoryPercent ?? 0) > 80 ? '#F59E0B' : '#3A4455' }}>
                {Math.round(nodeState.memoryPercent)}%
              </span>
            </div>
            <MiniBar value={nodeState.memoryPercent} color={memColor} />
          </div>
        )}

        {/* Queue depth — for SERVICE/QUEUE/DB nodes */}
        {isRunning && nodeState && !isFailed && showQueue && nodeState.queueDepth > 0 && (
          <div style={{ marginBottom: 4 }}>
            <div className="flex justify-between text-[8px] mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#2A3140' }}>
              <span>QUEUE</span>
              <span style={{ color: queueFill > 60 ? '#F97316' : '#3A4455' }}>
                {Math.round(nodeState.queueDepth)}/{maxQueue}
              </span>
            </div>
            <MiniBar value={queueFill} color={queueColor} />
          </div>
        )}

        {/* Active connections — DATABASE nodes */}
        {isRunning && nodeState && !isFailed && showConnections && (
          <div style={{ marginBottom: 2 }}>
            <div className="flex justify-between text-[8px] mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#2A3140' }}>
              <span>CONN</span>
              <span style={{ color: connFill > 80 ? '#EF4444' : '#3A4455' }}>
                {nodeState.activeConnections}/{poolSize}
              </span>
            </div>
            <MiniBar value={connFill} color={connFill > 80 ? '#EF4444' : '#06B6D4'} />
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
