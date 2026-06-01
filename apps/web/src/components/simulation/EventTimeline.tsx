import { useSimulationStore } from '../../stores/simulationStore'
import type { SimEvent } from '../../types/simulation'
import { useCanvasStore } from '../../stores/canvasStore'

const SeverityDot = ({ severity }: { severity: SimEvent['severity'] }) => {
  const colors: Record<SimEvent['severity'], string> = {
    CRITICAL: '#EF4444',
    WARNING: '#F59E0B',
    INFO: '#3B82F6',
  }
  const color = colors[severity]
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
      style={{ background: color, boxShadow: `0 0 4px ${color}60` }}
    />
  )
}

const severityTextColor: Record<SimEvent['severity'], string> = {
  CRITICAL: '#EF4444',
  WARNING:  '#F59E0B',
  INFO:     '#3B82F6',
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
    <div className="h-full flex flex-col font-['Inter']">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]">
        <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#444444]">
          Event Timeline
        </span>
        {events.length > 0 && (
          <span className="text-[9px] font-bold text-[#888888] bg-[#111111] border border-[#222222] px-2 py-0.5 rounded font-mono">
            {events.length}
          </span>
        )}
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto mt-2">
        {events.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[11px] text-[#444444] font-mono text-center">
            Events appear here during simulation
          </div>
        ) : (
          <div>
            {events.map(event => (
              <button
                key={event.id}
                onClick={() => event.nodeId && setSelectedNodeId(event.nodeId)}
                className="w-full text-left flex items-start gap-2.5 px-2 py-2 rounded-lg cursor-pointer transition-colors duration-100 hover:bg-[#111111] group"
              >
                <SeverityDot severity={event.severity} />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[11px] leading-snug font-['JetBrains_Mono',monospace] group-hover:text-white transition-colors"
                    style={{ color: severityTextColor[event.severity] }}
                  >
                    {event.message}
                  </div>
                </div>
                <span className="font-['JetBrains_Mono',monospace] text-[9px] text-[#444444] flex-shrink-0 pt-0.5">
                  {formatTime(event.timeSec)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
