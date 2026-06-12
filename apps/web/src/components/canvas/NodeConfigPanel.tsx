import { useState } from 'react'
import { useCanvasStore } from '../../stores/canvasStore'
import { useChaos } from '../../hooks/useChaos'
import { useBlastRadius } from '../../hooks/useBlastRadius'
import { useSimulationStore } from '../../stores/simulationStore'
import {
  X, Play, RefreshCw, AlertTriangle, ShieldAlert,
  Cpu, Database, Layers, Radio, ChevronRight, Info,
} from 'lucide-react'

const PANEL_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: 72,
  right: 12,
  bottom: 12,
  width: 340,
  background: '#0A0D12',
  border: '1px solid #1A2030',
  borderRadius: 14,
  boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
  zIndex: 50,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: "'DM Sans', sans-serif",
  color: '#E8EDF3',
  animation: 'slideInRight 0.2s ease',
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: 1.5, color: '#3A4455', textTransform: 'uppercase',
      marginBottom: 5,
    }}>
      {children}
    </div>
  )
}

function SectionHead({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: 1.5, color: '#8B95A3', textTransform: 'uppercase',
      marginBottom: 10,
    }}>
      {icon}{label}
    </div>
  )
}

function ChaosBtn({
  onClick, color = '#EF4444', icon, label, disabled, disabledTip,
}: {
  onClick: () => void
  color?: string
  icon: React.ReactNode
  label: string
  disabled?: boolean
  disabledTip?: string
}) {
  const [showTip, setShowTip] = useState(false)

  const handleClick = () => {
    if (disabled) { setShowTip(true); setTimeout(() => setShowTip(false), 2500); return }
    onClick()
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleClick}
        style={{
          width: '100%',
          padding: '8px 10px',
          background: disabled ? '#0D1018' : `${color}10`,
          border: `1px solid ${disabled ? '#141820' : color + '30'}`,
          borderRadius: 8,
          color: disabled ? '#2A3140' : color,
          fontSize: 11, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.15s',
          fontFamily: "'DM Sans', sans-serif",
        }}
        onMouseEnter={e => {
          if (!disabled) {
            e.currentTarget.style.background = `${color}20`
            e.currentTarget.style.borderColor = `${color}60`
          }
        }}
        onMouseLeave={e => {
          if (!disabled) {
            e.currentTarget.style.background = `${color}10`
            e.currentTarget.style.borderColor = `${color}30`
          }
        }}
      >
        {icon}{label}
      </button>
      {showTip && disabledTip && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#1A2030', border: '1px solid #2D3748',
          borderRadius: 6, padding: '6px 10px',
          fontSize: 10, color: '#F59E0B', lineHeight: 1.5, zIndex: 999,
        }}>
          ⚠ {disabledTip}
        </div>
      )}
    </div>
  )
}

export function NodeConfigPanel() {
  const { selectedNodeId, setSelectedNodeId, nodeConfigs, setNodeConfig, nodes, edges } = useCanvasStore()
  const chaos = useChaos()
  const { result: blastResult, loading: blastLoading, error: blastError, analyze: runBlast } = useBlastRadius()
  const simStatus = useSimulationStore(s => s.simState.status)

  if (!selectedNodeId) return null
  const config = nodeConfigs[selectedNodeId]
  if (!config) return null

  const isSimRunning = simStatus === 'RUNNING'
  const chaosDisabledTip = 'Start the simulation first — use the ▶ button in the top toolbar.'

  const handleUpdate = (field: string, val: unknown) => {
    setNodeConfig(selectedNodeId, { [field]: val })
  }

  const handleRunBlast = () => {
    runBlast(nodes, edges, selectedNodeId)
  }

  const riskColors: Record<string, string> = {
    CRITICAL: '#EF4444',
    HIGH: '#F97316',
    MEDIUM: '#F59E0B',
    LOW: '#10B981',
  }

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { opacity:0; transform:translateX(16px); }
          to   { opacity:1; transform:translateX(0); }
        }
      `}</style>
      <div style={PANEL_STYLE}>
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid #141820',
          background: '#07090D',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366F1', boxShadow: '0 0 8px #6366F1', flexShrink: 0 }} />
              Configure Node
            </div>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#3A4455', marginTop: 2 }}>
              {config.id}
            </div>
          </div>
          <button
            onClick={() => setSelectedNodeId(null)}
            style={{
              background: 'none', border: '1px solid #1A2030', borderRadius: 6,
              color: '#4A5568', cursor: 'pointer', padding: '4px 6px',
              display: 'flex', alignItems: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D3748'; e.currentTarget.style.color = '#E8EDF3' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A2030'; e.currentTarget.style.color = '#4A5568' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Parameters */}
          <div>
            <SectionHead icon={<Cpu size={11} />} label="Parameters" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Label */}
              <div>
                <Label>Label</Label>
                <input
                  type="text"
                  value={config.label}
                  onChange={e => handleUpdate('label', e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#07090D', border: '1px solid #1A2030',
                    borderRadius: 7, padding: '7px 10px',
                    fontSize: 12, color: '#E8EDF3', outline: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
                  onBlur={e => e.currentTarget.style.borderColor = '#1A2030'}
                />
              </div>

              {/* Logical Layer */}
              <div>
                <Label>Logical Layer</Label>
                <select
                  value={config.layer ?? ''}
                  onChange={e => handleUpdate('layer', e.target.value || undefined)}
                  style={{
                    width: '100%', background: '#07090D', border: '1px solid #1A2030',
                    borderRadius: 7, padding: '7px 10px',
                    fontSize: 12, color: '#E8EDF3', outline: 'none',
                  }}
                >
                  <option value="">None</option>
                  <option value="FRONTEND">Frontend Layer</option>
                  <option value="API">API Layer</option>
                  <option value="DATA">Data Layer</option>
                </select>
              </div>

              {/* SERVICE-specific */}
              {config.type === 'SERVICE' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <Label>Replicas</Label>
                      <input type="number" min={1} max={10}
                        value={config.replicas ?? 1}
                        onChange={e => handleUpdate('replicas', parseInt(e.target.value) || 1)}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: '#07090D', border: '1px solid #1A2030',
                          borderRadius: 7, padding: '7px 10px', fontSize: 12, color: '#E8EDF3', outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <Label>Latency (ms)</Label>
                      <input type="number" min={10} max={5000}
                        value={config.processingTimeMs ?? 50}
                        onChange={e => handleUpdate('processingTimeMs', parseInt(e.target.value) || 50)}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: '#07090D', border: '1px solid #1A2030',
                          borderRadius: 7, padding: '7px 10px', fontSize: 12, color: '#E8EDF3', outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>CPU Limit (%)</Label>
                    <input type="range" min={50} max={200} step={10}
                      value={config.cpuLimit ?? 100}
                      onChange={e => handleUpdate('cpuLimit', parseInt(e.target.value) || 100)}
                      style={{ width: '100%', accentColor: '#6366F1' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#3A4455', fontFamily: "'JetBrains Mono', monospace" }}>
                      <span>50%</span>
                      <span style={{ color: '#8B9CF8' }}>{config.cpuLimit ?? 100}% CPU</span>
                      <span>200%</span>
                    </div>
                  </div>
                </>
              )}

              {/* DATABASE-specific */}
              {(config.type === 'DATABASE' || config.type === 'ELASTICSEARCH' || config.type === 'REDIS') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <Label>Pool Size</Label>
                    <input type="number" min={1} max={100}
                      value={config.connectionPoolSize ?? 20}
                      onChange={e => handleUpdate('connectionPoolSize', parseInt(e.target.value) || 20)}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: '#07090D', border: '1px solid #1A2030',
                        borderRadius: 7, padding: '7px 10px', fontSize: 12, color: '#E8EDF3', outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <Label>Engine</Label>
                    <select
                      value={config.dbType ?? 'POSTGRESQL'}
                      onChange={e => handleUpdate('dbType', e.target.value)}
                      style={{
                        width: '100%', background: '#07090D', border: '1px solid #1A2030',
                        borderRadius: 7, padding: '7px 10px', fontSize: 12, color: '#E8EDF3', outline: 'none',
                      }}
                    >
                      <option value="POSTGRESQL">PostgreSQL</option>
                      <option value="REDIS">Redis</option>
                      <option value="MONGODB">MongoDB</option>
                      <option value="CASSANDRA">Cassandra</option>
                    </select>
                  </div>
                </div>
              )}

              {/* QUEUE-specific */}
              {(config.type === 'MESSAGE_QUEUE' || config.type === 'KAFKA' || config.type === 'RABBITMQ') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <Label>Max Queue Size</Label>
                    <input type="number" min={10} max={10000}
                      value={config.maxQueueDepth ?? 300}
                      onChange={e => handleUpdate('maxQueueDepth', parseInt(e.target.value) || 300)}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: '#07090D', border: '1px solid #1A2030',
                        borderRadius: 7, padding: '7px 10px', fontSize: 12, color: '#E8EDF3', outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <Label>Broker Type</Label>
                    <select
                      value={config.queueType ?? 'KAFKA'}
                      onChange={e => handleUpdate('queueType', e.target.value)}
                      style={{
                        width: '100%', background: '#07090D', border: '1px solid #1A2030',
                        borderRadius: 7, padding: '7px 10px', fontSize: 12, color: '#E8EDF3', outline: 'none',
                      }}
                    >
                      <option value="KAFKA">Apache Kafka</option>
                      <option value="RABBITMQ">RabbitMQ</option>
                      <option value="SQS">AWS SQS</option>
                    </select>
                  </div>
                </div>
              )}

              {/* LOAD BALANCER-specific */}
              {config.type === 'LOAD_BALANCER' && (
                <div>
                  <Label>Algorithm</Label>
                  <select
                    value={config.algorithm ?? 'ROUND_ROBIN'}
                    onChange={e => handleUpdate('algorithm', e.target.value)}
                    style={{
                      width: '100%', background: '#07090D', border: '1px solid #1A2030',
                      borderRadius: 7, padding: '7px 10px', fontSize: 12, color: '#E8EDF3', outline: 'none',
                    }}
                  >
                    <option value="ROUND_ROBIN">Round Robin</option>
                    <option value="LEAST_CONNECTIONS">Least Connections</option>
                    <option value="IP_HASH">IP Hash</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Inject Chaos */}
          <div>
            <SectionHead icon={<AlertTriangle size={11} style={{ color: '#F59E0B' }} />} label="Inject Chaos" />

            {!isSimRunning && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#F59E0B0A', border: '1px solid #F59E0B25',
                borderRadius: 7, padding: '7px 10px', marginBottom: 10,
                fontSize: 10, color: '#F59E0B', lineHeight: 1.5,
              }}>
                <Info size={11} style={{ flexShrink: 0 }} />
                Start the simulation first — press ▶ in the top toolbar to enable chaos injection.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <ChaosBtn onClick={() => chaos.killNode(config.id)} icon={<ShieldAlert size={12} />}
                  label="Kill Node" color="#EF4444"
                  disabled={!isSimRunning} disabledTip={chaosDisabledTip} />
                <ChaosBtn onClick={() => chaos.recoverNode(config.id)} icon={<RefreshCw size={12} />}
                  label="Recover" color="#10B981"
                  disabled={!isSimRunning} disabledTip={chaosDisabledTip} />
              </div>

              {config.type === 'SERVICE' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <ChaosBtn onClick={() => chaos.spikeCpu(config.id)} icon={<Cpu size={12} />}
                      label="Spike CPU" color="#6366F1"
                      disabled={!isSimRunning} disabledTip={chaosDisabledTip} />
                    <ChaosBtn onClick={() => chaos.applyMemoryPressure(config.id)} icon={<Layers size={12} />}
                      label="Leak Memory" color="#F59E0B"
                      disabled={!isSimRunning} disabledTip={chaosDisabledTip} />
                  </div>
                  {(config.replicas ?? 1) > 1 && (
                    <ChaosBtn onClick={() => chaos.killReplica(config.id)} icon={<Radio size={12} />}
                      label="Kill 1 Replica" color="#EC4899"
                      disabled={!isSimRunning} disabledTip={chaosDisabledTip} />
                  )}
                </>
              )}

              {(config.type === 'DATABASE' || config.type === 'ELASTICSEARCH' || config.type === 'REDIS') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <ChaosBtn onClick={() => chaos.exhaustConnections(config.id)} icon={<Database size={12} />}
                    label="Exhaust Pool" color="#06B6D4"
                    disabled={!isSimRunning} disabledTip={chaosDisabledTip} />
                  <ChaosBtn onClick={() => chaos.triggerCacheExpiration(config.id)} icon={<RefreshCw size={12} />}
                    label="Expire Cache" color="#F97316"
                    disabled={!isSimRunning} disabledTip={chaosDisabledTip} />
                </div>
              )}
            </div>
          </div>

          {/* Blast Radius Analysis */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <SectionHead icon={<ShieldAlert size={11} style={{ color: '#EF4444' }} />} label="Blast Radius" />
              <button
                onClick={handleRunBlast}
                disabled={blastLoading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px',
                  background: blastLoading ? '#0D1018' : 'rgba(99,102,241,0.12)',
                  border: `1px solid ${blastLoading ? '#1A2030' : 'rgba(99,102,241,0.35)'}`,
                  borderRadius: 6, color: blastLoading ? '#3A4455' : '#8B9CF8',
                  fontSize: 10, fontWeight: 700, cursor: blastLoading ? 'not-allowed' : 'pointer',
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1,
                  transition: 'all 0.15s',
                }}
              >
                <Play size={9} />
                {blastLoading ? 'ANALYZING...' : 'ANALYZE'}
              </button>
            </div>

            <div style={{
              fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#2A3140',
              letterSpacing: 1, marginBottom: 10,
            }}>
              CLIENT-SIDE · NO API REQUIRED
            </div>

            {blastError && (
              <div style={{
                background: '#EF444410', border: '1px solid #EF444425',
                borderRadius: 7, padding: '8px 10px', fontSize: 11, color: '#EF4444',
                marginBottom: 10,
              }}>
                {blastError}
              </div>
            )}

            {blastResult && (
              <div style={{
                background: '#07090D', border: '1px solid #141820',
                borderRadius: 10, overflow: 'hidden',
              }}>
                {/* Summary row */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderBottom: '1px solid #141820',
                }}>
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#4A5568', letterSpacing: 1 }}>
                    AFFECTED TRAFFIC
                  </span>
                  <span style={{
                    fontSize: 18, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2,
                    color: blastResult.totalAffectedTrafficPercent > 60 ? '#EF4444'
                      : blastResult.totalAffectedTrafficPercent > 30 ? '#F59E0B' : '#10B981',
                  }}>
                    {blastResult.totalAffectedTrafficPercent}%
                  </span>
                </div>

                {/* Affected nodes */}
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#2A3140', letterSpacing: 1.5, marginBottom: 4 }}>
                    RISK MATRIX
                  </div>
                  {blastResult.affectedNodes.map(n => (
                    <div key={n.nodeId} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '4px 0',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <ChevronRight size={10} style={{ color: '#2A3140', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: '#8B95A3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.nodeId}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#3A4455' }}>
                          D:{n.depth}
                        </span>
                        <span style={{
                          fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                          padding: '2px 6px', borderRadius: 4,
                          background: `${riskColors[n.riskLevel]}15`,
                          color: riskColors[n.riskLevel],
                          border: `1px solid ${riskColors[n.riskLevel]}30`,
                          fontWeight: 700,
                        }}>
                          {n.riskLevel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Critical paths */}
                {blastResult.criticalPaths.length > 0 && (
                  <div style={{ padding: '8px 12px', borderTop: '1px solid #0D1018' }}>
                    <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#2A3140', letterSpacing: 1.5, marginBottom: 6 }}>
                      CRITICAL PATH
                    </div>
                    {blastResult.criticalPaths.slice(0, 1).map((path, i) => (
                      <div key={i} style={{
                        fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                        color: '#4A5568', lineHeight: 1.8,
                        wordBreak: 'break-all',
                      }}>
                        {path.join(' → ')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
