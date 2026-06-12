import { useState, useEffect, useRef } from 'react'
import { useSimulationStore } from '../../stores/simulationStore'
import { RefreshCw, TrendingUp, AlertTriangle, Activity, Zap } from 'lucide-react'

// ── Mini sparkline chart ──────────────────────────────────────────────────────
function Sparkline({
  data,
  color,
  height = 32,
  fillOpacity = 0.12,
}: {
  data: number[]
  color: string
  height?: number
  fillOpacity?: number
}) {
  const W = 240
  const H = height
  if (data.length < 2) return (
    <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 9, color: '#2A3140', fontFamily: 'monospace' }}>—</span>
    </div>
  )

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 4) - 2
    return `${x.toFixed(1)},${Math.max(2, y).toFixed(1)}`
  })
  const d = `M ${pts.join(' L ')}`
  const fill = `${d} L ${W},${H} L 0,${H} Z`
  const id = `sg-${color.replace('#', '')}`

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity * 6} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Current value dot */}
      {(() => {
        const last = data[data.length - 1]
        const x = W
        const y = H - ((last - min) / range) * (H - 4) - 2
        return <circle cx={x} cy={Math.max(2, y)} r="2.5" fill={color} />
      })()}
    </svg>
  )
}

// ── Health badge ──────────────────────────────────────────────────────────────
const HEALTH_COLOR: Record<string, string> = {
  HEALTHY: '#10B981',
  DEGRADED: '#F59E0B',
  UNHEALTHY: '#F97316',
  FAILED: '#EF4444',
  RECOVERING: '#7C3AED',
}

// ── Main metrics panel ────────────────────────────────────────────────────────
export function MetricsPanel() {
  const simState = useSimulationStore(s => s.simState)
  const isRunning = simState.status !== 'IDLE'
  const totalNodes = Object.keys(simState.nodes).length

  // Rolling histories (60 ticks each)
  const [rpsHistory, setRpsHistory] = useState<number[]>([])
  const [errHistory, setErrHistory] = useState<number[]>([])
  const [p99History, setP99History] = useState<number[]>([])
  const prevTimeSec = useRef(simState.currentTimeSec)

  useEffect(() => {
    if (simState.status === 'IDLE') {
      prevTimeSec.current = 0
      return
    }
    // Only push once per new second tick
    if (simState.currentTimeSec === prevTimeSec.current) return

    // Clear and start fresh if transitioning from IDLE
    if (prevTimeSec.current === 0) {
      setRpsHistory([simState.totalRps])
      setErrHistory([simState.totalErrorRatePercent])
      setP99History([simState.systemP99LatencyMs])
      prevTimeSec.current = simState.currentTimeSec
      return
    }

    prevTimeSec.current = simState.currentTimeSec

    setRpsHistory(h => { const n = [...h, simState.totalRps]; if (n.length > 60) n.shift(); return n })
    setErrHistory(h => { const n = [...h, simState.totalErrorRatePercent]; if (n.length > 60) n.shift(); return n })
    setP99History(h => { const n = [...h, simState.systemP99LatencyMs]; if (n.length > 60) n.shift(); return n })
  }, [simState.currentTimeSec, simState.status, simState.totalRps, simState.totalErrorRatePercent, simState.systemP99LatencyMs])

  const handleReset = () => {
    setRpsHistory([])
    setErrHistory([])
    setP99History([])
  }

  const nodeList = Object.values(simState.nodes).sort((a, b) => {
    // Failed first, then by CPU descending
    if (a.health === 'FAILED' && b.health !== 'FAILED') return -1
    if (b.health === 'FAILED' && a.health !== 'FAILED') return 1
    return b.cpuPercent - a.cpuPercent
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 0, fontFamily: "'DM Sans', sans-serif", overflowY: 'auto' }}>

      {/* ── System summary strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
        {/* Total RPS */}
        <div style={{ background: '#0A0D14', border: '1px solid #111820', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <Activity size={9} color="#7C3AED" />
            <span style={{ fontSize: 8, color: '#3A4455', fontFamily: 'monospace', letterSpacing: 1 }}>RPS</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#E8EDF3', fontFamily: 'monospace', lineHeight: 1 }}>
            {isRunning ? simState.totalRps.toLocaleString() : '—'}
          </div>
        </div>
        {/* Error rate */}
        <div style={{ background: '#0A0D14', border: `1px solid ${isRunning && simState.totalErrorRatePercent > 10 ? '#EF444430' : '#111820'}`, borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <AlertTriangle size={9} color={isRunning && simState.totalErrorRatePercent > 10 ? '#EF4444' : '#F59E0B'} />
            <span style={{ fontSize: 8, color: '#3A4455', fontFamily: 'monospace', letterSpacing: 1 }}>ERR%</span>
          </div>
          <div style={{
            fontSize: 18, fontWeight: 700,
            color: isRunning && simState.totalErrorRatePercent > 10 ? '#EF4444' : '#E8EDF3',
            fontFamily: 'monospace', lineHeight: 1,
          }}>
            {isRunning ? `${simState.totalErrorRatePercent.toFixed(1)}` : '—'}
          </div>
        </div>
        {/* P99 */}
        <div style={{ background: '#0A0D14', border: `1px solid ${isRunning && simState.systemP99LatencyMs > 500 ? '#F9731630' : '#111820'}`, borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <TrendingUp size={9} color={isRunning && simState.systemP99LatencyMs > 500 ? '#F97316' : '#10B981'} />
            <span style={{ fontSize: 8, color: '#3A4455', fontFamily: 'monospace', letterSpacing: 1 }}>P99</span>
          </div>
          <div style={{
            fontSize: 18, fontWeight: 700,
            color: isRunning && simState.systemP99LatencyMs > 500 ? '#F97316' : '#E8EDF3',
            fontFamily: 'monospace', lineHeight: 1,
          }}>
            {isRunning ? `${simState.systemP99LatencyMs}` : '—'}
          </div>
        </div>
      </div>

      {/* ── Failed nodes row ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: simState.failedNodeCount > 0 ? 'rgba(239,68,68,0.06)' : '#0A0D14',
        border: `1px solid ${simState.failedNodeCount > 0 ? 'rgba(239,68,68,0.2)' : '#111820'}`,
        borderRadius: 8, padding: '6px 10px', marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={10} color={simState.failedNodeCount > 0 ? '#EF4444' : '#3A4455'} />
          <span style={{ fontSize: 10, color: '#4A5568' }}>Failed Nodes</span>
        </div>
        <span style={{
          fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
          color: simState.failedNodeCount > 0 ? '#EF4444' : '#10B981',
        }}>
          {simState.failedNodeCount} / {totalNodes || '—'}
        </span>
      </div>

      {/* ── Multi-sparkline section ── */}
      <div style={{ marginBottom: 10 }}>
        {/* RPS chart */}
        <div style={{ background: '#080B10', border: '1px solid #0D1018', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 8, color: '#2A3140', fontFamily: 'monospace', letterSpacing: 1.5 }}>THROUGHPUT (RPS)</span>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#7C3AED', fontWeight: 700 }}>
              {isRunning && rpsHistory.length > 0 ? rpsHistory[rpsHistory.length - 1].toLocaleString() : '—'}
            </span>
          </div>
          <Sparkline data={isRunning ? rpsHistory : []} color="#7C3AED" height={30} />
        </div>

        {/* Error rate chart */}
        <div style={{ background: '#080B10', border: '1px solid #0D1018', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 8, color: '#2A3140', fontFamily: 'monospace', letterSpacing: 1.5 }}>ERROR RATE (%)</span>
            <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
              color: isRunning && simState.totalErrorRatePercent > 10 ? '#EF4444' : '#4A5568' }}>
              {isRunning && errHistory.length > 0 ? `${errHistory[errHistory.length - 1].toFixed(1)}%` : '—'}
            </span>
          </div>
          <Sparkline data={isRunning ? errHistory : []} color="#EF4444" height={30} />
        </div>

        {/* P99 chart */}
        <div style={{ background: '#080B10', border: '1px solid #0D1018', borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 8, color: '#2A3140', fontFamily: 'monospace', letterSpacing: 1.5 }}>P99 LATENCY (ms)</span>
            <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
              color: isRunning && simState.systemP99LatencyMs > 500 ? '#F97316' : '#4A5568' }}>
              {isRunning && p99History.length > 0 ? `${p99History[p99History.length - 1]}ms` : '—'}
            </span>
          </div>
          <Sparkline data={isRunning ? p99History : []} color="#F97316" height={30} />
        </div>
      </div>

      {/* ── Per-node breakdown table ── */}
      {isRunning && nodeList.length > 0 && (
        <div style={{ background: '#080B10', border: '1px solid #0D1018', borderRadius: 8, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 40px 40px 40px 36px',
            gap: 4, padding: '5px 10px',
            borderBottom: '1px solid #0D1018',
            background: '#060810',
          }}>
            {['NODE', 'RPS', 'CPU', 'MEM', 'ERR'].map(h => (
              <span key={h} style={{ fontSize: 7, color: '#2A3140', fontFamily: 'monospace', letterSpacing: 1.5 }}>{h}</span>
            ))}
          </div>

          {/* Table rows */}
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {nodeList.map(node => {
              const hc = HEALTH_COLOR[node.health] ?? '#4A5568'
              return (
                <div
                  key={node.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 40px 40px 40px 36px',
                    gap: 4, padding: '5px 10px',
                    borderBottom: '1px solid #0A0D12',
                    background: node.health === 'FAILED' ? 'rgba(239,68,68,0.04)' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                >
                  {/* Node name + health dot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: hc, flexShrink: 0,
                      boxShadow: `0 0 4px ${hc}80`,
                    }} />
                    <span style={{
                      fontSize: 9, color: node.health === 'FAILED' ? '#EF4444' : '#8B95A3',
                      fontFamily: 'monospace',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {node.id}
                    </span>
                  </div>
                  {/* RPS */}
                  <span style={{ fontSize: 9, color: '#6B7A90', fontFamily: 'monospace', textAlign: 'right' }}>
                    {node.health === 'FAILED' ? <span style={{ color: '#EF4444' }}>✗</span> : node.requestsPerSec}
                  </span>
                  {/* CPU bar + % */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
                    <span style={{ fontSize: 8, color: node.cpuPercent > 80 ? '#F97316' : '#6B7A90', fontFamily: 'monospace', textAlign: 'right' }}>
                      {node.health === 'FAILED' ? '—' : `${Math.round(node.cpuPercent)}%`}
                    </span>
                    {node.health !== 'FAILED' && (
                      <div style={{ height: 2, background: '#111820', borderRadius: 1, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 1,
                          width: `${node.cpuPercent}%`,
                          background: node.cpuPercent > 90 ? '#EF4444' : node.cpuPercent > 75 ? '#F97316' : '#7C3AED',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    )}
                  </div>
                  {/* Memory */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
                    <span style={{ fontSize: 8, color: node.memoryPercent > 85 ? '#EF4444' : '#6B7A90', fontFamily: 'monospace', textAlign: 'right' }}>
                      {node.health === 'FAILED' ? '—' : `${Math.round(node.memoryPercent)}%`}
                    </span>
                    {node.health !== 'FAILED' && (
                      <div style={{ height: 2, background: '#111820', borderRadius: 1, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 1,
                          width: `${node.memoryPercent}%`,
                          background: node.memoryPercent > 85 ? '#EF4444' : node.memoryPercent > 70 ? '#F59E0B' : '#06B6D4',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    )}
                  </div>
                  {/* Error rate */}
                  <span style={{
                    fontSize: 9, fontFamily: 'monospace', textAlign: 'right',
                    color: node.errorRatePercent > 10 ? '#EF4444' : node.errorRatePercent > 2 ? '#F59E0B' : '#3A5040',
                  }}>
                    {node.health === 'FAILED' ? '100%' : `${node.errorRatePercent.toFixed(0)}%`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!isRunning && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#2A3140', fontSize: 10, fontFamily: 'monospace', letterSpacing: 1,
          textAlign: 'center', padding: 20,
        }}>
          START SIMULATION<br />TO SEE TELEMETRY
        </div>
      )}

      {/* Reset button */}
      {rpsHistory.length > 0 && (
        <div style={{ paddingTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleReset}
            style={{
              background: 'none', border: 'none',
              color: '#2A3140', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 9, fontFamily: 'monospace',
              padding: '3px 6px', borderRadius: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#8B95A3')}
            onMouseLeave={e => (e.currentTarget.style.color = '#2A3140')}
            title="Reset history"
          >
            <RefreshCw size={10} /> RESET HISTORY
          </button>
        </div>
      )}
    </div>
  )
}
