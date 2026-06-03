// Dashboard.tsx — Archaos
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { api } from '../lib/api'
import { Navbar } from '../components/layout/Navbar'
import { Plus, Trash2, Play, Network, Zap, Clock, Terminal, X, AlertCircle } from 'lucide-react'
import type { Topology } from '../types/topology'

// ─── Scenario definitions ─────────────────────────────────────────────────────
const SCENARIOS = [
  { id: 'cascade', label: 'Cascade Failure', color: '#EF4444', icon: '⛓', desc: 'DB overwhelm triggers service-by-service collapse' },
  { id: 'partition', label: 'Network Partition', color: '#F59E0B', icon: '✂', desc: 'Split-brain across two datacenter zones' },
  { id: 'overload', label: 'Traffic Overload', color: '#8B5CF6', icon: '⚡', desc: 'Request storm exhausts all gateway threads' },
  { id: 'memory', label: 'Memory Leak', color: '#06B6D4', icon: '🧠', desc: 'Gradual heap growth causes OOM across pods' },
  { id: 'latency', label: 'Latency Spike', color: '#10B981', icon: '⏱', desc: 'P99 tail latency cascades into timeouts' },
  { id: 'dns', label: 'DNS Failure', color: '#F97316', icon: '🌐', desc: 'Resolver outage silently breaks service mesh' },
  { id: 'deadlock', label: 'Distributed Deadlock', color: '#EC4899', icon: '🔒', desc: 'Circular lock acquisition across 3 services' },
  { id: 'corruption', label: 'Data Corruption', color: '#6366F1', icon: '💾', desc: 'Silent write errors propagate across replicas' },
]

// ─── Mini topology preview canvas ────────────────────────────────────────────
function TopologyPreview({ topology, color = '#6366F1' }: { topology: Topology; color?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    c.width = c.offsetWidth * window.devicePixelRatio
    c.height = c.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    const W = c.offsetWidth, H = c.offsetHeight

    const nodes: { x: number; y: number; r: number }[] = []
    const rawNodes = Array.isArray(topology.nodesJson)
      ? topology.nodesJson
      : typeof topology.nodesJson === 'string'
      ? JSON.parse(topology.nodesJson)
      : []
    const nodeCount = Math.min(Math.max((rawNodes?.length || 0), 3), 8)
    if (nodeCount === 0) return

    // Place nodes in a rough circle with some jitter
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2 - Math.PI / 2
      const jitter = 0.85 + Math.random() * 0.15
      nodes.push({
        x: W / 2 + Math.cos(angle) * (W * 0.33 * jitter),
        y: H / 2 + Math.sin(angle) * (H * 0.33 * jitter),
        r: 3 + Math.random() * 2,
      })
    }

    // Edges
    ctx.strokeStyle = color + '30'
    ctx.lineWidth = 0.8
    for (let i = 0; i < nodes.length; i++) {
      const next = nodes[(i + 1) % nodes.length]
      ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(next.x, next.y); ctx.stroke()
      if (i % 3 === 0 && i + 2 < nodes.length) {
        ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[i + 2].x, nodes[i + 2].y); ctx.stroke()
      }
    }

    // Nodes
    nodes.forEach((n, i) => {
      const alpha = i === 0 ? 1 : 0.6
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3)
      grd.addColorStop(0, color + '40'); grd.addColorStop(1, 'transparent')
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = color + (alpha === 1 ? 'FF' : '99')
      ctx.shadowBlur = 6; ctx.shadowColor = color
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0
    })
  }, [topology, color])

  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
}

// ─── Animated background grid ─────────────────────────────────────────────────
function BackgroundGrid() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      backgroundImage: `
        linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)
      `,
      backgroundSize: '48px 48px',
    }}>
      {/* Radial vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 40% at 80% 80%, rgba(239,68,68,0.04) 0%, transparent 60%)',
      }} />
    </div>
  )
}

// ─── Typed terminal log line ──────────────────────────────────────────────────
function LogLine({ text, delay = 0, color = '#4A5568', prefix = '$' }: { text: string; delay?: number; color?: string; prefix?: string }) {
  const [shown, setShown] = useState('')
  const [active, setActive] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setActive(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  useEffect(() => {
    if (!active) return
    let i = 0
    const iv = setInterval(() => { setShown(text.slice(0, ++i)); if (i >= text.length) clearInterval(iv) }, 28)
    return () => clearTimeout(iv)
  }, [active, text])
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minHeight: 18 }}>
      <span style={{ color: '#2A3140', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, flexShrink: 0, marginTop: 1 }}>{prefix}</span>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color, lineHeight: 1.6, letterSpacing: 0.3 }}>
        {shown}
        {shown.length < text.length && active && (
          <span style={{ display: 'inline-block', width: 6, height: 10, background: color, verticalAlign: 'middle', marginLeft: 2, animation: 'blink 0.7s infinite' }} />
        )}
      </span>
    </div>
  )
}

// ─── Scenario card ────────────────────────────────────────────────────────────
function ScenarioCard({ s, onLaunch }: { s: typeof SCENARIOS[0]; onLaunch: (id: string) => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onLaunch(s.id)}
      style={{
        background: hovered ? `${s.color}08` : '#0A0D12',
        border: `1px solid ${hovered ? s.color + '40' : '#141820'}`,
        borderRadius: 12,
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? `0 8px 24px ${s.color}10` : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${s.color}15`, border: `1px solid ${s.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, color: s.color, flexShrink: 0,
      }}>
        {s.icon}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 2 }}>{s.label}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>{s.desc}</div>
      </div>
    </div>
  )
}

// ─── Topology card ────────────────────────────────────────────────────────────
const CARD_COLORS = ['#6366F1', '#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444']

function TopologyCard({ t, idx, onClick, onDelete }: { t: Topology; idx: number; onClick: () => void; onDelete: (e: React.MouseEvent) => void }) {
  const [hovered, setHovered] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const color = CARD_COLORS[idx % CARD_COLORS.length]

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleting(true)
    setTimeout(() => onDelete(e), 200)
  }

  const rawNodes = Array.isArray(t.nodesJson)
    ? t.nodesJson
    : typeof t.nodesJson === 'string'
    ? JSON.parse(t.nodesJson)
    : []

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        border: `1px solid ${hovered ? color + '40' : '#141820'}`,
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: deleting ? 'scale(0.9)' : hovered ? 'translateY(-3px)' : 'translateY(0)',
        opacity: deleting ? 0 : 1,
        boxShadow: hovered ? `0 12px 32px ${color}14, 0 0 0 1px ${color}20` : '0 2px 8px rgba(0,0,0,0.3)',
        animation: `fadeUp 0.5s ${idx * 0.08 + 0.1}s both ease`,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        background: '#0A0D12',
      }}
    >
      {/* Preview area */}
      <div style={{
        height: 110, position: 'relative', overflow: 'hidden',
        background: `radial-gradient(ellipse at 50% 100%, ${color}12 0%, transparent 70%), #07090D`,
        borderBottom: `1px solid ${hovered ? color + '30' : '#141820'}`,
        transition: 'border-color 0.25s',
      }}>
        <TopologyPreview topology={t} color={color} />
        {/* Scanline overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.04) 3px,rgba(0,0,0,0.04) 4px)',
          pointerEvents: 'none',
        }} />
        {/* Node count badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(7,9,13,0.8)', backdropFilter: 'blur(6px)',
          border: `1px solid ${color}30`, borderRadius: 5,
          padding: '3px 7px', display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Network size={9} style={{ color }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: color, letterSpacing: 1 }}>
            {rawNodes?.length || 0} NODES
          </span>
        </div>
        {/* Delete button */}
        <button
          onClick={handleDelete}
          style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(7,9,13,0.85)', backdropFilter: 'blur(6px)',
            border: '1px solid #1E2530', borderRadius: 6,
            padding: 5, cursor: 'pointer', display: 'flex',
            color: '#3A4455',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.2s, color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#EF444430' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#3A4455'; e.currentTarget.style.borderColor = '#1E2530' }}
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: hovered ? color : '#C8D0DA',
          transition: 'color 0.2s',
          fontFamily: "'DM Sans',sans-serif",
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{t.name}</div>
        <div style={{
          fontSize: 11, color: '#3A4455', lineHeight: 1.6,
          fontFamily: "'DM Sans',sans-serif",
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          minHeight: 34,
        }}>{t.description || 'No description provided.'}</div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 'auto', paddingTop: 10,
          borderTop: '1px solid #141820',
        }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#2A3140', letterSpacing: 1 }}>
            {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
          </span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
            color: hovered ? color : '#3A4455',
            transition: 'color 0.2s', letterSpacing: 1,
          }}>
            OPEN <Play size={8} style={{ marginTop: 0.5 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Create modal ─────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, desc: string) => void }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [focused, setFocused] = useState<string | null>(null)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(7,9,13,0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        border: '1px solid #1A2030', borderRadius: 16,
        overflow: 'hidden', animation: 'scaleIn 0.2s ease',
        background: '#090C12',
      }}>
        {/* Header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #141820',
          background: 'rgba(99,102,241,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', boxShadow: '0 0 8px #6366F1' }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#8B95A3', letterSpacing: 2 }}>NEW TOPOLOGY</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5568', padding: 4, display: 'flex', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#E8EDF3'}
            onMouseLeave={e => e.currentTarget.style.color = '#4A5568'}
          ><X size={15} /></button>
        </div>

        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: 10, color: focused === 'name' ? '#6366F1' : '#4A5568', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2.5, display: 'block', marginBottom: 7, transition: 'color 0.2s' }}>TOPOLOGY NAME</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 8, border: `1px solid ${focused === 'name' ? '#6366F1' : '#1A2030'}`, boxShadow: focused === 'name' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none', transition: 'all 0.2s', pointerEvents: 'none' }} />
              <input
                type="text" placeholder="Production Gateway v2"
                value={name} onChange={e => setName(e.target.value)}
                onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, background: '#07090D', border: '1px solid transparent', color: '#E8EDF3', fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 10, color: focused === 'desc' ? '#6366F1' : '#4A5568', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2.5, display: 'block', marginBottom: 7, transition: 'color 0.2s' }}>DESCRIPTION <span style={{ color: '#2A3140' }}>(optional)</span></label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 8, border: `1px solid ${focused === 'desc' ? '#6366F1' : '#1A2030'}`, boxShadow: focused === 'desc' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none', transition: 'all 0.2s', pointerEvents: 'none' }} />
              <textarea
                placeholder="Inspecting database replication bottlenecks under partition stress..."
                value={desc} onChange={e => setDesc(e.target.value)}
                onFocus={() => setFocused('desc')} onBlur={() => setFocused(null)}
                rows={3}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, background: '#07090D', border: '1px solid transparent', color: '#E8EDF3', fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '11px', borderRadius: 9,
              background: '#0D1118', border: '1px solid #1A2030',
              color: '#8B95A3', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D3748'; e.currentTarget.style.color = '#E8EDF3' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A2030'; e.currentTarget.style.color = '#8B95A3' }}
            >Cancel</button>
            <button
              onClick={() => { if (name.trim()) onCreate(name.trim(), desc.trim()) }}
              disabled={!name.trim()}
              style={{
                flex: 2, padding: '11px', borderRadius: 9,
                background: name.trim() ? 'linear-gradient(135deg, #6366F1, #4338CA)' : '#0D1118',
                border: `1px solid ${name.trim() ? 'transparent' : '#1A2030'}`,
                color: name.trim() ? '#fff' : '#4A5568',
                fontSize: 13, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed',
                fontFamily: "'DM Sans',sans-serif",
                transition: 'all 0.2s',
                boxShadow: name.trim() ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
              <Plus size={14} /> Create Sandbox
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export function Dashboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [topologies, setTopologies] = useState<Topology[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activityLog, setActivityLog] = useState<{ time: string; msg: string; color: string }[]>([])

  useEffect(() => {
    if (!isAuthenticated()) navigate('/auth')
  }, [isAuthenticated, navigate])

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  useEffect(() => {
    async function load() {
      try {
        const list = await api.topologies.list()
        setTopologies(list)
        setActivityLog(list.slice(0, 4).map((t, i) => ({
          time: new Date(t.updatedAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          msg: `topology "${t.name}" loaded`,
          color: CARD_COLORS[i % CARD_COLORS.length],
        })))
      } catch (err) {
        console.error(err)
        const mocks: Topology[] = [
          { id: 'prod-grid', name: 'Production Grid', description: 'Multi-datacenter setup with custom caching layers.', isPublic: false, updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), nodesJson: new Array(7), edgesJson: [] },
          { id: 'cascade-test', name: 'Cascade Model', description: 'Identical replica config testing CB threshold speeds.', isPublic: true, updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(), nodesJson: new Array(5), edgesJson: [] },
          { id: 'mesh-v2', name: 'Service Mesh v2', description: 'East-west traffic observability across microservices.', isPublic: false, updatedAt: new Date().toISOString(), nodesJson: new Array(9), edgesJson: [] },
        ]
        setTopologies(mocks)
        setActivityLog([
          { time: '09:42', msg: 'cascade failure simulation completed', color: '#EF4444' },
          { time: '09:31', msg: 'topology "mesh-v2" saved', color: '#6366F1' },
          { time: '09:18', msg: 'network partition injected — 2 zones', color: '#F59E0B' },
          { time: '08:55', msg: 'session started', color: '#10B981' },
        ])
      } finally {
        setLoading(false)
      }
    }
    if (user) load()
  }, [user])

  const handleCreate = async (name: string, desc: string) => {
    setShowCreate(false)
    try {
      const created = await api.topologies.create({ name, description: desc, nodesJson: [], edgesJson: [] })
      setTopologies(prev => [created, ...prev])
      navigate(`/editor?id=${created.id}`)
    } catch {
      const mockId = `local-${Math.random().toString(36).slice(2, 8)}`
      navigate(`/editor?id=${mockId}&name=${encodeURIComponent(name)}`)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.topologies.delete(id)
    } catch {
      // Ignored: delete failed or offline
    }
    setTopologies(prev => prev.filter(t => t.id !== id))
  }

  const launchScenario = (id: string) => navigate(`/editor?scenario=${id}`)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#07090D',
      color: '#E8EDF3',
      fontFamily: "'DM Sans',sans-serif",
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse-glow {
          0%,100%{box-shadow:0 0 12px rgba(99,102,241,0.3)}
          50%{box-shadow:0 0 24px rgba(99,102,241,0.6)}
        }
        @keyframes shimmer {
          0%{transform:translateX(-100%)} 100%{transform:translateX(200%)}
        }
        @keyframes marquee-dot {
          0%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} 100%{opacity:0.3;transform:scale(0.8)}
        }
        ::placeholder { color:#1E2530; }
        input, textarea { caret-color:#6366F1; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#07090D; }
        ::-webkit-scrollbar-thumb { background:#1A2030; border-radius:2px; }

        .start-btn {
          transition:all 0.2s ease !important;
          position:relative; overflow:hidden;
        }
        .start-btn::after {
          content:'';position:absolute;inset:0;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);
          transform:translateX(-100%);
        }
        .start-btn:hover::after { animation:shimmer 0.6s ease; }
        .start-btn:hover { transform:translateY(-2px) !important; box-shadow:0 12px 40px rgba(99,102,241,0.4) !important; }
        .start-btn:active { transform:scale(0.98) !important; }
      `}</style>

      <BackgroundGrid />
      <Navbar />

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '96px 32px 64px',
        position: 'relative', zIndex: 1,
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}>

        {/* ── HERO HEADER ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: 40, gap: 24,
          animation: 'fadeUp 0.6s 0.1s both ease',
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 6, padding: '4px 10px', marginBottom: 14,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'marquee-dot 2s infinite' }} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#6366F1', letterSpacing: 2.5 }}>
                SYSTEM ACTIVE — {user?.email || 'UNKNOWN'}
              </span>
            </div>
            <h1 style={{
              fontFamily: "'Bebas Neue'", fontSize: 52, letterSpacing: 2,
              color: '#E8EDF3', lineHeight: 0.95, marginBottom: 12,
            }}>
              WELCOME BACK,<br />
              <span style={{ color: '#6366F1' }}>{(user?.name || 'DEVELOPER').toUpperCase()}</span>
            </h1>
            <p style={{ fontSize: 13, color: '#8B95A3', lineHeight: 1.7, maxWidth: 420 }}>
              Your chaos engineering workspace. Launch a scenario, open a saved topology, or build a new simulation from scratch.
            </p>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
            <button
              className="start-btn"
              onClick={() => navigate('/editor')}
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #4338CA 100%)',
                border: '1px solid transparent',
                borderRadius: 12, color: '#fff',
                fontSize: 14, fontWeight: 700,
                cursor: 'pointer', letterSpacing: 0.5,
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                animation: 'pulse-glow 3s infinite',
              }}>
              <Zap size={16} />
              Start Simulating
            </button>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                padding: '11px 20px',
                background: '#0D1118', border: '1px solid #1A2030',
                borderRadius: 10, color: '#8B95A3',
                fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D3748'; e.currentTarget.style.color = '#E8EDF3' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A2030'; e.currentTarget.style.color = '#8B95A3' }}
            >
              <Plus size={14} /> New Topology
            </button>
          </div>
        </div>

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* LEFT: Scenarios + Topologies */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* ── SCENARIOS ── */}
            <section style={{ animation: 'fadeUp 0.6s 0.2s both ease' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
              }}>
                <div style={{ width: 2, height: 18, background: '#6366F1', borderRadius: 1 }} />
                <h2 style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2.5, color: '#8B95A3' }}>QUICK LAUNCH — SCENARIOS</h2>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, #1A2030, transparent)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {SCENARIOS.map((s) => (
                  <ScenarioCard key={s.id} s={s} onLaunch={launchScenario} />
                ))}
              </div>
            </section>

            {/* ── TOPOLOGIES ── */}
            <section style={{ animation: 'fadeUp 0.6s 0.35s both ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 2, height: 18, background: '#10B981', borderRadius: 1 }} />
                <h2 style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2.5, color: '#8B95A3' }}>SAVED TOPOLOGIES</h2>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, #1A2030, transparent)' }} />
                <button onClick={() => setShowCreate(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: '1px solid #1A2030', borderRadius: 6,
                  padding: '5px 10px', color: '#4A5568', cursor: 'pointer', fontSize: 10,
                  fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F130'; e.currentTarget.style.color = '#6366F1' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A2030'; e.currentTarget.style.color = '#4A5568' }}
                >
                  <Plus size={10} /> NEW
                </button>
              </div>

              {loading ? (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: 160, gap: 10, color: '#2A3140',
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: 2,
                }}>
                  <span style={{ width: 14, height: 14, border: '2px solid #1A2030', borderTopColor: '#6366F1', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  LOADING...
                </div>
              ) : topologies.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  height: 180, gap: 12,
                  border: '1px dashed #141820', borderRadius: 14,
                  background: 'rgba(99,102,241,0.02)',
                }}>
                  <Network size={28} style={{ color: '#1A2030' }} />
                  <p style={{ color: '#3A4455', fontSize: 12, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>NO TOPOLOGIES YET</p>
                  <button onClick={() => setShowCreate(true)} style={{
                    padding: '9px 18px', borderRadius: 8, fontSize: 11,
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                    color: '#6366F1', cursor: 'pointer', fontWeight: 600,
                    transition: 'all 0.2s',
                  }}>Create your first topology</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                  {topologies.map((t, i) => (
                    <TopologyCard
                      key={t.id} t={t} idx={i}
                      onClick={() => navigate(`/editor?id=${t.id}`)}
                      onDelete={(e) => handleDelete(t.id, e)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT: Activity log + terminal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.6s 0.3s both ease' }}>

            {/* Activity log */}
            <div style={{
              border: '1px solid #141820',
              borderRadius: 14, overflow: 'hidden',
              background: '#090C12',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 16px',
                borderBottom: '1px solid #141820',
                background: 'rgba(16,185,129,0.04)',
              }}>
                <Clock size={11} style={{ color: '#10B981' }} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#8B95A3', letterSpacing: 2, flex: 1 }}>ACTIVITY LOG</span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'marquee-dot 2s infinite' }} />
              </div>

              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {activityLog.length === 0 ? (
                  <div style={{ padding: '16px 0', textAlign: 'center', color: '#2A3140', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: 1 }}>NO ACTIVITY YET</div>
                ) : (
                  activityLog.map((entry, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      padding: '9px 0',
                      borderBottom: i < activityLog.length - 1 ? '1px solid #0D1018' : 'none',
                      animation: `fadeUp 0.4s ${i * 0.07}s both ease`,
                    }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#2A3140', flexShrink: 0, marginTop: 2, letterSpacing: 0.5 }}>{entry.time}</span>
                      <div style={{ width: 2, alignSelf: 'stretch', background: entry.color + '40', borderRadius: 1, flexShrink: 0, marginTop: 3 }} />
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#4A5568', lineHeight: 1.5, letterSpacing: 0.3 }}>{entry.msg}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live terminal */}
            <div style={{
              background: '#090C12',
              border: '1px solid #141820',
              borderRadius: 14, overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 16px',
                borderBottom: '1px solid #141820',
                background: 'rgba(99,102,241,0.04)',
              }}>
                <Terminal size={11} style={{ color: '#6366F1' }} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#8B95A3', letterSpacing: 2, flex: 1 }}>SYSTEM STATUS</span>
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <LogLine text="archaos v1.0 — ready" delay={300} color="#10B981" prefix=">" />
                <LogLine text={`topologies: ${loading ? '...' : topologies.length} loaded`} delay={900} color="#6366F1" prefix=">" />
                <LogLine text="scenarios: 8 available" delay={1500} color="#06B6D4" prefix=">" />
                <LogLine text="ai narrator: standby" delay={2100} color="#8B5CF6" prefix=">" />
                <LogLine text="canvas engine: 60fps" delay={2700} color="#F59E0B" prefix=">" />
              </div>
            </div>

            {/* Tip card */}
            <div style={{
              background: 'rgba(99,102,241,0.05)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 14, padding: '16px',
              animation: 'fadeUp 0.6s 0.5s both ease',
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertCircle size={14} style={{ color: '#6366F1', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#8B95A3', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5, marginBottom: 6 }}>PRO TIP</div>
                  <p style={{ fontSize: 11, color: '#4A5568', lineHeight: 1.7, fontFamily: "'DM Sans',sans-serif" }}>
                    Launch any scenario from the editor to inject live chaos events and watch the AI narrator predict failure propagation in real time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}