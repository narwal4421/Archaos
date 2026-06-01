import { useSimulationStore } from '../../stores/simulationStore'
import { Activity, AlertTriangle, Clock, Server } from 'lucide-react'

export function MetricsPanel() {
  const simState = useSimulationStore(s => s.simState)
  const isRunning = simState.status !== 'IDLE'

  const errColor = simState.totalErrorRatePercent > 25 ? '#ef4444'
    : simState.totalErrorRatePercent > 10 ? '#f97316'
    : simState.totalErrorRatePercent > 2 ? '#eab308'
    : '#22c55e'

  const latColor = simState.systemP99LatencyMs > 2000 ? '#ef4444'
    : simState.systemP99LatencyMs > 500 ? '#f97316'
    : simState.systemP99LatencyMs > 100 ? '#eab308'
    : '#22c55e'

  const metrics = [
    {
      label: 'Total RPS',
      value: isRunning ? simState.totalRps.toLocaleString() : '—',
      icon: <Activity size={13} />,
      color: '#6366f1',
    },
    {
      label: 'Error Rate',
      value: isRunning ? `${simState.totalErrorRatePercent.toFixed(1)}%` : '—',
      icon: <AlertTriangle size={13} />,
      color: errColor,
    },
    {
      label: 'P99 Latency',
      value: isRunning ? `${simState.systemP99LatencyMs}ms` : '—',
      icon: <Clock size={13} />,
      color: latColor,
    },
    {
      label: 'Failed Nodes',
      value: isRunning ? `${simState.failedNodeCount}` : '—',
      icon: <Server size={13} />,
      color: simState.failedNodeCount > 0 ? '#ef4444' : '#22c55e',
    },
  ]

  return (
    <div>
      <div className="panel-header">
        <span className="panel-title">System Metrics</span>
        {simState.status === 'RUNNING' && (
          <span className="badge badge-green" style={{ fontSize: 9 }}>● LIVE</span>
        )}
        {simState.status === 'PAUSED' && (
          <span className="badge badge-yellow" style={{ fontSize: 9 }}>⏸ PAUSED</span>
        )}
      </div>
      <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {metrics.map(m => (
          <div key={m.label} className="metric-card">
            <div className="flex items-center gap-1 mb-1" style={{ color: m.color }}>
              {m.icon}
              <span className="metric-label" style={{ fontSize: 9 }}>{m.label}</span>
            </div>
            <div className="metric-value" style={{ fontSize: 18, color: m.color }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
