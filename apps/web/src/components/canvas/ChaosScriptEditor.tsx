// ChaosScriptEditor.tsx — Archaos
// Visual YAML chaos script editor with syntax highlighting, validation, and
// one-click execution against the live simulation engine.

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Play, RotateCcw, AlertCircle, CheckCircle2, Terminal, ChevronRight, Copy } from 'lucide-react'
import type { ChaosType } from '../../types/simulation'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChaosStep {
  atSec: number
  type: ChaosType
  targetId: string
  value?: number
  durationSecs?: number
}

interface ParsedScript {
  steps: ChaosStep[]
  errors: { line: number; msg: string }[]
}

interface Props {
  onClose: () => void
  onExecute: (steps: ChaosStep[]) => void
  nodeIds: string[]
}

// ─── Available chaos actions ──────────────────────────────────────────────────
const CHAOS_ACTIONS: { type: ChaosType; label: string; color: string; hasValue: boolean; valueLabel?: string }[] = [
  { type: 'KILL_NODE',           label: 'Kill Node',           color: '#EF4444', hasValue: false },
  { type: 'CPU_SPIKE',           label: 'CPU Spike',           color: '#F97316', hasValue: true,  valueLabel: '% (0–100)' },
  { type: 'MEMORY_PRESSURE',     label: 'Memory Pressure',     color: '#F59E0B', hasValue: true,  valueLabel: '% (0–100)' },
  { type: 'KILL_ONE_REPLICA',    label: 'Kill Replica',        color: '#EF4444', hasValue: false },
  { type: 'EXHAUST_CONNECTIONS', label: 'Exhaust Connections', color: '#EC4899', hasValue: false },
  { type: 'ADD_LATENCY',         label: 'Add Latency',         color: '#8B5CF6', hasValue: true,  valueLabel: 'ms' },
  { type: 'PACKET_LOSS',         label: 'Packet Loss',         color: '#06B6D4', hasValue: true,  valueLabel: '% (0–100)' },
  { type: 'NETWORK_PARTITION',   label: 'Network Partition',   color: '#3B82F6', hasValue: false },
  { type: 'BANDWIDTH_THROTTLE',  label: 'Bandwidth Throttle',  color: '#10B981', hasValue: true,  valueLabel: '% throttle' },
  { type: 'TRAFFIC_SPIKE',       label: 'Traffic Spike',       color: '#F59E0B', hasValue: true,  valueLabel: 'multiplier' },
  { type: 'CACHE_EXPIRE',        label: 'Cache Expire',        color: '#A3E635', hasValue: false },
  { type: 'RECOVER_NODE',        label: 'Recover Node',        color: '#10B981', hasValue: false },
]

// ─── Example scripts ──────────────────────────────────────────────────────────
const EXAMPLE_SCRIPTS: { name: string; color: string; yaml: string }[] = [
  {
    name: 'DB Cascade',
    color: '#EF4444',
    yaml:
`# Cascade failure: DB latency → thread exhaustion
- atSec: 5
  type: ADD_LATENCY
  targetId: postgres-db
  value: 3000

- atSec: 20
  type: CPU_SPIKE
  targetId: payment-service
  value: 95

- atSec: 40
  type: KILL_NODE
  targetId: billing-service

- atSec: 70
  type: RECOVER_NODE
  targetId: billing-service`,
  },
  {
    name: 'Retry Storm',
    color: '#F59E0B',
    yaml:
`# Retry storm: traffic spike + latency causes amplification
- atSec: 3
  type: TRAFFIC_SPIKE
  targetId: api-gateway
  value: 4

- atSec: 5
  type: ADD_LATENCY
  targetId: order-service
  value: 500

- atSec: 15
  type: PACKET_LOSS
  targetId: payment-service
  value: 30`,
  },
  {
    name: 'Canary Kill',
    color: '#8B5CF6',
    yaml:
`# Kill one replica, check if CB kicks in
- atSec: 5
  type: KILL_ONE_REPLICA
  targetId: api-service

- atSec: 20
  type: CPU_SPIKE
  targetId: api-service
  value: 90

- atSec: 45
  type: RECOVER_NODE
  targetId: api-service`,
  },
  {
    name: 'Network Split',
    color: '#06B6D4',
    yaml:
`# Partition network, force split-brain
- atSec: 5
  type: NETWORK_PARTITION
  targetId: db-east

- atSec: 30
  type: NETWORK_PARTITION
  targetId: db-west

- atSec: 60
  type: RECOVER_NODE
  targetId: db-east`,
  },
]

// ─── Simple YAML parser ───────────────────────────────────────────────────────
function parseYamlScript(yaml: string): ParsedScript {
  const errors: { line: number; msg: string }[] = []
  const steps: ChaosStep[] = []

  // Split into blocks by "- atSec:" pattern
  const lines = yaml.split('\n')
  let currentBlock: string[] = []
  let blockStartLine = 0

  const processBlock = (block: string[], startLine: number) => {
    if (block.length === 0) return
    const obj: Record<string, string> = {}
    block.forEach((l) => {
      const stripped = l.replace(/^[\s\-]+/, '')
      const colon = stripped.indexOf(':')
      if (colon === -1) return
      const key = stripped.slice(0, colon).trim()
      const val = stripped.slice(colon + 1).trim()
      if (key && val) obj[key] = val
    })

    const atSec = parseInt(obj['atSec'] ?? obj['at_sec'] ?? '')
    const type = obj['type'] as ChaosType
    const targetId = obj['targetId'] ?? obj['target_id'] ?? obj['target'] ?? ''
    const value = obj['value'] ? parseFloat(obj['value']) : undefined
    const durationSecs = obj['durationSecs'] ? parseInt(obj['durationSecs']) : undefined

    if (isNaN(atSec)) {
      errors.push({ line: startLine + 1, msg: 'Missing or invalid atSec' })
      return
    }
    if (!type) {
      errors.push({ line: startLine + 1, msg: 'Missing type' })
      return
    }
    if (!targetId) {
      errors.push({ line: startLine + 1, msg: 'Missing targetId' })
      return
    }
    const validTypes = CHAOS_ACTIONS.map(a => a.type)
    if (!validTypes.includes(type)) {
      errors.push({ line: startLine + 1, msg: `Unknown type: ${type}` })
      return
    }

    steps.push({ atSec, type, targetId, value, durationSecs })
  }

  lines.forEach((line, i) => {
    const isNewBlock = /^\s*-\s*atSec\s*:/.test(line) || /^\s*-\s*at_sec\s*:/.test(line)
    if (isNewBlock && currentBlock.length > 0) {
      processBlock(currentBlock, blockStartLine)
      currentBlock = [line]
      blockStartLine = i
    } else if (line.trim().startsWith('#') || line.trim() === '') {
      if (currentBlock.length > 0) currentBlock.push(line)
    } else {
      currentBlock.push(line)
    }
  })
  if (currentBlock.length > 0) processBlock(currentBlock, blockStartLine)

  steps.sort((a, b) => a.atSec - b.atSec)
  return { steps, errors }
}

// ─── Syntax Highlighted Textarea ──────────────────────────────────────────────
// Renders a textarea + a mirrored highlighted div layered on top
function SyntaxHighlight({ code }: { code: string }) {
  const lines = code.split('\n')
  return (
    <div style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, lineHeight: '20px', letterSpacing: 0.3, whiteSpace: 'pre', wordBreak: 'break-all', overflowWrap: 'break-word' }}>
      {lines.map((line, i) => {
        if (/^\s*#/.test(line)) {
          return <div key={i} style={{ color: '#3A4455' }}>{line || ' '}</div>
        }
        if (/^\s*-\s*atSec/.test(line) || /^\s*-\s*at_sec/.test(line)) {
          const [before, after] = line.split(':')
          return (
            <div key={i}>
              <span style={{ color: '#6366F1' }}>{before}:</span>
              <span style={{ color: '#A5B4FC' }}>{after}</span>
            </div>
          )
        }
        if (/^\s*(type)\s*:/.test(line)) {
          const m = line.match(/^(\s*)(type)\s*:\s*(.*)$/)
          if (m) {
            const action = CHAOS_ACTIONS.find(a => a.type === m[3].trim())
            return (
              <div key={i}>
                <span style={{ color: '#4A5568' }}>{m[1]}</span>
                <span style={{ color: '#F59E0B' }}>type</span>
                <span style={{ color: '#4A5568' }}>: </span>
                <span style={{ color: action ? action.color : '#EF4444' }}>{m[3]}</span>
              </div>
            )
          }
        }
        if (/^\s*(targetId|target_id|target)\s*:/.test(line)) {
          const [k, ...rest] = line.split(':')
          return (
            <div key={i}>
              <span style={{ color: '#10B981' }}>{k}:</span>
              <span style={{ color: '#6EE7B7' }}>{rest.join(':')}</span>
            </div>
          )
        }
        if (/^\s*(value|durationSecs)\s*:/.test(line)) {
          const [k, ...rest] = line.split(':')
          return (
            <div key={i}>
              <span style={{ color: '#06B6D4' }}>{k}:</span>
              <span style={{ color: '#67E8F9' }}>{rest.join(':')}</span>
            </div>
          )
        }
        if (/^\s*-\s*$/.test(line) || line.trim() === '-') {
          return <div key={i} style={{ color: '#3A4455' }}>{line || ' '}</div>
        }
        return <div key={i} style={{ color: '#8B95A3' }}>{line || ' '}</div>
      })}
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function ChaosScriptEditor({ onClose, onExecute, nodeIds }: Props) {
  const [code, setCode] = useState(EXAMPLE_SCRIPTS[0].yaml)
  const [parsed, setParsed] = useState<ParsedScript>({ steps: [], errors: [] })
  const [activeExample, setActiveExample] = useState(0)
  const [copied, setCopied] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [executionMsg, setExecutionMsg] = useState<string | null>(null)
  const [lineNumbers, setLineNumbers] = useState<number[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Re-parse on code change
  useEffect(() => {
    const p = parseYamlScript(code)
    setParsed(p)
  }, [code])

  // Update line numbers
  useEffect(() => {
    const count = code.split('\n').length
    setLineNumbers(Array.from({ length: count }, (_, i) => i + 1))
  }, [code])

  const handleExampleSelect = (idx: number) => {
    setActiveExample(idx)
    setCode(EXAMPLE_SCRIPTS[idx].yaml)
    setExecutionMsg(null)
  }

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [code])

  const handleExecute = useCallback(() => {
    if (parsed.errors.length > 0 || parsed.steps.length === 0) return
    setExecuting(true)
    setExecutionMsg(null)
    setTimeout(() => {
      onExecute(parsed.steps)
      setExecuting(false)
      setExecutionMsg(`✓ ${parsed.steps.length} events queued — simulation will process them at the scheduled times.`)
    }, 600)
  }, [parsed, onExecute])

  // Sync textarea scroll with highlight div
  const handleScroll = () => {
    if (textareaRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = textareaRef.current
      if (!ta) return
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newVal = code.slice(0, start) + '  ' + code.slice(end)
      setCode(newVal)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(5,7,11,0.92)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'fadeIn 0.2s ease',
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .chaos-textarea { background: transparent !important; color: transparent !important; caret-color: #6366F1 !important; resize: none !important; outline: none !important; border: none !important; }
        .chaos-textarea::selection { background: rgba(99,102,241,0.3); }
      `}</style>

      <div style={{
        width: '100%', maxWidth: 920,
        maxHeight: '90vh',
        border: '1px solid #1A2030', borderRadius: 16,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        background: '#07090D',
        animation: 'slideUp 0.25s ease',
        boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.1)',
      }}>

        {/* ── HEADER ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 18px',
          borderBottom: '1px solid #141820',
          background: 'rgba(99,102,241,0.04)',
          flexShrink: 0,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF4444' }} />
          <Terminal size={13} style={{ color: '#6366F1' }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#8B95A3', letterSpacing: 2.5, flex: 1 }}>
            CHAOS SCRIPT EDITOR
          </span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#2A3140', letterSpacing: 1.5 }}>
            YAML / ARCHAOS-DSL v1
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5568', padding: 4, display: 'flex', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#E8EDF3'}
            onMouseLeave={e => e.currentTarget.style.color = '#4A5568'}
          ><X size={15} /></button>
        </div>

        {/* ── BODY ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* LEFT: Examples + Reference */}
          <div style={{
            width: 220, flexShrink: 0,
            borderRight: '1px solid #141820',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Examples */}
            <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #0D1018', flexShrink: 0 }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#3A4455', letterSpacing: 2, marginBottom: 8 }}>
                EXAMPLE SCRIPTS
              </div>
              {EXAMPLE_SCRIPTS.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleSelect(i)}
                  style={{
                    width: '100%', padding: '7px 10px',
                    borderRadius: 7, marginBottom: 4,
                    background: activeExample === i ? `${ex.color}12` : 'transparent',
                    border: `1px solid ${activeExample === i ? ex.color + '30' : 'transparent'}`,
                    color: activeExample === i ? ex.color : '#4A5568',
                    fontSize: 10, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 7,
                    fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5,
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (activeExample !== i) { e.currentTarget.style.background = '#0D1018'; e.currentTarget.style.color = '#8B95A3' } }}
                  onMouseLeave={e => { if (activeExample !== i) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4A5568' } }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: ex.color, flexShrink: 0 }} />
                  {ex.name}
                  {activeExample === i && <ChevronRight size={9} style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>

            {/* Chaos Action Reference */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#3A4455', letterSpacing: 2, marginBottom: 8 }}>
                AVAILABLE ACTIONS
              </div>
              {CHAOS_ACTIONS.map(action => (
                <div key={action.type} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '4px 0',
                  borderBottom: '1px solid #0D1018',
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: action.color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: action.color, letterSpacing: 0.3 }}>
                      {action.type}
                    </div>
                    {action.hasValue && (
                      <div style={{ fontSize: 8, color: '#2A3140', fontFamily: "'JetBrains Mono',monospace" }}>
                        value: {action.valueLabel}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {nodeIds.length > 0 && (
                <>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#3A4455', letterSpacing: 2, marginTop: 14, marginBottom: 8 }}>
                    CANVAS NODE IDs
                  </div>
                  {nodeIds.map(id => (
                    <div key={id} style={{
                      padding: '3px 6px', marginBottom: 3,
                      background: '#0A0D12', border: '1px solid #141820', borderRadius: 4,
                      fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#4A5568',
                      cursor: 'pointer', transition: 'all 0.15s',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                    onClick={() => {
                      const ta = textareaRef.current
                      if (!ta) return
                      const start = ta.selectionStart
                      const newCode = code.slice(0, start) + id + code.slice(ta.selectionEnd)
                      setCode(newCode)
                      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + id.length })
                      ta.focus()
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F130'; e.currentTarget.style.color = '#6366F1' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#141820'; e.currentTarget.style.color = '#4A5568' }}
                    title={`Click to insert "${id}"`}
                    >
                      {id}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* CENTER: Code editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* Editor toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px',
              borderBottom: '1px solid #0D1018',
              background: '#07090D', flexShrink: 0,
            }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#2A3140', letterSpacing: 1.5 }}>
                SCRIPT.YAML
              </span>
              <div style={{ flex: 1 }} />
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 6,
                  background: 'transparent', border: '1px solid #141820',
                  color: copied ? '#10B981' : '#4A5568', cursor: 'pointer',
                  fontSize: 9, fontFamily: "'JetBrains Mono',monospace",
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!copied) { e.currentTarget.style.borderColor = '#2D3748'; e.currentTarget.style.color = '#8B95A3' } }}
                onMouseLeave={e => { if (!copied) { e.currentTarget.style.borderColor = '#141820'; e.currentTarget.style.color = '#4A5568' } }}
              >
                <Copy size={10} />
                {copied ? 'COPIED!' : 'COPY'}
              </button>
              <button
                onClick={() => { setCode(''); setExecutionMsg(null) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 6,
                  background: 'transparent', border: '1px solid #141820',
                  color: '#4A5568', cursor: 'pointer',
                  fontSize: 9, fontFamily: "'JetBrains Mono',monospace",
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D3748'; e.currentTarget.style.color = '#8B95A3' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#141820'; e.currentTarget.style.color = '#4A5568' }}
              >
                <RotateCcw size={10} />
                CLEAR
              </button>
            </div>

            {/* Code area */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', position: 'relative', minHeight: 0 }}>
              {/* Line numbers */}
              <div style={{
                width: 44, flexShrink: 0,
                background: '#060810',
                borderRight: '1px solid #0D1018',
                padding: '14px 0',
                overflowY: 'hidden',
                userSelect: 'none',
              }}>
                {lineNumbers.map(n => (
                  <div key={n} style={{
                    height: 20, lineHeight: '20px',
                    textAlign: 'right', paddingRight: 10,
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                    color: '#1E2530',
                  }}>{n}</div>
                ))}
              </div>

              {/* Syntax highlight overlay */}
              <div
                ref={scrollRef}
                style={{
                  position: 'absolute', left: 44, right: 0, top: 0, bottom: 0,
                  padding: '14px 16px',
                  overflow: 'hidden',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                <SyntaxHighlight code={code} />
              </div>

              {/* Actual textarea */}
              <textarea
                ref={textareaRef}
                className="chaos-textarea"
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="none"
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 12, lineHeight: '20px',
                  letterSpacing: 0.3,
                  background: 'transparent',
                  color: 'transparent',
                  caretColor: '#6366F1',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  position: 'relative',
                  zIndex: 1,
                  overflowY: 'auto',
                }}
              />
            </div>
          </div>

          {/* RIGHT: Parse result + execution */}
          <div style={{
            width: 240, flexShrink: 0,
            borderLeft: '1px solid #141820',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Parse status */}
            <div style={{
              padding: '12px 14px',
              borderBottom: '1px solid #0D1018',
              flexShrink: 0,
            }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#3A4455', letterSpacing: 2, marginBottom: 10 }}>
                PARSE RESULT
              </div>
              {parsed.errors.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <CheckCircle2 size={13} style={{ color: '#10B981' }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#10B981' }}>
                    {parsed.steps.length} steps valid
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {parsed.errors.map((err, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <AlertCircle size={11} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#EF4444', lineHeight: 1.5 }}>
                        L{err.line}: {err.msg}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step preview */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#3A4455', letterSpacing: 2, marginBottom: 8 }}>
                EXECUTION PLAN
              </div>
              {parsed.steps.length === 0 ? (
                <div style={{ fontSize: 9, color: '#1E2530', fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.6 }}>
                  No steps parsed yet.<br />Write a chaos script on the left.
                </div>
              ) : (
                parsed.steps.map((step, i) => {
                  const action = CHAOS_ACTIONS.find(a => a.type === step.type)
                  return (
                    <div key={i} style={{
                      padding: '8px 10px',
                      marginBottom: 6,
                      background: '#0A0D12',
                      border: `1px solid ${action?.color ?? '#141820'}18`,
                      borderLeft: `2px solid ${action?.color ?? '#4A5568'}`,
                      borderRadius: 6,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: '#6366F1' }}>
                          T+{step.atSec}s
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: action?.color ?? '#4A5568' }}>
                          {step.type}
                        </span>
                      </div>
                      <div style={{ fontSize: 9, color: '#8B95A3', fontFamily: "'JetBrains Mono',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        → {step.targetId}
                        {step.value !== undefined && <span style={{ color: '#06B6D4' }}> ({step.value})</span>}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Execute button + status */}
            <div style={{ padding: '12px 14px', borderTop: '1px solid #141820', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {executionMsg && (
                <div style={{
                  padding: '8px 10px', borderRadius: 7,
                  background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                  fontSize: 9, color: '#10B981', fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.5,
                }}>
                  {executionMsg}
                </div>
              )}
              <button
                onClick={handleExecute}
                disabled={parsed.errors.length > 0 || parsed.steps.length === 0 || executing}
                style={{
                  width: '100%', padding: '11px',
                  borderRadius: 9,
                  background: (parsed.errors.length > 0 || parsed.steps.length === 0)
                    ? '#0D1118'
                    : executing
                    ? '#1A2030'
                    : 'linear-gradient(135deg, #EF4444, #B91C1C)',
                  border: `1px solid ${(parsed.errors.length > 0 || parsed.steps.length === 0) ? '#1A2030' : 'transparent'}`,
                  color: (parsed.errors.length > 0 || parsed.steps.length === 0) ? '#3A4455' : '#fff',
                  fontSize: 11, fontWeight: 700, cursor: (parsed.errors.length > 0 || parsed.steps.length === 0 || executing) ? 'not-allowed' : 'pointer',
                  fontFamily: "'JetBrains Mono',monospace",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  boxShadow: (parsed.errors.length > 0 || parsed.steps.length === 0) ? 'none' : '0 4px 16px rgba(239,68,68,0.3)',
                  transition: 'all 0.2s',
                  letterSpacing: 1,
                }}
              >
                {executing ? (
                  <>
                    <span style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    QUEUING...
                  </>
                ) : (
                  <>
                    <Play size={12} />
                    EXECUTE SCRIPT
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
