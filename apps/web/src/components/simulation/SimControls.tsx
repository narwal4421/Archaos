import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Play, Pause, RotateCcw,
} from 'lucide-react'
import { useSimulationStore } from '../../stores/simulationStore'
import { useCanvasStore } from '../../stores/canvasStore'
import { useSimulation } from '../../hooks/useSimulation'
import type { TrafficProfile } from '../../types/simulation'

const SPEEDS = [1, 2, 5, 10]
const PATTERNS = ['CONSTANT', 'SINUSOIDAL', 'SPIKE', 'RAMP'] as const

const sectionHeader = "text-[11px] font-bold uppercase tracking-[1.5px] text-[#444444] mb-3 font-['Inter']"

export function SimControls() {
  const { start, pause, resume, reset, setSpeed, injectChaos } = useSimulation()
  const simState = useSimulationStore(s => s.simState)
  const setTrafficProfile = useSimulationStore(s => s.setTrafficProfile)
  const nodes = useCanvasStore(s => s.nodes)

  const [rps, setRps] = useState(500)
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
    <div className="flex flex-col gap-5 font-['Inter']">

      {/* ─── TRAFFIC PROFILE ─── */}
      <div>
        <div className={sectionHeader}>Traffic Profile</div>

        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[#888888]">Base Traffic</span>
          <span className="font-mono text-xs font-bold text-[#7C3AED]">{rps} RPS</span>
        </div>
        <input
          type="range" min={10} max={5000} step={10} value={rps}
          onChange={e => setRps(Number(e.target.value))}
          disabled={isRunning}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#222222] disabled:opacity-40"
          style={{ accentColor: '#7C3AED' }}
        />

        <div className="mt-3 mb-1.5">
          <span className="text-xs text-[#888888]">Pattern</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {PATTERNS.map(p => (
            <button
              key={p}
              onClick={() => setPattern(p)}
              disabled={isRunning}
              className="py-1.5 rounded-md text-[10px] font-semibold border transition-all duration-150 cursor-pointer disabled:opacity-40"
              style={{
                background: pattern === p ? 'rgba(124,58,237,0.2)' : '#111111',
                color: pattern === p ? '#A78BFA' : '#888888',
                border: `1px solid ${pattern === p ? '#7C3AED' : '#222222'}`,
              }}
            >
              {p.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ─── SIMULATION ─── */}
      <div>
        <div className={sectionHeader}>Simulation</div>

        {/* Speed Toggles */}
        <div className="flex gap-1 mb-3">
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => handleSpeed(s)}
              disabled={isIdle}
              className="flex-1 py-1.5 rounded-md text-[11px] font-bold border transition-all duration-150 cursor-pointer disabled:opacity-40"
              style={{
                background: speed === s ? '#7C3AED' : '#111111',
                color: speed === s ? '#ffffff' : '#888888',
                border: `1px solid ${speed === s ? '#7C3AED' : '#222222'}`,
              }}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Start / Pause / Resume / Reset */}
        {isIdle && (
          <button
            onClick={handleStart}
            disabled={nodes.length === 0}
            className="w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
          >
            <Play size={14} className="fill-white" /> Start Simulation
          </button>
        )}

        {(isRunning || isPaused) && (
          <div className="flex gap-2">
            {isRunning ? (
              <button
                onClick={pause}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold text-[#888888] border border-[#333333] hover:border-[#888888] hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                style={{ background: 'transparent' }}
              >
                <Pause size={14} /> Pause
              </button>
            ) : (
              <button
                onClick={resume}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}
              >
                <Play size={14} className="fill-white" /> Resume
              </button>
            )}
            <button
              onClick={reset}
              className="py-2.5 px-3 rounded-lg text-sm font-bold text-[#888888] border border-[#333333] hover:border-[#888888] hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
              title="Reset"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        )}

        {/* Timer display */}
        {!isIdle && (
          <div className="mt-2 text-center font-mono text-[10px] text-[#444444]">
            T+{Math.floor(simState.currentTimeSec)}s elapsed
          </div>
        )}
      </div>

      {/* ─── CHAOS INJECTION (only when running) ─── */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={sectionHeader}>Chaos Injection</div>
            <div className="flex flex-col gap-1.5">
              {[
                {
                  label: '💀 Kill Random Node',
                  action: () => { const id = randomNodeId(); if (id) injectChaos({ type: 'KILL_NODE', targetId: id }) },
                },
                {
                  label: '⚡ Spike Traffic 10×',
                  action: () => injectChaos({ type: 'TRAFFIC_SPIKE', targetId: nodes[0]?.id || '', value: 10 }),
                },
                {
                  label: '✂ Partition Network',
                  action: () => { const id = randomEdgeId(); if (id) injectChaos({ type: 'NETWORK_PARTITION', targetId: id }) },
                },
                {
                  label: '🐢 Slow All Edges',
                  action: () => { const id = randomEdgeId(); if (id) injectChaos({ type: 'ADD_LATENCY', targetId: id, value: 1000 }) },
                },
              ].map(({ label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="w-full py-2.5 px-3 text-left text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  style={{
                    background: 'transparent',
                    color: '#EF4444',
                    border: '1px solid #EF4444',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
