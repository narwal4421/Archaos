import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Play, Skull, Brain, ShieldAlert, Cpu, HelpCircle, Users,
  ChevronRight, Zap, GitBranch,
  AlertTriangle, CheckCircle, ArrowRight, BookOpen,
  BarChart2, Shield, Network, GraduationCap,
  Wrench, TrendingUp, Eye, Terminal, Flame
} from 'lucide-react'

// ─── Animated hero canvas ───────────────────────────────────────────────────
function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const nodes = [
      { id: 'gateway', label: 'API Gateway', px: 0.15, py: 0.5, size: 10, color: '#06B6D4', pulse: 0, state: 'HEALTHY' },
      { id: 'order', label: 'Order Svc', px: 0.38, py: 0.33, size: 8, color: '#10B981', pulse: 0, state: 'HEALTHY' },
      { id: 'user', label: 'User Svc', px: 0.38, py: 0.67, size: 8, color: '#10B981', pulse: 0, state: 'HEALTHY' },
      { id: 'payment', label: 'Payment Svc', px: 0.62, py: 0.4, size: 8, color: '#10B981', pulse: 0, state: 'HEALTHY' },
      { id: 'billing', label: 'Billing Svc', px: 0.62, py: 0.65, size: 7, color: '#10B981', pulse: 0, state: 'HEALTHY' },
      { id: 'db', label: 'PostgreSQL DB', px: 0.85, py: 0.5, size: 12, color: '#3B82F6', pulse: 0, state: 'HEALTHY' },
    ]

    const edges = [
      { source: 0, target: 1, progress: [0, 0.4, 0.75] },
      { source: 0, target: 2, progress: [0.2, 0.6, 0.85] },
      { source: 1, target: 3, progress: [0.1, 0.5] },
      { source: 2, target: 4, progress: [0.3, 0.7] },
      { source: 3, target: 5, progress: [0.15, 0.55, 0.9] },
      { source: 4, target: 5, progress: [0.05, 0.45, 0.8] },
    ]

    let time = 0

    const render = () => {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = '#050505'
      ctx.lineWidth = 1
      const gridSize = 50
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke()
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke()
      }

      time += 0.012

      const cycle = (time * 0.2) % Math.PI
      const failureRatio = Math.sin(cycle)
      const orderNode = nodes[1]
      if (failureRatio > 0.7) {
        orderNode.state = 'FAILED'; orderNode.color = '#EF4444'
      } else if (failureRatio > 0.4) {
        orderNode.state = 'DEGRADED'; orderNode.color = '#F59E0B'
      } else {
        orderNode.state = 'HEALTHY'; orderNode.color = '#10B981'
      }

      edges.forEach((edge) => {
        const nSource = nodes[edge.source]
        const nTarget = nodes[edge.target]
        const x1 = nSource.px * width, y1 = nSource.py * height
        const x2 = nTarget.px * width, y2 = nTarget.py * height

        ctx.strokeStyle = '#181818'
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()

        ctx.fillStyle = nTarget.color
        edge.progress = edge.progress.map((p) => {
          let nextP = p + 0.004
          if (nextP > 1) nextP = 0
          const px = x1 + (x2 - x1) * nextP
          const py = y1 + (y2 - y1) * nextP
          ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill()
          return nextP
        })
      })

      nodes.forEach((n) => {
        const nx = n.px * width, ny = n.py * height
        n.pulse = Math.sin(time * 2.5 + (n.id === 'order' ? 3 : 0)) * 7 + 14
        ctx.shadowBlur = n.pulse
        ctx.shadowColor = n.color
        ctx.fillStyle = n.color
        ctx.beginPath(); ctx.arc(nx, ny, n.size, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0

        ctx.fillStyle = '#666666'
        ctx.font = "10px 'JetBrains Mono', monospace"
        ctx.textAlign = 'center'
        ctx.fillText(n.label, nx, ny - n.size - 8)
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-25 z-0" />
}

// ─── Scroll-triggered fade-in wrapper ───────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ─── Section label pill ──────────────────────────────────────────────────────
function SectionPill({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-4"
      style={{ background: `${color}15`, border: `1px solid ${color}40`, color }}
    >
      <Icon size={12} />
      {label}
    </div>
  )
}

// ─── Architecture Flow Diagram (inline SVG) ──────────────────────────────────
function ArchitectureDiagram() {
  const nodes = [
    { x: 60,  y: 160, label: 'Client',           sub: 'Browser / App',  color: '#06B6D4', icon: '🌐' },
    { x: 200, y: 160, label: 'API Gateway',       sub: 'Entry Point',    color: '#7C3AED', icon: '🔀' },
    { x: 370, y: 80,  label: 'Order Service',     sub: '2 Replicas',     color: '#10B981', icon: '📦' },
    { x: 370, y: 240, label: 'User Service',      sub: '2 Replicas',     color: '#10B981', icon: '👤' },
    { x: 550, y: 80,  label: 'Payment Service',   sub: '1 Replica',      color: '#F59E0B', icon: '💳' },
    { x: 550, y: 240, label: 'Billing Service',   sub: '1 Replica',      color: '#F59E0B', icon: '🧾' },
    { x: 730, y: 160, label: 'PostgreSQL DB',     sub: 'Pool: 20 conns', color: '#EF4444', icon: '🗄️' },
  ]

  const edges = [
    { x1: 110, y1: 160, x2: 200, y2: 160 },
    { x1: 290, y1: 145, x2: 370, y2: 100 },
    { x1: 290, y1: 175, x2: 370, y2: 260 },
    { x1: 465, y1: 100, x2: 550, y2: 100 },
    { x1: 465, y1: 260, x2: 550, y2: 260 },
    { x1: 645, y1: 100, x2: 730, y2: 150 },
    { x1: 645, y1: 260, x2: 730, y2: 170 },
  ]

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 840 340" className="w-full max-w-4xl mx-auto" style={{ minWidth: 600 }}>
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#333333" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => (
          <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="#2A2A2A" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
        ))}

        {/* Nodes */}
        {nodes.map((n, i) => (
          <g key={i}>
            <rect
              x={n.x} y={n.y - 30} width={90} height={50}
              rx="8" ry="8"
              fill="#0D0D0D"
              stroke={n.color}
              strokeWidth="1"
              style={{ filter: `drop-shadow(0 0 6px ${n.color}55)` }}
            />
            <text x={n.x + 45} y={n.y - 12} textAnchor="middle" fill={n.color} fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="700">
              {n.label.toUpperCase()}
            </text>
            <text x={n.x + 45} y={n.y + 4} textAnchor="middle" fill="#555555" fontSize="8" fontFamily="Inter, sans-serif">
              {n.sub}
            </text>
          </g>
        ))}

        {/* Failure injection indicator */}
        <g>
          <circle cx="509" cy="80" r="8" fill="#EF4444" opacity="0.9">
            <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x="509" y="63" textAnchor="middle" fill="#EF4444" fontSize="8" fontFamily="JetBrains Mono, monospace">CHAOS INJECTED</text>
        </g>

        <text x="420" y="320" textAnchor="middle" fill="#333333" fontSize="9" fontFamily="JetBrains Mono, monospace">
          ARCHAOS — LIVE SYSTEM TOPOLOGY VISUALIZATION
        </text>
      </svg>
    </div>
  )
}

// ─── Simulation Cycle Flow ───────────────────────────────────────────────────
function SimulationCycleFlow() {
  const steps = [
    { num: '01', icon: GitBranch, label: 'MODEL', title: 'Design Topology', desc: 'Drag services, databases, queues, and load balancers onto the interactive canvas. Connect them with HTTP, gRPC, or message queue edges.', color: '#7C3AED' },
    { num: '02', icon: Wrench, label: 'CONFIGURE', title: 'Tune Parameters', desc: 'Set replica counts, connection pool sizes, timeouts, circuit breaker thresholds, retry policies, and cache TTLs for every node.', color: '#06B6D4' },
    { num: '03', icon: Flame, label: 'INJECT', title: 'Trigger Chaos', desc: 'Fire load patterns and inject faults — latency spikes, network partitions, CPU pressure, OOM kills, cache expiries, and more.', color: '#EF4444' },
    { num: '04', icon: Eye, label: 'OBSERVE', title: 'Watch in Real Time', desc: 'See nodes transition from HEALTHY → DEGRADED → FAILED. Traffic dots slow and stop. Metrics charts spike.', color: '#F59E0B' },
    { num: '05', icon: Brain, label: 'ANALYZE', title: 'AI Narration', desc: 'A streaming AI copilot explains WHY the system failed, what pattern triggered it, and which mitigation strategies apply.', color: '#10B981' },
  ]

  return (
    <div className="relative">
      {/* Connector line */}
      <div className="hidden md:block absolute top-10 left-[10%] right-[10%] h-px bg-gradient-to-r from-[#7C3AED] via-[#06B6D4] via-[#EF4444] via-[#F59E0B] to-[#10B981] opacity-30" />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {steps.map((step, i) => (
          <FadeIn key={i} delay={i * 100}>
            <div
              className="relative bg-[#0A0A0A] rounded-2xl p-6 text-center space-y-3 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
              style={{ border: `1px solid ${step.color}30` }}
            >
              <div className="absolute top-3 right-3 font-mono text-[9px] text-[#333333] font-bold">{step.num}</div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                style={{ background: `${step.color}15`, border: `1px solid ${step.color}40` }}
              >
                <step.icon size={20} style={{ color: step.color }} />
              </div>
              <div className="text-[9px] font-mono font-bold tracking-widest" style={{ color: step.color }}>
                {step.label}
              </div>
              <h4 className="text-sm font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {step.title}
              </h4>
              <p className="text-[11px] text-[#666666] leading-relaxed">{step.desc}</p>

              {i < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight size={14} className="text-[#333]" />
                </div>
              )}
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  )
}

// ─── Failure Mode Diagram ────────────────────────────────────────────────────
function FailureModeDiagram() {
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 760 300" className="w-full max-w-3xl mx-auto" style={{ minWidth: 500 }}>
        <defs>
          <marker id="arr2" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <polygon points="0 0, 6 2.5, 0 5" fill="#EF4444" />
          </marker>
          <marker id="arr3" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <polygon points="0 0, 6 2.5, 0 5" fill="#F59E0B" />
          </marker>
        </defs>

        {/* Timeline baseline */}
        <line x1="40" y1="240" x2="720" y2="240" stroke="#1A1A1A" strokeWidth="1.5" />
        <text x="40" y="260" fill="#333" fontSize="9" fontFamily="JetBrains Mono, monospace">t=0s</text>
        <text x="200" y="260" fill="#333" fontSize="9" fontFamily="JetBrains Mono, monospace">t=15s</text>
        <text x="370" y="260" fill="#333" fontSize="9" fontFamily="JetBrains Mono, monospace">t=30s</text>
        <text x="530" y="260" fill="#333" fontSize="9" fontFamily="JetBrains Mono, monospace">t=55s</text>
        <text x="680" y="260" fill="#333" fontSize="9" fontFamily="JetBrains Mono, monospace">t=90s</text>

        {/* Health bars for each service */}
        {[
          { y: 30, label: 'API Gateway', bars: [{ x: 40, w: 170, c: '#10B981' }, { x: 210, w: 130, c: '#F59E0B' }, { x: 340, w: 140, c: '#EF4444' }, { x: 480, w: 100, c: '#F59E0B' }, { x: 580, w: 140, c: '#10B981' }] },
          { y: 80, label: 'Order Svc',   bars: [{ x: 40, w: 170, c: '#10B981' }, { x: 210, w: 80,  c: '#F59E0B' }, { x: 290, w: 180, c: '#EF4444' }, { x: 470, w: 100, c: '#7C3AED' }, { x: 570, w: 150, c: '#10B981' }] },
          { y: 130, label: 'Payment Svc',bars: [{ x: 40, w: 200, c: '#10B981' }, { x: 240, w: 60,  c: '#F59E0B' }, { x: 300, w: 200, c: '#EF4444' }, { x: 500, w: 90,  c: '#7C3AED' }, { x: 590, w: 130, c: '#10B981' }] },
          { y: 180, label: 'PostgreSQL', bars: [{ x: 40, w: 220, c: '#10B981' }, { x: 260, w: 40,  c: '#F59E0B' }, { x: 300, w: 240, c: '#EF4444' }, { x: 540, w: 60,  c: '#7C3AED' }, { x: 600, w: 120, c: '#10B981' }] },
        ].map((row, i) => (
          <g key={i}>
            <text x="30" y={row.y + 15} textAnchor="end" fill="#555" fontSize="8" fontFamily="JetBrains Mono, monospace">{row.label}</text>
            {row.bars.map((b, j) => (
              <rect key={j} x={b.x} y={row.y} width={b.w} height={18} rx="3" fill={b.c} opacity="0.75" />
            ))}
          </g>
        ))}

        {/* Chaos injection marker */}
        <line x1="210" y1="15" x2="210" y2="240" stroke="#EF4444" strokeWidth="1" strokeDasharray="4,3" />
        <text x="214" y="15" fill="#EF4444" fontSize="8" fontFamily="JetBrains Mono, monospace">⚡ CHAOS INJECTED</text>

        {/* Recovery marker */}
        <line x1="540" y1="15" x2="540" y2="240" stroke="#10B981" strokeWidth="1" strokeDasharray="4,3" />
        <text x="544" y="15" fill="#10B981" fontSize="8" fontFamily="JetBrains Mono, monospace">✓ RECOVERING</text>

        {/* Legend */}
        {[{ c: '#10B981', l: 'HEALTHY' }, { c: '#F59E0B', l: 'DEGRADED' }, { c: '#EF4444', l: 'FAILED' }, { c: '#7C3AED', l: 'RECOVERING' }].map((leg, i) => (
          <g key={i}>
            <rect x={40 + i * 90} y={275} width={10} height={10} rx="2" fill={leg.c} opacity="0.8" />
            <text x={56 + i * 90} y={284} fill="#555" fontSize="8" fontFamily="JetBrains Mono, monospace">{leg.l}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ─── Feature deep-dive card ──────────────────────────────────────────────────
function FeatureCard({ icon: Icon, color, title, badge, bullets }: {
  icon: React.ElementType; color: string; title: string; badge: string; bullets: string[]
}) {
  return (
    <div
      className="bg-[#0A0A0A] rounded-2xl p-7 space-y-5 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 group"
      style={{ border: `1px solid #222222` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = color + '60')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#222222')}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={22} style={{ color }} />
        </div>
        <div>
          <span className="text-[9px] font-mono font-bold tracking-widest px-2 py-0.5 rounded" style={{ background: `${color}15`, color }}>{badge}</span>
          <h3 className="text-lg font-bold text-white mt-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
        </div>
      </div>
      <ul className="space-y-2.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[12px] text-[#888888] leading-relaxed">
            <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: `${color}20` }}>
              <CheckCircle size={10} style={{ color }} />
            </span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Audience card ───────────────────────────────────────────────────────────
function AudienceCard({ icon: Icon, color, role, tagline, useCases, bestScenarios }: {
  icon: React.ElementType; color: string; role: string; tagline: string; useCases: string[]; bestScenarios: string[]
}) {
  return (
    <div
      className="bg-[#0A0A0A] rounded-2xl p-7 space-y-5 h-full transition-all duration-300 hover:-translate-y-1"
      style={{ border: `1px solid #222` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = color + '50')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#222')}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{role}</h3>
        <p className="text-sm mt-1" style={{ color }}>{tagline}</p>
      </div>
      <div>
        <p className="text-[10px] font-mono font-bold tracking-widest text-[#444] uppercase mb-2">Use Cases</p>
        <ul className="space-y-1.5">
          {useCases.map((u, i) => (
            <li key={i} className="text-xs text-[#888888] flex items-start gap-2">
              <ArrowRight size={10} className="mt-0.5 flex-shrink-0" style={{ color }} />
              {u}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-[10px] font-mono font-bold tracking-widest text-[#444] uppercase mb-2">Best Scenarios</p>
        <div className="flex flex-wrap gap-1.5">
          {bestScenarios.map((s, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: `${color}15`, color }}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Scenario card ────────────────────────────────────────────────────────────
function ScenarioCard({ tag, difficulty, title, description, onLaunch }: {
  tag: string; difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  title: string; description: string; onLaunch: () => void
}) {
  const diffColor = difficulty === 'BEGINNER' ? '#10B981' : difficulty === 'INTERMEDIATE' ? '#F59E0B' : '#EF4444'
  return (
    <div
      onClick={onLaunch}
      className="bg-[#0A0A0A] border border-[#1E1E1E] hover:border-[#7C3AED] hover:shadow-[0_0_24px_rgba(124,58,237,0.15)] rounded-xl p-6 transition-all duration-300 cursor-pointer flex flex-col gap-3 group"
    >
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#555555]">{tag}</span>
        <span className="text-[9px] px-2 py-0.5 rounded font-bold" style={{ background: `${diffColor}15`, color: diffColor, border: `1px solid ${diffColor}30` }}>
          {difficulty}
        </span>
      </div>
      <h3 className="text-base font-bold text-white group-hover:text-[#A78BFA] transition-colors" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        {title}
      </h3>
      <p className="text-xs text-[#666666] leading-relaxed flex-1">{description}</p>
      <button className="w-full mt-1 py-2 bg-transparent hover:bg-[#7C3AED] border border-[#222] group-hover:border-[#7C3AED] text-xs text-[#888] group-hover:text-white rounded-lg transition-all font-semibold flex items-center justify-center gap-1.5">
        <Play size={11} className="group-hover:fill-white transition-all" /> Launch Scenario
      </button>
    </div>
  )
}

// ─── Metric comparison table ──────────────────────────────────────────────────
function ComparisonTable() {
  const rows = [
    { feature: 'Visual drag-and-drop canvas',     archaos: true,  other1: false, other2: false },
    { feature: 'Real-time traffic animation',      archaos: true,  other1: false, other2: true  },
    { feature: 'AI-narrated failure explanation',  archaos: true,  other1: false, other2: false },
    { feature: 'Guided walkthrough scenarios',     archaos: true,  other1: false, other2: false },
    { feature: 'Circuit breaker simulation',       archaos: true,  other1: true,  other2: false },
    { feature: 'Message queue flood scenario',     archaos: true,  other1: true,  other2: false },
    { feature: 'No cloud credentials required',   archaos: true,  other1: false, other2: true  },
    { feature: 'Interactive quiz checkpoints',     archaos: true,  other1: false, other2: false },
    { feature: 'Free in-browser simulator',        archaos: true,  other1: false, other2: true  },
  ]

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-xs border-collapse" style={{ minWidth: 500 }}>
        <thead>
          <tr>
            <th className="text-left p-4 text-[#444] font-mono text-[10px] tracking-widest uppercase border-b border-[#1A1A1A]">Feature</th>
            <th className="p-4 border-b border-[#7C3AED] font-bold text-white" style={{ background: '#7C3AED15' }}>
              <span className="text-[#A78BFA] font-mono tracking-widest text-[10px]">ARCHAOS</span>
            </th>
            <th className="p-4 border-b border-[#222] text-[#444] font-mono text-[10px] tracking-widest uppercase">Chaos Monkey</th>
            <th className="p-4 border-b border-[#222] text-[#444] font-mono text-[10px] tracking-widest uppercase">Gremlin</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#0F0F0F] hover:bg-[#0A0A0A] transition-colors">
              <td className="p-4 text-[#888]">{row.feature}</td>
              <td className="p-4 text-center" style={{ background: '#7C3AED08' }}>
                {row.archaos ? <CheckCircle size={14} className="mx-auto text-[#7C3AED]" /> : <span className="text-[#333]">—</span>}
              </td>
              <td className="p-4 text-center">
                {row.other1 ? <CheckCircle size={14} className="mx-auto text-[#444]" /> : <span className="text-[#222]">—</span>}
              </td>
              <td className="p-4 text-center">
                {row.other2 ? <CheckCircle size={14} className="mx-auto text-[#444]" /> : <span className="text-[#222]">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── FAQ Item ────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#111111] last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left py-5 flex items-start justify-between gap-4 cursor-pointer group"
      >
        <span className="text-sm font-semibold text-white group-hover:text-[#A78BFA] transition-colors">{q}</span>
        <span className="flex-shrink-0 mt-0.5 transition-transform duration-300" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          <ChevronRight size={16} className="text-[#444]" />
        </span>
      </button>
      {open && (
        <div className="pb-5 text-sm text-[#666666] leading-relaxed animate-fade-in">
          {a}
        </div>
      )}
    </div>
  )
}

// ─── MAIN LANDING COMPONENT ───────────────────────────────────────────────────
export function Landing() {
  const navigate = useNavigate()

  return (
    <div
      className="bg-black text-white min-h-screen flex flex-col relative overflow-x-hidden"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >

      {/* ══ FIXED NAVBAR ══ */}
      <nav className="fixed top-0 left-0 right-0 h-[60px] bg-black/85 backdrop-blur-[16px] border-b border-[#111] z-[1000] px-6 flex items-center justify-between">
        <Link to="/" className="font-bold tracking-[3px] text-white text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          ARCHAOS
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <a href="#how-it-works" className="text-[#666] hover:text-white transition-colors hidden sm:block">How It Works</a>
          <a href="#features" className="text-[#666] hover:text-white transition-colors hidden sm:block">Features</a>
          <a href="#scenarios" className="text-[#666] hover:text-white transition-colors hidden sm:block">Scenarios</a>
          <Link to="/editor" className="text-[#666] hover:text-white transition-colors">Playground</Link>
          <Link
            to="/auth"
            state={{ mode: 'register' }}
            className="px-5 py-1.5 text-xs bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white font-bold rounded-lg hover:opacity-85 active:scale-[0.98] transition-all"
          >
            Sign Up Free
          </Link>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center px-6 text-center z-10 overflow-hidden">
        <HeroCanvas />
        <div className="relative z-10 max-w-5xl mx-auto space-y-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/30 text-xs font-semibold text-[#A78BFA] tracking-wide">
            <Zap size={11} />
            Chaos Engineering · Visual Simulation · AI Narration
          </div>
          <h1
            className="text-5xl md:text-[72px] font-extrabold leading-[1.04] tracking-tight"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Watch your<br />
            <span className="bg-gradient-to-r from-[#7C3AED] via-[#A78BFA] to-[#06B6D4] bg-clip-text text-transparent">
              architecture fail.
            </span>
            <br />Safely.
          </h1>
          <p className="text-lg md:text-xl text-[#777] font-light max-w-2xl mx-auto leading-relaxed">
            Archaos is an interactive visual simulator for distributed system failures.
            Build any topology, inject chaos, watch cascades unfold in real time,
            and let AI explain exactly why your system broke.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/editor')}
              className="px-8 py-4 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white font-bold rounded-xl flex items-center gap-2 shadow-xl shadow-[#7C3AED]/25 hover:opacity-90 active:scale-[0.98] transition-all text-sm"
            >
              <Play size={14} className="fill-white" />
              Start Simulating — Free
            </button>
            <a
              href="#what-is-archaos"
              className="px-8 py-4 border border-[#222] hover:border-[#888] text-[#888] hover:text-white font-semibold rounded-xl transition-all text-sm flex items-center gap-2"
            >
              <BookOpen size={14} /> Learn More <ChevronRight size={14} />
            </a>
          </div>
          <div className="flex items-center justify-center gap-8 pt-4 text-xs text-[#444]">
            <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#10B981]" /> No signup required to try</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#10B981]" /> Runs entirely in browser</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#10B981]" /> AI-powered explanations</span>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#333] animate-bounce">
          <span className="text-xs font-mono tracking-widest">SCROLL TO EXPLORE</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#333] to-transparent" />
        </div>
      </section>

      {/* ══ SECTION 1: WHAT IS ARCHAOS ══ */}
      <section id="what-is-archaos" className="py-28 px-6 max-w-6xl mx-auto w-full z-10 relative border-t border-[#0F0F0F]">
        <FadeIn>
          <SectionPill icon={HelpCircle} label="What is Archaos?" color="#7C3AED" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                An Interactive Playground for<br />
                <span className="text-[#7C3AED]">Distributed Systems</span> Failure
              </h2>
              <p className="text-[15px] text-[#777] leading-relaxed">
                Modern software is built from dozens of services talking to each other over networks. Databases go slow. Queues fill up. Retries amplify load. Connection pools exhaust. Most developers have never <em>seen</em> these failures because they are incredibly hard to reproduce on a laptop or staging environment.
              </p>
              <p className="text-[15px] text-[#777] leading-relaxed">
                <strong className="text-white">Archaos</strong> solves this by giving you a visual, drag-and-drop simulation canvas. You build a topology — services, databases, caches, load balancers, message queues — connect them with edges, tune parameters, and then inject chaos. The simulation runs in a Web Worker in real time, giving you metrics, animated traffic, and an AI narration that explains the root cause as it happens.
              </p>
              <p className="text-[15px] text-[#777] leading-relaxed">
                Think of it as a <strong className="text-white">flight simulator for distributed systems</strong> — you experience real failure scenarios and learn how to build resilient architectures, without touching production.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                {[
                  { num: '8+', label: 'Failure scenario types' },
                  { num: '100%', label: 'Browser-based, no install' },
                  { num: 'AI', label: 'Streaming narration engine' },
                  { num: '∞', label: 'Custom topologies you can build' },
                ].map((stat, i) => (
                  <div key={i} className="p-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl">
                    <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stat.num}</div>
                    <div className="text-xs text-[#555] mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[
                { color: '#EF4444', title: 'The Problem It Solves', icon: AlertTriangle, body: 'Distributed failures are invisible until production. A 4-second database latency doesn\'t just slow down one query — it blocks every thread waiting for a response, causing a cascading freeze that takes your entire application offline. Understanding WHY this happens requires experiencing it.' },
                { color: '#06B6D4', title: 'How Archaos Helps', icon: Eye, body: 'Archaos makes failure visual. You see traffic particles flowing between nodes. You watch node colors shift from green → yellow → red. You see queue depths climb. You see error rates spike. The system makes the invisible visible, transforming abstract concepts into intuitive experiences.' },
                { color: '#10B981', title: 'What You Walk Away With', icon: CheckCircle, body: 'After running a scenario, you understand the exact failure pattern — cascade, retry storm, thundering herd, split brain — and the mitigation pattern that prevents it — circuit breakers, exponential backoff, cache-aside locking, write quorums.' },
              ].map((card, i) => (
                <div key={i} className="p-6 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl space-y-2 hover:border-[#2A2A2A] transition-all">
                  <div className="flex items-center gap-2">
                    <card.icon size={14} style={{ color: card.color }} />
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: card.color }}>{card.title}</span>
                  </div>
                  <p className="text-xs text-[#666] leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Architecture Diagram */}
        <FadeIn delay={200} className="mt-20">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-[#888]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              A Real Topology Running Inside Archaos
            </h3>
            <p className="text-xs text-[#444] mt-2 font-mono">Animated particles show live traffic · Glowing nodes show health state · Red pulsing = CHAOS INJECTED</p>
          </div>
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-8">
            <ArchitectureDiagram />
          </div>
        </FadeIn>
      </section>

      {/* ══ SECTION 2: HOW IT WORKS ══ */}
      <section id="how-it-works" className="py-28 px-6 max-w-6xl mx-auto w-full z-10 relative border-t border-[#0F0F0F]">
        <FadeIn>
          <div className="text-center mb-14">
            <SectionPill icon={Zap} label="How It Works" color="#10B981" />
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              The Archaos Simulation Cycle
            </h2>
            <p className="text-[#666] mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              Five phases take you from blank canvas to deep architectural understanding. Each phase builds on the previous one, creating a complete learning loop.
            </p>
          </div>
        </FadeIn>

        <SimulationCycleFlow />

        {/* Failure timeline diagram */}
        <FadeIn delay={100} className="mt-20">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-[#888]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Failure Cascade Timeline — Visualized
            </h3>
            <p className="text-xs text-[#444] mt-2 font-mono">How a single database latency spike propagates across all services over 90 seconds</p>
          </div>
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-8">
            <FailureModeDiagram />
          </div>
        </FadeIn>

        {/* Detailed step breakdown */}
        <FadeIn delay={150} className="mt-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                What happens during a simulation?
              </h3>
              <p className="text-sm text-[#666] leading-relaxed">
                When you press <strong className="text-white">Start Simulation</strong>, Archaos launches a Web Worker that runs the simulation engine at real-time speed. The engine maintains the state of every node and edge, processes incoming requests, routes them through the topology, applies queue depths, checks connection pool availability, evaluates circuit breaker states, and emits health events.
              </p>
              <p className="text-sm text-[#666] leading-relaxed">
                The canvas updates every animation frame, drawing traffic particles along edges proportional to actual throughput. Node colors transition smoothly between states. A metrics panel shows live RPS, error rate, p99 latency, and queue depth graphs updated every second.
              </p>
              <p className="text-sm text-[#666] leading-relaxed">
                When chaos is injected — say, 4000ms of artificial latency on the database connection — the ripple propagates upstream. You watch it happen in real time, the same way a Netflix SRE would watch a Grafana dashboard during an incident.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { icon: BarChart2, color: '#7C3AED', title: 'Real-Time Metrics', desc: 'RPS, error rate, p99 latency, and queue depth charts update every simulation second — giving you a view identical to a production Grafana dashboard.' },
                { icon: Network, color: '#06B6D4', title: 'Traffic Animation', desc: 'Colored particles flow along every edge proportional to actual throughput. When a link degrades, particles slow. When it fails, they stop entirely.' },
                { icon: Brain, color: '#10B981', title: 'AI Streaming Narration', desc: 'A GPT-powered copilot explains each failure event as it happens — identifying the root cause, the blast radius, and the applicable resilience pattern.' },
                { icon: Terminal, color: '#F59E0B', title: 'Interactive Checkpoints', desc: 'At key moments, the simulation pauses and asks you a multiple-choice question about what you just observed — reinforcing the learning with active recall.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl hover:border-[#222] transition-all">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}15` }}>
                    <item.icon size={18} style={{ color: item.color }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{item.title}</h4>
                    <p className="text-xs text-[#555] mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ══ SECTION 3: FEATURES ══ */}
      <section id="features" className="py-28 px-6 max-w-6xl mx-auto w-full z-10 relative border-t border-[#0F0F0F]">
        <FadeIn>
          <div className="text-center mb-14">
            <SectionPill icon={Zap} label="Features" color="#06B6D4" />
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Everything You Need to Master<br />Distributed Systems Resilience
            </h2>
            <p className="text-[#666] mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              Every feature is purpose-built to bridge the gap between academic distributed systems theory and real engineering practice.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: GitBranch, color: '#7C3AED', title: 'Visual Topology Builder', badge: 'DRAG & DROP CANVAS',
              bullets: [
                'Drag API Gateways, Services, Databases, Caches, Message Queues, and Load Balancers onto the canvas',
                'Connect nodes with HTTP, gRPC, or message queue edges — each with configurable properties',
                'Configure replicas, processing time, connection pool size, and health thresholds per node',
                'Edge parameters: timeout, max retries, retry backoff policy, circuit breaker thresholds',
                'Save and load custom topologies for later sessions',
              ]
            },
            {
              icon: Skull, color: '#EF4444', title: 'Chaos Injection Engine', badge: 'FAULT SIMULATION',
              bullets: [
                'ADD_LATENCY — inject artificial millisecond delays on any edge to simulate slow dependencies',
                'KILL_NODE — terminate a service instance to simulate OOM kills or pod crashes',
                'NETWORK_PARTITION — sever the connection between two nodes (split-brain simulation)',
                'CPU_SPIKE — simulate CPU pressure that slows processing on a service',
                'MEMORY_PRESSURE — ramp memory usage to trigger OOM killer cycles',
                'CACHE_EXPIRE — force cache key expiry to trigger thundering herd stampedes',
                'TRAFFIC_SPIKE — multiply incoming RPS by a factor to simulate flash traffic events',
              ]
            },
            {
              icon: Brain, color: '#10B981', title: 'AI Narration Engine', badge: 'STREAMING COPILOT',
              bullets: [
                'Streams token-by-token explanation of failure events in real time (typewriter animation)',
                'Identifies the root cause of each failure — not just what broke, but why',
                'Explains the failure pattern by name: cascade, retry storm, thundering herd, split brain',
                'Recommends the specific mitigation pattern: circuit breakers, backoff jitter, write quorum',
                'Monitors queue depths, error rates, and latency spikes to trigger explanations proactively',
              ]
            },
            {
              icon: BarChart2, color: '#F59E0B', title: 'Live Metrics Dashboard', badge: 'REAL-TIME TELEMETRY',
              bullets: [
                'Requests Per Second (RPS) line chart — see how load evolves over simulation time',
                'Error Rate % — watch it climb from 0% to 100% as failures cascade',
                'p99 Latency chart — shows tail latency degradation before systems fully fail',
                'Queue Depth gauge for message queues — watch backlogs grow in real time',
                'Per-node health status indicators: HEALTHY, DEGRADED, UNHEALTHY, FAILED, RECOVERING',
              ]
            },
            {
              icon: Shield, color: '#06B6D4', title: 'Circuit Breaker Simulation', badge: 'RESILIENCE PATTERNS',
              bullets: [
                'Enable circuit breakers on any edge with configurable error threshold percentages',
                'Watch circuit breaker OPEN state halt traffic and prevent cascade amplification',
                'Observe HALF-OPEN probing after recovery timeout for safe traffic resumption',
                'Compare The Cascade scenario (no circuit breakers) vs Graceful Degradation (circuit breakers)',
                'See how fail-fast behavior actually improves user-facing error rates during incidents',
              ]
            },
            {
              icon: BookOpen, color: '#A78BFA', title: 'Guided Scenario Library', badge: 'STRUCTURED LEARNING',
              bullets: [
                '8+ pre-designed scenarios covering every major distributed systems failure pattern',
                'Each scenario has a scripted chaos timeline with automatic fault injection at key moments',
                'Interactive walkthrough with multiple-choice questions pausing the simulation at critical events',
                'Difficulty levels: BEGINNER → INTERMEDIATE → ADVANCED progression path',
                'Scenario completion cards and guided return to the scenario grid',
              ]
            },
          ].map((f, i) => (
            <FadeIn key={i} delay={i * 60}>
              <FeatureCard {...f} />
            </FadeIn>
          ))}
        </div>

        {/* Node types section */}
        <FadeIn delay={100} className="mt-20">
          <h3 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Available Node Types
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { icon: '🔀', label: 'API Gateway', desc: 'Entry point. Distributes incoming RPS across downstream services.', color: '#06B6D4' },
              { icon: '⚖️', label: 'Load Balancer', desc: 'Round-robin or least-connections traffic distribution.', color: '#7C3AED' },
              { icon: '⚙️', label: 'Service', desc: 'Configurable replicas, processing time, and health thresholds.', color: '#10B981' },
              { icon: '🗄️', label: 'Database', desc: 'PostgreSQL or Redis. Configurable connection pool and replication.', color: '#3B82F6' },
              { icon: '📨', label: 'Message Queue', desc: 'Kafka or RabbitMQ. Configurable max queue depth and consumer lag.', color: '#F59E0B' },
              { icon: '⚡', label: 'Cache Layer', desc: 'Redis cache with configurable TTL and miss-fall-through behavior.', color: '#EF4444' },
            ].map((node, i) => (
              <div key={i} className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-5 text-center space-y-2 hover:border-[#2A2A2A] transition-all">
                <div className="text-3xl">{node.icon}</div>
                <h4 className="text-xs font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif', color: node.color }}>{node.label}</h4>
                <p className="text-[10px] text-[#444] leading-relaxed">{node.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ══ SECTION 4: FAILURE PATTERNS ══ */}
      <section className="py-28 px-6 max-w-6xl mx-auto w-full z-10 relative border-t border-[#0F0F0F]">
        <FadeIn>
          <div className="text-center mb-14">
            <SectionPill icon={AlertTriangle} label="Failure Patterns" color="#EF4444" />
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              The 8 Distributed Systems Failures<br />You Must Understand
            </h2>
            <p className="text-[#666] mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              Each of these patterns has caused major outages at companies like Netflix, Amazon, and Meta. Archaos lets you experience all of them safely.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              num: '01', color: '#EF4444', icon: '🌊',
              pattern: 'The Cascade Failure',
              tldr: 'A slow dependency blocks threads upstream, freezing the entire application.',
              mechanism: 'When Service B is slow, Service A\'s thread pool fills with requests waiting for B\'s response. New requests pile up. The entire system freezes — not because B failed, but because A ran out of threads.',
              mitigation: 'Circuit Breakers + Timeouts',
              real: 'Amazon 2013 DynamoDB outage. Netflix 2012 holiday outage.',
            },
            {
              num: '02', color: '#F59E0B', icon: '🔁',
              pattern: 'The Retry Storm',
              tldr: 'Aggressive retries amplify load on a struggling service, preventing recovery.',
              mechanism: 'Payment Service is slow. Order Service retries 3 times with 50ms fixed delay. This multiplies load on Payment by 4x. The extra load makes Payment even slower, creating a feedback loop until it crashes.',
              mitigation: 'Exponential Backoff + Jitter',
              real: 'AWS 2012 Elastic Load Balancer retry storm causing cascaded failures.',
            },
            {
              num: '03', color: '#06B6D4', icon: '🐘',
              pattern: 'The Thundering Herd',
              tldr: 'A cache miss sends a stampede of concurrent requests to the database.',
              mechanism: 'A popular cache key expires under high traffic. All 500 concurrent requests miss the cache and hit PostgreSQL simultaneously. The DB\'s connection pool (size: 5) is exhausted instantly. All queries timeout.',
              mitigation: 'Cache-Aside Locking / Mutex on Cache Miss',
              real: 'Instagram cache warmup outages. Reddit cache stampedes.',
            },
            {
              num: '04', color: '#A78BFA', icon: '🧠',
              pattern: 'The Split Brain',
              tldr: 'A network partition causes two database nodes to think the other is dead and accept writes independently, diverging data.',
              mechanism: 'The replication link between DB East and DB West is severed. Both promote themselves to primary. East accepts writes from East users, West from West users. When the partition heals, data conflicts exist with no clear winner.',
              mitigation: 'Raft / Paxos Consensus · Write Quorums',
              real: 'GitHub 2012 MySQL split-brain. Elasticsearch split-brain issues.',
            },
            {
              num: '05', color: '#10B981', icon: '📦',
              pattern: 'The Queue Flood',
              tldr: 'A dead consumer lets a message queue fill up, causing producers to experience backpressure.',
              mechanism: 'Consumer Service crashes. The Kafka queue starts filling at the producer\'s rate. Once it hits maxQueueDepth (300 messages), producers receive QUEUE_FULL errors and upstream requests begin failing. Consumer recovers and drains the backlog.',
              mitigation: 'Dead Letter Queues + Consumer Autoscaling',
              real: 'Uber message queue backlog incidents. Discord queue overflow outages.',
            },
            {
              num: '06', color: '#F97316', icon: '💾',
              pattern: 'The Memory Leak',
              tldr: 'A slow heap leak causes OOM kills that create periodic outages in a repeating cycle.',
              mechanism: 'Leak Service allocates objects without freeing them. Memory climbs from 40% → 70% → 95% → 100%. The OS OOM Killer terminates the process. The service restarts and begins leaking again immediately. Requests fail during each crash.',
              mitigation: 'Heap Profiling + Memory Limits + Liveness Probes',
              real: 'Node.js event listener leaks. Java GC pressure under load.',
            },
            {
              num: '07', color: '#3B82F6', icon: '📈',
              pattern: 'Traffic Spike Survival',
              tldr: 'A 10x traffic spike overwhelms database connection pools before services scale.',
              mechanism: 'A flash sale generates 10x normal traffic. The load balancer distributes to 2 service replicas (still scaling). The PostgreSQL connection pool (size: 10) is exhausted as both services send concurrent queries. Error rates spike to 60%.',
              mitigation: 'Connection Pool Sizing + Horizontal Autoscaling',
              real: 'Black Friday e-commerce failures. Gaming server launch crashes.',
            },
            {
              num: '08', color: '#A78BFA', icon: '🛡️',
              pattern: 'Graceful Degradation',
              tldr: 'Circuit breakers isolate a failure, keeping the healthy parts of the system running.',
              mechanism: 'Same topology as The Cascade, but circuit breakers are enabled on every edge. When DB latency spikes, the circuit on billing→payment trips OPEN. Payment fails fast with 503 instead of waiting. Order Service stays responsive for other operations.',
              mitigation: 'This IS the mitigation — Circuit Breakers Done Right',
              real: 'Netflix Hystrix pattern. AWS SDK circuit breakers.',
            },
          ].map((p, i) => (
            <FadeIn key={i} delay={i * 50}>
              <div
                className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-7 space-y-4 hover:border-[#2A2A2A] transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{p.icon}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-mono text-[#333]">{p.num}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold" style={{ background: `${p.color}15`, color: p.color }}>
                        PATTERN
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif', color: p.color }}>
                      {p.pattern}
                    </h3>
                    <p className="text-xs text-[#666] mt-1 italic">{p.tldr}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-mono font-bold text-[#333] uppercase tracking-widest mb-1">HOW IT HAPPENS</p>
                    <p className="text-xs text-[#666] leading-relaxed">{p.mechanism}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={11} style={{ color: p.color }} />
                    <span className="text-[10px] font-mono font-bold" style={{ color: p.color }}>MITIGATION:</span>
                    <span className="text-[10px] text-[#666]">{p.mitigation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={11} className="text-[#333]" />
                    <span className="text-[10px] font-mono text-[#333] font-bold">REAL-WORLD:</span>
                    <span className="text-[10px] text-[#444]">{p.real}</span>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══ SECTION 5: FOR WHOM ══ */}
      <section id="for-whom" className="py-28 px-6 max-w-6xl mx-auto w-full z-10 relative border-t border-[#0F0F0F]">
        <FadeIn>
          <div className="text-center mb-14">
            <SectionPill icon={Users} label="Who It's For" color="#3B82F6" />
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Designed for Every<br />Level of Systems Thinker
            </h2>
            <p className="text-[#666] mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              Whether you're a CS student encountering distributed systems for the first time, or an SRE running production runbooks, Archaos meets you where you are.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Cpu, color: '#7C3AED', role: 'Backend & Software Engineers',
              tagline: 'Level up your systems knowledge without a cluster',
              useCases: [
                'Understand how circuit breakers actually protect services in practice',
                'See what happens when you forget to add timeouts on HTTP clients',
                'Experience retry storms before deploying aggressive retry logic to production',
                'Learn to right-size connection pools for your service\'s concurrency requirements',
                'Prototype a new microservice topology before writing a single line of code',
              ],
              bestScenarios: ['The Cascade', 'Retry Storm', 'Graceful Degradation', 'Traffic Spike'],
            },
            {
              icon: ShieldAlert, color: '#3B82F6', role: 'SREs & DevOps Teams',
              tagline: 'Prepare for incidents before they happen',
              useCases: [
                'Model blast radius: which services are affected if Payments goes down?',
                'Test runbook procedures against simulated failure scenarios',
                'Validate circuit breaker thresholds before deploying to staging',
                'Train junior SREs on incident patterns with guided scenario walkthroughs',
                'Demonstrate failure scenarios to product managers without touching production',
              ],
              bestScenarios: ['Split Brain', 'Queue Flood', 'Memory Leak', 'Traffic Spike Survival'],
            },
            {
              icon: GraduationCap, color: '#06B6D4', role: 'CS Students & Educators',
              tagline: 'Bring distributed systems to life beyond textbooks',
              useCases: [
                'Replace dry CAP Theorem slides with a live split-brain simulation',
                'Use guided scenarios as interactive homework assignments',
                'Quiz students with live prediction checkpoints during scenarios',
                'Teach load balancing algorithms visually with animated traffic flow',
                'Cover advanced topics like backpressure and OOM cycles interactively',
              ],
              bestScenarios: ['The Cascade', 'Thundering Herd', 'Split Brain', 'Graceful Degradation'],
            },
          ].map((a, i) => (
            <FadeIn key={i} delay={i * 80}>
              <AudienceCard {...a} />
            </FadeIn>
          ))}
        </div>

        {/* High-value professions bonus section */}
        <FadeIn delay={100} className="mt-16">
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-10">
            <h3 className="text-2xl font-bold mb-8 text-center" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Where Archaos Fits in Your Workflow
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              {[
                { icon: '🏗️', title: 'Architecture Reviews', desc: 'Prototype a proposed service topology and run a failure simulation before the architecture review meeting.' },
                { icon: '🎓', title: 'Onboarding Engineers', desc: 'Use Archaos scenarios to show new hires why the existing circuit breakers and timeouts exist.' },
                { icon: '📋', title: 'Runbook Validation', desc: 'Test your incident response runbook steps against simulated failures to find gaps before an actual incident.' },
                { icon: '🏫', title: 'University Courses', desc: 'Assign specific scenarios as graded labs for Distributed Systems or Cloud Computing courses.' },
              ].map((w, i) => (
                <div key={i} className="space-y-3">
                  <div className="text-4xl">{w.icon}</div>
                  <h4 className="text-sm font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{w.title}</h4>
                  <p className="text-xs text-[#555] leading-relaxed">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ══ SECTION 6: SCENARIOS ══ */}
      <section id="scenarios" className="py-28 px-6 max-w-6xl mx-auto w-full z-10 relative border-t border-[#0F0F0F]">
        <FadeIn>
          <div className="text-center mb-14">
            <SectionPill icon={Play} label="Scenario Library" color="#10B981" />
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Launch a Scenario in 30 Seconds
            </h2>
            <p className="text-[#666] mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              Every scenario is pre-configured with a topology, chaos timeline, and guided walkthrough. Pick your level and press play.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { slug: 'the-cascade', tag: 'Resilience', difficulty: 'BEGINNER' as const, title: 'The Cascade', description: 'A 4000ms database latency propagates upstream through 6 services in 90 seconds, freezing the entire application. No circuit breakers. Complete thread pool exhaustion.' },
            { slug: 'graceful-degradation', tag: 'Resilience', difficulty: 'BEGINNER' as const, title: 'Graceful Degradation', description: 'Identical topology and chaos as The Cascade — but with circuit breakers enabled. Watch how fail-fast behavior isolates the failure and keeps the healthy services running.' },
            { slug: 'the-retry-storm', tag: 'Traffic', difficulty: 'INTERMEDIATE' as const, title: 'Retry Storm', description: 'A CPU spike slows Payment Service past the 200ms timeout. Three aggressive fixed-backoff retries amplify load by 4x, crashing a service that was only slightly struggling.' },
            { slug: 'the-thundering-herd', tag: 'Cache', difficulty: 'INTERMEDIATE' as const, title: 'The Thundering Herd', description: 'A popular Redis cache key expires under heavy traffic. 500 concurrent requests miss the cache and stampede PostgreSQL simultaneously, exhausting its tiny connection pool.' },
            { slug: 'split-brain', tag: 'Consistency', difficulty: 'ADVANCED' as const, title: 'Split Brain', description: 'A network partition severs the replication link between two database nodes. Both promote themselves to primary and accept independent writes — causing silent data divergence.' },
            { slug: 'the-queue-flood', tag: 'Queuing', difficulty: 'INTERMEDIATE' as const, title: 'The Queue Flood', description: 'The Consumer Service crashes. The Kafka queue fills to its 300-message limit. Producers start failing with QUEUE_FULL errors. Consumer recovers and the backlog drains.' },
            { slug: 'the-memory-leak', tag: 'Memory', difficulty: 'INTERMEDIATE' as const, title: 'The Memory Leak', description: 'A slow heap leak drives Leak Service memory from 40% to 100%, triggering an OOM kill. The process restarts and immediately begins leaking again in a repeating crash cycle.' },
            { slug: 'traffic-spike-survival', tag: 'Scaling', difficulty: 'ADVANCED' as const, title: 'Traffic Spike Survival', description: 'A 10x traffic spike overwhelms a 2-replica load-balanced system before autoscaling kicks in. Database connection pool exhaustion determines whether you survive or crash.' },
          ].map((s, i) => (
            <FadeIn key={i} delay={i * 40}>
              <ScenarioCard {...s} onLaunch={() => navigate(`/learn/${s.slug}`)} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══ SECTION 7: COMPARISON TABLE ══ */}
      <section className="py-28 px-6 max-w-6xl mx-auto w-full z-10 relative border-t border-[#0F0F0F]">
        <FadeIn>
          <div className="text-center mb-14">
            <SectionPill icon={BarChart2} label="Comparison" color="#A78BFA" />
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Archaos vs. Other Chaos Tools
            </h2>
            <p className="text-[#666] mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              Archaos is not a production chaos engineering tool — it's a learning-first simulator. Here's how it compares.
            </p>
          </div>
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl overflow-hidden">
            <ComparisonTable />
          </div>
          <p className="text-xs text-center text-[#333] mt-4 font-mono">
            Chaos Monkey and Gremlin are production tools that require real infrastructure. Archaos is a browser-based learning simulator.
          </p>
        </FadeIn>
      </section>

      {/* ══ SECTION 8: HOW TO USE STEP BY STEP ══ */}
      <section className="py-28 px-6 max-w-6xl mx-auto w-full z-10 relative border-t border-[#0F0F0F]">
        <FadeIn>
          <div className="text-center mb-14">
            <SectionPill icon={BookOpen} label="Getting Started" color="#06B6D4" />
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              How to Use Archaos
            </h2>
            <p className="text-[#666] mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              From zero to your first chaos simulation in under 2 minutes. Two paths: guided scenarios or freestyle playground.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Path 1 */}
          <FadeIn>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981] font-bold text-sm">A</div>
                <h3 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#10B981' }}>
                  Path A: Guided Scenarios (Recommended for Beginners)
                </h3>
              </div>
              <div className="space-y-4 border-l border-[#1A1A1A] pl-6">
                {[
                  { step: '1', title: 'Go to Scenarios', desc: 'Click "Scenarios" in the navbar or choose a scenario card on this page. All 8 scenarios are available without an account.' },
                  { step: '2', title: 'Read the Description', desc: 'Each scenario tells you exactly what system you\'re looking at, what chaos will be injected, and at what time (e.g., "at t=15s, we inject 4000ms DB latency").' },
                  { step: '3', title: 'Press Start', desc: 'Click Start Simulation. The simulation begins running at real-time speed. Watch the canvas animate traffic particles between services.' },
                  { step: '4', title: 'Answer the Checkpoint', desc: 'At key moments, the simulation pauses and asks you a question about what just happened. Answer correctly to continue.' },
                  { step: '5', title: 'Read the AI Narration', desc: 'Watch the streaming AI copilot explain each failure event in real time. It identifies the pattern and mitigation in plain language.' },
                  { step: '6', title: 'Complete & Compare', desc: 'After completing The Cascade, try Graceful Degradation with the same topology but circuit breakers enabled — and see the difference.' },
                ].map((s, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-[#0F0F0F] border border-[#1A1A1A] flex items-center justify-center text-[10px] font-mono text-[#555] flex-shrink-0 mt-0.5">{s.step}</div>
                    <div>
                      <h4 className="text-sm font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{s.title}</h4>
                      <p className="text-xs text-[#555] mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Path 2 */}
          <FadeIn delay={100}>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] font-bold text-sm">B</div>
                <h3 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#7C3AED' }}>
                  Path B: Freestyle Playground (For Engineers)
                </h3>
              </div>
              <div className="space-y-4 border-l border-[#1A1A1A] pl-6">
                {[
                  { step: '1', title: 'Open the Editor', desc: 'Click "Playground" in the navbar. You\'ll see a blank canvas with a node palette on the left side.' },
                  { step: '2', title: 'Build Your Topology', desc: 'Drag nodes from the palette onto the canvas: API Gateway → Load Balancer → Services → Database. Draw edges by clicking and dragging between node handles.' },
                  { step: '3', title: 'Configure Each Node', desc: 'Click any node to open its property panel. Set replicas, processing time, connection pool size, circuit breaker settings, and retry policies.' },
                  { step: '4', title: 'Start Simulation', desc: 'Hit Start in the top panel. Set base RPS and traffic pattern. Watch traffic begin flowing. All nodes start in HEALTHY state.' },
                  { step: '5', title: 'Inject Chaos', desc: 'Use the Chaos panel to select a fault type and target node or edge. Inject latency, kill a node, or trigger a network partition.' },
                  { step: '6', title: 'Observe & Iterate', desc: 'Watch the cascade in the metrics panel. Adjust parameters — add circuit breakers, increase pool sizes — and restart to see the difference.' },
                ].map((s, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-[#0F0F0F] border border-[#1A1A1A] flex items-center justify-center text-[10px] font-mono text-[#555] flex-shrink-0 mt-0.5">{s.step}</div>
                    <div>
                      <h4 className="text-sm font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{s.title}</h4>
                      <p className="text-xs text-[#555] mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══ SECTION 9: FAQ ══ */}
      <section className="py-28 px-6 max-w-4xl mx-auto w-full z-10 relative border-t border-[#0F0F0F]">
        <FadeIn>
          <div className="text-center mb-14">
            <SectionPill icon={HelpCircle} label="FAQ" color="#F59E0B" />
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Frequently Asked Questions
            </h2>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl px-8">
            {[
              {
                q: 'Does Archaos require any installation, Docker, or cloud credentials?',
                a: 'No. Archaos runs entirely in the browser using a Web Worker for the simulation engine. There is no server involved in the simulation itself. You don\'t need Docker, Kubernetes, AWS credentials, or any local setup. All you need is a modern browser.',
              },
              {
                q: 'Is the simulation realistic or just a toy?',
                a: 'The simulation models real distributed systems mechanics: HTTP request routing, connection pool exhaustion, circuit breaker state machines (CLOSED → OPEN → HALF-OPEN), message queue backpressure, retry amplification, and cache miss waterfall effects. The failure patterns are based on real-world incident reports from companies like Netflix, Amazon, and GitHub. While it\'s a simulation (not a real Kubernetes cluster), the underlying mechanics are accurate enough to teach genuine intuition.',
              },
              {
                q: 'How does the AI narration work?',
                a: 'During a simulation, Archaos monitors every state change event — node health transitions, error rate spikes, queue depth growth, circuit breaker trips. These events are sent to a language model with context about the current topology and fault. The model generates a streaming explanation that is displayed token-by-token in the narration panel, explaining what happened, why, and what pattern it represents.',
              },
              {
                q: 'Can I build my own custom topologies, or only use pre-built scenarios?',
                a: 'Both. The Scenario Library provides 8+ pre-configured failure scenarios with guided walkthroughs and quiz checkpoints. The Playground (Editor) gives you a blank canvas where you can build any topology from scratch, configure every parameter, and inject any fault at any time. It\'s like a free-form chaos engineering sandbox.',
              },
              {
                q: 'I\'m a student learning distributed systems — where should I start?',
                a: 'Start with "The Cascade" scenario (BEGINNER). It covers the most important concept in distributed systems: how a slow dependency causes a cascade failure upstream. After that, run "Graceful Degradation" — the exact same topology but with circuit breakers enabled — and compare the results. Those two scenarios together teach the most impactful lesson in systems resilience in about 10 minutes.',
              },
              {
                q: 'I\'m a senior SRE — is this too basic for me?',
                a: 'Not necessarily. The INTERMEDIATE and ADVANCED scenarios (Split Brain, Traffic Spike Survival, Thundering Herd) model genuinely complex failure modes. The free-form Playground lets you reconstruct your actual production topology and simulate your most feared failure scenarios. Many engineers use Archaos to demonstrate failure modes to stakeholders who are unfamiliar with infrastructure.',
              },
              {
                q: 'Is Archaos free?',
                a: 'The core simulator, all 8 scenarios, and the visual canvas editor are free to use without an account. Creating an account allows you to save custom topologies. AI narration is available in the free tier with a usage limit. We will introduce team and enterprise tiers for collaborative use and unlimited AI narration.',
              },
            ].map((faq, i) => (
              <FAQItem key={i} {...faq} />
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="py-32 px-6 max-w-5xl mx-auto w-full z-10 relative border-t border-[#0F0F0F]">
        <FadeIn>
          <div
            className="rounded-3xl p-16 text-center space-y-8 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #7C3AED12, #06B6D412)', border: '1px solid #7C3AED30' }}
          >
            {/* Glow blobs */}
            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: '#7C3AED' }} />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: '#06B6D4' }} />

            <div className="relative z-10 space-y-6">
              <div className="text-6xl">🚀</div>
              <h2 className="text-4xl md:text-5xl font-extrabold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Ready to build systems<br />
                <span className="bg-gradient-to-r from-[#A78BFA] to-[#06B6D4] bg-clip-text text-transparent">
                  that don't break?
                </span>
              </h2>
              <p className="text-[#888] text-lg max-w-lg mx-auto leading-relaxed">
                Start with a guided scenario in 30 seconds, or jump straight into the free-form playground. No setup. No credentials. No excuses.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => navigate('/learn/the-cascade')}
                  className="px-8 py-4 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white font-bold rounded-xl flex items-center gap-2 shadow-2xl shadow-[#7C3AED]/30 hover:opacity-90 active:scale-[0.98] transition-all text-sm"
                >
                  <Play size={14} className="fill-white" />
                  Start with The Cascade — Free
                </button>
                <button
                  onClick={() => navigate('/editor')}
                  className="px-8 py-4 border border-[#333] hover:border-[#7C3AED] text-[#888] hover:text-white font-semibold rounded-xl transition-all text-sm flex items-center gap-2"
                >
                  <Terminal size={14} /> Open Playground
                </button>
              </div>
              <div className="flex items-center justify-center gap-8 pt-2 text-xs text-[#444]">
                <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#10B981]" /> Free forever tier</span>
                <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#10B981]" /> No credit card required</span>
                <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#10B981]" /> 8 scenarios included</span>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-[#0F0F0F] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="space-y-3">
              <div className="font-bold tracking-[3px] text-white text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>ARCHAOS</div>
              <p className="text-xs text-[#444] leading-relaxed">
                A visual, interactive distributed systems failure simulator with AI narration. Built for engineers, SREs, and students.
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-mono font-bold tracking-widest text-[#333] uppercase mb-4">Product</h4>
              <ul className="space-y-2.5">
                {['Playground', 'Scenarios', 'Learn'].map(l => (
                  <li key={l}>
                    <Link to={`/${l.toLowerCase()}`} className="text-xs text-[#444] hover:text-white transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-mono font-bold tracking-widest text-[#333] uppercase mb-4">Scenarios</h4>
              <ul className="space-y-2.5">
                {['The Cascade', 'Retry Storm', 'Thundering Herd', 'Split Brain'].map(l => (
                  <li key={l}>
                    <span className="text-xs text-[#444]">{l}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-mono font-bold tracking-widest text-[#333] uppercase mb-4">Get Started</h4>
              <div className="space-y-2">
                <Link
                  to="/auth"
                  state={{ mode: 'register' }}
                  className="block w-full px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white text-xs font-bold rounded-lg hover:opacity-85 transition-all text-center"
                >
                  Sign Up Free
                </Link>
                <Link
                  to="/editor"
                  className="block w-full px-4 py-2 border border-[#1A1A1A] text-[#444] hover:text-white hover:border-[#333] text-xs font-bold rounded-lg transition-all text-center"
                >
                  Open Playground
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-[#0F0F0F] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[10px] font-mono text-[#333]">© {new Date().getFullYear()} ARCHAOS. All rights reserved.</p>
            <p className="text-[10px] font-mono text-[#222]">
              Built for engineers who want to understand failure before it finds them.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
