import { useState, useEffect } from 'react'
import { useSimulationStore } from '../../stores/simulationStore'
import { RefreshCw } from 'lucide-react'

export function MetricsPanel() {
  const simState = useSimulationStore(s => s.simState)
  const isRunning = simState.status !== 'IDLE'

  // Maintain a rolling history of the last 60 seconds of total RPS
  const [history, setHistory] = useState<number[]>([])

  useEffect(() => {
    if (simState.status === 'IDLE') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHistory(prev => (prev.length === 0 ? prev : []))
      return
    }
    if (simState.status === 'RUNNING') {
      setHistory(prev => {
        const next = [...prev, simState.totalRps]
        if (next.length > 60) next.shift()
        return next
      })
    }
  }, [simState.currentTimeSec, simState.status, simState.totalRps])

  const handleResetHistory = () => {
    setHistory([])
  }

  // Draw the SVG sparkline path
  const width = 260
  const height = 50
  let pathD = ''
  if (history.length > 1) {
    const maxVal = Math.max(...history, 10)
    const minVal = Math.min(...history, 0)
    const valRange = maxVal - minVal || 1
    const points = history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * width
      const y = height - ((val - minVal) / valRange) * height - 2 // small buffer
      return `${x},${Math.max(2, Math.min(height - 2, y))}`
    })
    pathD = `M ${points.join(' L ')}`
  }

  return (
    <div className="h-full flex flex-col justify-between font-['Inter']">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]">
        <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#444444]">
          System Metrics
        </span>
        <button
          onClick={handleResetHistory}
          className="text-[#888888] hover:text-white p-1 rounded hover:bg-[#111111] transition-colors"
          title="Reset metrics history"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div>
          <div className="text-[20px] font-bold font-mono tracking-tight text-white">
            {isRunning ? simState.totalRps.toLocaleString() : '—'}
          </div>
          <div className="text-[9px] text-[#888888] uppercase tracking-[0.05em] mt-0.5">
            Total RPS
          </div>
        </div>
        <div>
          <div className={`text-[20px] font-bold font-mono tracking-tight ${
            simState.totalErrorRatePercent > 10 ? 'text-[#EF4444]' : 'text-white'
          }`}>
            {isRunning ? `${simState.totalErrorRatePercent.toFixed(1)}%` : '—'}
          </div>
          <div className="text-[9px] text-[#888888] uppercase tracking-[0.05em] mt-0.5">
            Error Rate
          </div>
        </div>
        <div>
          <div className={`text-[20px] font-bold font-mono tracking-tight ${
            simState.systemP99LatencyMs > 500 ? 'text-[#F97316]' : 'text-white'
          }`}>
            {isRunning ? `${simState.systemP99LatencyMs}ms` : '—'}
          </div>
          <div className="text-[9px] text-[#888888] uppercase tracking-[0.05em] mt-0.5">
            P99 Latency
          </div>
        </div>
      </div>

      {/* Failed node count */}
      <div className="mt-4 text-[12px] text-[#888888] flex items-center justify-between">
        <span>Failed Nodes</span>
        <span className={`font-bold font-mono ${simState.failedNodeCount > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
          {simState.failedNodeCount} / {Object.keys(simState.nodes).length || 8}
        </span>
      </div>

      {/* Sparkline Graph */}
      <div className="mt-4 bg-[#050505] border border-[#1A1A1A] rounded-lg p-2 h-16 flex items-center justify-center relative">
        {history.length > 1 ? (
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
            <path
              d={pathD}
              fill="none"
              stroke="#7C3AED"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Soft gradient fill under sparkline */}
            <path
              d={`${pathD} L ${width},${height} L 0,${height} Z`}
              fill="url(#sparkline-grad)"
              opacity="0.15"
            />
            <defs>
              <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        ) : (
          <span className="text-[10px] text-[#444444] font-mono">
            {isRunning ? 'Gathering telemetry...' : 'Simulation idle'}
          </span>
        )}
      </div>
    </div>
  )
}
