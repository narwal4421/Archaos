import { useSimulationStore } from '../../stores/simulationStore'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { SimEvent } from '../../types/simulation'
import { useCanvasStore } from '../../stores/canvasStore'

const SeverityIcon = ({ severity }: { severity: SimEvent['severity'] }) => {
  if (severity === 'CRITICAL') return <AlertCircle size={11} style={{ color: '#ef4444', flexShrink: 0 }} />
  if (severity === 'WARNING')  return <AlertTriangle size={11} style={{ color: '#eab308', flexShrink: 0 }} />
  return <Info size={11} style={{ color: '#3b82f6', flexShrink: 0 }} />
}

const severityColor: Record<SimEvent['severity'], string> = {
  CRITICAL: '#ef4444',
  WARNING:  '#eab308',
  INFO:     '#3b82f6',
}

export function EventTimeline() {
  const events = useSimulationStore(s => s.simState.eventLog)
  const setSelectedNodeId = useCanvasStore(s => s.setSelectedNodeId)

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = Math.floor(sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <span className="panel-title">Event Log</span>
        {events.length > 0 && (
          <span className="badge badge-gray" style={{ fontSize: 9 }}>{events.length}</span>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {events.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-xs"
            style={{ color: 'var(--text-muted)' }}>
            Events appear here during simulation
          </div>
        ) : (
          <div style={{ padding: '4px 0' }}>
            {events.map(event => (
              <div
                key={event.id}
                onClick={() => event.nodeId && setSelectedNodeId(event.nodeId)}
                className="flex items-start gap-2 px-3 py-2 cursor-pointer transition-colors duration-100"
                style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = ''}
              >
                <SeverityIcon severity={event.severity} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] leading-snug" style={{ color: severityColor[event.severity] }}>
                    {event.message}
                  </div>
                </div>
                <span className="mono text-[9px] flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}>
                  {formatTime(event.timeSec)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
