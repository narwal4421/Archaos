// Scenarios.tsx — Archaos
// Full aesthetic overhaul matching Auth / Dashboard / Editor chrome.

import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { ChevronRight, Zap, Terminal, BookOpen } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────
const SCENARIOS = [
  {
    id: 'the-cascade',
    name: 'The Cascade',
    desc: 'A database slowdown cascades upstream through 6 services in 90 seconds, causing complete thread exhaustion.',
    category: 'RESILIENCE',
    difficulty: 'BEGINNER' as const,
    color: '#EF4444',
    highlights: ['Cascading Timeout', 'Thread Exhaustion', 'Synchronous Hops'],
    nodes: 8, edges: 7,
    pattern: 'linear',
  },
  {
    id: 'the-retry-storm',
    name: 'The Retry Storm',
    desc: 'Aggressive client retries without exponential backoff or jitter amplify load 4x on a struggling service.',
    category: 'TRAFFIC',
    difficulty: 'INTERMEDIATE' as const,
    color: '#F59E0B',
    highlights: ['Traffic Amplification', 'Fixed Retries', 'Self-Inflicted DDOS'],
    nodes: 3, edges: 2,
    pattern: 'chain',
  },
  {
    id: 'the-thundering-herd',
    name: 'Thundering Herd',
    desc: 'A critical cache item expires under heavy traffic, sending a stampede of simultaneous requests to Postgres.',
    category: 'CACHING',
    difficulty: 'INTERMEDIATE' as const,
    color: '#8B5CF6',
    highlights: ['Cache Stampede', 'Connection Pool', 'Mutex Locks'],
    nodes: 4, edges: 3,
    pattern: 'star',
  },
  {
    id: 'split-brain',
    name: 'Split Brain',
    desc: 'A network partition isolates a primary database from its follower. Both promote themselves, writes diverge.',
    category: 'DATABASE',
    difficulty: 'ADVANCED' as const,
    color: '#06B6D4',
    highlights: ['CAP Theorem', 'Network Partition', 'Active-Active Split'],
    nodes: 4, edges: 3,
    pattern: 'dual',
  },
  {
    id: 'graceful-degradation',
    name: 'Graceful Degradation',
    desc: 'Same database slowdown as The Cascade — but circuit breakers enabled upstream isolate and save the app.',
    category: 'RESILIENCE',
    difficulty: 'BEGINNER' as const,
    color: '#10B981',
    highlights: ['Circuit Breaker', 'Fast-Fail Fallback', 'Blast Isolation'],
    nodes: 7, edges: 6,
    pattern: 'linear',
  },
  {
    id: 'the-queue-flood',
    name: 'The Queue Flood',
    desc: 'Consumer dies, a Kafka queue grows, producing services throttle, consumer recovers and drains backlog.',
    category: 'TRAFFIC',
    difficulty: 'INTERMEDIATE' as const,
    color: '#EC4899',
    highlights: ['Async Buffering', 'Backpressure', 'Backlog Draining'],
    nodes: 4, edges: 3,
    pattern: 'chain',
  },
  {
    id: 'the-memory-leak',
    name: 'The Memory Leak',
    desc: 'Service heap memory grows slowly until an OOM Killer restart triggers, causing cyclical downtime.',
    category: 'DATABASE',
    difficulty: 'INTERMEDIATE' as const,
    color: '#F97316',
    highlights: ['Heap Leak', 'OOM Crash', 'Process Recovery'],
    nodes: 3, edges: 2,
    pattern: 'chain',
  },
  {
    id: 'traffic-spike-survival',
    name: 'Traffic Spike',
    desc: 'A massive 10x traffic spike tests system limits. Your replica layouts and pool configs decide what crashes first.',
    category: 'TRAFFIC',
    difficulty: 'ADVANCED' as const,
    color: '#3B82F6',
    highlights: ['10x Traffic Run', 'Load Balancer', 'Resource Bottleneck'],
    nodes: 5, edges: 5,
    pattern: 'fan',
  },
]

const CATEGORIES = ['ALL', 'RESILIENCE', 'TRAFFIC', 'DATABASE', 'CACHING'] as const

const DIFFICULTY_META = {
  BEGINNER: { color: '#10B981', label: 'BEGINNER', glow: 'rgba(16,185,129,0.15)' },
  INTERMEDIATE: { color: '#F59E0B', label: 'INTERMEDIATE', glow: 'rgba(245,158,11,0.15)' },
  ADVANCED: { color: '#EF4444', label: 'ADVANCED', glow: 'rgba(239,68,68,0.15)' },
}

// ─── Mini topology canvas per card ───────────────────────────────────────────
function MiniTopology({
  color, nodeCount, edgeCount, pattern, animate,
}: {
  color: string; nodeCount: number; edgeCount: number; pattern: string; animate: boolean
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    c.width = c.offsetWidth * dpr
    c.height = c.offsetHeight * dpr
    ctx.scale(dpr, dpr)
    const W = c.offsetWidth, H = c.offsetHeight

    // Build node positions based on pattern
    const nodes: { x: number; y: number; r: number; role: 'gateway' | 'service' | 'db' }[] = []
    const n = Math.max(nodeCount, 2)

    if (pattern === 'linear' || pattern === 'chain') {
      const cols = Math.min(n, 5)
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / cols)
        const col = i % cols
        const totalCols = Math.min(n - row * cols, cols)
        nodes.push({
          x: W * (0.12 + (col / (totalCols - 0.5 || 1)) * 0.76),
          y: H * (0.35 + row * 0.3),
          r: i === 0 ? 4.5 : i === n - 1 ? 5 : 3,
          role: i === 0 ? 'gateway' : i === n - 1 ? 'db' : 'service',
        })
      }
    } else if (pattern === 'star') {
      nodes.push({ x: W * 0.25, y: H * 0.5, r: 4.5, role: 'gateway' })
      const spokes = n - 1
      for (let i = 0; i < spokes; i++) {
        const a = ((i / spokes) * Math.PI * 2) - Math.PI / 2
        nodes.push({
          x: W * 0.25 + Math.cos(a) * W * 0.2,
          y: H * 0.5 + Math.sin(a) * H * 0.32,
          r: i === spokes - 1 ? 5 : 3,
          role: i === spokes - 1 ? 'db' : 'service',
        })
      }
    } else if (pattern === 'dual') {
      nodes.push({ x: W * 0.15, y: H * 0.32, r: 4, role: 'gateway' })
      nodes.push({ x: W * 0.15, y: H * 0.68, r: 4, role: 'gateway' })
      nodes.push({ x: W * 0.72, y: H * 0.32, r: 5, role: 'db' })
      nodes.push({ x: W * 0.72, y: H * 0.68, r: 5, role: 'db' })
    } else if (pattern === 'fan') {
      nodes.push({ x: W * 0.12, y: H * 0.5, r: 4.5, role: 'gateway' })
      nodes.push({ x: W * 0.38, y: H * 0.5, r: 4, role: 'service' })
      nodes.push({ x: W * 0.63, y: H * 0.28, r: 3, role: 'service' })
      nodes.push({ x: W * 0.63, y: H * 0.72, r: 3, role: 'service' })
      nodes.push({ x: W * 0.85, y: H * 0.5, r: 5, role: 'db' })
    }

    // Build edges
    const edges: [number, number][] = []
    if (pattern === 'linear' || pattern === 'chain') {
      for (let i = 0; i < nodes.length - 1; i++) edges.push([i, i + 1])
    } else if (pattern === 'star') {
      for (let i = 1; i < nodes.length; i++) edges.push([0, i])
    } else if (pattern === 'dual') {
      edges.push([0, 2], [1, 3], [2, 3])
    } else if (pattern === 'fan') {
      edges.push([0, 1], [1, 2], [1, 3], [2, 4], [3, 4])
    }

    // Particles per edge
    const particles = edges.map(() =>
      Array.from({ length: 3 }, (_, i) => ({ t: i / 3, sp: 0.005 + Math.random() * 0.004 }))
    )

    let t = 0
    const draw = () => {
      t += animate ? 0.008 : 0
      ctx.clearRect(0, 0, W, H)

      // Background gradient
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.6)
      bg.addColorStop(0, color + '08')
      bg.addColorStop(1, 'transparent')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Edges
      edges.forEach(([si, ti], ei) => {
        const S = nodes[si], T = nodes[ti]
        ctx.strokeStyle = color + '25'
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(T.x, T.y); ctx.stroke()

        // Moving particles
        particles[ei].forEach(p => {
          if (animate) p.t = (p.t + p.sp) % 1
          const px = S.x + (T.x - S.x) * p.t
          const py = S.y + (T.y - S.y) * p.t
          ctx.fillStyle = color
          ctx.globalAlpha = 0.8
          ctx.shadowBlur = 4; ctx.shadowColor = color
          ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill()
          ctx.shadowBlur = 0; ctx.globalAlpha = 1
        })
      })

      // Nodes
      nodes.forEach((n, i) => {
        const pulse = animate ? Math.sin(t * 1.5 + i * 1.1) * 0.4 + 0.6 : 0.7
        const nodeColor = n.role === 'gateway' ? color : n.role === 'db' ? color + 'CC' : color + '99'

        // Glow halo
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3.5)
        grd.addColorStop(0, color + Math.round(pulse * 40).toString(16).padStart(2, '0'))
        grd.addColorStop(1, 'transparent')
        ctx.fillStyle = grd
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 3.5, 0, Math.PI * 2); ctx.fill()

        ctx.shadowBlur = animate ? 10 * pulse : 6
        ctx.shadowColor = color
        ctx.fillStyle = nodeColor
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
      })

      if (animate) rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [color, nodeCount, edgeCount, pattern, animate])

  return (
    <canvas
      ref={ref}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}

// ─── Background grid ──────────────────────────────────────────────────────────
function BackgroundField() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      backgroundImage: `
        linear-gradient(rgba(99,102,241,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99,102,241,0.025) 1px, transparent 1px)
      `,
      backgroundSize: '52px 52px',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99,102,241,0.07) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 50% 40% at 100% 80%, rgba(239,68,68,0.04) 0%, transparent 60%)',
      }} />
    </div>
  )
}

// ─── Scenario card ────────────────────────────────────────────────────────────
function ScenarioCard({ s, idx, visible }: { s: typeof SCENARIOS[0]; idx: number; visible: boolean }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const diff = DIFFICULTY_META[s.difficulty]

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#090C12',
        border: `1px solid ${hovered ? s.color + '50' : '#141820'}`,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: visible
          ? hovered ? 'translateY(-4px)' : 'translateY(0)'
          : 'translateY(20px)',
        opacity: visible ? 1 : 0,
        transitionDelay: visible ? `${idx * 0.06}s` : '0s',
        boxShadow: hovered
          ? `0 16px 40px ${s.color}18, 0 0 0 1px ${s.color}25`
          : '0 2px 12px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Preview area */}
      <div style={{
        height: 120, position: 'relative', overflow: 'hidden',
        background: `radial-gradient(ellipse at 50% 100%, ${s.color}10 0%, transparent 65%), #07090D`,
        borderBottom: `1px solid ${hovered ? s.color + '25' : '#0D1018'}`,
        transition: 'border-color 0.25s',
      }}>
        <MiniTopology
          color={s.color}
          nodeCount={s.nodes}
          edgeCount={s.edges}
          pattern={s.pattern}
          animate={hovered}
        />

        {/* Scanlines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.05) 3px,rgba(0,0,0,0.05) 4px)',
        }} />

        {/* Node/edge count badge */}
        <div style={{
          position: 'absolute', bottom: 8, left: 10,
          display: 'flex', gap: 6,
        }}>
          <div style={{
            background: 'rgba(7,9,13,0.85)', backdropFilter: 'blur(6px)',
            border: `1px solid ${s.color}25`, borderRadius: 5,
            padding: '3px 7px',
            fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
            color: s.color, letterSpacing: 1,
          }}>
            {s.nodes}N · {s.edges}E
          </div>
        </div>

        {/* Category badge */}
        <div style={{
          position: 'absolute', top: 8, right: 10,
          background: 'rgba(7,9,13,0.85)', backdropFilter: 'blur(6px)',
          border: '1px solid #141820', borderRadius: 5,
          padding: '3px 7px',
          fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
          color: '#4A5568', letterSpacing: 1.5,
        }}>
          {s.category}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Name row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <h3 style={{
            fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 1.5,
            color: hovered ? s.color : '#E8EDF3',
            lineHeight: 1, transition: 'color 0.2s',
            flex: 1,
          }}>{s.name}</h3>
          {/* Difficulty badge */}
          <span style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
            color: diff.color, letterSpacing: 1.5, fontWeight: 700,
            background: diff.glow,
            border: `1px solid ${diff.color}40`,
            borderRadius: 4, padding: '3px 7px',
            flexShrink: 0, marginTop: 2,
          }}>{diff.label}</span>
        </div>

        {/* Description */}
        <p style={{
          fontSize: 11, color: '#4A5568', lineHeight: 1.7,
          fontFamily: "'DM Sans',sans-serif",
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          flex: 1,
        }}>{s.desc}</p>

        {/* Highlights */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {s.highlights.map(h => (
            <span key={h} style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
              color: hovered ? s.color + 'CC' : '#3A4455',
              background: hovered ? `${s.color}0A` : '#0D1018',
              border: `1px solid ${hovered ? s.color + '25' : '#141820'}`,
              borderRadius: 4, padding: '3px 8px',
              letterSpacing: 0.5, transition: 'all 0.2s',
            }}>{h}</span>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex', gap: 8,
          paddingTop: 10, borderTop: '1px solid #0D1018',
        }}>
          <Link
            to={`/learn/${s.id}`}
            onClick={e => e.stopPropagation()}
            style={{
              flex: 1, padding: '9px',
              background: '#0A0D12', border: '1px solid #1A2030',
              borderRadius: 8, color: '#8B95A3',
              fontSize: 11, fontWeight: 600, textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: "'DM Sans',sans-serif",
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D3748'; e.currentTarget.style.color = '#E8EDF3' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A2030'; e.currentTarget.style.color = '#8B95A3' }}
          >
            <BookOpen size={11} />
            Walkthrough
          </Link>
          <button
            onClick={() => navigate(`/editor?scenario=${s.id}`)}
            style={{
              flex: 1, padding: '9px',
              background: hovered
                ? `linear-gradient(135deg, ${s.color}, ${s.color}CC)`
                : 'linear-gradient(135deg, #6366F1, #4338CA)',
              border: '1px solid transparent',
              borderRadius: 8, color: '#fff',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: "'DM Sans',sans-serif",
              transition: 'all 0.25s',
              boxShadow: hovered ? `0 4px 16px ${s.color}35` : '0 4px 12px rgba(99,102,241,0.25)',
            }}>
            <Zap size={11} />
            Launch
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Filter button ────────────────────────────────────────────────────────────
function FilterBtn({
  label, active, count, onClick,
}: {
  label: string; active: boolean; count: number; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '7px 14px', borderRadius: 20,
        background: active ? 'rgba(99,102,241,0.1)' : '#090C12',
        border: `1px solid ${active ? 'rgba(99,102,241,0.4)' : '#141820'}`,
        color: active ? '#E8EDF3' : '#4A5568',
        fontSize: 11, fontWeight: 600, cursor: 'pointer',
        fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5,
        transition: 'all 0.2s',
        boxShadow: active ? '0 0 16px rgba(99,102,241,0.15)' : 'none',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = '#2D3748'; e.currentTarget.style.color = '#8B95A3' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = '#141820'; e.currentTarget.style.color = '#4A5568' } }}
    >
      {active && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#6366F1', boxShadow: '0 0 8px #6366F1' }} />}
      {label}
      <span style={{
        background: active ? 'rgba(99,102,241,0.2)' : '#0D1018',
        border: `1px solid ${active ? 'rgba(99,102,241,0.3)' : '#141820'}`,
        color: active ? '#8B9CF8' : '#2A3140',
        borderRadius: 10, padding: '1px 6px',
        fontSize: 9, fontFamily: "'JetBrains Mono',monospace",
      }}>{count}</span>
    </button>
  )
}

// ─── Animated header stat ────────────────────────────────────────────────────
function HeaderStat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: '#6366F1', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#2A3140', letterSpacing: 2, marginTop: 3 }}>{label.toUpperCase()}</div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
// Pre-computed animation delays — avoids calling Math.random() during render
const STAT_FLOAT_DELAYS = [0, 0.5, 1.0, 1.5]

export function Scenarios() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<typeof CATEGORIES[number]>('ALL')
  const [mounted, setMounted] = useState(false)
  const [cardsVisible, setCardsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    setTimeout(() => setMounted(true), 50)
    setTimeout(() => setCardsVisible(true), 300)
  }, [])

  const handleFilterChange = useCallback((cat: typeof CATEGORIES[number]) => {
    setCardsVisible(false)
    setFilter(cat)
    setTimeout(() => setCardsVisible(true), 180)
  }, [])

  const filtered = SCENARIOS.filter(s => {
    const matchCat = filter === 'ALL' || s.category === filter
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.highlights.some(h => h.toLowerCase().includes(q))
    return matchCat && matchSearch
  })

  const countFor = (cat: typeof CATEGORIES[number]) =>
    cat === 'ALL' ? SCENARIOS.length : SCENARIOS.filter(s => s.category === cat).length

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

        @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes scanH    { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes pulse-ring {
          0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2);opacity:0}
        }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes title-in {
          from{opacity:0;transform:translateY(30px) skewY(2deg)}
          to{opacity:1;transform:translateY(0) skewY(0)}
        }

        ::placeholder { color:#1A2030; }
        input { caret-color:#6366F1; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#07090D; }
        ::-webkit-scrollbar-thumb { background:#141820; border-radius:2px; }
      `}</style>

      <BackgroundField />
      <Navbar />

      <div style={{
        maxWidth: 1220, margin: '0 auto',
        padding: '96px 32px 80px',
        position: 'relative', zIndex: 1,
      }}>

        {/* ── HERO HEADER ── */}
        <div style={{
          marginBottom: 52,
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}>
          {/* Live badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 20, padding: '5px 14px', marginBottom: 20,
            animation: 'fadeUp 0.5s 0.1s both ease',
          }}>
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'block' }} />
              <span style={{
                position: 'absolute', inset: 0, borderRadius: '50%', background: '#EF4444',
                animation: 'pulse-ring 1.5s infinite',
              }} />
            </span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#EF4444', letterSpacing: 2.5 }}>
              8 FAILURE SCENARIOS — LIVE
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
            {/* Title block */}
            <div>
              <h1 style={{
                fontFamily: "'Bebas Neue'", fontSize: 72, letterSpacing: 2,
                color: '#E8EDF3', lineHeight: 0.92, marginBottom: 16,
                animation: 'title-in 0.7s 0.15s both ease',
              }}>
                SCENARIO<br />
                <span style={{ color: '#6366F1' }}>LIBRARY</span>
              </h1>
              <p style={{
                fontSize: 13, color: '#8B95A3', lineHeight: 1.8,
                maxWidth: 480, fontFamily: "'DM Sans',sans-serif",
                animation: 'fadeUp 0.6s 0.3s both ease',
              }}>
                Eight production failure patterns, fully animated. Load any scenario directly into the visual sandbox — or follow the guided walkthrough to understand the underlying mechanics.
              </p>
            </div>

            {/* Stats */}
            <div style={{
              display: 'flex', gap: 20, alignItems: 'center',
              animation: 'fadeUp 0.6s 0.4s both ease',
            }}>
              {([['8', 'Scenarios'], ['3', 'Difficulty Levels'], ['4', 'Categories'], ['60fps', 'Canvas']] as [string, string][]).map(([v, l], i) => (
                <div key={l} style={{ animation: 'float 4s ease-in-out infinite', animationDelay: `${STAT_FLOAT_DELAYS[i]}s` }}>
                  <HeaderStat value={v} label={l} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTROLS BAR ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 32, flexWrap: 'wrap',
          animation: 'fadeUp 0.5s 0.45s both ease',
        }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            {CATEGORIES.map(cat => (
              <FilterBtn
                key={cat}
                label={cat}
                active={filter === cat}
                count={countFor(cat)}
                onClick={() => handleFilterChange(cat)}
              />
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 8,
              border: `1px solid ${searchFocused ? '#6366F1' : '#141820'}`,
              boxShadow: searchFocused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
              pointerEvents: 'none', transition: 'all 0.2s', zIndex: 1,
            }} />
            {searchFocused && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: 'linear-gradient(90deg,transparent,#6366F1,transparent)',
                borderRadius: '8px 8px 0 0', zIndex: 2, pointerEvents: 'none',
                animation: 'scanH 1.5s ease-in-out infinite',
              }} />
            )}
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                padding: '8px 14px', borderRadius: 8,
                background: '#090C12', border: '1px solid transparent',
                color: '#E8EDF3', fontSize: 12,
                fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5,
                outline: 'none', width: 200,
                transition: 'background 0.2s',
              }}
            />
          </div>
        </div>

        {/* ── RESULT COUNT ── */}
        <div style={{
          marginBottom: 24,
          fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
          color: '#2A3140', letterSpacing: 2,
          animation: 'fadeIn 0.3s ease',
        }}>
          {filtered.length} SCENARIO{filtered.length !== 1 ? 'S' : ''} — {filter}
        </div>

        {/* ── GRID ── */}
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: 280, gap: 14,
            border: '1px dashed #141820', borderRadius: 16,
            background: 'rgba(99,102,241,0.02)',
            animation: 'fadeIn 0.3s ease',
          }}>
            <Terminal size={32} style={{ color: '#1A2030' }} />
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#2A3140', letterSpacing: 1.5 }}>NO SCENARIOS MATCH</p>
            <button onClick={() => { setFilter('ALL'); setSearchQuery('') }} style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 11,
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              color: '#6366F1', cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
            }}>RESET FILTERS</button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}>
            {filtered.map((s, i) => (
              <ScenarioCard key={s.id} s={s} idx={i} visible={cardsVisible} />
            ))}
          </div>
        )}

        {/* ── BOTTOM CTA ── */}
        <div style={{
          marginTop: 64,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          animation: 'fadeUp 0.6s 0.6s both ease',
        }}>
          <div style={{
            width: '100%', height: 1,
            background: 'linear-gradient(to right, transparent, #1A2030, transparent)',
          }} />
          <p style={{ fontSize: 12, color: '#3A4455', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5 }}>
            WANT TO BUILD YOUR OWN?
          </p>
          <button
            onClick={() => navigate('/editor')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '13px 28px', borderRadius: 12,
              background: 'linear-gradient(135deg, #6366F1, #4338CA)',
              border: '1px solid transparent', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: '0 4px 24px rgba(99,102,241,0.3)',
              transition: 'all 0.2s',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.3)' }}
          >
            <Zap size={15} />
            Open Blank Canvas
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}