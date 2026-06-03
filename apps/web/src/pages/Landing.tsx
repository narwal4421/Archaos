// ARCHAOS — Cinematic War Room Landing Page
// Drop into apps/web/src/pages/Landing.tsx

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play, Terminal, Brain, Shield, BarChart2, GitBranch, BookOpen, GraduationCap, ShieldAlert, Flame, Cpu, CheckCircle, ArrowRight, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

// ─── FONTS + GLOBAL CSS ──────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700;800&family=Syne+Mono&family=Unbounded:wght@300;400;600;700;900&display=swap');

  :root {
    --void: #03040A;
    --void2: #07080F;
    --void3: #0C0D17;
    --ink: #12131E;
    --wire: #1A1C2E;
    --wire2: #252840;
    --fog: #38395A;
    --mist: #6B6D9A;
    --ghost: #9B9DC8;
    --ice: #D4D5F5;
    --white: #EEEEF8;
    --arc: #5B5FEF;
    --arc2: #7B7FFF;
    --arc-glow: rgba(91,95,239,0.18);
    --live: #22C773;
    --live-glow: rgba(34,199,115,0.15);
    --danger: #FF3B5C;
    --danger-glow: rgba(255,59,92,0.15);
    --warn: #F0A500;
    --warn-glow: rgba(240,165,0,0.12);
    --heat: #FF6B35;
    --cyan: #00D4FF;
    --cyan-glow: rgba(0,212,255,0.12);
    --text-a: #EEEEF8;
    --text-b: #9B9DC8;
    --text-c: #6B6D9A;
    --text-d: #38395A;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  body {
    background: var(--void);
    color: var(--text-a);
    font-family: 'Space Grotesk', sans-serif;
    overflow-x: hidden;
    cursor: crosshair;
  }

  a { text-decoration: none; color: inherit; }

  .f-display { font-family: 'Unbounded', sans-serif; }
  .f-title   { font-family: 'Syne', sans-serif; }
  .f-mono    { font-family: 'Syne Mono', monospace; }

  /* ── Cursor dot ── */
  #cursor-dot {
    position: fixed; top: 0; left: 0;
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--arc2); pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 9999; transition: transform 0.08s;
  }
  #cursor-ring {
    position: fixed; top: 0; left: 0;
    width: 32px; height: 32px; border-radius: 50%;
    border: 1px solid rgba(91,95,239,0.4); pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 9998; transition: transform 0.18s, width 0.2s, height 0.2s;
  }
  body:has(button:hover) #cursor-ring,
  body:has(a:hover) #cursor-ring {
    width: 48px; height: 48px;
    border-color: var(--arc);
  }

  /* ── Scanlines ── */
  .scanlines::after {
    content: '';
    position: absolute; inset: 0; pointer-events: none;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 2px,
      rgba(0,0,0,0.12) 2px,
      rgba(0,0,0,0.12) 4px
    );
    z-index: 5;
  }

  /* ── Noise overlay ── */
  .noise::before {
    content: '';
    position: absolute; inset: -100%;
    width: 300%; height: 300%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 1; opacity: 0.4;
    animation: drift 12s linear infinite;
  }
  @keyframes drift {
    0%   { transform: translate(0,0); }
    100% { transform: translate(30px, 20px); }
  }

  /* ── Glitch text ── */
  @keyframes glitch-1 {
    0%, 90%, 100% { clip-path: inset(0 0 100% 0); transform: translate(0); }
    92%  { clip-path: inset(10% 0 60% 0); transform: translate(-4px, 1px); }
    94%  { clip-path: inset(50% 0 20% 0); transform: translate(4px, -2px); }
    96%  { clip-path: inset(30% 0 40% 0); transform: translate(-2px); }
    98%  { clip-path: inset(70% 0 5% 0);  transform: translate(3px, 1px); }
  }
  @keyframes glitch-2 {
    0%, 90%, 100% { clip-path: inset(0 0 100% 0); transform: translate(0); }
    91%  { clip-path: inset(60% 0 10% 0); transform: translate(3px, -1px); }
    93%  { clip-path: inset(20% 0 50% 0); transform: translate(-3px, 2px); }
    95%  { clip-path: inset(80% 0 5% 0);  transform: translate(2px); }
    97%  { clip-path: inset(40% 0 30% 0); transform: translate(-4px, -1px); }
  }

  .glitch-wrap { position: relative; display: inline-block; }
  .glitch-wrap::before, .glitch-wrap::after {
    content: attr(data-text);
    position: absolute; inset: 0;
    color: var(--text-a);
    white-space: pre;
    font: inherit;
    letter-spacing: inherit;
  }
  .glitch-wrap::before {
    color: var(--cyan);
    animation: glitch-1 6s steps(1) infinite;
  }
  .glitch-wrap::after {
    color: var(--danger);
    animation: glitch-2 6s steps(1) infinite 0.1s;
  }

  /* ── Animations ── */
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pulse-dot {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%       { transform: scale(1.5); opacity: 0.6; }
  }
  @keyframes blink { 50% { opacity: 0; } }
  @keyframes ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes scan-v {
    0%   { top: -2px; }
    100% { top: 100%; }
  }
  @keyframes orbit {
    from { transform: rotate(0deg) translateX(var(--orbit-r, 60px)) rotate(0deg); }
    to   { transform: rotate(360deg) translateX(var(--orbit-r, 60px)) rotate(-360deg); }
  }
  @keyframes count-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cascade-sweep {
    0%   { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  @keyframes border-run {
    0%   { background-position: 0% 0%; }
    100% { background-position: 300% 0%; }
  }

  /* ── Ticker ── */
  .ticker-track { animation: ticker 40s linear infinite; display: inline-block; }

  /* ── Card hover shimmer border ── */
  .card-arc {
    position: relative; border-radius: 14px; overflow: hidden;
    transition: transform 0.35s cubic-bezier(.22,.68,0,1.2);
  }
  .card-arc::before {
    content: '';
    position: absolute; inset: 0; border-radius: 14px; padding: 1px;
    background: linear-gradient(130deg, var(--arc) 0%, transparent 40%, transparent 60%, var(--live) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0; transition: opacity 0.35s;
  }
  .card-arc:hover { transform: translateY(-6px); }
  .card-arc:hover::before { opacity: 1; }

  /* ── Flat border button ── */
  .btn-arc {
    position: relative; overflow: hidden;
    border: 1px solid var(--arc); background: var(--arc);
    color: #fff; border-radius: 8px;
    font-family: 'Syne Mono', monospace; font-size: 13px;
    padding: 14px 32px; cursor: pointer;
    transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .btn-arc:hover {
    background: var(--arc2);
    box-shadow: 0 0 28px var(--arc-glow), 0 0 60px var(--arc-glow);
    transform: translateY(-2px);
  }
  .btn-ghost {
    position: relative; overflow: hidden;
    border: 1px solid var(--wire2); background: transparent;
    color: var(--text-b); border-radius: 8px;
    font-family: 'Syne Mono', monospace; font-size: 13px;
    padding: 14px 32px; cursor: pointer;
    transition: border-color 0.2s, color 0.2s, transform 0.15s;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .btn-ghost:hover {
    border-color: var(--fog); color: var(--text-a);
    transform: translateY(-2px);
  }

  /* ── Scroll indicator ── */
  .scroll-line {
    width: 1px; height: 60px;
    background: linear-gradient(to bottom, var(--arc), transparent);
  }

  /* ── Section label ── */
  .sect-label {
    font-family: 'Syne Mono', monospace;
    font-size: 10px; letter-spacing: 4px;
    text-transform: uppercase; color: var(--arc);
    display: flex; align-items: center; gap: 10px;
  }
  .sect-label::before {
    content: ''; display: inline-block;
    width: 24px; height: 1px; background: var(--arc);
  }

  /* ── Live badge ── */
  .live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 20px;
    background: var(--live-glow);
    border: 1px solid rgba(34,199,115,0.25);
    font-family: 'Syne Mono', monospace; font-size: 10px;
    letter-spacing: 2px; color: var(--live);
  }
  .live-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--live);
    animation: pulse-dot 1.5s ease-in-out infinite;
  }

  /* ── Terminal block ── */
  .term-block {
    background: var(--void2);
    border: 1px solid var(--wire);
    border-radius: 10px; overflow: hidden;
  }
  .term-header {
    background: var(--ink); padding: 10px 16px;
    display: flex; align-items: center; gap: 8px;
    border-bottom: 1px solid var(--wire);
  }
  .term-dot { width: 10px; height: 10px; border-radius: 50%; }

  /* ── Stat card ── */
  .stat-num {
    font-family: 'Unbounded', sans-serif;
    font-size: 52px; font-weight: 700;
    color: var(--text-a); line-height: 1;
  }

  /* ── Node states ── */
  .ns-healthy   { color: var(--live); }
  .ns-degraded  { color: var(--warn); }
  .ns-failed    { color: var(--danger); }
  .ns-recover   { color: var(--arc2); }
  .ns-unhealthy { color: var(--heat); }

  /* ── FAQ ── */
  .faq-item { border-bottom: 1px solid var(--wire); }
  .faq-q {
    width: 100%; text-align: left; background: none; border: none;
    cursor: pointer; padding: 22px 0;
    display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;
    font-family: 'Space Grotesk', sans-serif; font-size: 14px;
    font-weight: 600; color: var(--text-a); line-height: 1.5;
    transition: color 0.2s;
  }
  .faq-q:hover { color: var(--arc2); }
  .faq-a {
    font-size: 13px; color: var(--text-b); line-height: 1.85;
    padding-bottom: 22px; max-height: 0; overflow: hidden;
    transition: max-height 0.35s ease;
  }
  .faq-a.open { max-height: 400px; }

  /* ── Scenario card ── */
  .scen-card {
    background: var(--void3);
    border: 1px solid var(--wire);
    border-radius: 14px; padding: 24px;
    cursor: pointer; display: flex;
    flex-direction: column; gap: 14px; height: 100%;
    transition: border-color 0.25s, transform 0.3s cubic-bezier(.22,.68,0,1.2), background 0.25s;
  }
  .scen-card:hover {
    transform: translateY(-5px);
    background: var(--ink);
  }

  /* ── Grid helpers ── */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
  .grid-4 { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 16px; }
  .grid-scen { display: grid; grid-template-columns: repeat(auto-fit,minmax(300px,1fr)); gap: 20px; }

  @media (max-width: 768px) {
    .grid-2 { grid-template-columns: 1fr; }
    .grid-3 { grid-template-columns: 1fr; }
    .stat-num { font-size: 36px; }
  }
`

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect() } }, { threshold })
    o.observe(el)
    return () => o.disconnect()
  }, [threshold])
  return { ref, v }
}

function Reveal({ children, delay = 0, className = '', style = {} }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties
}) {
  const { ref, v } = useInView()
  return (
    <div ref={ref} className={className} style={{
      opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.75s ease ${delay}ms, transform 0.75s cubic-bezier(.22,.68,0,1.2) ${delay}ms`,
      ...style
    }}>
      {children}
    </div>
  )
}

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const { ref, v } = useInView()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!v) return
    const dur = 1400
    const fn = (ts: number, s: number) => {
      const p = Math.min((ts - s) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setN(Math.round(ease * to))
      if (p < 1) requestAnimationFrame(t => fn(t, s))
    }
    requestAnimationFrame(t => fn(t, t))
  }, [v, to])
  return <span ref={ref}>{n}{suffix}</span>
}

// ─── CURSOR ──────────────────────────────────────────────────────────────────
function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0, raf = 0
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    document.addEventListener('mousemove', onMove)
    const loop = () => {
      if (dot.current) { dot.current.style.left = mx + 'px'; dot.current.style.top = my + 'px' }
      if (ring.current) {
        rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12
        ring.current.style.left = rx + 'px'; ring.current.style.top = ry + 'px'
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => { document.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [])
  return (
    <>
      <div id="cursor-dot" ref={dot} />
      <div id="cursor-ring" ref={ring} />
    </>
  )
}

// ─── HERO CANVAS ─────────────────────────────────────────────────────────────
function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let raf: number, W = 0, H = 0
    const resize = () => { W = c.width = c.offsetWidth; H = c.height = c.offsetHeight }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(c)

    // Nodes
    const NODES = [
      { id: 'gw', x: 0.10, y: 0.50, r: 10, label: 'API GW', base: '#00D4FF' },
      { id: 'ord', x: 0.30, y: 0.30, r: 8, label: 'Order', base: '#22C773' },
      { id: 'usr', x: 0.30, y: 0.70, r: 8, label: 'User', base: '#22C773' },
      { id: 'pay', x: 0.55, y: 0.36, r: 8, label: 'Pay', base: '#22C773' },
      { id: 'bil', x: 0.55, y: 0.64, r: 8, label: 'Billing', base: '#22C773' },
      { id: 'db', x: 0.82, y: 0.50, r: 12, label: 'DB', base: '#5B5FEF' },
    ]
    const EDGES = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5]]
    const parts = EDGES.map(() => Array.from({ length: 4 }, (_, i) => ({ t: i / 4, sp: 0.0025 + Math.random() * 0.002 })))

    let t = 0
    const sched: Record<string, [number, number, number, number, string]> = {
      db: [0.12, 0.22, 0.65, 0.78, '#5B5FEF'],
      pay: [0.22, 0.34, 0.67, 0.80, '#22C773'],
      bil: [0.30, 0.42, 0.69, 0.82, '#22C773'],
      ord: [0.38, 0.52, 0.71, 0.84, '#22C773'],
      usr: [0.40, 0.54, 0.73, 0.86, '#22C773'],
      gw: [0.48, 0.62, 0.75, 0.88, '#00D4FF'],
    }
    const color = (id: string, ph: number) => {
      const [dg, fl, rc, ok, base] = sched[id]
      if (ph < dg) return base
      if (ph < fl) return '#F0A500'
      if (ph < rc) return '#FF3B5C'
      if (ph < ok) return '#7B7FFF'
      return base
    }

    const draw = () => {
      t += 0.007
      const ph = (t * 0.16) % 1

      ctx.fillStyle = '#03040A'
      ctx.fillRect(0, 0, W, H)

      // Grid dots
      const gs = 48
      for (let x = 0; x < W; x += gs)
        for (let y = 0; y < H; y += gs) {
          const d = Math.hypot(x - W * 0.82, y - H * 0.5) / Math.max(W, H)
          ctx.globalAlpha = 0.08 + d * 0.04
          ctx.fillStyle = '#5B5FEF'
          ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill()
        }
      ctx.globalAlpha = 1

      // Edges + particles
      EDGES.forEach(([si, ti], ei) => {
        const S = NODES[si], T = NODES[ti]
        const x1 = S.x * W, y1 = S.y * H, x2 = T.x * W, y2 = T.y * H
        const tc = color(T.id, ph)
        const fail = tc === '#FF3B5C'

        ctx.strokeStyle = fail ? 'rgba(255,59,92,0.2)' : 'rgba(91,95,239,0.15)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 6])
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
        ctx.setLineDash([])

        parts[ei].forEach(p => {
          p.t = (p.t + p.sp) % 1
          const px = x1 + (x2 - x1) * p.t, py = y1 + (y2 - y1) * p.t
          ctx.globalAlpha = fail ? 0.95 : 0.7
          ctx.fillStyle = fail ? '#FF3B5C' : tc
          ctx.shadowBlur = 8; ctx.shadowColor = ctx.fillStyle
          ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill()
          ctx.shadowBlur = 0
        })
        ctx.globalAlpha = 1
      })

      // Status overlay
      if (ph > 0.18 && ph < 0.65) {
        const a = ph < 0.23 ? (ph - 0.18) / 0.05 : ph > 0.61 ? (0.65 - ph) / 0.04 : 1
        ctx.save(); ctx.globalAlpha = a * 0.85
        ctx.fillStyle = '#FF3B5C'; ctx.font = "bold 11px 'Syne Mono'"
        ctx.fillText('⚡ CHAOS — 4000ms DB LATENCY INJECTED', W * 0.5 - 160, H * 0.1)
        ctx.restore()
      }
      if (ph > 0.65 && ph < 0.90) {
        const a = ph < 0.69 ? (ph - 0.65) / 0.04 : ph > 0.86 ? (0.90 - ph) / 0.04 : 1
        ctx.save(); ctx.globalAlpha = a * 0.75
        ctx.fillStyle = '#22C773'; ctx.font = "bold 11px 'Syne Mono'"
        ctx.fillText('✓ RECOVERING — CIRCUIT BREAKERS HELD', W * 0.5 - 155, H * 0.1)
        ctx.restore()
      }

      // Nodes
      NODES.forEach(n => {
        const nx = n.x * W, ny = n.y * H, cl = color(n.id, ph)
        // glow
        const g = ctx.createRadialGradient(nx, ny, n.r, nx, ny, n.r * 5)
        g.addColorStop(0, cl + '33'); g.addColorStop(1, 'transparent')
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nx, ny, n.r * 5, 0, Math.PI * 2); ctx.fill()
        // ring
        ctx.strokeStyle = cl; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(nx, ny, n.r + 4 + Math.sin(t * 2 + NODES.indexOf(n)) * 2, 0, Math.PI * 2); ctx.stroke()
        // core
        ctx.shadowBlur = 20; ctx.shadowColor = cl; ctx.fillStyle = cl
        ctx.beginPath(); ctx.arc(nx, ny, n.r, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
        // label
        ctx.globalAlpha = 0.7; ctx.fillStyle = cl; ctx.font = "9px 'Syne Mono'"
        ctx.textAlign = 'center'; ctx.fillText(n.label, nx, ny - n.r - 8)
        ctx.textAlign = 'left'; ctx.globalAlpha = 1
      })

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.65, pointerEvents: 'none', zIndex: 0 }} />
}

// ─── TYPING ──────────────────────────────────────────────────────────────────
function Typewriter({ phrases }: { phrases: string[] }) {
  const [pi, setPi] = useState(0)
  const [ci, setCi] = useState(0)
  const [del, setDel] = useState(false)
  useEffect(() => {
    const ph = phrases[pi]
    const id = del
      ? (ci === 0
        ? setTimeout(() => { setDel(false); setPi(p => (p + 1) % phrases.length) }, 500)
        : setTimeout(() => setCi(c => c - 1), 35))
      : (ci === ph.length
        ? setTimeout(() => setDel(true), 2200)
        : setTimeout(() => setCi(c => c + 1), 55))
    return () => clearTimeout(id)
  }, [pi, ci, del, phrases])
  return (
    <span style={{ color: 'var(--live)', fontFamily: "'Syne Mono',monospace" }}>
      {phrases[pi].slice(0, ci)}
      <span style={{ animation: 'blink 0.9s step-end infinite', opacity: 1 }}>█</span>
    </span>
  )
}

// ─── TICKER ──────────────────────────────────────────────────────────────────
function Ticker() {
  const items = ['⚡ CASCADE FAILURE', '✓ CIRCUIT BREAKER', '⚠ RETRY STORM', '⚡ THUNDERING HERD', '✓ SPLIT BRAIN', '⚠ QUEUE FLOOD', '⚡ MEMORY LEAK', '✓ GRACEFUL DEGRADE', '⚠ BACKPRESSURE', '⚡ TRAFFIC SPIKE', '✓ RECOVERING', '⚠ POOL EXHAUSTION']
  const str = items.join('   ///   ')
  return (
    <div style={{ overflow: 'hidden', background: 'var(--void2)', borderTop: '1px solid var(--wire)', borderBottom: '1px solid var(--wire)', padding: '9px 0', whiteSpace: 'nowrap' }}>
      <div className="ticker-track f-mono" style={{ fontSize: 9, color: 'var(--text-d)', letterSpacing: 2 }}>
        {str}&nbsp;&nbsp;&nbsp;///&nbsp;&nbsp;&nbsp;{str}
      </div>
    </div>
  )
}

// ─── TRAFFIC FLOW SVG ────────────────────────────────────────────────────────
function FlowSVG({ failing = false }: { failing?: boolean }) {
  const nodes = [
    { x: 60, y: 90, r: 20, l: 'GW', cl: failing ? '#FF3B5C' : '#00D4FF' },
    { x: 220, y: 50, r: 16, l: 'Ord', cl: failing ? '#FF3B5C' : '#22C773' },
    { x: 220, y: 130, r: 16, l: 'Usr', cl: '#22C773' },
    { x: 380, y: 70, r: 16, l: 'Pay', cl: failing ? '#FF3B5C' : '#22C773' },
    { x: 380, y: 110, r: 16, l: 'Bil', cl: '#22C773' },
    { x: 470, y: 90, r: 22, l: 'DB', cl: failing ? '#FF3B5C' : '#5B5FEF' },
  ]
  const edges = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5]]
  const paths = ["M60 90 L220 50", "M60 90 L220 130", "M220 50 L380 70", "M220 130 L380 110", "M380 70 L470 90", "M380 110 L470 90"]
  return (
    <svg viewBox="0 0 540 185" style={{ width: '100%', maxWidth: 540 }}>
      <defs>
        <marker id="a" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto">
          <polygon points="0 0,5 2,0 4" fill={failing ? 'rgba(255,59,92,0.3)' : 'rgba(91,95,239,0.3)'} />
        </marker>
      </defs>
      {edges.map(([s, t], i) => {
        const S = nodes[s], T = nodes[t]
        return <line key={i} x1={S.x} y1={S.y} x2={T.x} y2={T.y}
          stroke={failing ? 'rgba(255,59,92,0.2)' : 'rgba(91,95,239,0.12)'} strokeWidth={1.5} strokeDasharray="4,5"
          markerEnd="url(#a)" />
      })}
      {!failing && paths.map((d, i) => (
        <circle key={i} r={3} fill="#5B5FEF" opacity={0.85}>
          <animateMotion dur={`${1.4 + i * 0.25}s`} repeatCount="indefinite" path={d} />
        </circle>
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.r + 7} fill={n.cl + '12'} />
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.cl + '18'} stroke={n.cl} strokeWidth={1.5} />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fill={n.cl} fontSize={8} fontFamily="Syne Mono,monospace">{n.l}</text>
        </g>
      ))}
      {failing && <text x={270} y={175} textAnchor="middle" fill="#FF3B5C" fontSize={9} fontFamily="Syne Mono,monospace">CASCADE FAILURE — ALL SERVICES DEGRADED</text>}
    </svg>
  )
}

// ─── CASCADE TIMELINE ────────────────────────────────────────────────────────
function CascadeTimeline() {
  const svcs = [
    { l: 'PostgreSQL DB', ev: [{ x: 30, w: 155, c: '#22C773' }, { x: 185, w: 45, c: '#F0A500' }, { x: 230, w: 195, c: '#FF3B5C' }, { x: 425, w: 50, c: '#7B7FFF' }, { x: 475, w: 130, c: '#22C773' }] },
    { l: 'Payment Svc', ev: [{ x: 30, w: 195, c: '#22C773' }, { x: 225, w: 30, c: '#F0A500' }, { x: 255, w: 170, c: '#FF3B5C' }, { x: 425, w: 50, c: '#7B7FFF' }, { x: 475, w: 130, c: '#22C773' }] },
    { l: 'Billing Svc', ev: [{ x: 30, w: 225, c: '#22C773' }, { x: 255, w: 30, c: '#F0A500' }, { x: 285, w: 140, c: '#FF3B5C' }, { x: 425, w: 50, c: '#7B7FFF' }, { x: 475, w: 130, c: '#22C773' }] },
    { l: 'Order Svc', ev: [{ x: 30, w: 265, c: '#22C773' }, { x: 295, w: 30, c: '#F0A500' }, { x: 325, w: 100, c: '#FF3B5C' }, { x: 425, w: 50, c: '#7B7FFF' }, { x: 475, w: 130, c: '#22C773' }] },
    { l: 'API Gateway', ev: [{ x: 30, w: 310, c: '#22C773' }, { x: 340, w: 30, c: '#F0A500' }, { x: 370, w: 55, c: '#FF3B5C' }, { x: 425, w: 50, c: '#7B7FFF' }, { x: 475, w: 130, c: '#22C773' }] },
  ]
  const rh = 32, top = 18
  return (
    <svg viewBox="0 0 700 255" style={{ width: '100%' }}>
      <line x1={30} y1={215} x2={660} y2={215} stroke="#1A1C2E" strokeWidth={1} />
      {['t=0s', 't=15s', 't=30s', 't=60s', 't=90s'].map((l, i) => (
        <text key={i} x={30 + i * 158} y={230} fill="#38395A" fontSize={8} fontFamily="Syne Mono,monospace">{l}</text>
      ))}
      <line x1={185} y1={8} x2={185} y2={210} stroke="#FF3B5C" strokeWidth={1} strokeDasharray="3,3" />
      <text x={188} y={17} fill="#FF3B5C" fontSize={7.5} fontFamily="Syne Mono,monospace">⚡ CHAOS</text>
      <line x1={425} y1={8} x2={425} y2={210} stroke="#22C773" strokeWidth={1} strokeDasharray="3,3" />
      <text x={428} y={17} fill="#22C773" fontSize={7.5} fontFamily="Syne Mono,monospace">✓ RECOVER</text>
      {svcs.map((s, i) => (
        <g key={i}>
          <text x={22} y={top + i * rh + 15} textAnchor="end" fill="#6B6D9A" fontSize={7.5} fontFamily="Syne Mono,monospace">{s.l}</text>
          {s.ev.map((e, j) => (
            <rect key={j} x={e.x} y={top + i * rh} width={e.w} height={20} rx={3} fill={e.c} opacity={0.72} />
          ))}
        </g>
      ))}
      {[['#22C773', 'HEALTHY'], ['#F0A500', 'DEGRADED'], ['#FF3B5C', 'FAILED'], ['#7B7FFF', 'RECOVERING']].map(([c, l], i) => (
        <g key={i}>
          <rect x={30 + i * 130} y={240} width={10} height={8} rx={2} fill={c} opacity={0.8} />
          <text x={44 + i * 130} y={247} fill="#38395A" fontSize={8} fontFamily="Syne Mono,monospace">{l}</text>
        </g>
      ))}
    </svg>
  )
}

// ─── STATE MACHINE ───────────────────────────────────────────────────────────
function StateSVG() {
  const states = [
    { l: 'HEALTHY', x: 100, y: 120, c: '#22C773' }, { l: 'DEGRADED', x: 280, y: 60, c: '#F0A500' },
    { l: 'UNHEALTHY', x: 280, y: 180, c: '#FF6B35' }, { l: 'FAILED', x: 460, y: 120, c: '#FF3B5C' },
    { l: 'RECOVERING', x: 280, y: 300, c: '#7B7FFF' },
  ]
  const edges = [
    [[100, 120], [280, 60], '#F0A500', 'CPU>75%'], [[280, 60], [280, 180], '#FF6B35', 'err>10%'],
    [[280, 180], [460, 120], '#FF3B5C', 'err>50%'], [[460, 120], [280, 300], '#7B7FFF', 'recover'],
    [[280, 300], [100, 120], '#22C773', 'clean'],
  ]
  return (
    <svg viewBox="0 0 580 380" style={{ width: '100%', maxWidth: 540 }}>
      <defs>
        <marker id="sm" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto">
          <polygon points="0 0,5 2,0 4" fill="#38395A" />
        </marker>
      </defs>
      {edges.map(([f, t, c, l], i) => (
        <g key={i}>
          <line x1={(f as number[])[0]} y1={(f as number[])[1]} x2={(t as number[])[0]} y2={(t as number[])[1]}
            stroke={c as string} strokeWidth={1.5} opacity={0.5} markerEnd="url(#sm)" />
          <text x={((f as number[])[0] + (t as number[])[0]) / 2 + 6} y={((f as number[])[1] + (t as number[])[1]) / 2}
            fill={c as string} fontSize={8} fontFamily="Syne Mono,monospace">{l as string}</text>
        </g>
      ))}
      {states.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r={36} fill={s.c + '15'} stroke={s.c} strokeWidth={1.5}>
            <animate attributeName="opacity" values="0.7;1;0.7" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
          </circle>
          <text x={s.x} y={s.y - 4} textAnchor="middle" fill={s.c} fontSize={9.5} fontFamily="Syne Mono,monospace" fontWeight="700">{s.l[0]}</text>
          <text x={s.x} y={s.y + 12} textAnchor="middle" fill={s.c} fontSize={6.5} fontFamily="Syne Mono,monospace">{s.l}</text>
        </g>
      ))}
    </svg>
  )
}

// ─── ARCH DIAGRAM ────────────────────────────────────────────────────────────
function ArchDiagram() {
  return (
    <svg viewBox="0 0 760 360" style={{ width: '100%', maxWidth: 760 }}>
      <defs>
        <marker id="aa" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto">
          <polygon points="0 0,5 2,0 4" fill="#252840" />
        </marker>
        <marker id="ab" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto">
          <polygon points="0 0,5 2,0 4" fill="#5B5FEF" />
        </marker>
      </defs>
      {/* Browser */}
      <rect x={8} y={35} width={165} height={285} rx={10} fill="#07080F" stroke="#1A1C2E" strokeWidth={1} />
      <text x={90} y={55} textAnchor="middle" fill="#38395A" fontSize={7.5} fontFamily="Syne Mono,monospace">BROWSER</text>
      {[
        { y: 65, c: '#5B5FEF', t: 'React Flow', d: 'Canvas 60fps' },
        { y: 135, c: '#22C773', t: 'Web Worker', d: 'Sim Engine 10Hz' },
        { y: 205, c: '#F0A500', t: 'Socket.IO', d: 'RT narration' },
        { y: 270, c: '#7C3AED', t: 'Zustand', d: 'State stores' },
      ].map((b, i) => (
        <g key={i}>
          <rect x={18} y={b.y} width={145} height={52} rx={6} fill={b.c + '12'} stroke={b.c} strokeWidth={1} />
          <text x={90} y={b.y + 22} textAnchor="middle" fill={b.c} fontSize={9} fontFamily="Syne Mono,monospace">{b.t}</text>
          <text x={90} y={b.y + 37} textAnchor="middle" fill="#6B6D9A" fontSize={7.5} fontFamily="Space Grotesk,sans-serif">{b.d}</text>
        </g>
      ))}
      <line x1={90} y1={117} x2={90} y2={135} stroke="#5B5FEF" strokeWidth={1} markerEnd="url(#ab)" />
      {/* Backend */}
      <rect x={235} y={35} width={205} height={285} rx={10} fill="#07080F" stroke="#1A1C2E" strokeWidth={1} />
      <text x={337} y={55} textAnchor="middle" fill="#38395A" fontSize={7.5} fontFamily="Syne Mono,monospace">RAILWAY BACKEND</text>
      {[
        { y: 65, c: '#FF3B5C', t: 'NestJS API', d: 'REST + Socket.IO' },
        { y: 135, c: '#00D4FF', t: 'NarrationGateway', d: 'GPT-OSS-120B stream' },
        { y: 205, c: '#7B7FFF', t: 'BlastService', d: 'BFS graph traversal' },
      ].map((b, i) => (
        <g key={i}>
          <rect x={245} y={b.y} width={185} height={52} rx={6} fill={b.c + '12'} stroke={b.c} strokeWidth={1} />
          <text x={337} y={b.y + 22} textAnchor="middle" fill={b.c} fontSize={9} fontFamily="Syne Mono,monospace">{b.t}</text>
          <text x={337} y={b.y + 37} textAnchor="middle" fill="#6B6D9A" fontSize={7.5}>{b.d}</text>
        </g>
      ))}
      <rect x={245} y={268} width={88} height={38} rx={6} fill="#3B82F612" stroke="#3B82F6" strokeWidth={1} />
      <text x={289} y={284} textAnchor="middle" fill="#3B82F6" fontSize={8} fontFamily="Syne Mono,monospace">PostgreSQL</text>
      <text x={289} y={297} textAnchor="middle" fill="#6B6D9A" fontSize={7}>Topology</text>
      <rect x={342} y={268} width={88} height={38} rx={6} fill="#FF3B5C12" stroke="#FF3B5C" strokeWidth={1} />
      <text x={386} y={284} textAnchor="middle" fill="#FF3B5C" fontSize={8} fontFamily="Syne Mono,monospace">Redis</text>
      <text x={386} y={297} textAnchor="middle" fill="#6B6D9A" fontSize={7}>Cache</text>
      {[117, 187, 250].map((y, i) => (
        <line key={i} x1={337} y1={y} x2={337} y2={y + 18} stroke="#252840" strokeWidth={1} markerEnd="url(#aa)" />
      ))}
      <line x1={173} y1={231} x2={245} y2={200} stroke="#F0A500" strokeWidth={1.5} strokeDasharray="4,3" markerEnd="url(#aa)" />
      <text x={192} y={208} fill="#F0A500" fontSize={7} fontFamily="Syne Mono,monospace">WSS</text>
      {/* OpenRouter */}
      <rect x={488} y={72} width={162} height={208} rx={10} fill="#07080F" stroke="#1A1C2E" strokeWidth={1} />
      <text x={569} y={92} textAnchor="middle" fill="#38395A" fontSize={7.5} fontFamily="Syne Mono,monospace">OPENROUTER</text>
      {[{ y: 102, c: '#00D4FF', t: 'GPT-OSS-120B', d: 'Primary' }, { y: 170, c: '#F0A500', t: 'Kimi K2.6', d: 'Fallback 5s' }].map((b, i) => (
        <g key={i}>
          <rect x={498} y={b.y} width={142} height={50} rx={6} fill={b.c + '12'} stroke={b.c} strokeWidth={1} />
          <text x={569} y={b.y + 20} textAnchor="middle" fill={b.c} fontSize={9} fontFamily="Syne Mono,monospace">{b.t}</text>
          <text x={569} y={b.y + 36} textAnchor="middle" fill="#6B6D9A" fontSize={8}>{b.d}</text>
        </g>
      ))}
      <text x={569} y={250} textAnchor="middle" fill="#38395A" fontSize={7.5} fontFamily="Syne Mono,monospace">stream: true · token-by-token</text>
      <line x1={440} y1={161} x2={488} y2={155} stroke="#00D4FF" strokeWidth={1.5} strokeDasharray="4,3" markerEnd="url(#aa)" />
      <text x={448} y={152} fill="#00D4FF" fontSize={7} fontFamily="Syne Mono,monospace">HTTPS</text>
      <circle cx={710} cy={96} r={18} fill="#12131E" stroke="#252840" strokeWidth={1} />
      <text x={710} y={101} textAnchor="middle" fill="#6B6D9A" fontSize={13}>👤</text>
      <text x={710} y={122} textAnchor="middle" fill="#38395A" fontSize={7.5} fontFamily="Syne Mono,monospace">Engineer</text>
      <line x1={692} y1={96} x2={650} y2={96} stroke="#252840" strokeWidth={1} markerEnd="url(#aa)" />
    </svg>
  )
}

// ─── LEARNING PATH ────────────────────────────────────────────────────────────
function LearningPath() {
  const steps = [
    { n: '01', c: '#22C773', t: 'The Cascade', tm: '~10min', lv: 'BEGINNER', d: 'Start here. Database latency cascades through 6 services. The most important pattern.' },
    { n: '02', c: '#22C773', t: 'Graceful Degradation', tm: '~10min', lv: 'BEGINNER', d: 'Same topology. Circuit breakers enabled. System survives the identical failure.' },
    { n: '03', c: '#F0A500', t: 'Retry Storm', tm: '~12min', lv: 'INTERMEDIATE', d: 'Fixed retries amplify a struggling service 4×. Why backoff + jitter are non-negotiable.' },
    { n: '04', c: '#F0A500', t: 'Thundering Herd', tm: '~12min', lv: 'INTERMEDIATE', d: 'Cache miss stampede exhausts the database connection pool in seconds.' },
    { n: '05', c: '#F0A500', t: 'Queue Flood', tm: '~15min', lv: 'INTERMEDIATE', d: 'Dead consumer fills Kafka. Producers block. Backpressure made visible.' },
    { n: '06', c: '#FF6B35', t: 'Memory Leak', tm: '~12min', lv: 'INTERMEDIATE', d: 'Sawtooth OOM crash cycles. Why heap profiling is critical in Node.js services.' },
    { n: '07', c: '#FF3B5C', t: 'Traffic Spike', tm: '~15min', lv: 'ADVANCED', d: '10× RPS. What fails first depends entirely on your configuration choices.' },
    { n: '08', c: '#FF3B5C', t: 'Split Brain', tm: '~18min', lv: 'ADVANCED', d: 'Network partition. Two databases diverge. CAP Theorem: not a theorem, an event.' },
  ]
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 20, top: 30, bottom: 30, width: 1, background: 'linear-gradient(to bottom,#22C773,#FF3B5C)', opacity: 0.2 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {steps.map((s, i) => (
          <Reveal key={i} delay={i * 45}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', paddingLeft: 50, position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 8, top: 13, width: 26, height: 26, borderRadius: '50%',
                background: s.c + '15', border: `1.5px solid ${s.c}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span className="f-mono" style={{ fontSize: 8, color: s.c }}>{s.n}</span>
              </div>
              <div style={{ flex: 1, background: 'var(--void3)', border: '1px solid var(--wire)', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = s.c}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--wire)'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span className="f-mono" style={{ fontSize: 8, padding: '2px 7px', borderRadius: 4, background: s.c + '15', color: s.c, border: `1px solid ${s.c}28` }}>{s.lv}</span>
                    <span className="f-mono" style={{ fontSize: 8, color: 'var(--text-d)' }}>{s.tm}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-a)', marginBottom: 4 }}>{s.t}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-b)', lineHeight: 1.65 }}>{s.d}</div>
                </div>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.c, flexShrink: 0, marginTop: 5 }} />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

// ─── FAQ ITEM ────────────────────────────────────────────────────────────────
function FAQItem({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(false)
  return (
    <Reveal delay={i * 40}>
      <div className="faq-item">
        <button className="faq-q" onClick={() => setOpen(o => !o)}>
          <span>{q}</span>
          <ChevronRight size={15} style={{ color: 'var(--mist)', flexShrink: 0, marginTop: 2, transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
        </button>
        <div className={`faq-a${open ? ' open' : ''}`}>{a}</div>
      </div>
    </Reveal>
  )
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
function SecHead({ label, title, sub }: { label: string; title: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 56 }}>
      <div className="sect-label" style={{ marginBottom: 20 }}>{label}</div>
      <h2 className="f-title" style={{ fontSize: 'clamp(32px,5vw,58px)', fontWeight: 700, lineHeight: 1.05, color: 'var(--text-a)', marginBottom: sub ? 16 : 0 }}>
        {title}
      </h2>
      {sub && <p style={{ color: 'var(--text-b)', fontSize: 15, maxWidth: 560, lineHeight: 1.75, marginTop: 14 }}>{sub}</p>}
    </div>
  )
}

// ─── MAIN LANDING ────────────────────────────────────────────────────────────
export function Landing() {
  const nav = useNavigate()
  const { logout, isAuthenticated } = useAuthStore()

  return (
    <div style={{ background: 'var(--void)', color: 'var(--text-a)', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{CSS}</style>
      <Cursor />

      {/* ══ NAV ══ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 58,
        background: 'rgba(3,4,10,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--wire)', zIndex: 1000,
        padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <Link to="/" className="f-display" style={{ fontSize: 20, letterSpacing: 4, color: 'var(--text-a)' }}>
          ARCHAOS
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 13 }}>
          {[['#how-it-works', 'How It Works'], ['#scenarios', 'Scenarios'], ['#for-whom', 'For Whom']].map(([h, l]) => (
            <a key={h} href={h} className="f-mono" style={{ color: 'var(--text-c)', fontSize: 11, letterSpacing: 1, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-a)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-c)'}
            >{l as string}</a>
          ))}
          {isAuthenticated() ? (
            <>
              <Link to="/dashboard" className="f-mono" style={{ fontSize: 11, color: 'var(--text-c)', letterSpacing: 1 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-a)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-c)'}>Dashboard</Link>
              <button onClick={logout} className="f-mono" style={{ background: 'transparent', border: 'none', color: 'var(--text-c)', cursor: 'pointer', fontSize: 11, letterSpacing: 1 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-a)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-c)'}>Sign Out</button>
              <Link to="/editor" className="btn-arc" style={{ padding: '8px 18px', fontSize: 11 }}>Playground →</Link>
            </>
          ) : (
            <>
              <Link to="/auth" className="f-mono" style={{ fontSize: 11, color: 'var(--text-c)', letterSpacing: 1 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-a)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-c)'}>Sign In</Link>
              <Link to="/auth" state={{ mode: 'register' }} className="btn-arc" style={{ padding: '8px 18px', fontSize: 11 }}>Sign Up →</Link>
            </>
          )}
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{
        position: 'relative', height: '100vh', minHeight: 640,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '0 28px', overflow: 'hidden'
      }} className="scanlines noise">
        <HeroCanvas />
        {/* Scan line */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(91,95,239,0.1),transparent)', animation: 'scan-v 5s linear infinite', top: 0, pointerEvents: 'none', zIndex: 4 }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 900, animation: 'fadeSlideUp 1s ease both' }}>
          <div className="live-badge" style={{ marginBottom: 28 }}>
            <span className="live-dot" /> LIVE SIMULATION — CASCADE IN PROGRESS
          </div>

          {/* Giant headline */}
          <div className="f-display" style={{
            fontSize: 'clamp(72px,12vw,148px)', lineHeight: 0.88,
            color: 'var(--text-a)', marginBottom: 0, userSelect: 'none'
          }}>
            <div>WATCH</div>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <span className="glitch-wrap" data-text="YOUR" style={{
                background: 'linear-gradient(90deg,var(--arc),var(--cyan),var(--arc))',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', animation: 'cascade-sweep 3s linear infinite'
              }}>YOUR</span>
            </div>
            <div>ARCH</div>
            <div style={{
              background: 'linear-gradient(90deg,var(--danger),var(--heat),var(--warn))',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', animation: 'cascade-sweep 3s linear infinite 0.5s'
            }}>FAIL.</div>
          </div>

          <div style={{ marginTop: 28, fontSize: 17, color: 'var(--text-b)', minHeight: 28 }}>
            <Typewriter phrases={[
              'Simulate cascading failures without touching production',
              'Understand circuit breakers through direct experience',
              'Build the mental models senior engineers have from incidents',
              'See CAP theorem play out in real time on your canvas',
            ]} />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 36 }}>
            <button onClick={() => nav('/learn/the-cascade')} className="btn-arc" style={{ fontSize: 13 }}>
              <Play size={13} style={{ fill: '#fff' }} /> Run The Cascade — Free
            </button>
            <button onClick={() => nav('/editor')} className="btn-ghost" style={{ fontSize: 13 }}>
              <Terminal size={13} /> Open Playground
            </button>
          </div>

          <div style={{ display: 'flex', gap: 28, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
            {[['✓', 'No signup to try'], ['✓', 'Runs in browser'], ['✓', '8 guided scenarios'], ['✓', 'AI narration']].map(([icon, l], i) => (
              <span key={i} className="f-mono" style={{ fontSize: 10, color: 'var(--text-d)', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--live)' }}>{icon}</span>{l}
              </span>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 10 }}>
          <span className="f-mono" style={{ fontSize: 8, color: 'var(--text-d)', letterSpacing: 4 }}>SCROLL</span>
          <div className="scroll-line" />
        </div>
      </section>

      <Ticker />

      {/* ══ STATS ══ */}
      <section style={{ borderBottom: '1px solid var(--wire)', padding: '48px 28px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 40, textAlign: 'center' }}>
          {[
            { n: 8, s: '', l: 'Scenarios' }, { n: 60, s: 'fps', l: 'Canvas Render' },
            { n: 7, s: '', l: 'Node Types' }, { n: 10, s: 'Hz', l: 'Sim Rate' },
            { n: 5, s: '', l: 'Health States' }, { n: 120, s: 'B', l: 'GPT Params' },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 55}>
              <div className="stat-num"><CountUp to={s.n} suffix={s.s} /></div>
              <div className="f-mono" style={{ fontSize: 9, color: 'var(--text-d)', letterSpacing: 3, marginTop: 10 }}>{s.l.toUpperCase()}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ THE PROBLEM ══ */}
      <section style={{ padding: '96px 28px', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <SecHead
            label="The Problem"
            title={<>Distributed systems knowledge<br />is locked behind incidents</>}
            sub="Senior engineers know things students don't — not because the concepts are secret, but because they've lived through failures that create visceral, unforgettable memories."
          />
        </Reveal>

        <div className="grid-2" style={{ marginBottom: 60 }}>
          {[
            {
              title: 'BEFORE ARCHAOS', border: '#FF3B5C', icon: '✕', ic: 'var(--danger)', items: [
                'You read about cascading failures in a blog post',
                'You understand CAP theorem as a theoretical concept',
                'You add circuit breakers because someone told you to',
                "You fear distributed systems incidents you've never seen",
                'System design interviews feel abstract and disconnected',
              ]
            },
            {
              title: 'AFTER ARCHAOS', border: '#22C773', icon: '✓', ic: 'var(--live)', items: [
                'You watched a cascade kill 6 services in 90 seconds',
                'You saw a split-brain CAP violation unfold in real time',
                'You compared the same failure with and without circuit breakers',
                'You predicted the next failure 15 seconds before it happened',
                'System design answers come from memory, not theory',
              ]
            },
          ].map((col, i) => (
            <Reveal key={i} delay={80 + i * 80}>
              <div style={{ background: 'var(--void2)', border: `1px solid ${col.border}25`, borderRadius: 14, padding: 32 }}>
                <div className="f-mono" style={{ fontSize: 10, color: col.ic, letterSpacing: 3, marginBottom: 20 }}>{col.title}</div>
                {col.items.map((t, j) => (
                  <div key={j} style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 13, color: 'var(--text-b)', alignItems: 'flex-start' }}>
                    <span style={{ color: col.ic, flexShrink: 0, marginTop: 1 }}>{col.icon}</span>{t}
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={160}>
          <div style={{
            textAlign: 'center', padding: '48px 40px',
            background: 'var(--void2)', border: '1px solid var(--wire)', borderRadius: 16,
            maxWidth: 720, margin: '0 auto', position: 'relative', overflow: 'hidden'
          }}>
            {/* Corner accents */}
            {[[0, 0], [0, 'auto'], ['auto', 0], ['auto', 'auto']].map((_, i) => (
              <div key={i} style={{
                position: 'absolute', width: 20, height: 20,
                borderTop: i < 2 ? `1px solid var(--arc)` : undefined,
                borderBottom: i >= 2 ? `1px solid var(--arc)` : undefined,
                borderLeft: i === 0 || i === 2 ? `1px solid var(--arc)` : undefined,
                borderRight: i === 1 || i === 3 ? `1px solid var(--arc)` : undefined,
                top: i < 2 ? 12 : 'auto', bottom: i >= 2 ? 12 : 'auto',
                left: i === 0 || i === 2 ? 12 : 'auto', right: i === 1 || i === 3 ? 12 : 'auto',
              }} />
            ))}
            <p style={{ fontSize: 'clamp(16px,2.5vw,24px)', color: 'var(--text-a)', lineHeight: 1.55, fontStyle: 'italic', marginBottom: 14, fontFamily: "'Syne',sans-serif", fontWeight: 500 }}>
              "Senior engineers don't reason from CAP theorem every time. They <span style={{ color: 'var(--arc2)' }}>replay memories</span> of watching systems fail at 2am."
            </p>
            <div className="f-mono" style={{ fontSize: 9, color: 'var(--text-d)', letterSpacing: 3 }}>ARCHAOS GENERATES THOSE MEMORIES — SAFELY</div>
          </div>
        </Reveal>
      </section>

      {/* ══ WHAT IS ARCHAOS ══ */}
      <section style={{ background: 'var(--void2)', borderTop: '1px solid var(--wire)', borderBottom: '1px solid var(--wire)', padding: '96px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal><SecHead label="What Is Archaos" title="A flight simulator for distributed systems" sub="Pilots don't learn to crash-land by crashing real planes. They use simulators. Archaos is that simulator — for the production incidents you haven't lived through yet." /></Reveal>
          <div className="grid-2" style={{ gap: 48, alignItems: 'center', marginBottom: 0 }}>
            <Reveal delay={100}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { c: 'var(--arc2)', e: '🎨', t: 'Build any topology', d: 'Drag API Gateways, Services, Databases, Queues, Load Balancers, and CDNs onto an infinite canvas. Connect them with HTTP, gRPC, or message queue edges.' },
                  { c: 'var(--danger)', e: '⚡', t: 'Inject real chaos', d: 'Kill nodes, spike CPU, add 4000ms of latency, partition networks, exhaust connection pools. Every failure type that has caused a real outage.' },
                  { c: 'var(--live)', e: '🧠', t: 'Watch and understand', d: 'Traffic particles flow in real time. Node health states transition visually. AI streams a narration explaining WHY your system is dying and what to do.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: 20, background: 'var(--void3)', borderRadius: 10, border: '1px solid var(--wire)', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = item.c}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--wire)'}
                  >
                    <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{item.e}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: item.c, marginBottom: 5, fontSize: 14 }}>{item.t}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-b)', lineHeight: 1.7 }}>{item.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="term-block">
                <div className="term-header">
                  <div className="term-dot" style={{ background: '#FF3B5C' }} /><div className="term-dot" style={{ background: '#F0A500' }} /><div className="term-dot" style={{ background: '#22C773' }} />
                  <span className="f-mono" style={{ fontSize: 9, color: 'var(--text-d)', marginLeft: 6, letterSpacing: 2 }}>SIMULATION CANVAS</span>
                </div>
                <div style={{ padding: 24 }}>
                  <div className="f-mono" style={{ fontSize: 9, color: 'var(--live)', letterSpacing: 2, marginBottom: 16 }}>HEALTHY — 100 RPS</div>
                  <FlowSVG failing={false} />
                  <div style={{ borderTop: '1px solid var(--wire)', marginTop: 20, paddingTop: 20 }}>
                    <div className="f-mono" style={{ fontSize: 9, color: 'var(--danger)', letterSpacing: 2, marginBottom: 16 }}>AFTER CHAOS — CASCADE FAILURE</div>
                    <FlowSVG failing={true} />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" style={{ padding: '96px 28px', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal><SecHead label="How It Works" title={<>5 phases from blank canvas<br />to deep understanding</>} /></Reveal>

        {/* Phase cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 80 }}>
          {[
            { n: '01', e: '🎨', c: 'var(--purple)', l: 'DESIGN', t: 'Build Topology', d: 'Drag nodes and draw edges to build any architecture.' },
            { n: '02', e: '⚙️', c: 'var(--arc)', l: 'CONFIGURE', t: 'Set Parameters', d: 'Replicas, timeouts, circuit breaker thresholds.' },
            { n: '03', e: '▶', c: 'var(--cyan)', l: 'SIMULATE', t: 'Start Engine', d: 'Web Worker 10Hz. Canvas 60fps. Both independent.' },
            { n: '04', e: '⚡', c: 'var(--danger)', l: 'INJECT', t: 'Trigger Chaos', d: 'Kill a node. Add latency. Partition the network.' },
            { n: '05', e: '🧠', c: 'var(--live)', l: 'LEARN', t: 'AI Narration', d: "GPT-OSS-120B explains the pattern and predicts next." },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 70}>
              <div style={{
                background: 'var(--void3)', border: `1px solid ${s.c}25`, borderRadius: 12,
                padding: '20px 16px', textAlign: 'center', height: '100%',
                transition: 'all 0.3s cubic-bezier(.22,.68,0,1.2)', cursor: 'default'
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.c; e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.background = 'var(--ink)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = s.c + '25'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'var(--void3)' }}
              >
                <div className="f-mono" style={{ fontSize: 8, color: s.c, letterSpacing: 3, marginBottom: 10 }}>{s.l}</div>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{s.e}</div>
                <div style={{ fontWeight: 600, color: 'var(--text-a)', fontSize: 13, marginBottom: 7 }}>{s.t}</div>
                <div style={{ fontSize: 11, color: 'var(--text-b)', lineHeight: 1.6 }}>{s.d}</div>
                <div className="f-mono" style={{ fontSize: 8, color: 'var(--text-d)', marginTop: 12 }}>{s.n}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Cascade Timeline */}
        <Reveal delay={80}>
          <h3 className="f-title" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-a)', marginBottom: 8, textAlign: 'center' }}>The Cascade — Second by Second</h3>
          <p style={{ color: 'var(--text-b)', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>How a 4000ms database latency spike propagates through 6 services over 90 seconds</p>
          <div className="term-block" style={{ padding: 32, overflow: 'auto' }}>
            <CascadeTimeline />
          </div>
        </Reveal>

        {/* State machine */}
        <div className="grid-2" style={{ gap: 48, alignItems: 'center', marginTop: 80 }}>
          <Reveal delay={80}>
            <div>
              <h3 className="f-title" style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: 'var(--text-a)' }}>Each node runs a 5-state health machine</h3>
              <p style={{ fontSize: 13, color: 'var(--text-b)', lineHeight: 1.8, marginBottom: 20 }}>Every service, database, and queue is driven by a discrete state machine. Transitions happen based on real metrics — error rate, CPU, queue depth, connection pool utilization.</p>
              {[
                { s: 'HEALTHY', c: 'var(--live)', d: 'Normal operation. Requests processing within thresholds.' },
                { s: 'DEGRADED', c: 'var(--warn)', d: 'CPU >75% or error rate >10%. Latency climbing.' },
                { s: 'UNHEALTHY', c: 'var(--heat)', d: 'CPU >95% or error rate >50%. Near failure.' },
                { s: 'FAILED', c: 'var(--danger)', d: 'Health check failed or chaos-killed. Requests error immediately.' },
                { s: 'RECOVERING', c: 'var(--arc2)', d: 'Metrics improving. Traffic cautiously resuming.' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 9, fontSize: 12, color: 'var(--text-b)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.c, flexShrink: 0 }} />
                  <span className="f-mono" style={{ color: s.c, fontSize: 9, width: 110, flexShrink: 0 }}>{s.s}</span>
                  <span>{s.d}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={180}>
            <div className="term-block" style={{ padding: 24 }}>
              <StateSVG />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ SYSTEM ARCHITECTURE ══ */}
      <section style={{ background: 'var(--void2)', borderTop: '1px solid var(--wire)', borderBottom: '1px solid var(--wire)', padding: '96px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <SecHead label="System Architecture" title="How Archaos is built"
              sub="The simulation runs in a Web Worker so the canvas stays at 60fps. AI narration streams token-by-token via Socket.IO. NestJS on Railway with GPT-OSS-120B via OpenRouter." />
          </Reveal>
          <Reveal delay={80}>
            <div className="term-block" style={{ padding: 32, overflow: 'auto' }}>
              <ArchDiagram />
            </div>
          </Reveal>
          <div className="grid-4" style={{ marginTop: 28 }}>
            {[
              { c: 'var(--arc2)', t: 'React Flow Canvas', d: 'Renders topology at 60fps. Custom node/edge components with live health indicators.' },
              { c: 'var(--live)', t: 'Web Worker Engine', d: 'Discrete event simulation at 10 ticks/sec. Completely off the main thread.' },
              { c: 'var(--warn)', t: 'Socket.IO Narration', d: 'GPT-OSS-120B tokens stream in real time. Kimi K2.6 fallback on 5-second timeout.' },
              { c: 'var(--purple)', t: 'BFS Blast Radius', d: 'PostgreSQL recursive CTE traverses dependency graph. Heat map overlaid on canvas.' },
            ].map((c, i) => (
              <Reveal key={i} delay={i * 55}>
                <div style={{ background: 'var(--void)', border: `1px solid ${c.c}20`, borderRadius: 10, padding: 18, transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = c.c + '60'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = c.c + '20'}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.c, marginBottom: 10 }} />
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-a)', marginBottom: 5 }}>{c.t}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-b)', lineHeight: 1.65 }}>{c.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SCENARIOS ══ */}
      <section id="scenarios" style={{ padding: '96px 28px', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <SecHead label="Scenario Library" title={<>8 failures that have taken down<br />real production systems</>}
            sub="Amazon, Netflix, GitHub, Discord — these patterns caused real outages. Now you can experience all of them in your browser." />
        </Reveal>
        <div className="grid-scen">
          {[
            { slug: 'the-cascade', tag: 'RESILIENCE', diff: 'BEGINNER', c: '#22C773', e: '🌊', t: 'The Cascade', tm: '~10 min', tl: 'Database latency freezes 6 services in 90 seconds.', how: 'A 4000ms DB latency fills thread pools upstream. Each service waits. Queues back up. Error rates spike. The system freezes from the inside out.', learn: 'WHY slow dependencies are more dangerous than dead ones.', real: 'Amazon DynamoDB 2013 · Netflix holiday 2012' },
            { slug: 'graceful-degradation', tag: 'RESILIENCE', diff: 'BEGINNER', c: '#22C773', e: '🛡', t: 'Graceful Degradation', tm: '~10 min', tl: 'Same failure as The Cascade. Circuit breakers save the system.', how: 'Identical topology and chaos. 4 edge configs changed: circuitBreakerEnabled: true. The system degrades partially instead of dying completely.', learn: 'The exact config that separates survivable from fatal.', real: 'Netflix Hystrix · AWS SDK circuit breakers' },
            { slug: 'the-retry-storm', tag: 'TRAFFIC', diff: 'INTERMEDIATE', c: '#F0A500', e: '🔁', t: 'Retry Storm', tm: '~12 min', tl: '3 retries with no backoff turns a struggling service into a dead one.', how: 'Payment Service is slow. Order Service retries 3× immediately. This triples load on Payment, which makes it slower, causing more retries. Feedback loop to 100% error rate.', learn: 'Why exponential backoff with jitter is not optional.', real: 'AWS 2012 ELB retry storm' },
            { slug: 'the-thundering-herd', tag: 'CACHING', diff: 'INTERMEDIATE', c: '#F0A500', e: '🐘', t: 'Thundering Herd', tm: '~12 min', tl: 'Cache expiry sends 500 requests to a connection pool of 5.', how: 'Popular Redis key expires. All 500 concurrent requests miss cache and hit PostgreSQL simultaneously. Connection pool exhausts in milliseconds.', learn: 'Why cache stampedes need mutex locks or probabilistic early expiry.', real: 'Instagram warmup outages · Reddit stampedes' },
            { slug: 'the-queue-flood', tag: 'QUEUING', diff: 'INTERMEDIATE', c: '#F0A500', e: '📦', t: 'Queue Flood', tm: '~15 min', tl: 'Dead consumer fills Kafka. Producers start failing after 5 minutes.', how: 'Consumer crashes. Queue fills at producer rate. At max depth, producers fail. Consumer recovers: backlog drains in a controlled flood.', learn: 'How message queues buffer failures and why they eventually overflow.', real: 'Uber queue incidents · Discord overflow outages' },
            { slug: 'the-memory-leak', tag: 'INFRASTRUCTURE', diff: 'INTERMEDIATE', c: '#FF6B35', e: '💾', t: 'Memory Leak', tm: '~12 min', tl: 'Heap grows 1.5%/sec until OOM kill. Cycle repeats.', how: 'Objects accumulate without cleanup. Memory: 40% → 95% → OOM kill. Service restarts and immediately begins leaking again.', learn: 'OOM kill patterns and why liveness probes catch this before users do.', real: 'Node.js event listener leaks · Java GC pressure' },
            { slug: 'traffic-spike-survival', tag: 'SCALING', diff: 'ADVANCED', c: '#FF3B5C', e: '📈', t: 'Traffic Spike', tm: '~15 min', tl: '10× traffic. Your configuration determines what survives.', how: 'No hidden chaos. Just a 10× RPS multiplier. Which node fails first depends entirely on your replica count, connection pool size, and timeout configuration.', learn: 'Right-sizing every parameter and what happens when you get it wrong.', real: 'Black Friday e-commerce · Gaming launches' },
            { slug: 'split-brain', tag: 'CONSISTENCY', diff: 'ADVANCED', c: '#FF3B5C', e: '🧠', t: 'Split Brain', tm: '~18 min', tl: "Network partition. Two databases both think they're the leader.", how: 'Replication link severed. DB East and DB West both promote to primary. Data diverges. Partition heals: conflicts with no clear winner.', learn: 'CAP Theorem as a lived sequence of events — not a theoretical constraint.', real: 'GitHub 2012 MySQL split-brain · Elasticsearch split-brain' },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 35}>
              <div className="scen-card"
                style={{ borderColor: `${s.c}20` }}
                onClick={() => nav(`/learn/${s.slug}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = s.c}
                onMouseLeave={e => e.currentTarget.style.borderColor = `${s.c}20`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="f-mono" style={{ fontSize: 8, color: 'var(--text-d)', letterSpacing: 2 }}>{s.tag}</span>
                  <span className="f-mono" style={{ fontSize: 8, padding: '3px 8px', borderRadius: 4, background: s.c + '18', color: s.c, border: `1px solid ${s.c}28` }}>{s.diff}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 26, lineHeight: 1 }}>{s.e}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-a)', marginBottom: 3 }}>{s.t}</div>
                    <div className="f-mono" style={{ fontSize: 8, color: 'var(--text-d)' }}>{s.tm}</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-b)', lineHeight: 1.65 }}>{s.tl}</p>
                <div style={{ background: 'var(--void2)', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: 'var(--text-c)', lineHeight: 1.65 }}>
                  <span style={{ color: 'var(--text-b)', fontWeight: 600 }}>How: </span>{s.how}
                </div>
                <div style={{ fontSize: 11, color: s.c }}>
                  <span style={{ opacity: 0.5 }}>You'll learn: </span>{s.learn}
                </div>
                <div className="f-mono" style={{ fontSize: 8, color: 'var(--text-d)' }}>Real: {s.real}</div>
                <button style={{
                  marginTop: 'auto', padding: '10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: 'transparent', border: `1px solid ${s.c}35`, color: s.c,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'background 0.2s', fontFamily: "'Syne Mono',monospace"
                }}
                  onMouseEnter={e => e.currentTarget.style.background = s.c + '18'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Play size={11} style={{ fill: 'currentColor' }} /> Launch Walkthrough
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ LEARNING PATH ══ */}
      <section style={{ background: 'var(--void2)', borderTop: '1px solid var(--wire)', borderBottom: '1px solid var(--wire)', padding: '96px 28px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Reveal><SecHead label="Learning Path" title="Beginner to advanced in 8 scenarios" sub="Each scenario builds on the previous. By the end, you'll have watched every major distributed systems failure pattern play out in real time." /></Reveal>
          <LearningPath />
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" style={{ padding: '96px 28px', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal><SecHead label="Features" title="Everything built to teach, not just demonstrate" /></Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20 }}>
          {[
            {
              c: 'var(--arc2)', Icon: GitBranch, t: 'Drag-and-Drop Topology Builder', badge: 'CANVAS', bs: [
                '7 node types: Service, Database, Queue, Load Balancer, API Gateway, CDN, External API',
                '4 edge types: HTTP, gRPC, Message, Database Connection',
                'Per-node config: replicas, CPU limit, processing time, connection pool, health thresholds',
                'Per-edge config: timeout, max retries, retry backoff, circuit breaker threshold',
                'Save and reload custom topologies anytime',
              ]
            },
            {
              c: 'var(--danger)', Icon: Flame, t: 'Real-Time Chaos Injection', badge: 'FAULT ENGINE', bs: [
                'ADD_LATENCY: inject ms of delay on any edge (simulates slow dependencies)',
                'KILL_NODE: terminate service instances (OOM kill, pod crash simulation)',
                'NETWORK_PARTITION: sever connections between nodes (split-brain scenarios)',
                'CPU_SPIKE: simulate compute pressure slowing request processing',
                'CACHE_EXPIRE: force cache miss to trigger thundering herd stampede',
                'TRAFFIC_SPIKE: multiply RPS by any factor (flash sale simulation)',
              ]
            },
            {
              c: 'var(--live)', Icon: Brain, t: 'GPT-OSS-120B Streaming Narration', badge: 'AI COPILOT', bs: [
                'Streams token-by-token explanation as failures happen in real time',
                'Identifies root cause — not just WHAT broke but WHY it broke',
                'Names the failure pattern: cascade, retry storm, thundering herd, split brain',
                'Predicts what will break next with a time estimate (10–30 seconds ahead)',
                'Auto-confirms predictions when the simulation matches the forecast',
                'Falls back to Kimi K2.6 if primary model takes >5 seconds',
              ]
            },
            {
              c: 'var(--warn)', Icon: BarChart2, t: 'Live Metrics Dashboard', badge: 'TELEMETRY', bs: [
                'Total RPS chart — watch load evolve over simulation time',
                'System error rate — see it climb from 0% to 100% during cascade',
                'P99 latency — tail latency spikes before full failure',
                'Queue depth gauge for message queues — backlog growing in real time',
                'Per-node health: HEALTHY, DEGRADED, UNHEALTHY, FAILED, RECOVERING',
                'Event log with timestamps for every state change',
              ]
            },
            {
              c: 'var(--cyan)', Icon: Shield, t: 'Blast Radius Analysis', badge: 'IMPACT MAP', bs: [
                'Click any node to calculate its blast radius before injecting chaos',
                'BFS graph traversal through the dependency graph via PostgreSQL recursive CTE',
                'Heat map overlay directly on canvas nodes with traffic percentage badges',
                'Shield icons on nodes protected by circuit breakers',
                'Critical path edges highlighted in red',
                'Shows % of total system traffic at risk for each failure',
              ]
            },
            {
              c: 'var(--purple)', Icon: BookOpen, t: 'Guided Interactive Walkthroughs', badge: 'LEARN MODE', bs: [
                '8 pre-scripted scenarios with timed automatic chaos injection',
                'Simulation pauses at key moments to ask multiple-choice prediction questions',
                'Cannot advance without answering — active recall reinforces learning',
                'AI narration explains whether your prediction was correct and why',
                "Completion tracking shows which patterns you've seen and understood",
                'Difficulty: BEGINNER → INTERMEDIATE → ADVANCED progression',
              ]
            },
          ].map((f, i) => (
            <Reveal key={i} delay={i * 55}>
              <div className="card-arc" style={{
                background: 'var(--void3)', border: '1px solid var(--wire)',
                borderRadius: 14, padding: 28, height: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: f.c + '18', border: `1px solid ${f.c}28` }}>
                    <f.Icon size={19} style={{ color: f.c }} />
                  </div>
                  <div>
                    <div className="f-mono" style={{ fontSize: 8, padding: '2px 8px', borderRadius: 4, background: f.c + '15', color: f.c, marginBottom: 6, display: 'inline-block' }}>{f.badge}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-a)' }}>{f.t}</div>
                  </div>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {f.bs.map((b, j) => (
                    <li key={j} style={{ display: 'flex', gap: 8, fontSize: 11.5, color: 'var(--text-b)', lineHeight: 1.65, alignItems: 'flex-start' }}>
                      <CheckCircle size={11} style={{ color: f.c, flexShrink: 0, marginTop: 3 }} />{b}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ FOR WHOM ══ */}
      <section id="for-whom" style={{ background: 'var(--void2)', borderTop: '1px solid var(--wire)', borderBottom: '1px solid var(--wire)', padding: '96px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal><SecHead label="Who Is This For" title="Three very different people. One tool." /></Reveal>
          <div className="grid-3">
            {[
              { c: 'var(--arc2)', Icon: Cpu, r: 'Backend Engineers', tag: 'See what happens before it happens in production.', who: "You write services. You add timeouts and circuit breakers because someone told you to. You've never actually watched a cascading failure unfold end to end.", use: ['Understand why your retry logic can kill a struggling service', 'See what happens when you forget timeouts on HTTP clients', 'Watch connection pool exhaustion before it costs you a 3am page', 'Test your system design interview answers against reality'], best: ['The Cascade', 'Retry Storm', 'Traffic Spike'] },
              { c: 'var(--danger)', Icon: ShieldAlert, r: 'SREs & DevOps', tag: 'Practice runbooks before incidents find you.', who: "You run production systems. You've been paged. You know the feeling of watching dashboards go red. Archaos lets you train for that without the production blast radius.", use: ['Model blast radius before injecting real chaos', 'Train junior SREs on failure patterns with guided scenarios', 'Validate circuit breaker thresholds before deploying to staging', 'Show product managers failure modes without touching prod'], best: ['Split Brain', 'Queue Flood', 'Graceful Degradation'] },
              { c: 'var(--cyan)', Icon: GraduationCap, r: 'CS Students', tag: 'Go into interviews with memories, not definitions.', who: "You understand CAP theorem on paper. You've read about cascading failures. But you've never watched them happen. Archaos changes that in one session.", use: ['Replace dry slides with interactive failure simulations', 'Answer system design questions from experience, not theory', 'Build the mental models senior engineers have from incidents', 'Get through distributed systems interviews differently'], best: ['The Cascade', 'Thundering Herd', 'Split Brain'] },
            ].map((a, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{
                  background: 'var(--void3)', border: `1px solid ${a.c}18`, borderRadius: 14, padding: 28,
                  height: '100%', display: 'flex', flexDirection: 'column', gap: 16,
                  transition: 'border-color 0.3s'
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = a.c + '55'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = a.c + '18'}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: a.c + '18', border: `1px solid ${a.c}28` }}>
                    <a.Icon size={19} style={{ color: a.c }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-a)', marginBottom: 4 }}>{a.r}</div>
                    <div style={{ fontSize: 13, color: a.c }}>{a.tag}</div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-b)', lineHeight: 1.75 }}>{a.who}</p>
                  <div>
                    <div className="f-mono" style={{ fontSize: 8, color: 'var(--text-d)', letterSpacing: 3, marginBottom: 10 }}>USE IT TO</div>
                    {a.use.map((u, j) => (
                      <div key={j} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-b)', marginBottom: 6, alignItems: 'flex-start' }}>
                        <ArrowRight size={9} style={{ color: a.c, marginTop: 3, flexShrink: 0 }} />{u}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="f-mono" style={{ fontSize: 8, color: 'var(--text-d)', letterSpacing: 3, marginBottom: 10 }}>START WITH</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {a.best.map((b, j) => (
                        <span key={j} className="f-mono" style={{ fontSize: 9, padding: '4px 8px', borderRadius: 6, background: a.c + '15', color: a.c, border: `1px solid ${a.c}28` }}>{b}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ GETTING STARTED ══ */}
      <section style={{ padding: '96px 28px', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal><SecHead label="Getting Started" title="From zero to first simulation in 2 minutes" sub="Two paths. Both start immediately. No account, no install, no setup." /></Reveal>
        <div className="grid-2">
          {[
            {
              l: 'A', c: 'var(--live)', t: 'Guided Scenarios', sub: 'RECOMMENDED FOR BEGINNERS', steps: [
                { t: 'Click "Scenarios" in the navbar', d: 'All 8 scenarios available immediately. No account needed.' },
                { t: 'Choose a scenario by difficulty', d: 'Start with The Cascade (BEGINNER). Read the setup description.' },
                { t: 'Press Start Simulation', d: 'Topology loads with nodes and edges pre-configured.' },
                { t: 'Answer the prediction checkpoint', d: 'Simulation pauses and asks what you think happens next.' },
                { t: 'Watch the AI narration stream', d: 'GPT-OSS-120B explains the failure pattern in real time.' },
                { t: 'Try Graceful Degradation next', d: 'Same topology, circuit breakers on. Compare the outcomes.' },
              ], btn: 'Start The Cascade', action: () => nav('/learn/the-cascade')
            },
            {
              l: 'B', c: 'var(--arc)', t: 'Freestyle Playground', sub: 'FOR ENGINEERS', steps: [
                { t: 'Click "Open Playground" in the navbar', d: 'Blank canvas. Node palette on the left. Metrics panel on the right.' },
                { t: 'Drag nodes from the palette', d: 'Gateway → Load Balancer → Services → Database. Any topology.' },
                { t: 'Connect nodes by drawing edges', d: 'Configure timeout, retries, circuit breakers per edge.' },
                { t: 'Hit Start — set RPS and pattern', d: 'Constant, sinusoidal, spike, or ramp traffic. Watch it flow.' },
                { t: 'Inject chaos from the panel', d: 'Click any node or use Quick Chaos. Kill it. Spike it. Partition it.' },
                { t: 'Observe and iterate', d: 'Enable circuit breakers. Increase pool sizes. Restart. Compare.' },
              ], btn: 'Open Playground', action: () => nav('/editor')
            },
          ].map((path, pi) => (
            <Reveal key={pi} delay={80 + pi * 80}>
              <div style={{ background: 'var(--void2)', border: `1px solid ${path.c}25`, borderRadius: 14, padding: 32, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: path.c + '18', border: `1px solid ${path.c}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: path.c, fontFamily: "'Unbounded',sans-serif" }}>{path.l}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: path.c, fontSize: 15 }}>{path.t}</div>
                    <div className="f-mono" style={{ fontSize: 8, color: 'var(--text-d)', letterSpacing: 2 }}>{path.sub}</div>
                  </div>
                </div>
                {path.steps.map((s, j) => (
                  <div key={j} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--void3)', border: '1px solid var(--wire)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span className="f-mono" style={{ fontSize: 8, color: 'var(--text-d)' }}>{j + 1}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-a)', marginBottom: 2 }}>{s.t}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-b)', lineHeight: 1.65 }}>{s.d}</div>
                    </div>
                  </div>
                ))}
                <button onClick={path.action} style={{
                  marginTop: 'auto', width: '100%', padding: 14, borderRadius: 10,
                  background: path.c, color: path.l === 'A' ? '#03040A' : '#fff',
                  fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: "'Syne Mono',monospace", transition: 'opacity 0.2s, transform 0.15s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {path.l === 'A' ? <Play size={13} style={{ fill: path.l === 'A' ? '#03040A' : '#fff' }} /> : <Terminal size={13} />} {path.btn}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section style={{ background: 'var(--void2)', borderTop: '1px solid var(--wire)', borderBottom: '1px solid var(--wire)', padding: '96px 28px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Reveal><SecHead label="FAQ" title="Common questions" /></Reveal>
          {[
            { q: 'Does Archaos require Docker, Kubernetes, or cloud credentials?', a: "No. The simulation engine runs entirely inside a Web Worker in your browser. There's no real infrastructure involved. You need nothing installed and no accounts with any cloud provider." },
            { q: 'Is the simulation realistic or just a toy?', a: "The simulation models real distributed systems mechanics: HTTP request routing, thread pool exhaustion, circuit breaker state machines (CLOSED → OPEN → HALF-OPEN → CLOSED), message queue backpressure, retry amplification, cache miss stampedes, and OOM kill cycles. The failure patterns are based on real incident postmortems from Netflix, Amazon, GitHub, and Discord." },
            { q: 'How does the AI narration work exactly?', a: "Archaos monitors every simulation state change — node health transitions, error rate thresholds, circuit breaker trips, queue depth growth. Significant events trigger a request to GPT-OSS-120B via OpenRouter. The model receives the current topology, the event that just happened, and the live system state, then generates a streaming explanation that appears token-by-token in the narration panel. If GPT-OSS-120B takes more than 5 seconds to respond, Kimi K2.6 automatically handles the request." },
            { q: "I'm a student preparing for system design interviews. Where do I start?", a: "Run The Cascade (BEGINNER) first — 10 minutes. Then immediately run Graceful Degradation with the identical topology. In 20 minutes you'll have watched a cascading failure happen and then watched the identical failure be contained by circuit breakers. That comparison gives you a concrete answer to \"how would you make this system more resilient\" that comes from direct experience rather than reading." },
            { q: "I'm an experienced SRE. Is Archaos too basic for me?", a: "The ADVANCED scenarios (Split Brain, Traffic Spike Survival) model genuinely complex failure modes. The free-form Playground lets you reconstruct your actual production topology and simulate your highest-risk failure scenarios. Many engineers use Archaos to demonstrate failure modes to engineering managers or product stakeholders." },
            { q: 'Is Archaos free?', a: "Yes. All 8 scenarios, the visual playground, and the canvas editor are free with no account required. AI narration is included with usage limits. Saving custom topologies requires creating a free account." },
          ].map((f, i) => (
            <FAQItem key={i} q={f.q} a={f.a} i={i} />
          ))}
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section style={{ padding: '120px 28px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <div className="f-mono" style={{ fontSize: 9, color: 'var(--arc)', letterSpacing: 4, marginBottom: 28, textTransform: 'uppercase' }}>Stop Reading. Start Watching.</div>
          <h2 className="f-display" style={{
            fontSize: 'clamp(52px,9vw,104px)', color: 'var(--text-a)',
            lineHeight: 0.9, marginBottom: 28, letterSpacing: '-0.01em'
          }}>
            THE CASCADE<br />
            <span style={{
              background: 'linear-gradient(90deg,var(--danger),var(--heat),var(--warn))',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', animation: 'cascade-sweep 3s linear infinite'
            }}>WON'T WAIT.</span>
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-b)', maxWidth: 500, margin: '0 auto 44px', lineHeight: 1.75 }}>
            Every engineer eventually learns these lessons. The question is whether you learn them from a simulation or from a 2am production incident.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => nav('/learn/the-cascade')} className="btn-arc" style={{ fontSize: 14, padding: '16px 40px' }}>
              <Play size={14} style={{ fill: '#fff' }} /> Run The Cascade — Free
            </button>
            <button onClick={() => nav('/scenarios')} className="btn-ghost" style={{ fontSize: 14, padding: '16px 40px' }}>
              Browse All Scenarios →
            </button>
          </div>
          <div className="f-mono" style={{ marginTop: 32, fontSize: 9, color: 'var(--text-d)', letterSpacing: 2, lineHeight: 2.2 }}>
            Free forever · No credit card · No install · 8 scenarios · AI narration included
          </div>
        </Reveal>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: '1px solid var(--wire)', padding: '52px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 40, marginBottom: 48 }}>
            <div>
              <div className="f-display" style={{ fontSize: 22, letterSpacing: 5, marginBottom: 12, color: 'var(--text-a)' }}>ARCHAOS</div>
              <p style={{ fontSize: 12, color: 'var(--text-d)', lineHeight: 1.75 }}>A visual distributed systems simulator with AI narration. Built for engineers who want to understand failure before it finds them.</p>
            </div>
            {[
              { h: 'PRODUCT', links: [['Playground', '/editor'], ['Scenarios', '/scenarios'], ['The Cascade', '/learn/the-cascade'], ['Sign Up', '/auth']] },
              { h: 'SCENARIOS', links: [['The Cascade', ''], ['Graceful Degradation', ''], ['Retry Storm', ''], ['Thundering Herd', ''], ['Queue Flood', ''], ['Split Brain', '']] },
              { h: 'BUILT WITH', links: [['React Flow · Web Workers', ''], ['NestJS · PostgreSQL', ''], ['Redis · Socket.IO', ''], ['GPT-OSS-120B · Kimi K2.6', ''], ['Qdrant · OpenRouter', ''], ['Railway · Vercel', '']] },
            ].map((col, i) => (
              <div key={i}>
                <div className="f-mono" style={{ fontSize: 8, color: 'var(--text-d)', letterSpacing: 3, marginBottom: 16 }}>{col.h}</div>
                {col.links.map(([l, p]) => (
                  <div key={l} style={{ marginBottom: 9 }}>
                    {p ? (
                      <Link to={p} style={{ fontSize: 12, color: 'var(--text-d)', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-a)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-d)'}
                      >{l}</Link>
                    ) : (
                      <span className="f-mono" style={{ fontSize: 11, color: 'var(--text-d)' }}>{l}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--wire)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span className="f-mono" style={{ fontSize: 9, color: 'var(--text-d)', letterSpacing: 1 }}>© {new Date().getFullYear()} ARCHAOS — All rights reserved</span>
            <span className="f-mono" style={{ fontSize: 9, color: 'var(--text-d)', letterSpacing: 1 }}>Built for engineers who remember failure, not just read about it</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing