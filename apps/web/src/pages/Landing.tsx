
// ARCHAOS — New Landing Page
// Drop this file into apps/web/src/pages/Landing.tsx
// Fonts loaded via inline style tag — no additional installs needed

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Play, ChevronRight, CheckCircle, ArrowRight,
  Brain, Shield, BarChart2, Terminal,
  GitBranch, BookOpen,
  GraduationCap, ShieldAlert, Flame, Cpu,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  :root {
    --bg:        #080B0F;
    --bg2:       #0E1117;
    --bg3:       #161B23;
    --border:    #1E2530;
    --border2:   #2D3748;
    --text1:     #E8EDF3;
    --text2:     #8B95A3;
    --text3:     #4A5568;
    --indigo:    #6366F1;
    --green:     #10B981;
    --amber:     #F59E0B;
    --red:       #EF4444;
    --orange:    #F97316;
    --cyan:      #06B6D4;
    --purple:    #7C3AED;
    --recovering:#6366F1;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text1);
    font-family: 'DM Sans', sans-serif;
    overflow-x: hidden;
  }

  .font-display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.02em; }
  .font-mono    { font-family: 'JetBrains Mono', monospace; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: 0.8; }
    70%  { transform: scale(2.5); opacity: 0; }
    100% { transform: scale(2.5); opacity: 0; }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes scan {
    0%   { top: 0; }
    100% { top: 100%; }
  }
  @keyframes flow {
    0%   { stroke-dashoffset: 1000; }
    100% { stroke-dashoffset: 0; }
  }
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 8px 0px var(--indigo); }
    50%       { box-shadow: 0 0 24px 4px var(--indigo); }
  }
  @keyframes cascade-wave {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes count-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  .animate-fade-up  { animation: fadeUp 0.7s ease forwards; }
  .animate-fade-in  { animation: fadeIn 0.5s ease forwards; }
  .blink-cursor::after { content: '|'; animation: blink 1s step-end infinite; }

  .scanline {
    position: absolute; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.15), transparent);
    animation: scan 4s linear infinite;
    pointer-events: none;
  }

  .cascade-text {
    background: linear-gradient(90deg,
      var(--green)  0%,
      var(--amber)  30%,
      var(--red)    60%,
      var(--amber)  80%,
      var(--green)  100%
    );
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: cascade-wave 4s linear infinite;
  }

  .section-divider {
    width: 48px; height: 3px;
    background: linear-gradient(90deg, var(--indigo), var(--cyan));
    border-radius: 2px;
    margin: 0 auto 20px;
  }

  .node-dot {
    width: 12px; height: 12px; border-radius: 50%;
    position: relative; display: inline-block;
  }
  .node-dot::before {
    content: '';
    position: absolute; inset: -4px; border-radius: 50%;
    border: 1px solid currentColor; opacity: 0.4;
    animation: pulse-ring 2s ease-out infinite;
  }

  .ticker-wrap {
    overflow: hidden;
    white-space: nowrap;
    width: 100%;
  }
  .ticker-inner {
    display: inline-block;
    animation: ticker 30s linear infinite;
  }

  .feature-card:hover {
    transform: translateY(-4px);
    border-color: var(--indigo) !important;
    box-shadow: 0 0 32px rgba(99,102,241,0.12);
  }

  .scenario-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 24px rgba(99,102,241,0.1);
  }

  .cta-btn {
    position: relative; overflow: hidden;
  }
  .cta-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }
  .cta-btn:hover::before { transform: translateX(100%); }
`

// ─── HOOKS ────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function FadeUp({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(40px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`
    }}>
      {children}
    </div>
  )
}

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const { ref, inView } = useInView()
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const dur = 1200
    const step = (ts: number, startTs: number) => {
      const p = Math.min((ts - startTs) / dur, 1)
      setVal(Math.round(p * target))
      if (p < 1) requestAnimationFrame(ts2 => step(ts2, startTs))
    }
    requestAnimationFrame(ts => step(ts, ts))
  }, [inView, target])
  return (
    <span ref={ref} className="font-display" style={{ fontSize: 'inherit' }}>
      {val}{suffix}
    </span>
  )
}

// ─── HERO CANVAS ──────────────────────────────────────────────────────────────
function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight
    const onResize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    // Topology
    const NODES = [
      { id: 'gw', label: 'API Gateway', px: 0.10, py: 0.50, r: 11, base: '#06B6D4' },
      { id: 'order', label: 'Order Svc', px: 0.30, py: 0.32, r: 9, base: '#10B981' },
      { id: 'user', label: 'User Svc', px: 0.30, py: 0.68, r: 9, base: '#10B981' },
      { id: 'payment', label: 'Payment Svc', px: 0.55, py: 0.38, r: 9, base: '#10B981' },
      { id: 'billing', label: 'Billing Svc', px: 0.55, py: 0.62, r: 9, base: '#10B981' },
      { id: 'db', label: 'PostgreSQL DB', px: 0.82, py: 0.50, r: 13, base: '#3B82F6' },
    ]
    const EDGES = [
      [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5]
    ]
    // traffic particles per edge
    const particles = EDGES.map(() =>
      Array.from({ length: 3 }, (_, i) => ({ t: i / 3, speed: 0.003 + Math.random() * 0.002 }))
    )

    let time = 0

    // cascade color for each node based on cycle phase
    function nodeColor(id: string, phase: number): string {
      // phase 0-1 repeating
      // DB degrades at 0.15, fails 0.25 → recovery 0.70
      // payment 0.25/0.38 → 0.72
      // billing 0.32/0.44 → 0.74
      // order   0.40/0.54 → 0.76
      // user    0.42/0.56 → 0.78
      // gateway 0.50/0.64 → 0.80
      const schedules: Record<string, [number, number, number, number, string]> = {
        db: [0.15, 0.25, 0.68, 0.80, '#3B82F6'],
        payment: [0.25, 0.38, 0.70, 0.82, '#10B981'],
        billing: [0.32, 0.44, 0.72, 0.84, '#10B981'],
        order: [0.40, 0.54, 0.74, 0.86, '#10B981'],
        user: [0.42, 0.56, 0.76, 0.88, '#10B981'],
        gw: [0.50, 0.64, 0.78, 0.90, '#06B6D4'],
      }
      const [deg, fail, rec, ok, base] = schedules[id]
      if (phase < deg) return base
      if (phase < fail) return '#F59E0B'
      if (phase < rec) return '#EF4444'
      if (phase < ok) return '#6366F1'
      return base
    }

    function draw() {
      time += 0.008
      const phase = (time * 0.18) % 1   // cycle ~7s

      // background
      ctx.fillStyle = '#080B0F'
      ctx.fillRect(0, 0, W, H)

      // dot grid
      ctx.fillStyle = 'rgba(30,37,48,0.6)'
      const gs = 40
      for (let x = 0; x < W; x += gs)
        for (let y = 0; y < H; y += gs) {
          ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill()
        }

      // chaos text overlay
      if (phase > 0.20 && phase < 0.68) {
        const alpha = phase < 0.25 ? (phase - 0.20) / 0.05
          : phase > 0.64 ? (0.68 - phase) / 0.04 : 1
        ctx.save()
        ctx.globalAlpha = alpha * 0.7
        ctx.fillStyle = '#EF4444'
        ctx.font = "bold 11px 'JetBrains Mono'"
        ctx.fillText('⚡ CHAOS INJECTED — 4000ms DB LATENCY', W * 0.5 - 160, H * 0.12)
        ctx.restore()
      }
      if (phase > 0.68 && phase < 0.92) {
        const alpha = phase < 0.72 ? (phase - 0.68) / 0.04
          : phase > 0.88 ? (0.92 - phase) / 0.04 : 1
        ctx.save()
        ctx.globalAlpha = alpha * 0.6
        ctx.fillStyle = '#10B981'
        ctx.font = "bold 11px 'JetBrains Mono'"
        ctx.fillText('✓ RECOVERING — CIRCUIT BREAKERS PROTECTING', W * 0.5 - 175, H * 0.12)
        ctx.restore()
      }

      // edges + particles
      EDGES.forEach(([si, ti], ei) => {
        const S = NODES[si], T = NODES[ti]
        const x1 = S.px * W, y1 = S.py * H, x2 = T.px * W, y2 = T.py * H
        const tc = nodeColor(T.id, phase)

        // edge line
        ctx.strokeStyle = '#1E2530'
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()

        // particles
        particles[ei].forEach(p => {
          p.t = (p.t + p.speed) % 1
          const px2 = x1 + (x2 - x1) * p.t, py2 = y1 + (y2 - y1) * p.t
          // particle color: interpolate source to target color
          const isError = nodeColor(T.id, phase) === '#EF4444'
          ctx.fillStyle = isError ? '#EF4444' : tc
          ctx.globalAlpha = isError ? 0.9 : 0.75
          ctx.beginPath(); ctx.arc(px2, py2, 3, 0, Math.PI * 2); ctx.fill()
          ctx.globalAlpha = 1
        })
      })

      // nodes
      NODES.forEach(n => {
        const nx = n.px * W, ny = n.py * H
        const color = nodeColor(n.id, phase)
        const glowR = n.r + 8 + Math.sin(time * 3) * 4

        // glow ring
        const grad = ctx.createRadialGradient(nx, ny, n.r, nx, ny, glowR + 8)
        grad.addColorStop(0, color + '40')
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.beginPath(); ctx.arc(nx, ny, glowR + 8, 0, Math.PI * 2); ctx.fill()

        // node circle
        ctx.shadowBlur = 16; ctx.shadowColor = color
        ctx.fillStyle = color
        ctx.beginPath(); ctx.arc(nx, ny, n.r, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0

        // label
        ctx.fillStyle = color
        ctx.globalAlpha = 0.8
        ctx.font = "9px 'JetBrains Mono'"
        ctx.textAlign = 'center'
        ctx.fillText(n.label, nx, ny - n.r - 8)
        ctx.textAlign = 'left'
        ctx.globalAlpha = 1
      })

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])
  return (
    <canvas ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.55, zIndex: 0 }}
    />
  )
}

// ─── TYPING EFFECT ────────────────────────────────────────────────────────────
function TypingText({ phrases }: { phrases: string[] }) {
  const [pi, setPi] = useState(0)
  const [ci, setCi] = useState(0)
  const [del, setDel] = useState(false)
  useEffect(() => {
    const phrase = phrases[pi]
    const timeout = del
      ? (ci === 0
        ? setTimeout(() => { setDel(false); setPi(p => (p + 1) % phrases.length) }, 400)
        : setTimeout(() => setCi(c => c - 1), 40))
      : (ci === phrase.length
        ? setTimeout(() => setDel(true), 1800)
        : setTimeout(() => setCi(c => c + 1), 60))
    return () => clearTimeout(timeout)
  }, [pi, ci, del, phrases])
  return (
    <span className="font-mono" style={{ color: 'var(--green)' }}>
      {phrases[pi].slice(0, ci)}
      <span style={{ animation: 'blink 1s step-end infinite', opacity: 1 }}>|</span>
    </span>
  )
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ pill, title, sub }: {
  pill: string; title: React.ReactNode; sub?: string
}) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 56 }}>
      <div className="section-divider" />
      <div className="font-mono" style={{
        fontSize: 11, letterSpacing: 3, color: 'var(--indigo)',
        textTransform: 'uppercase', marginBottom: 16
      }}>{pill}</div>
      <h2 className="font-display" style={{
        fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 1.05,
        color: 'var(--text1)', marginBottom: 16
      }}>{title}</h2>
      {sub && <p style={{
        color: 'var(--text2)', fontSize: 16, maxWidth: 560, margin: '0 auto', lineHeight: 1.7
      }}>{sub}</p>}
    </div>
  )
}

// ─── TRAFFIC FLOW SVG ─────────────────────────────────────────────────────────
function TrafficFlowSVG({ failing = false }: { failing?: boolean }) {
  const pathColor = failing ? '#EF4444' : '#6366F1'
  return (
    <svg viewBox="0 0 520 180" style={{ width: '100%', maxWidth: 520 }}>
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <polygon points="0 0,6 2.5,0 5" fill={failing ? '#EF4444' : '#2D3748'} />
        </marker>
      </defs>
      {/* edges */}
      {[
        [80, 90, 200, 50], [80, 90, 200, 130],
        [260, 50, 380, 70], [260, 130, 380, 110],
        [440, 90, 440, 90]
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={failing ? '#EF444440' : `${pathColor}40`} strokeWidth={1.5}
          markerEnd="url(#arr)"
        />
      ))}
      {/* nodes */}
      {[
        { x: 60, y: 90, r: 20, label: 'Gateway', color: failing ? '#EF4444' : '#06B6D4' },
        { x: 220, y: 50, r: 16, label: 'Order', color: failing ? '#EF4444' : '#10B981' },
        { x: 220, y: 130, r: 16, label: 'User', color: '#10B981' },
        { x: 380, y: 70, r: 16, label: 'Payment', color: failing ? '#EF4444' : '#10B981' },
        { x: 380, y: 110, r: 16, label: 'Billing', color: '#10B981' },
        { x: 470, y: 90, r: 20, label: 'DB', color: failing ? '#EF4444' : '#3B82F6' },
      ].map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.r + 6} fill={n.color + '15'} />
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.color + '22'} stroke={n.color} strokeWidth={1.5} />
          <text x={n.x} y={n.y + 4} textAnchor="middle"
            fill={n.color} fontSize={8} fontFamily="JetBrains Mono, monospace"
          >{n.label}</text>
        </g>
      ))}
      {/* animated particles */}
      {!failing && [
        "M 80 90 L 200 50", "M 80 90 L 200 130",
        "M 220 50 L 380 70", "M 220 130 L 380 110",
        "M 380 70 L 470 90", "M 380 110 L 470 90",
      ].map((d, i) => (
        <circle key={i} r={3} fill="#6366F1" opacity={0.8}>
          <animateMotion dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" path={d} />
        </circle>
      ))}
      {failing && (
        <text x={260} y={170} textAnchor="middle"
          fill="#EF4444" fontSize={9} fontFamily="JetBrains Mono, monospace"
        >CASCADE FAILURE — ALL SERVICES DEGRADED</text>
      )}
    </svg>
  )
}

// ─── CASCADE TIMELINE SVG ─────────────────────────────────────────────────────
function CascadeTimeline() {
  const services = [
    { label: 'PostgreSQL DB', events: [{ x: 40, w: 160, c: '#10B981' }, { x: 200, w: 50, c: '#F59E0B' }, { x: 250, w: 200, c: '#EF4444' }, { x: 450, w: 50, c: '#6366F1' }, { x: 500, w: 120, c: '#10B981' }] },
    { label: 'Payment Svc', events: [{ x: 40, w: 200, c: '#10B981' }, { x: 240, w: 30, c: '#F59E0B' }, { x: 270, w: 180, c: '#EF4444' }, { x: 450, w: 50, c: '#6366F1' }, { x: 500, w: 120, c: '#10B981' }] },
    { label: 'Billing Svc', events: [{ x: 40, w: 230, c: '#10B981' }, { x: 270, w: 30, c: '#F59E0B' }, { x: 300, w: 150, c: '#EF4444' }, { x: 450, w: 50, c: '#6366F1' }, { x: 500, w: 120, c: '#10B981' }] },
    { label: 'Order Svc', events: [{ x: 40, w: 270, c: '#10B981' }, { x: 310, w: 30, c: '#F59E0B' }, { x: 340, w: 110, c: '#EF4444' }, { x: 450, w: 50, c: '#6366F1' }, { x: 500, w: 120, c: '#10B981' }] },
    { label: 'API Gateway', events: [{ x: 40, w: 320, c: '#10B981' }, { x: 360, w: 30, c: '#F59E0B' }, { x: 390, w: 60, c: '#EF4444' }, { x: 450, w: 50, c: '#6366F1' }, { x: 500, w: 120, c: '#10B981' }] },
  ]
  const rowH = 34, top = 20
  return (
    <svg viewBox="0 0 700 250" style={{ width: '100%' }}>
      {/* time axis */}
      <line x1={40} y1={220} x2={680} y2={220} stroke="#1E2530" strokeWidth={1} />
      {['t=0s', 't=15s', 't=30s', 't=60s', 't=90s'].map((t, i) => (
        <text key={i} x={40 + i * 160} y={235}
          fill="#4A5568" fontSize={8} fontFamily="JetBrains Mono,monospace">{t}</text>
      ))}
      {/* chaos line */}
      <line x1={200} y1={10} x2={200} y2={215} stroke="#EF4444" strokeWidth={1} strokeDasharray="4,3" />
      <text x={203} y={18} fill="#EF4444" fontSize={7.5} fontFamily="JetBrains Mono,monospace">⚡ CHAOS</text>
      {/* recovery line */}
      <line x1={450} y1={10} x2={450} y2={215} stroke="#10B981" strokeWidth={1} strokeDasharray="4,3" />
      <text x={453} y={18} fill="#10B981" fontSize={7.5} fontFamily="JetBrains Mono,monospace">✓ RECOVER</text>
      {/* rows */}
      {services.map((s, i) => (
        <g key={i}>
          <text x={30} y={top + i * rowH + 14} textAnchor="end"
            fill="#8B95A3" fontSize={8} fontFamily="JetBrains Mono,monospace">{s.label}</text>
          {s.events.map((e, j) => (
            <rect key={j} x={e.x} y={top + i * rowH} width={e.w} height={18}
              rx={3} fill={e.c} opacity={0.75} />
          ))}
        </g>
      ))}
      {/* legend */}
      {[['#10B981', 'HEALTHY'], ['#F59E0B', 'DEGRADED'], ['#EF4444', 'FAILED'], ['#6366F1', 'RECOVERING']].map(([c, l], i) => (
        <g key={i}>
          <rect x={40 + i * 130} y={242} width={10} height={8} rx={2} fill={c} opacity={0.8} />
          <text x={55 + i * 130} y={249} fill="#4A5568" fontSize={8} fontFamily="JetBrains Mono,monospace">{l}</text>
        </g>
      ))}
    </svg>
  )
}

// ─── SYSTEM ARCHITECTURE DIAGRAM ──────────────────────────────────────────────
function SystemArchDiagram() {
  return (
    <svg viewBox="0 0 760 360" style={{ width: '100%', maxWidth: 760 }}>
      <defs>
        <marker id="a2" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <polygon points="0 0,6 2.5,0 5" fill="#2D3748" />
        </marker>
        <marker id="a3" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <polygon points="0 0,6 2.5,0 5" fill="#6366F1" />
        </marker>
      </defs>

      {/* Browser box */}
      <rect x={10} y={40} width={160} height={280} rx={10}
        fill="#0E111740" stroke="#1E2530" strokeWidth={1} />
      <text x={90} y={60} textAnchor="middle" fill="#4A5568"
        fontSize={8} fontFamily="JetBrains Mono,monospace">BROWSER</text>

      {/* React Flow Canvas */}
      <rect x={20} y={70} width={140} height={55} rx={6}
        fill="#6366F115" stroke="#6366F1" strokeWidth={1} />
      <text x={90} y={92} textAnchor="middle" fill="#6366F1" fontSize={9} fontFamily="JetBrains Mono,monospace">React Flow</text>
      <text x={90} y={107} textAnchor="middle" fill="#8B95A3" fontSize={8} fontFamily="DM Sans,sans-serif">Canvas (60fps)</text>

      {/* Web Worker */}
      <rect x={20} y={140} width={140} height={55} rx={6}
        fill="#10B98115" stroke="#10B981" strokeWidth={1} />
      <text x={90} y={162} textAnchor="middle" fill="#10B981" fontSize={9} fontFamily="JetBrains Mono,monospace">Web Worker</text>
      <text x={90} y={177} textAnchor="middle" fill="#8B95A3" fontSize={8} fontFamily="DM Sans,sans-serif">Simulation Engine</text>

      {/* Socket.IO */}
      <rect x={20} y={210} width={140} height={55} rx={6}
        fill="#F59E0B15" stroke="#F59E0B" strokeWidth={1} />
      <text x={90} y={232} textAnchor="middle" fill="#F59E0B" fontSize={9} fontFamily="JetBrains Mono,monospace">Socket.IO</text>
      <text x={90} y={247} textAnchor="middle" fill="#8B95A3" fontSize={8} fontFamily="DM Sans,sans-serif">Real-time narration</text>

      {/* postMessage arrow between React Flow and Web Worker */}
      <line x1={90} y1={125} x2={90} y2={140} stroke="#6366F1" strokeWidth={1} markerEnd="url(#a3)" />
      <text x={93} y={135} fill="#6366F1" fontSize={7} fontFamily="JetBrains Mono,monospace">postMessage</text>

      {/* Auth Store */}
      <rect x={20} y={280} width={140} height={32} rx={6}
        fill="#7C3AED15" stroke="#7C3AED" strokeWidth={1} />
      <text x={90} y={301} textAnchor="middle" fill="#7C3AED" fontSize={8} fontFamily="JetBrains Mono,monospace">Zustand Stores</text>

      {/* Arrow to backend */}
      <line x1={160} y1={237} x2={240} y2={200} stroke="#F59E0B" strokeWidth={1.5}
        strokeDasharray="5,3" markerEnd="url(#a2)" />
      <text x={185} y={212} fill="#F59E0B" fontSize={7} fontFamily="JetBrains Mono,monospace">WSS</text>

      {/* Railway/Backend box */}
      <rect x={240} y={40} width={200} height={280} rx={10}
        fill="#0E111740" stroke="#1E2530" strokeWidth={1} />
      <text x={340} y={60} textAnchor="middle" fill="#4A5568"
        fontSize={8} fontFamily="JetBrains Mono,monospace">RAILWAY BACKEND</text>

      {/* NestJS */}
      <rect x={252} y={70} width={176} height={50} rx={6}
        fill="#EF444415" stroke="#EF4444" strokeWidth={1} />
      <text x={340} y={92} textAnchor="middle" fill="#EF4444" fontSize={9} fontFamily="JetBrains Mono,monospace">NestJS API</text>
      <text x={340} y={107} textAnchor="middle" fill="#8B95A3" fontSize={8} fontFamily="DM Sans,sans-serif">REST + Socket.IO Gateway</text>

      {/* Narration Gateway */}
      <rect x={252} y={135} width={176} height={50} rx={6}
        fill="#06B6D415" stroke="#06B6D4" strokeWidth={1} />
      <text x={340} y={157} textAnchor="middle" fill="#06B6D4" fontSize={9} fontFamily="JetBrains Mono,monospace">NarrationGateway</text>
      <text x={340} y={172} textAnchor="middle" fill="#8B95A3" fontSize={8} fontFamily="DM Sans,sans-serif">GPT-OSS-120B streaming</text>

      {/* Blast Service */}
      <rect x={252} y={200} width={176} height={50} rx={6}
        fill="#7C3AED15" stroke="#7C3AED" strokeWidth={1} />
      <text x={340} y={222} textAnchor="middle" fill="#7C3AED" fontSize={9} fontFamily="JetBrains Mono,monospace">BlastService</text>
      <text x={340} y={237} textAnchor="middle" fill="#8B95A3" fontSize={8} fontFamily="DM Sans,sans-serif">BFS graph traversal</text>

      {/* PostgreSQL */}
      <rect x={252} y={265} width={80} height={40} rx={6}
        fill="#3B82F615" stroke="#3B82F6" strokeWidth={1} />
      <text x={292} y={283} textAnchor="middle" fill="#3B82F6" fontSize={8} fontFamily="JetBrains Mono,monospace">PostgreSQL</text>
      <text x={292} y={296} textAnchor="middle" fill="#8B95A3" fontSize={7} fontFamily="DM Sans,sans-serif">Topology store</text>

      {/* Redis */}
      <rect x={346} y={265} width={82} height={40} rx={6}
        fill="#EF444415" stroke="#EF4444" strokeWidth={1} />
      <text x={387} y={283} textAnchor="middle" fill="#EF4444" fontSize={8} fontFamily="JetBrains Mono,monospace">Redis</text>
      <text x={387} y={296} textAnchor="middle" fill="#8B95A3" fontSize={7} fontFamily="DM Sans,sans-serif">Session cache</text>

      {/* Internal arrows in backend */}
      <line x1={340} y1={120} x2={340} y2={135} stroke="#2D3748" strokeWidth={1} markerEnd="url(#a2)" />
      <line x1={340} y1={185} x2={340} y2={200} stroke="#2D3748" strokeWidth={1} markerEnd="url(#a2)" />
      <line x1={340} y1={250} x2={340} y2={265} stroke="#2D3748" strokeWidth={1} markerEnd="url(#a2)" />

      {/* Arrow to OpenRouter */}
      <line x1={428} y1={160} x2={490} y2={160} stroke="#06B6D4" strokeWidth={1.5}
        strokeDasharray="5,3" markerEnd="url(#a2)" />
      <text x={432} y={153} fill="#06B6D4" fontSize={7} fontFamily="JetBrains Mono,monospace">HTTPS</text>

      {/* OpenRouter box */}
      <rect x={490} y={80} width={160} height={200} rx={10}
        fill="#0E111740" stroke="#1E2530" strokeWidth={1} />
      <text x={570} y={100} textAnchor="middle" fill="#4A5568"
        fontSize={8} fontFamily="JetBrains Mono,monospace">OPENROUTER</text>

      <rect x={502} y={110} width={136} height={50} rx={6}
        fill="#06B6D415" stroke="#06B6D4" strokeWidth={1} />
      <text x={570} y={132} textAnchor="middle" fill="#06B6D4" fontSize={9} fontFamily="JetBrains Mono,monospace">GPT-OSS-120B</text>
      <text x={570} y={147} textAnchor="middle" fill="#8B95A3" fontSize={8}>Primary model</text>

      <rect x={502} y={175} width={136} height={50} rx={6}
        fill="#F59E0B15" stroke="#F59E0B" strokeWidth={1} />
      <text x={570} y={197} textAnchor="middle" fill="#F59E0B" fontSize={9} fontFamily="JetBrains Mono,monospace">Kimi K2.6</text>
      <text x={570} y={212} textAnchor="middle" fill="#8B95A3" fontSize={8}>Fallback (5s timeout)</text>

      {/* labels */}
      <text x={570} y={250} textAnchor="middle" fill="#4A5568" fontSize={7.5} fontFamily="JetBrains Mono,monospace">stream: true</text>
      <text x={570} y={263} textAnchor="middle" fill="#4A5568" fontSize={7.5} fontFamily="JetBrains Mono,monospace">token-by-token response</text>

      {/* user icon */}
      <circle cx={700} cy={100} r={18} fill="#1E253080" stroke="#2D3748" strokeWidth={1} />
      <text x={700} y={105} textAnchor="middle" fill="#8B95A3" fontSize={14}>👤</text>
      <text x={700} y={128} textAnchor="middle" fill="#4A5568" fontSize={7.5} fontFamily="JetBrains Mono,monospace">Engineer</text>
      <line x1={682} y1={100} x2={650} y2={100} stroke="#2D3748" strokeWidth={1} markerEnd="url(#a2)" />
    </svg>
  )
}

// ─── STATE MACHINE SVG ────────────────────────────────────────────────────────
function StateMachineSVG() {
  const states = [
    { id: 'H', label: 'HEALTHY', x: 100, y: 120, color: '#10B981' },
    { id: 'D', label: 'DEGRADED', x: 280, y: 60, color: '#F59E0B' },
    { id: 'U', label: 'UNHEALTHY', x: 280, y: 180, color: '#F97316' },
    { id: 'F', label: 'FAILED', x: 460, y: 120, color: '#EF4444' },
    { id: 'R', label: 'RECOVERING', x: 280, y: 300, color: '#6366F1' },
  ]
  const transitions = [
    { from: [100, 120], to: [280, 60], label: 'CPU>75%', color: '#F59E0B' },
    { from: [280, 60], to: [280, 180], label: 'err>10%', color: '#F97316' },
    { from: [280, 180], to: [460, 120], label: 'err>50%', color: '#EF4444' },
    { from: [460, 120], to: [280, 300], label: 'recover', color: '#6366F1' },
    { from: [280, 300], to: [100, 120], label: 'clean', color: '#10B981' },
  ]
  return (
    <svg viewBox="0 0 580 380" style={{ width: '100%', maxWidth: 580 }}>
      <defs>
        <marker id="sm" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <polygon points="0 0,6 2.5,0 5" fill="#2D3748" />
        </marker>
      </defs>
      {transitions.map((t, i) => (
        <g key={i}>
          <line x1={t.from[0]} y1={t.from[1]} x2={t.to[0]} y2={t.to[1]}
            stroke={t.color} strokeWidth={1.5} opacity={0.5}
            markerEnd="url(#sm)" />
          <text
            x={(t.from[0] + t.to[0]) / 2 + 8}
            y={(t.from[1] + t.to[1]) / 2}
            fill={t.color} fontSize={8} fontFamily="JetBrains Mono,monospace"
          >{t.label}</text>
        </g>
      ))}
      {states.map(s => (
        <g key={s.id}>
          <circle cx={s.x} cy={s.y} r={36} fill={s.color + '18'} stroke={s.color} strokeWidth={1.5}>
            <animate attributeName="opacity" values="0.7;1;0.7" dur={`${2 + states.indexOf(s) * 0.4}s`} repeatCount="indefinite" />
          </circle>
          <text x={s.x} y={s.y - 4} textAnchor="middle"
            fill={s.color} fontSize={10} fontFamily="JetBrains Mono,monospace" fontWeight="700">{s.id}</text>
          <text x={s.x} y={s.y + 12} textAnchor="middle"
            fill={s.color} fontSize={7} fontFamily="JetBrains Mono,monospace">{s.label}</text>
        </g>
      ))}
    </svg>
  )
}

// ─── LEARNING PATH ────────────────────────────────────────────────────────────
function LearningPath() {
  const steps = [
    { num: '01', color: '#10B981', title: 'The Cascade', time: '~10min', level: 'BEGINNER', desc: 'Start here. Database latency cascades through 6 services. The most important pattern.' },
    { num: '02', color: '#10B981', title: 'Graceful Degradation', time: '~10min', level: 'BEGINNER', desc: 'Same topology. Circuit breakers enabled. System survives the identical failure.' },
    { num: '03', color: '#F59E0B', title: 'Retry Storm', time: '~12min', level: 'INTERMEDIATE', desc: 'Fixed retries amplify a struggling service 4x. Why backoff + jitter are non-negotiable.' },
    { num: '04', color: '#F59E0B', title: 'Thundering Herd', time: '~12min', level: 'INTERMEDIATE', desc: 'Cache miss stampede exhausts the database connection pool in seconds.' },
    { num: '05', color: '#F59E0B', title: 'Queue Flood', time: '~15min', level: 'INTERMEDIATE', desc: 'Dead consumer fills Kafka. Producers block. Backpressure made visible.' },
    { num: '06', color: '#F97316', title: 'Memory Leak', time: '~12min', level: 'INTERMEDIATE', desc: 'Sawtooth OOM crash cycles. Why heap profiling is critical in Node.js services.' },
    { num: '07', color: '#EF4444', title: 'Traffic Spike', time: '~15min', level: 'ADVANCED', desc: '10x RPS. What fails first depends entirely on your configuration choices.' },
    { num: '08', color: '#EF4444', title: 'Split Brain', time: '~18min', level: 'ADVANCED', desc: 'Network partition. Two databases diverge. CAP Theorem: not a theorem, an event.' },
  ]
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', left: 20, top: 30, bottom: 30,
        width: 2, background: 'linear-gradient(to bottom, var(--green), var(--red))',
        opacity: 0.3
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {steps.map((s, i) => (
          <FadeUp key={i} delay={i * 50}>
            <div style={{
              display: 'flex', gap: 24, alignItems: 'flex-start', paddingLeft: 48, position: 'relative'
            }}>
              <div style={{
                position: 'absolute', left: 8, top: 14, width: 26, height: 26,
                borderRadius: '50%', background: s.color + '22',
                border: `1.5px solid ${s.color}`, display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <span className="font-mono" style={{ fontSize: 9, color: s.color }}>{s.num}</span>
              </div>
              <div style={{
                flex: 1, background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 10, padding: '14px 18px',
                display: 'flex', gap: 16, alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="font-mono" style={{
                      fontSize: 8, padding: '2px 6px', borderRadius: 4,
                      background: s.color + '15', color: s.color,
                      border: `1px solid ${s.color}30`
                    }}>{s.level}</span>
                    <span className="font-mono" style={{ fontSize: 8, color: 'var(--text3)' }}>{s.time}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text1)', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{s.desc}</div>
                </div>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: s.color, flexShrink: 0, marginTop: 6
                }} />
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </div>
  )
}

// ─── TICKER ───────────────────────────────────────────────────────────────────
function Ticker() {
  const items = [
    '⚡ CASCADE FAILURE', '✓ CIRCUIT BREAKER', '⚠ RETRY STORM',
    '⚡ THUNDERING HERD', '✓ GRACEFUL DEGRADE', '⚠ SPLIT BRAIN',
    '⚡ QUEUE FLOOD', '✓ RECOVERING', '⚠ MEMORY LEAK',
    '⚡ TRAFFIC SPIKE', '✓ BACKPRESSURE', '⚠ CONNECTION POOL',
  ]
  const str = items.join('   ·   ')
  return (
    <div className="ticker-wrap" style={{
      background: 'var(--bg2)', borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)', padding: '10px 0'
    }}>
      <div className="ticker-inner font-mono" style={{ fontSize: 10, color: 'var(--text3)' }}>
        {str}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;{str}
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function Landing() {
  const nav = useNavigate()
  const { logout, isAuthenticated } = useAuthStore()

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text1)', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{CSS}</style>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 60,
        background: '#080B0FEE', borderBottom: '1px solid var(--border)',
        zIndex: 1000, padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <Link to="/" className="font-display" style={{ fontSize: 22, color: 'var(--text1)', letterSpacing: 3 }}>
          ARCHAOS
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 13 }}>
          {[['#how-it-works', 'How It Works'], ['#scenarios', 'Scenarios'], ['#for-whom', 'For Whom']].map(([h, l]) => (
            <a key={h} href={h} style={{ color: 'var(--text3)', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text1)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
              className="hidden sm:block"
            >{l}</a>
          ))}

          {isAuthenticated() ? (
            <>
              <Link to="/dashboard" style={{ color: 'var(--text3)', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text1)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
              >
                Dashboard
              </Link>
              <button 
                onClick={logout}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', transition: 'color 0.2s', fontSize: 13, padding: 0
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text1)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
              >
                Sign Out
              </button>
              <Link to="/editor" style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--indigo)', color: '#fff', transition: 'opacity 0.2s'
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >Playground →</Link>
            </>
          ) : (
            <>
              <Link to="/auth" style={{ color: 'var(--text3)', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text1)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
              >
                Sign In
              </Link>
              <Link to="/auth" state={{ mode: 'register' }} style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--indigo)', color: '#fff', transition: 'opacity 0.2s'
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >Sign Up →</Link>
            </>
          )}
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{
        position: 'relative', height: '100vh', minHeight: 600,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '0 24px', overflow: 'hidden'
      }}>
        <HeroCanvas />
        <div className="scanline" />
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 860 }}>
          {/* pill */}
          <div className="font-mono" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 20, fontSize: 11,
            background: 'var(--indigo)15', border: '1px solid var(--indigo)40',
            color: 'var(--indigo)', marginBottom: 24, letterSpacing: 2
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--green)', display: 'inline-block',
              animation: 'pulse-ring 2s ease-out infinite'
            }} />
            LIVE SIMULATION RUNNING — WATCH THE CASCADE
          </div>

          {/* headline */}
          <h1 className="font-display" style={{
            fontSize: 'clamp(60px, 10vw, 130px)',
            lineHeight: 0.95, color: 'var(--text1)',
            marginBottom: 16
          }}>
            Watch your<br />
            <span className="cascade-text">architecture fail.</span><br />
            Safely.
          </h1>

          {/* typing sub */}
          <div style={{ fontSize: 18, color: 'var(--text2)', marginBottom: 36, minHeight: 30 }}>
            <TypingText phrases={[
              'Simulate cascading failures without touching production',
              'Understand circuit breakers through direct experience',
              'Build the mental images senior engineers have from incidents',
              'See CAP theorem play out in real time on your canvas',
            ]} />
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => nav('/learn/the-cascade')} className="cta-btn"
              style={{
                padding: '16px 32px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: 'var(--indigo)', color: '#fff', cursor: 'pointer',
                border: 'none', display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 0 40px rgba(99,102,241,0.3)', transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(99,102,241,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(99,102,241,0.3)' }}
            >
              <Play size={14} style={{ fill: '#fff' }} />
              Run The Cascade — Free
            </button>
            <button onClick={() => nav('/editor')} className="cta-btn"
              style={{
                padding: '16px 32px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: 'transparent', color: 'var(--text2)', cursor: 'pointer',
                border: '1px solid var(--border2)', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text2)'; e.currentTarget.style.color = 'var(--text1)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text2)' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={14} /> Open Playground
              </span>
            </button>
          </div>

          {/* trust strip */}
          <div style={{
            display: 'flex', gap: 24, justifyContent: 'center', marginTop: 40,
            flexWrap: 'wrap', fontSize: 12
          }}>
            {[
              ['✓', 'No signup to try'], ['✓', 'Runs in browser'],
              ['✓', '8 guided scenarios'], ['✓', 'AI narration included'],
            ].map(([icon, label], i) => (
              <span key={i} style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--green)' }}>{icon}</span> {label}
              </span>
            ))}
          </div>
        </div>

        {/* scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
        }}>
          <span className="font-mono" style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 3 }}>SCROLL</span>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, var(--text3), transparent)' }} />
        </div>
      </section>

      {/* ══ TICKER ══ */}
      <Ticker />

      {/* ══ STATS ══ */}
      <section style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 32, textAlign: 'center' }}>
          {[
            { n: 8, s: '', label: 'Failure Scenarios' },
            { n: 60, s: 'fps', label: 'Canvas Rendering' },
            { n: 7, s: '', label: 'Node Types' },
            { n: 10, s: 'Hz', label: 'Simulation Rate' },
            { n: 5, s: '', label: 'Health States' },
            { n: 120, s: 'B', label: 'GPT Parameters' },
          ].map((s, i) => (
            <FadeUp key={i} delay={i * 60}>
              <div className="font-display" style={{ fontSize: 48, color: 'var(--text1)', lineHeight: 1 }}>
                <AnimatedNumber target={s.n} suffix={s.s} />
              </div>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, marginTop: 8 }}>
                {s.label.toUpperCase()}
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ══ THE PROBLEM ══ */}
      <section style={{ padding: '96px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <FadeUp>
          <SectionHeader
            pill="The Problem"
            title={<>Distributed systems knowledge<br />is locked behind production incidents</>}
            sub="Senior engineers know things students don't. Not because the concepts are secret — but because they've lived through failures that create visceral, unforgeatable memories."
          />
        </FadeUp>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 64 }}>
          {/* Before */}
          <FadeUp delay={100}>
            <div style={{
              background: 'var(--bg2)', border: '1px solid #EF444430',
              borderRadius: 12, padding: 32
            }}>
              <div className="font-mono" style={{ fontSize: 11, color: '#EF4444', letterSpacing: 3, marginBottom: 16 }}>
                BEFORE ARCHAOS
              </div>
              {[
                'You read about cascading failures in a blog post',
                'You understand CAP theorem as a theoretical concept',
                'You add circuit breakers because someone told you to',
                'You fear distributed systems incidents you\'ve never seen',
                'System design interviews feel abstract and disconnected',
              ].map((t, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, marginBottom: 12,
                  fontSize: 13, color: 'var(--text2)', alignItems: 'flex-start'
                }}>
                  <span style={{ color: '#EF4444', marginTop: 2, flexShrink: 0 }}>✕</span>
                  {t}
                </div>
              ))}
            </div>
          </FadeUp>

          {/* After */}
          <FadeUp delay={180}>
            <div style={{
              background: 'var(--bg2)', border: '1px solid #10B98130',
              borderRadius: 12, padding: 32
            }}>
              <div className="font-mono" style={{ fontSize: 11, color: 'var(--green)', letterSpacing: 3, marginBottom: 16 }}>
                AFTER ARCHAOS
              </div>
              {[
                'You watched a cascade kill 6 services in 90 seconds',
                'You saw a split-brain CAP violation unfold and diverge',
                'You compared the same failure with and without circuit breakers',
                'You predicted the next failure 15 seconds before it happened',
                'System design answers come from memory, not theory',
              ].map((t, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, marginBottom: 12,
                  fontSize: 13, color: 'var(--text2)', alignItems: 'flex-start'
                }}>
                  <span style={{ color: 'var(--green)', marginTop: 2, flexShrink: 0 }}>✓</span>
                  {t}
                </div>
              ))}
            </div>
          </FadeUp>
        </div>

        {/* Pull quote */}
        <FadeUp delay={200}>
          <div style={{
            textAlign: 'center', padding: '40px 32px',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 16, maxWidth: 720, margin: '0 auto'
          }}>
            <div style={{
              fontSize: 'clamp(18px,3vw,28px)', color: 'var(--text1)',
              lineHeight: 1.5, fontStyle: 'italic', marginBottom: 16
            }}>
              "Senior engineers don't reason from CAP theorem every time. They <span style={{ color: 'var(--indigo)' }}>replay memories</span> of watching systems fail at 2am."
            </div>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--text3)' }}>
              ARCHAOS GENERATES THOSE MEMORIES — SAFELY
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ══ WHAT IS ARCHAOS ══ */}
      <section style={{
        background: 'var(--bg2)', borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)', padding: '96px 24px'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <SectionHeader
              pill="What Is Archaos"
              title="A flight simulator for distributed systems"
              sub="Pilots don't learn to crash-land by crashing real planes. They use simulators. Archaos is that simulator — for the production incidents you haven't lived through yet."
            />
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', marginBottom: 64 }}>
            <FadeUp delay={100}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { color: 'var(--indigo)', icon: '🎨', title: 'Build any topology', desc: 'Drag API Gateways, Services, Databases, Queues, Load Balancers, and CDNs onto an infinite canvas. Connect them with HTTP, gRPC, or message queue edges. Configure every parameter.' },
                  { color: 'var(--red)', icon: '⚡', title: 'Inject real chaos', desc: 'Kill nodes, spike CPU, add 4000ms of latency, partition networks, exhaust connection pools, expire caches. Every failure type that has caused a real outage.' },
                  { color: 'var(--green)', icon: '🧠', title: 'Watch and understand', desc: 'Traffic particles flow in real time. Node health states transition visually. AI streams a narration explaining WHY your system is dying and what to do about it.' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 16, padding: 20,
                    background: 'var(--bg3)', borderRadius: 10,
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: item.color, marginBottom: 4, fontSize: 14 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>

            <FadeUp delay={200}>
              <div style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 24
              }}>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 16, letterSpacing: 2 }}>
                  HEALTHY SYSTEM — 100 RPS
                </div>
                <TrafficFlowSVG failing={false} />
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 20 }}>
                  <div className="font-mono" style={{ fontSize: 10, color: '#EF4444', marginBottom: 16, letterSpacing: 2 }}>
                    AFTER CHAOS — CASCADE FAILURE
                  </div>
                  <TrafficFlowSVG failing={true} />
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" style={{ padding: '96px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <FadeUp>
          <SectionHeader
            pill="How It Works"
            title={<>5 phases from blank canvas<br />to deep understanding</>}
          />
        </FadeUp>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 80 }}>
          {[
            { n: '01', icon: '🎨', color: 'var(--purple)', label: 'DESIGN', title: 'Build Topology', desc: 'Drag nodes and draw edges to build any microservices architecture.' },
            { n: '02', icon: '⚙️', color: 'var(--indigo)', label: 'CONFIGURE', title: 'Set Parameters', desc: 'Replicas, timeouts, circuit breaker thresholds, retry policies.' },
            { n: '03', icon: '▶', color: 'var(--cyan)', label: 'SIMULATE', title: 'Start Engine', desc: 'Web Worker runs at 10Hz. Canvas renders at 60fps. Both independent.' },
            { n: '04', icon: '⚡', color: 'var(--red)', label: 'INJECT', title: 'Trigger Chaos', desc: 'Kill a node. Add latency. Partition the network. Expire the cache.' },
            { n: '05', icon: '🧠', color: 'var(--green)', label: 'LEARN', title: 'AI Narration', desc: 'GPT-OSS-120B explains the failure pattern and predicts what\'s next.' },
          ].map((s, i) => (
            <FadeUp key={i} delay={i * 80}>
              <div style={{
                background: 'var(--bg2)', border: `1px solid ${s.color}30`,
                borderRadius: 12, padding: 20, textAlign: 'center',
                height: '100%', transition: 'all 0.3s'
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = s.color + '30'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div className="font-mono" style={{ fontSize: 9, color: s.color, letterSpacing: 3, marginBottom: 10 }}>{s.label}</div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontWeight: 600, color: 'var(--text1)', fontSize: 14, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{s.desc}</div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--text3)', marginTop: 12 }}>{s.n}</div>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Cascade Timeline */}
        <FadeUp delay={100}>
          <div style={{ marginBottom: 64 }}>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text1)', marginBottom: 8, textAlign: 'center' }}>
              The Cascade — Second by Second
            </h3>
            <p style={{ color: 'var(--text2)', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
              How a 4000ms database latency spike propagates through 6 services over 90 seconds
            </p>
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 32, overflow: 'auto'
            }}>
              <CascadeTimeline />
            </div>
          </div>
        </FadeUp>

        {/* State Machine */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <FadeUp delay={100}>
            <div>
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: 'var(--text1)' }}>
                Each node runs a 5-state health machine
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 20 }}>
                Every service, database, and queue in your simulation is driven by a discrete state machine. State transitions happen based on real metrics — error rate, CPU percentage, queue depth, connection pool utilization.
              </p>
              {[
                { state: 'HEALTHY', color: 'var(--green)', cond: 'Normal operation. Requests processing within thresholds.' },
                { state: 'DEGRADED', color: 'var(--amber)', cond: 'CPU >75% or error rate >10%. Latency climbing.' },
                { state: 'UNHEALTHY', color: 'var(--orange)', cond: 'CPU >95% or error rate >50%. Near failure.' },
                { state: 'FAILED', color: 'var(--red)', cond: 'Health check failed or chaos-killed. Requests error immediately.' },
                { state: 'RECOVERING', color: 'var(--indigo)', cond: 'Metrics improving. Traffic cautiously resuming.' },
              ].map((s, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8,
                  fontSize: 12, color: 'var(--text2)'
                }}>
                  <div className="node-dot" style={{ background: s.color, color: s.color, flexShrink: 0 }} />
                  <span className="font-mono" style={{ color: s.color, fontSize: 10, width: 100, flexShrink: 0 }}>{s.state}</span>
                  <span>{s.cond}</span>
                </div>
              ))}
            </div>
          </FadeUp>
          <FadeUp delay={200}>
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 24
            }}>
              <StateMachineSVG />
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══ SYSTEM ARCHITECTURE ══ */}
      <section style={{
        background: 'var(--bg2)', borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)', padding: '96px 24px'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <SectionHeader
              pill="System Architecture"
              title="How Archaos is built"
              sub="The simulation runs in a Web Worker so the canvas stays at 60fps. AI narration streams token-by-token via Socket.IO. The backend is NestJS on Railway with GPT-OSS-120B via OpenRouter."
            />
          </FadeUp>
          <FadeUp delay={100}>
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 32, overflow: 'auto'
            }}>
              <SystemArchDiagram />
            </div>
          </FadeUp>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 20, marginTop: 32 }}>
            {[
              { color: 'var(--indigo)', title: 'React Flow Canvas', desc: 'Renders topology at 60fps on main thread. Custom node/edge components with live health indicators.' },
              { color: 'var(--green)', title: 'Web Worker Engine', desc: 'Discrete event simulation at 10 ticks/sec. Completely off the main thread.' },
              { color: 'var(--amber)', title: 'Socket.IO Narration', desc: 'GPT-OSS-120B tokens stream in real time. Kimi K2.6 fallback on 5-second timeout.' },
              { color: 'var(--purple)', title: 'BFS Blast Radius', desc: 'PostgreSQL recursive CTE traverses dependency graph. Heat map overlaid on canvas.' },
            ].map((c, i) => (
              <FadeUp key={i} delay={i * 60}>
                <div style={{
                  background: 'var(--bg)', border: `1px solid ${c.color}25`,
                  borderRadius: 10, padding: 16
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, marginBottom: 10 }} />
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text1)', marginBottom: 6 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{c.desc}</div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SCENARIOS ══ */}
      <section id="scenarios" style={{ padding: '96px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <FadeUp>
          <SectionHeader
            pill="Scenario Library"
            title={<>8 failures that have taken down<br />real production systems</>}
            sub="Amazon, Netflix, GitHub, Discord — these patterns caused real outages at real companies. Now you can experience all of them in your browser."
          />
        </FadeUp>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 20 }}>
          {[
            {
              slug: 'the-cascade', tag: 'RESILIENCE', diff: 'BEGINNER', color: 'var(--green)', icon: '🌊',
              title: 'The Cascade', time: '~10 min',
              tldr: 'Database latency freezes 6 services in 90 seconds.',
              mechanism: 'A 4000ms DB latency fills thread pools upstream. Each service waits. Queues back up. Error rates spike. The system freezes from the inside out.',
              learn: 'WHY slow dependencies are more dangerous than dead ones.',
              real: 'Amazon DynamoDB 2013 · Netflix holiday 2012'
            },
            {
              slug: 'graceful-degradation', tag: 'RESILIENCE', diff: 'BEGINNER', color: 'var(--green)', icon: '🛡',
              title: 'Graceful Degradation', time: '~10 min',
              tldr: 'Same failure as The Cascade. Circuit breakers save the system.',
              mechanism: 'Identical topology and chaos. 4 edge configurations changed: circuitBreakerEnabled: true. The system degrades partially instead of dying completely.',
              learn: 'The exact configuration that separates survivable from fatal.',
              real: 'Netflix Hystrix · AWS SDK circuit breakers'
            },
            {
              slug: 'the-retry-storm', tag: 'TRAFFIC', diff: 'INTERMEDIATE', color: 'var(--amber)', icon: '🔁',
              title: 'Retry Storm', time: '~12 min',
              tldr: '3 retries with no backoff turns a struggling service into a dead one.',
              mechanism: 'Payment Service is slow. Order Service retries 3 times immediately. This triples load on Payment, which makes it slower, which causes more retries. Feedback loop to 100% error rate.',
              learn: 'Why exponential backoff with jitter is not optional.',
              real: 'AWS 2012 ELB retry storm'
            },
            {
              slug: 'the-thundering-herd', tag: 'CACHING', diff: 'INTERMEDIATE', color: 'var(--amber)', icon: '🐘',
              title: 'Thundering Herd', time: '~12 min',
              tldr: 'Cache expiry sends 500 requests to a connection pool of 5.',
              mechanism: 'Popular Redis key expires. All 500 concurrent requests miss cache and hit PostgreSQL simultaneously. Connection pool (size: 5) exhausts in milliseconds. All queries timeout.',
              learn: 'Why cache stampedes need mutex locks or probabilistic early expiry.',
              real: 'Instagram warmup outages · Reddit stampedes'
            },
            {
              slug: 'the-queue-flood', tag: 'QUEUING', diff: 'INTERMEDIATE', color: 'var(--amber)', icon: '📦',
              title: 'Queue Flood', time: '~15 min',
              tldr: 'Dead consumer fills Kafka. Producers start failing after 5 minutes.',
              mechanism: 'Consumer crashes. Queue fills at producer rate. At max depth (300 messages), producers receive QUEUE_FULL and fail. Consumer recovers: backlog drains in a controlled flood.',
              learn: 'How message queues buffer failures and why they eventually overflow.',
              real: 'Uber queue incidents · Discord overflow outages'
            },
            {
              slug: 'the-memory-leak', tag: 'INFRASTRUCTURE', diff: 'INTERMEDIATE', color: 'var(--amber)', icon: '💾',
              title: 'Memory Leak', time: '~12 min',
              tldr: 'Heap grows 1.5%/sec until OOM kill. Cycle repeats.',
              mechanism: 'Objects accumulate without cleanup. Memory: 40% → 95% → OOM kill. Service restarts with fresh heap and immediately begins leaking again. Periodic outage cycle every 5 minutes.',
              learn: 'OOM kill patterns and why liveness probes catch this before users do.',
              real: 'Node.js event listener leaks · Java GC pressure'
            },
            {
              slug: 'traffic-spike-survival', tag: 'SCALING', diff: 'ADVANCED', color: 'var(--red)', icon: '📈',
              title: 'Traffic Spike', time: '~15 min',
              tldr: '10x traffic. Your configuration determines what survives.',
              mechanism: 'No hidden chaos. Just a 10x RPS multiplier. Which node fails first depends entirely on your replica count, connection pool size, and timeout configuration. Build wisely.',
              learn: 'Right-sizing every parameter and what happens when you get it wrong.',
              real: 'Black Friday e-commerce · Gaming server launches'
            },
            {
              slug: 'split-brain', tag: 'CONSISTENCY', diff: 'ADVANCED', color: 'var(--red)', icon: '🧠',
              title: 'Split Brain', time: '~18 min',
              tldr: 'Network partition. Two databases both think they\'re the leader.',
              mechanism: 'Replication link severed. DB East and DB West both promote to primary. Each accepts independent writes. Data diverges. Partition heals: conflicts exist with no clear winner.',
              learn: 'CAP Theorem as a lived sequence of events — not a theoretical constraint.',
              real: 'GitHub 2012 MySQL split-brain · Elasticsearch split-brain'
            },
          ].map((s, i) => (
            <FadeUp key={i} delay={i * 40}>
              <div className="scenario-card" style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 24, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 12,
                transition: 'all 0.3s', height: '100%'
              }}
                onClick={() => nav(`/learn/${s.slug}`)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.background = 'var(--bg3)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg2)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-mono" style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 2 }}>{s.tag}</span>
                  <span className="font-mono" style={{
                    fontSize: 9, padding: '3px 8px', borderRadius: 4,
                    background: s.color + '18', color: s.color, border: `1px solid ${s.color}30`
                  }}>{s.diff}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text1)', marginBottom: 4 }}>{s.title}</div>
                    <div className="font-mono" style={{ fontSize: 9, color: 'var(--text3)' }}>{s.time}</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{s.tldr}</p>
                <div style={{
                  background: 'var(--bg3)', borderRadius: 8,
                  padding: '10px 14px', fontSize: 11, color: 'var(--text3)',
                  lineHeight: 1.6
                }}>
                  <span style={{ color: 'var(--text2)', fontWeight: 600 }}>How: </span>{s.mechanism}
                </div>
                <div style={{ fontSize: 11, color: s.color }}>
                  <span style={{ opacity: 0.6 }}>You\'ll learn: </span>{s.learn}
                </div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--text3)' }}>
                  Real: {s.real}
                </div>
                <button style={{
                  marginTop: 'auto', padding: '10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: 'transparent', border: `1px solid ${s.color}40`, color: s.color,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = s.color + '18' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <Play size={12} style={{ fill: 'currentColor' }} /> Launch Walkthrough
                </button>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ══ LEARNING PATH ══ */}
      <section style={{
        background: 'var(--bg2)', borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)', padding: '96px 24px'
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <FadeUp>
            <SectionHeader
              pill="Learning Path"
              title="Beginner to advanced in 8 scenarios"
              sub="Each scenario builds on the previous. By the end, you'll have watched every major distributed systems failure pattern play out in real time."
            />
          </FadeUp>
          <LearningPath />
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" style={{ padding: '96px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <FadeUp>
          <SectionHeader
            pill="Features"
            title="Everything built to teach, not just demonstrate"
          />
        </FadeUp>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: 24 }}>
          {[
            {
              color: 'var(--indigo)', icon: GitBranch, title: 'Drag-and-Drop Topology Builder',
              badge: 'CANVAS',
              bullets: ['7 node types: Service, Database, Queue, Load Balancer, API Gateway, CDN, External API', '4 edge types: HTTP, gRPC, Message, Database Connection', 'Per-node config: replicas, CPU limit, processing time, connection pool, health thresholds', 'Per-edge config: timeout, max retries, retry backoff, circuit breaker threshold', 'Save and reload custom topologies anytime']
            },
            {
              color: 'var(--red)', icon: Flame, title: 'Real-Time Chaos Injection',
              badge: 'FAULT ENGINE',
              bullets: ['ADD_LATENCY: inject ms of delay on any edge (simulates slow dependencies)', 'KILL_NODE: terminate service instances (OOM kill, pod crash simulation)', 'NETWORK_PARTITION: sever connections between nodes (split-brain scenarios)', 'CPU_SPIKE: simulate compute pressure slowing request processing', 'CACHE_EXPIRE: force cache miss to trigger thundering herd stampede', 'TRAFFIC_SPIKE: multiply RPS by any factor (flash sale simulation)']
            },
            {
              color: 'var(--green)', icon: Brain, title: 'GPT-OSS-120B Streaming Narration',
              badge: 'AI COPILOT',
              bullets: ['Streams token-by-token explanation as failures happen in real time', 'Identifies root cause — not just WHAT broke but WHY it broke', 'Names the failure pattern: cascade, retry storm, thundering herd, split brain', 'Predicts what will break next with a time estimate (10–30 seconds ahead)', 'Auto-confirms predictions when the simulation matches the forecast', 'Falls back to Kimi K2.6 if primary model takes >5 seconds']
            },
            {
              color: 'var(--amber)', icon: BarChart2, title: 'Live Metrics Dashboard',
              badge: 'TELEMETRY',
              bullets: ['Total RPS chart — watch load evolve over simulation time', 'System error rate — see it climb from 0% to 100% during cascade', 'P99 latency — tail latency spikes before full failure', 'Queue depth gauge for message queues — backlog growing in real time', 'Per-node health: HEALTHY, DEGRADED, UNHEALTHY, FAILED, RECOVERING', 'Event log with timestamps for every state change']
            },
            {
              color: 'var(--cyan)', icon: Shield, title: 'Blast Radius Analysis',
              badge: 'IMPACT MAP',
              bullets: ['Click any node to calculate its blast radius before injecting chaos', 'BFS graph traversal through the dependency graph via PostgreSQL recursive CTE', 'Heat map overlay directly on canvas nodes with traffic percentage badges', 'Shield icons on nodes protected by circuit breakers', 'Critical path edges highlighted in red', 'Shows % of total system traffic at risk for each failure']
            },
            {
              color: 'var(--purple)', icon: BookOpen, title: 'Guided Interactive Walkthroughs',
              badge: 'LEARN MODE',
              bullets: ['8 pre-scripted scenarios with timed automatic chaos injection', 'Simulation pauses at key moments to ask multiple-choice prediction questions', 'Cannot advance without answering — active recall reinforces learning', 'AI narration explains whether your prediction was correct and why', 'Completion tracking shows which patterns you\'ve seen and understood', 'Difficulty: BEGINNER → INTERMEDIATE → ADVANCED progression']
            },
          ].map((f, i) => (
            <FadeUp key={i} delay={i * 60}>
              <div className="feature-card" style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 14, padding: 28, transition: 'all 0.3s', height: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: f.color + '18', border: `1px solid ${f.color}30`
                  }}>
                    <f.icon size={20} style={{ color: f.color }} />
                  </div>
                  <div>
                    <div className="font-mono" style={{
                      fontSize: 9, padding: '3px 8px', borderRadius: 4,
                      background: f.color + '15', color: f.color, marginBottom: 6
                    }}>{f.badge}</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text1)' }}>{f.title}</div>
                  </div>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {f.bullets.map((b, j) => (
                    <li key={j} style={{
                      display: 'flex', gap: 8, fontSize: 12, color: 'var(--text2)',
                      lineHeight: 1.6, alignItems: 'flex-start'
                    }}>
                      <CheckCircle size={12} style={{ color: f.color, flexShrink: 0, marginTop: 3 }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ══ FOR WHOM ══ */}
      <section id="for-whom" style={{
        background: 'var(--bg2)', borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)', padding: '96px 24px'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <SectionHeader
              pill="Who Is This For"
              title="Three very different people. One tool."
            />
          </FadeUp>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 24 }}>
            {[
              {
                color: 'var(--indigo)', icon: Cpu, role: 'Backend Engineers',
                tagline: 'See what happens before it happens in production.',
                who: 'You write services. You add timeouts and circuit breakers because someone told you to. You\'ve never actually watched a cascading failure unfold end to end.',
                use: ['Understand why your retry logic can kill a struggling service', 'See what happens when you forget timeouts on HTTP clients', 'Watch connection pool exhaustion before it costs you a 3am page', 'Test your system design interview answers against reality'],
                best: ['The Cascade', 'Retry Storm', 'Traffic Spike Survival']
              },
              {
                color: 'var(--red)', icon: ShieldAlert, role: 'SREs & DevOps',
                tagline: 'Practice runbooks before incidents find you.',
                who: 'You run production systems. You\'ve been paged. You know the feeling of watching dashboards go red. Archaos lets you train for that without the production blast radius.',
                use: ['Model blast radius before injecting real chaos', 'Train junior SREs on failure patterns with guided scenarios', 'Validate circuit breaker thresholds before deploying to staging', 'Show product managers failure modes without touching prod'],
                best: ['Split Brain', 'Queue Flood', 'Graceful Degradation']
              },
              {
                color: 'var(--cyan)', icon: GraduationCap, role: 'CS Students',
                tagline: 'Go into interviews with memories, not definitions.',
                who: 'You understand CAP theorem on paper. You\'ve read about cascading failures. But you\'ve never watched them happen. Archaos changes that in one session.',
                use: ['Replace dry slides with interactive failure simulations', 'Answer system design questions from experience, not theory', 'Build the mental models senior engineers have from incidents', 'Get through distributed systems interviews differently'],
                best: ['The Cascade', 'Thundering Herd', 'Split Brain']
              },
            ].map((a, i) => (
              <FadeUp key={i} delay={i * 80}>
                <div style={{
                  background: 'var(--bg3)', border: `1px solid ${a.color}20`,
                  borderRadius: 14, padding: 28, height: '100%',
                  display: 'flex', flexDirection: 'column', gap: 16,
                  transition: 'all 0.3s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = a.color + '60' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = a.color + '20' }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: a.color + '18', border: `1px solid ${a.color}30`
                  }}>
                    <a.icon size={20} style={{ color: a.color }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text1)', marginBottom: 4 }}>{a.role}</div>
                    <div style={{ fontSize: 13, color: a.color }}>{a.tagline}</div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>{a.who}</p>
                  <div>
                    <div className="font-mono" style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 2, marginBottom: 10 }}>USE IT TO</div>
                    {a.use.map((u, j) => (
                      <div key={j} style={{
                        display: 'flex', gap: 8, fontSize: 12, color: 'var(--text2)',
                        marginBottom: 6, alignItems: 'flex-start'
                      }}>
                        <ArrowRight size={10} style={{ color: a.color, marginTop: 3, flexShrink: 0 }} />
                        {u}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="font-mono" style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 2, marginBottom: 10 }}>START WITH</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {a.best.map((b, j) => (
                        <span key={j} className="font-mono" style={{
                          fontSize: 10, padding: '4px 8px', borderRadius: 6,
                          background: a.color + '15', color: a.color, border: `1px solid ${a.color}30`
                        }}>{b}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ GETTING STARTED ══ */}
      <section style={{ padding: '96px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <FadeUp>
          <SectionHeader
            pill="Getting Started"
            title="From zero to first simulation in 2 minutes"
            sub="Two paths. Both start immediately. No account, no install, no setup."
          />
        </FadeUp>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Path A */}
          <FadeUp delay={100}>
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--green)30',
              borderRadius: 14, padding: 32
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--green)18', border: '1px solid var(--green)40',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14, color: 'var(--green)'
                }}>A</div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: 15 }}>Guided Scenarios</div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text3)' }}>RECOMMENDED FOR BEGINNERS</div>
                </div>
              </div>
              {[
                { n: 1, t: 'Click "Scenarios" in the navbar', d: 'All 8 scenarios available immediately. No account needed.' },
                { n: 2, t: 'Choose a scenario by difficulty', d: 'Start with The Cascade (BEGINNER). Read the setup description.' },
                { n: 3, t: 'Press Start Simulation', d: 'Topology loads with nodes and edges pre-configured.' },
                { n: 4, t: 'Answer the prediction checkpoint', d: 'Simulation pauses and asks what you think happens next.' },
                { n: 5, t: 'Watch the AI narration stream', d: 'GPT-OSS-120B explains the failure pattern in real time.' },
                { n: 6, t: 'Try Graceful Degradation next', d: 'Same topology, circuit breakers on. Compare the outcomes.' },
              ].map((s, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: 'var(--bg3)',
                    border: '1px solid var(--border)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2
                  }}>
                    <span className="font-mono" style={{ fontSize: 9, color: 'var(--text3)' }}>{s.n}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text1)', marginBottom: 3 }}>{s.t}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{s.d}</div>
                  </div>
                </div>
              ))}
              <button onClick={() => nav('/learn/the-cascade')} style={{
                width: '100%', padding: '14px', borderRadius: 10, marginTop: 8,
                background: 'var(--green)', color: '#080B0F', fontWeight: 700,
                fontSize: 14, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <Play size={14} style={{ fill: '#080B0F' }} /> Start The Cascade
              </button>
            </div>
          </FadeUp>

          {/* Path B */}
          <FadeUp delay={180}>
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--indigo)30',
              borderRadius: 14, padding: 32
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--indigo)18', border: '1px solid var(--indigo)40',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14, color: 'var(--indigo)'
                }}>B</div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--indigo)', fontSize: 15 }}>Freestyle Playground</div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text3)' }}>FOR ENGINEERS</div>
                </div>
              </div>
              {[
                { n: 1, t: 'Click "Open Playground" in the navbar', d: 'Blank canvas. Node palette on the left. Metrics panel on the right.' },
                { n: 2, t: 'Drag nodes from the palette', d: 'Gateway → Load Balancer → Services → Database. Any topology you want.' },
                { n: 3, t: 'Connect nodes by drawing edges', d: 'Click and drag between node handles. Configure timeout, retries, circuit breakers.' },
                { n: 4, t: 'Hit Start — set RPS and pattern', d: 'Constant, sinusoidal, spike, or ramp traffic. Watch it flow.' },
                { n: 5, t: 'Inject chaos from the panel', d: 'Click any node or use Quick Chaos. Kill it. Spike it. Partition it.' },
                { n: 6, t: 'Observe and iterate', d: 'Enable circuit breakers. Increase pool sizes. Restart. Compare.' },
              ].map((s, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: 'var(--bg3)',
                    border: '1px solid var(--border)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2
                  }}>
                    <span className="font-mono" style={{ fontSize: 9, color: 'var(--text3)' }}>{s.n}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text1)', marginBottom: 3 }}>{s.t}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{s.d}</div>
                  </div>
                </div>
              ))}
              <button onClick={() => nav('/editor')} style={{
                width: '100%', padding: '14px', borderRadius: 10, marginTop: 8,
                background: 'var(--indigo)', color: '#fff', fontWeight: 700,
                fontSize: 14, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <Terminal size={14} /> Open Playground
              </button>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section style={{
        background: 'var(--bg2)', borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)', padding: '96px 24px'
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <FadeUp>
            <SectionHeader pill="FAQ" title="Common questions" />
          </FadeUp>
          {[
            {
              q: 'Does Archaos require Docker, Kubernetes, or cloud credentials?',
              a: 'No. The simulation engine runs entirely inside a Web Worker in your browser. There\'s no real infrastructure involved. You need nothing installed and no accounts with any cloud provider.'
            },
            {
              q: 'Is the simulation realistic or just a toy?',
              a: 'The simulation models real distributed systems mechanics: HTTP request routing, thread pool exhaustion, circuit breaker state machines (CLOSED → OPEN → HALF-OPEN → CLOSED), message queue backpressure, retry amplification, cache miss stampedes, and OOM kill cycles. The failure patterns are based on real incident postmortems from Netflix, Amazon, GitHub, and Discord. It\'s not a real Kubernetes cluster, but the mechanics are accurate enough to build genuine intuition.'
            },
            {
              q: 'How does the AI narration work exactly?',
              a: 'Archaos monitors every simulation state change — node health transitions, error rate thresholds, circuit breaker trips, queue depth growth. Significant events trigger a request to GPT-OSS-120B via OpenRouter. The model receives the current topology, the event that just happened, and the live system state, then generates a streaming explanation that appears token-by-token in the narration panel. If GPT-OSS-120B takes more than 5 seconds to respond, Kimi K2.6 automatically handles the request.'
            },
            {
              q: 'I\'m a student preparing for system design interviews. Where do I start?',
              a: 'Run The Cascade (BEGINNER) first — 10 minutes. Then immediately run Graceful Degradation with the identical topology. In 20 minutes you\'ll have watched a cascading failure happen and then watched the identical failure be contained by circuit breakers. That comparison gives you a concrete answer to "how would you make this system more resilient" that comes from direct experience rather than reading.'
            },
            {
              q: 'I\'m an experienced SRE. Is Archaos too basic for me?',
              a: 'The ADVANCED scenarios (Split Brain, Traffic Spike Survival) model genuinely complex failure modes. The free-form Playground lets you reconstruct your actual production topology and simulate your highest-risk failure scenarios. Many engineers use Archaos to demonstrate failure modes to engineering managers or product stakeholders who don\'t have the infrastructure background to reason about these risks.'
            },
            {
              q: 'Is Archaos free?',
              a: 'Yes. All 8 scenarios, the visual playground, and the canvas editor are free with no account required. AI narration is included with usage limits. Saving custom topologies requires creating a free account.'
            },
          ].map((f, i) => (
            <FAQItem key={i} f={f} i={i} />
          ))}
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section style={{ padding: '96px 24px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <FadeUp>
          <div className="font-mono" style={{
            fontSize: 11, color: 'var(--indigo)', letterSpacing: 3,
            marginBottom: 24, textTransform: 'uppercase'
          }}>Stop Reading. Start Watching.</div>
          <h2 className="font-display" style={{
            fontSize: 'clamp(48px,8vw,96px)', color: 'var(--text1)',
            lineHeight: 0.95, marginBottom: 24
          }}>
            The cascade won't wait.
          </h2>
          <p style={{
            fontSize: 16, color: 'var(--text2)', maxWidth: 520,
            margin: '0 auto 40px', lineHeight: 1.7
          }}>
            Every engineer eventually learns these lessons. The question is whether you learn them from a simulation or from a 2am production incident.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => nav('/learn/the-cascade')} className="cta-btn"
              style={{
                padding: '18px 40px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                background: 'var(--indigo)', color: '#fff', cursor: 'pointer', border: 'none',
                boxShadow: '0 0 60px rgba(99,102,241,0.35)', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 10
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 80px rgba(99,102,241,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(99,102,241,0.35)' }}
            >
              <Play size={16} style={{ fill: '#fff' }} />
              Run The Cascade — Free
            </button>
            <button onClick={() => nav('/scenarios')} className="cta-btn"
              style={{
                padding: '18px 40px', borderRadius: 12, fontSize: 15, fontWeight: 600,
                background: 'transparent', color: 'var(--text2)', cursor: 'pointer',
                border: '1px solid var(--border2)', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text2)'; e.currentTarget.style.color = 'var(--text1)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text2)' }}
            >
              Browse All Scenarios →
            </button>
          </div>
          <div className="font-mono" style={{
            marginTop: 32, fontSize: 11, color: 'var(--text3)', lineHeight: 2
          }}>
            Free forever · No credit card · No install · 8 scenarios · AI narration included
          </div>
        </FadeUp>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 40, marginBottom: 48 }}>
            <div>
              <div className="font-display" style={{ fontSize: 24, letterSpacing: 4, marginBottom: 12, color: 'var(--text1)' }}>
                ARCHAOS
              </div>
              <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.7 }}>
                A visual distributed systems simulator with AI narration. Built for engineers who want to understand failure before it finds them.
              </p>
            </div>
            <div>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 3, marginBottom: 16 }}>PRODUCT</div>
              {[['Playground', '/editor'], ['Scenarios', '/scenarios'], ['The Cascade', '/learn/the-cascade'], ['Sign Up', '/auth']].map(([l, p]) => (
                <div key={l} style={{ marginBottom: 8 }}>
                  <Link to={p} style={{ fontSize: 13, color: 'var(--text3)', transition: 'color 0.2s', textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text1)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
                  >{l}</Link>
                </div>
              ))}
            </div>
            <div>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 3, marginBottom: 16 }}>SCENARIOS</div>
              {['The Cascade', 'Graceful Degradation', 'Retry Storm', 'Thundering Herd', 'Queue Flood', 'Split Brain'].map(l => (
                <div key={l} style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>{l}</div>
              ))}
            </div>
            <div>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 3, marginBottom: 16 }}>BUILT WITH</div>
              {['React Flow · Web Workers', 'NestJS · PostgreSQL', 'Redis · Socket.IO', 'GPT-OSS-120B · Kimi K2.6', 'Qdrant · OpenRouter', 'Railway · Vercel'].map(l => (
                <div key={l} className="font-mono" style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>{l}</div>
              ))}
            </div>
          </div>
          <div style={{
            borderTop: '1px solid var(--border)', paddingTop: 24,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
          }}>
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--text3)' }}>
              © {new Date().getFullYear()} ARCHAOS — All rights reserved
            </span>
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--text3)' }}>
              Built for engineers who want to remember failure, not just read about it
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export function FAQItem({ f, i }: { f: { q: string; a: string }; i: number }) {
  const [open, setOpen] = useState(false)
  return (
    <FadeUp key={i} delay={i * 40}>
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => setOpen(o => !o)} style={{
          width: '100%', textAlign: 'left', padding: '20px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16
        }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text1)', lineHeight: 1.5 }}>{f.q}</span>
          <ChevronRight size={16} style={{
            color: 'var(--text3)', flexShrink: 0, marginTop: 2,
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s'
          }} />
        </button>
        {open && (
          <div style={{
            paddingBottom: 20, fontSize: 13, color: 'var(--text2)', lineHeight: 1.8
          }}>{f.a}</div>
        )}
      </div>
    </FadeUp>
  )
}

export default Landing

