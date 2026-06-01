import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, RotateCcw, Skull, Scissors, Timer, TrendingUp
} from 'lucide-react'
import { useSimulationStore } from '../../stores/simulationStore'
import { useCanvasStore } from '../../stores/canvasStore'
import { useSimulation } from '../../hooks/useSimulation'
import type { TrafficProfile } from '../../types/simulation'

const SPEEDS = [1, 2, 5, 10]
const PATTERNS = ['CONSTANT', 'SINUSOIDAL', 'SPIKE', 'RAMP'] as const

export function SimControls() {
  const { start, pause, resume, reset, setSpeed, injectChaos } = useSimulation()
  const simState = useSimulationStore(s => s.simState)

  const setTrafficProfile = useSimulationStore(s => s.setTrafficProfile)
  const nodes = useCanvasStore(s => s.nodes)

  const [rps, setRps] = useState(100)
  const [pattern, setPattern] = useState<TrafficProfile['pattern']>('CONSTANT')
  const [speed, setSpeedState] = useState(1)

  const status = simState.status
  const isRunning = status === 'RUNNING'
  const isPaused = status === 'PAUSED'
  const isIdle = status === 'IDLE'

  const handleStart = () => {
    const profile: TrafficProfile = { baseRps: rps, pattern }
    setTrafficProfile(profile)
    start(profile)
  }

  const handleSpeed = (s: number) => {
    setSpeedState(s)
    setSpeed(s)
  }

  const randomNodeId = () => {
    const serviceNodes = nodes.filter(n => n.type === 'service')
    if (!serviceNodes.length) return nodes[0]?.id
    return serviceNodes[Math.floor(Math.random() * serviceNodes.length)].id
  }

  const randomEdgeId = () => {
    const edges = useCanvasStore.getState().edges
    if (!edges.length) return null
    return edges[Math.floor(Math.random() * edges.length)].id
  }

  return (
    <div>
      <div className="panel-header">
        <span className="panel-title">Simulation</span>
        {!isIdle && (
          <span className="mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
            T+{simState.currentTimeSec}s
          </span>
        )}
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Traffic RPS */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Base Traffic</label>
            <span className="mono text-xs font-bold" style={{ color: 'var(--accent-bright)' }}>{rps} RPS</span>
          </div>
          <input
            type="range" min={10} max={5000} step={10} value={rps}
            onChange={e => setRps(Number(e.target.value))}
            disabled={isRunning}
            className="w-full"
            style={{ accentColor: 'var(--accent)' }}
          />
        </div>

        {/* Pattern */}
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Pattern</label>
          <div className="grid grid-cols-2 gap-1">
            {PATTERNS.map(p => (
              <button
                key={p}
                onClick={() => setPattern(p)}
                disabled={isRunning}
                className="btn btn-sm"
                style={{
                  background: pattern === p ? 'var(--accent)' : 'var(--bg-card)',
                  color: pattern === p ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${pattern === p ? 'var(--accent)' : 'var(--border)'}`,
                  fontSize: 10,
                }}
              >
                {p.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Speed</label>
          <div className="flex gap-1">
            {SPEEDS.map(s => (
              <button
                key={s}
                onClick={() => handleSpeed(s)}
                disabled={isIdle}
                className="btn btn-sm flex-1"
                style={{
                  background: speed === s ? 'var(--accent)22' : 'var(--bg-card)',
                  color: speed === s ? 'var(--accent-bright)' : 'var(--text-muted)',
                  border: `1px solid ${speed === s ? 'var(--accent)' : 'var(--border)'}`,
                  fontSize: 11,
                }}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Play / Pause / Reset */}
        <div className="flex gap-2">
          {isIdle && (
            <button onClick={handleStart} className="btn btn-primary flex-1"
              disabled={nodes.length === 0}>
              <Play size={14} /> Simulate
            </button>
          )}
          {isRunning && (
            <button onClick={pause} className="btn btn-ghost flex-1">
              <Pause size={14} /> Pause
            </button>
          )}
          {isPaused && (
            <button onClick={resume} className="btn btn-success flex-1">
              <Play size={14} /> Resume
            </button>
          )}
          {!isIdle && (
            <button onClick={reset} className="btn btn-ghost btn-icon" title="Reset">
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        {/* Chaos Quick-Inject */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="mt-1 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="panel-title mb-2">Quick Chaos</div>
                <div className="grid grid-cols-1 gap-1.5">
                  <button onClick={() => { const id = randomNodeId(); if (id) injectChaos({ type: 'KILL_NODE', targetId: id }) }}
                    className="btn btn-danger btn-sm w-full">
                    <Skull size={12} /> Kill Random Service
                  </button>
                  <button onClick={() => injectChaos({ type: 'TRAFFIC_SPIKE', targetId: nodes[0]?.id || '', value: 10 })}
                    className="btn btn-sm w-full"
                    style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid #f97316' }}>
                    <TrendingUp size={12} /> Spike Traffic 10×
                  </button>
                  <button onClick={() => { const id = randomEdgeId(); if (id) injectChaos({ type: 'NETWORK_PARTITION', targetId: id }) }}
                    className="btn btn-sm w-full"
                    style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308', border: '1px solid #eab308' }}>
                    <Scissors size={12} /> Partition Network
                  </button>
                  <button onClick={() => { const id = randomEdgeId(); if (id) injectChaos({ type: 'ADD_LATENCY', targetId: id, value: 1000 }) }}
                    className="btn btn-sm w-full"
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid #3b82f6' }}>
                    <Timer size={12} /> Add 1s Latency
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
