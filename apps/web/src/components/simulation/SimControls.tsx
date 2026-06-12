import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Play, Pause, RotateCcw, ChevronDown, Crosshair, Clock,
} from 'lucide-react'
import { useSimulationStore } from '../../stores/simulationStore'
import { useCanvasStore } from '../../stores/canvasStore'
import { useSimulation } from '../../hooks/useSimulation'
import type { TrafficProfile, ChaosType, ChaosAction } from '../../types/simulation'

const SPEEDS = [1, 2, 5, 10]
const PATTERNS = ['CONSTANT', 'SINUSOIDAL', 'SPIKE', 'RAMP'] as const

// ── Chaos action catalogue ────────────────────────────────────────────────────
const NODE_CHAOS: { type: ChaosType; label: string; emoji: string; desc: string; needsValue?: boolean; valueLabel?: string; defaultValue?: number }[] = [
  { type: 'KILL_NODE',          label: 'Kill Node',          emoji: '💀', desc: 'Crash the process — simulates SIGKILL or OOM' },
  { type: 'CPU_SPIKE',          label: 'CPU Spike',          emoji: '🔥', desc: 'Saturate CPU to 95%+, causing latency divergence' },
  { type: 'MEMORY_PRESSURE',    label: 'Memory Leak',        emoji: '📈', desc: 'Slow heap growth → eventual OOM crash' },
  { type: 'KILL_ONE_REPLICA',   label: 'Kill Replica',       emoji: '⬛', desc: 'Remove one pod — reduces capacity, not full outage' },
  { type: 'EXHAUST_CONNECTIONS',label: 'Exhaust Pool',       emoji: '🔗', desc: 'Fill the connection pool → new requests block' },
  { type: 'RECOVER_NODE',       label: 'Recover Node',       emoji: '💚', desc: 'Restart crashed node — simulates Kubernetes restart' },
]

const EDGE_CHAOS: { type: ChaosType; label: string; emoji: string; desc: string; needsValue?: boolean; valueLabel?: string; defaultValue?: number }[] = [
  { type: 'ADD_LATENCY',        label: 'Add Latency',        emoji: '🐢', desc: 'Inject artificial delay', needsValue: true, valueLabel: 'ms', defaultValue: 500 },
  { type: 'PACKET_LOSS',        label: 'Packet Loss',        emoji: '📉', desc: 'Drop N% of packets randomly', needsValue: true, valueLabel: '%', defaultValue: 20 },
  { type: 'NETWORK_PARTITION',  label: 'Partition',          emoji: '✂️', desc: 'Full network partition — zero traffic passes' },
  { type: 'BANDWIDTH_THROTTLE', label: 'Bandwidth Throttle', emoji: '🚰', desc: 'Choke bandwidth to N% pass-through', needsValue: true, valueLabel: '% choked', defaultValue: 70 },
]

// ── Dropdown selector ─────────────────────────────────────────────────────────
function TargetDropdown({
  options, value, onChange, placeholder,
}: {
  options: { id: string; label: string; type?: string }[]
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.id === value)

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 10px', borderRadius: 7,
          background: '#0A0D12', border: '1px solid #1A2030',
          color: selected ? '#C8D0DA' : '#3A4455',
          cursor: 'pointer', fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#2D3748')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#1A2030')}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.id : placeholder}
        </span>
        <ChevronDown size={10} style={{ flexShrink: 0, marginLeft: 4, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              zIndex: 300, background: '#0A0D12',
              border: '1px solid #1A2030', borderRadius: 8,
              boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
              maxHeight: 180, overflowY: 'auto',
            }}
          >
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setOpen(false) }}
                style={{
                  width: '100%', textAlign: 'left', padding: '7px 10px',
                  background: value === opt.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                  border: 'none', color: value === opt.id ? '#A5B4FC' : '#8B95A3',
                  cursor: 'pointer', fontSize: 9,
                  fontFamily: "'JetBrains Mono', monospace",
                  display: 'block', transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (value !== opt.id) e.currentTarget.style.background = '#0D1018' }}
                onMouseLeave={e => { if (value !== opt.id) e.currentTarget.style.background = 'transparent' }}
              >
                {opt.id}
                {opt.type && (
                  <span style={{ marginLeft: 6, fontSize: 8, color: '#3A4455', opacity: 0.7 }}>
                    [{opt.type}]
                  </span>
                )}
              </button>
            ))}
            {options.length === 0 && (
              <div style={{ padding: '8px 10px', fontSize: 9, color: '#3A4455', fontFamily: 'monospace' }}>
                No targets available
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Chaos action button ───────────────────────────────────────────────────────
function ChaosButton({
  emoji, label, desc, disabled, onClick,
}: {
  emoji: string; label: string; desc: string; disabled: boolean; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const isRecover = label === 'Recover Node'
  const accent = isRecover ? '#10B981' : '#EF4444'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', textAlign: 'left',
        padding: '7px 10px', borderRadius: 7,
        background: hovered && !disabled ? `${accent}0D` : 'transparent',
        border: `1px solid ${hovered && !disabled ? `${accent}40` : '#141820'}`,
        color: disabled ? '#2A3140' : accent,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 10, display: 'flex', flexDirection: 'column', gap: 1,
        transition: 'all 0.15s', opacity: disabled ? 0.4 : 1,
      }}
    >
      <span style={{ fontWeight: 600 }}>{emoji} {label}</span>
      <span style={{ fontSize: 8, color: disabled ? '#2A3140' : '#4A5568', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.4 }}>
        {desc}
      </span>
    </button>
  )
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export function SimControls() {
  const { start, pause, resume, reset, setSpeed, injectChaos, scheduleChaos } = useSimulation()
  const simState = useSimulationStore(s => s.simState)
  const setTrafficProfile = useSimulationStore(s => s.setTrafficProfile)
  const nodes = useCanvasStore(s => s.nodes)

  const [rps, setRps] = useState(500)
  const [pattern, setPattern] = useState<TrafficProfile['pattern']>('CONSTANT')
  const [speed, setSpeedState] = useState(1)

  // Chaos targeting
  const [nodeTarget, setNodeTarget] = useState('')
  const [edgeTarget, setEdgeTarget] = useState('')
  const [chaosValue, setChaosValue] = useState<Record<ChaosType, number>>({} as Record<ChaosType, number>)
  // Scheduled chaos
  const [scheduleDelaySecs, setScheduleDelaySecs] = useState(30)
  const [scheduledType, setScheduledType] = useState<ChaosType>('KILL_NODE')
  const [scheduleTarget, setScheduleTarget] = useState('')

  const [customScript, setCustomScript] = useState(
`# Timed Failure Sequence YAML
- time: 10
  type: CPU_SPIKE
  target: order-service
- time: 20
  type: KILL_NODE
  target: user-service
- time: 30
  type: RECOVER_NODE
  target: user-service`
  )
  const [scriptError, setScriptError] = useState<string | null>(null)
  const [scriptSuccess, setScriptSuccess] = useState(false)

  interface ParsedEvent {
    time: number
    type: ChaosType
    target: string
    value?: number
  }

  const handleRunScript = () => {
    setScriptError(null)
    setScriptSuccess(false)
    try {
      const items = customScript.split('- ')
      const parsed: ParsedEvent[] = []
      for (const item of items) {
        if (!item.trim() || item.startsWith('#')) continue
        const lines = item.split('\n')
        const obj: Partial<ParsedEvent> = {}
        for (const line of lines) {
          const parts = line.split(':')
          if (parts.length >= 2) {
            const key = parts[0].trim()
            const val = parts.slice(1).join(':').trim()
            if (key === 'time') obj.time = parseInt(val) || 0
            if (key === 'type') obj.type = val as ChaosType
            if (key === 'target') obj.target = val
            if (key === 'value') obj.value = parseFloat(val) || 0
          }
        }
        if (obj.time !== undefined && obj.type && obj.target) {
          parsed.push(obj as ParsedEvent)
        }
      }

      if (parsed.length === 0) {
        throw new Error("No valid events found. Check your YAML formatting.")
      }

      parsed.forEach(evt => {
        scheduleChaos(evt.time, {
          type: evt.type,
          targetId: evt.target,
          value: evt.value,
        })
      })

      setScriptSuccess(true)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to parse script."
      setScriptError(errorMessage)
    }
  }

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

  // Build node/edge option lists from current canvas
  const nodeOptions = nodes.map(n => ({ id: n.id, label: n.data?.label as string ?? n.id, type: n.type ?? '' }))
  const edgeOptions = useCanvasStore.getState().edges.map(e => ({
    id: e.id,
    label: e.id,
    type: e.type ?? 'http',
  }))

  const getNodeChaosValue = (type: ChaosType, def: number) => chaosValue[type] ?? def

  const fireNodeChaos = (type: ChaosType, value?: number) => {
    if (!nodeTarget) return
    injectChaos({ type, targetId: nodeTarget, value })
  }

  const fireEdgeChaos = (type: ChaosType, value?: number) => {
    if (!edgeTarget) return
    injectChaos({ type, targetId: edgeTarget, value })
  }

  const fireSched = () => {
    if (!scheduleTarget || !scheduleDelaySecs) return
    const atSec = simState.currentTimeSec + scheduleDelaySecs
    const action: ChaosAction = { type: scheduledType, targetId: scheduleTarget }
    scheduleChaos(atSec, action)
  }

  const labelClass = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 8, color: '#3A4455', letterSpacing: 2,
    marginBottom: 6, display: 'block' as const,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: "'DM Sans', sans-serif" }}>

      {/* ─── TRAFFIC PROFILE ─── */}
      <div>
        <span style={labelClass}>TRAFFIC PROFILE</span>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: '#4A5568' }}>Base Traffic</span>
          <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#7C3AED' }}>{rps.toLocaleString()} RPS</span>
        </div>
        <input
          type="range" min={10} max={5000} step={10} value={rps}
          onChange={e => setRps(Number(e.target.value))}
          disabled={isRunning}
          style={{ width: '100%', accentColor: '#7C3AED', opacity: isRunning ? 0.4 : 1, cursor: isRunning ? 'not-allowed' : 'pointer' }}
        />

        <div style={{ marginTop: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: '#4A5568' }}>Pattern</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {PATTERNS.map(p => (
            <button
              key={p}
              onClick={() => setPattern(p)}
              disabled={isRunning}
              style={{
                padding: '5px 8px', borderRadius: 6, fontSize: 9, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
                background: pattern === p ? 'rgba(124,58,237,0.18)' : '#0A0D12',
                color: pattern === p ? '#A78BFA' : '#4A5568',
                border: `1px solid ${pattern === p ? '#7C3AED' : '#141820'}`,
                opacity: isRunning ? 0.4 : 1, transition: 'all 0.15s',
              }}
            >
              {p.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ─── SIMULATION CONTROLS ─── */}
      <div>
        <span style={labelClass}>SIMULATION</span>

        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => handleSpeed(s)}
              disabled={isIdle}
              style={{
                flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 10, fontWeight: 700,
                fontFamily: 'monospace', cursor: 'pointer',
                background: speed === s ? '#7C3AED' : '#0A0D12',
                color: speed === s ? '#fff' : '#4A5568',
                border: `1px solid ${speed === s ? '#7C3AED' : '#141820'}`,
                opacity: isIdle ? 0.4 : 1, transition: 'all 0.15s',
              }}
            >{s}×</button>
          ))}
        </div>

        {isIdle && (
          <button
            onClick={handleStart}
            disabled={nodes.length === 0}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 8, fontSize: 12, fontWeight: 700,
              color: '#fff', border: 'none', cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
              opacity: nodes.length === 0 ? 0.4 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'opacity 0.2s',
            }}
          >
            <Play size={13} fill="#fff" /> Start Simulation
          </button>
        )}

        {(isRunning || isPaused) && (
          <div style={{ display: 'flex', gap: 6 }}>
            {isRunning ? (
              <button
                onClick={pause}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 11, fontWeight: 700,
                  color: '#8B95A3', border: '1px solid #1A2030', cursor: 'pointer',
                  background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D3748'; e.currentTarget.style.color = '#E8EDF3' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A2030'; e.currentTarget.style.color = '#8B95A3' }}
              >
                <Pause size={12} /> Pause
              </button>
            ) : (
              <button
                onClick={resume}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 11, fontWeight: 700,
                  color: '#fff', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                }}
              >
                <Play size={12} fill="#fff" /> Resume
              </button>
            )}
            <button
              onClick={reset}
              title="Reset"
              style={{
                padding: '9px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                color: '#4A5568', border: '1px solid #141820', cursor: 'pointer',
                background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D3748'; e.currentTarget.style.color = '#E8EDF3' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#141820'; e.currentTarget.style.color = '#4A5568' }}
            >
              <RotateCcw size={12} />
            </button>
          </div>
        )}

        {!isIdle && (
          <div style={{ marginTop: 6, textAlign: 'center', fontSize: 9, color: '#3A4455', fontFamily: 'monospace' }}>
            T+{simState.currentTimeSec.toFixed(1)}s · {simState.speedMultiplier}× speed
          </div>
        )}
      </div>

      {/* ─── CHAOS INJECTION ─── */}
      <AnimatePresence>
        {(isRunning || isPaused) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <span style={labelClass}>NODE CHAOS</span>

            {/* Node target selector */}
            <div style={{ marginBottom: 8 }}>
              <TargetDropdown
                options={nodeOptions}
                value={nodeTarget}
                onChange={setNodeTarget}
                placeholder="Select target node…"
              />
            </div>

            {/* Node chaos buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
              {NODE_CHAOS.map(({ type, label, emoji, desc }) => (
                <ChaosButton
                  key={type}
                  emoji={emoji}
                  label={label}
                  desc={desc}
                  disabled={!nodeTarget}
                  onClick={() => fireNodeChaos(type)}
                />
              ))}
            </div>

            <span style={labelClass}>EDGE CHAOS</span>

            {/* Edge target selector */}
            <div style={{ marginBottom: 8 }}>
              <TargetDropdown
                options={edgeOptions}
                value={edgeTarget}
                onChange={setEdgeTarget}
                placeholder="Select target edge…"
              />
            </div>

            {/* Edge chaos buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
              {EDGE_CHAOS.map(({ type, label, emoji, desc, needsValue, valueLabel, defaultValue }) => (
                <div key={type}>
                  {needsValue && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <input
                        type="number"
                        value={getNodeChaosValue(type, defaultValue!)}
                        onChange={e => setChaosValue(prev => ({ ...prev, [type]: Number(e.target.value) }))}
                        min={1} max={type === 'ADD_LATENCY' ? 10000 : 100}
                        style={{
                          width: 60, padding: '3px 6px', borderRadius: 5,
                          background: '#0A0D12', border: '1px solid #1A2030',
                          color: '#C8D0DA', fontSize: 10, fontFamily: 'monospace',
                          outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: 9, color: '#3A4455', fontFamily: 'monospace' }}>{valueLabel}</span>
                    </div>
                  )}
                  <ChaosButton
                    emoji={emoji}
                    label={label}
                    desc={desc}
                    disabled={!edgeTarget}
                    onClick={() => fireEdgeChaos(type, needsValue ? getNodeChaosValue(type, defaultValue!) : undefined)}
                  />
                </div>
              ))}
            </div>

            {/* ─── SCHEDULED CHAOS ─── */}
            <span style={{ ...labelClass, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={9} /> SCHEDULED CHAOS
            </span>
            <div style={{ background: '#0A0D12', border: '1px solid #111820', borderRadius: 8, padding: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Crosshair size={9} color="#F59E0B" />
                <span style={{ fontSize: 9, color: '#4A5568', fontFamily: 'monospace' }}>Fire chaos event in future</span>
              </div>

              {/* Delay input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: '#3A4455', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>In</span>
                <input
                  type="number"
                  value={scheduleDelaySecs}
                  onChange={e => setScheduleDelaySecs(Number(e.target.value))}
                  min={1} max={300}
                  style={{
                    width: 50, padding: '3px 6px', borderRadius: 5,
                    background: '#060810', border: '1px solid #1A2030',
                    color: '#F59E0B', fontSize: 10, fontFamily: 'monospace', outline: 'none',
                  }}
                />
                <span style={{ fontSize: 9, color: '#3A4455', fontFamily: 'monospace' }}>sec</span>
              </div>

              {/* Scheduled action type */}
              <div style={{ marginBottom: 6 }}>
                <select
                  value={scheduledType}
                  onChange={e => setScheduledType(e.target.value as ChaosType)}
                  style={{
                    width: '100%', padding: '5px 8px', borderRadius: 6,
                    background: '#060810', border: '1px solid #1A2030',
                    color: '#C8D0DA', fontSize: 9, fontFamily: 'monospace',
                    outline: 'none', cursor: 'pointer',
                  }}
                >
                  {[...NODE_CHAOS, ...EDGE_CHAOS].map(c => (
                    <option key={c.type} value={c.type}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>

              {/* Target */}
              <div style={{ marginBottom: 8 }}>
                <TargetDropdown
                  options={[...nodeOptions, ...edgeOptions]}
                  value={scheduleTarget}
                  onChange={setScheduleTarget}
                  placeholder="Select target…"
                />
              </div>

              <button
                disabled={!scheduleTarget || !scheduleDelaySecs}
                onClick={fireSched}
                style={{
                  width: '100%', padding: '7px 0', borderRadius: 7, fontSize: 10, fontWeight: 700,
                  cursor: !scheduleTarget ? 'not-allowed' : 'pointer',
                  background: !scheduleTarget ? 'transparent' : 'rgba(245,158,11,0.1)',
                  color: '#F59E0B',
                  border: `1px solid ${!scheduleTarget ? '#141820' : '#F59E0B40'}`,
                  opacity: !scheduleTarget ? 0.4 : 1,
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  marginBottom: 12,
                }}
              >
                <Clock size={10} /> Schedule Event
              </button>

              {/* ─── CUSTOM CHAOS SCRIPT ─── */}
              <div style={{ borderTop: '1px solid #141820', paddingTop: 10 }}>
                <span style={{ fontSize: 9, color: '#4A5568', fontFamily: 'monospace', display: 'block', marginBottom: 6 }}>
                  ⚡ CUSTOM CHAOS SCRIPT (YAML)
                </span>
                <textarea
                  value={customScript}
                  onChange={e => setCustomScript(e.target.value)}
                  style={{
                    width: '100%', height: 90, background: '#060810', border: '1px solid #1A2030',
                    borderRadius: 6, padding: '6px 8px', fontSize: 9, fontFamily: 'monospace',
                    color: '#A5B4FC', outline: 'none', resize: 'vertical', lineHeight: 1.4,
                  }}
                />
                <button
                  onClick={handleRunScript}
                  style={{
                    width: '100%', padding: '6px 0', borderRadius: 6, fontSize: 9, fontWeight: 700,
                    cursor: 'pointer', background: 'rgba(99,102,241,0.1)', color: '#A5B4FC',
                    border: '1px solid rgba(99,102,241,0.3)', transition: 'all 0.15s',
                    marginTop: 6,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                >
                  Inject Chaos Sequence
                </button>

                {scriptError && (
                  <div style={{ color: '#EF4444', fontSize: 8, fontFamily: 'monospace', marginTop: 4 }}>
                    ⚠️ {scriptError}
                  </div>
                )}
                {scriptSuccess && (
                  <div style={{ color: '#10B981', fontSize: 8, fontFamily: 'monospace', marginTop: 4 }}>
                    ✓ Custom sequence loaded and scheduled!
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
