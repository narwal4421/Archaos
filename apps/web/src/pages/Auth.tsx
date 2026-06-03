// Auth.tsx — Archaos (Heavily Animated Version)
// NOTE: Before Google/GitHub OAuth works, configure in Supabase Dashboard:
//   Authentication → Providers → Enable Google + GitHub
//   Add redirect URL: https://archaos-tau.vercel.app/editor
//   Also works locally: http://localhost:5173/editor

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

// ─── Glitch Text ──────────────────────────────────────────────────────────────
function GlitchText({ text, style }: { text: string; style?: React.CSSProperties }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', ...style }}>
      <style>{`
        @keyframes glitch1 {
          0%,94%,100% { clip-path: inset(0 0 100% 0); transform: translate(0) }
          95% { clip-path: inset(33% 0 33% 0); transform: translate(-4px,1px); color:#EF4444; }
          96% { clip-path: inset(66% 0 10% 0); transform: translate(4px,-1px); color:#6366F1; }
          97% { clip-path: inset(10% 0 66% 0); transform: translate(-2px,2px); color:#EF4444; }
          98% { clip-path: inset(44% 0 44% 0); transform: translate(3px,-2px); color:#E8EDF3; }
          99% { clip-path: inset(0 0 100% 0); transform: translate(0); }
        }
        @keyframes glitch2 {
          0%,93%,100% { clip-path: inset(0 0 100% 0); transform: translate(0) }
          94% { clip-path: inset(20% 0 60% 0); transform: translate(5px,2px); color:#6366F1; }
          95% { clip-path: inset(60% 0 20% 0); transform: translate(-5px,-2px); color:#EF4444; }
          96% { clip-path: inset(40% 0 40% 0); transform: translate(2px,1px); }
          97% { clip-path: inset(0 0 100% 0); transform: translate(0); }
        }
      `}</style>
      {text}
      <span aria-hidden style={{
        position: 'absolute', inset: 0, content: '""',
        animation: 'glitch1 4s infinite',
        color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit',
      }}>{text}</span>
      <span aria-hidden style={{
        position: 'absolute', inset: 0,
        animation: 'glitch2 5s 0.3s infinite',
        color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit',
      }}>{text}</span>
    </span>
  )
}

// ─── Neural Network Canvas ────────────────────────────────────────────────────
function NeuralCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let raf: number
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight }
    resize()
    window.addEventListener('resize', resize)
    const W = () => c.width, H = () => c.height

    // Service nodes — distributed system topology
    const nodesDef = [
      { rx: 0.12, ry: 0.50, r: 11, id: 'gw', base: '#06B6D4', label: 'Gateway', ring: true },
      { rx: 0.35, ry: 0.25, r: 8, id: 'ord', base: '#10B981', label: 'Order', ring: false },
      { rx: 0.35, ry: 0.50, r: 8, id: 'usr', base: '#10B981', label: 'User', ring: false },
      { rx: 0.35, ry: 0.75, r: 8, id: 'inv', base: '#10B981', label: 'Inventory', ring: false },
      { rx: 0.60, ry: 0.35, r: 8, id: 'pay', base: '#8B5CF6', label: 'Payment', ring: false },
      { rx: 0.60, ry: 0.65, r: 8, id: 'bil', base: '#8B5CF6', label: 'Billing', ring: false },
      { rx: 0.84, ry: 0.50, r: 14, id: 'db', base: '#3B82F6', label: 'Database', ring: true },
    ]
    const edges = [[0, 1], [0, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 6], [5, 6]]

    // Per-particle state
    const particles = edges.map(() =>
      Array.from({ length: 4 }, (_, i) => ({ t: i * 0.25, sp: 0.003 + Math.random() * 0.003 }))
    )

    let t = 0
    // Cascade failure phase
    const failPhase = (ph: number) => {
      const cycle = ph % 1
      // 0-0.2: normal, 0.2-0.35: db stressed, 0.35-0.55: cascade, 0.55-0.7: recovery, 0.7-1: normal
      return cycle
    }

    const nodeColor = (id: string, cycle: number) => {
      const stressMap: Record<string, [number, number]> = {
        db: [0.20, 0.55], pay: [0.28, 0.58], bil: [0.30, 0.58],
        ord: [0.34, 0.62], usr: [0.36, 0.62], inv: [0.38, 0.64], gw: [0.42, 0.68],
      }
      const [start, recover] = stressMap[id] || [0.5, 0.8]
      if (cycle < start) return nodesDef.find(n => n.id === id)?.base || '#6366F1'
      if (cycle < start + 0.06) return '#F59E0B'
      if (cycle < recover) return '#EF4444'
      if (cycle < recover + 0.06) return '#6366F1'
      return nodesDef.find(n => n.id === id)?.base || '#6366F1'
    }

    const draw = () => {
      t += 0.005
      const cycle = failPhase(t * 0.12)
      const w = W(), h = H()

      // Background
      ctx.fillStyle = '#07090D'
      ctx.fillRect(0, 0, w, h)

      // Subtle grid
      ctx.strokeStyle = 'rgba(30,37,48,0.6)'
      ctx.lineWidth = 0.5
      const gp = 40
      for (let x = 0; x < w; x += gp) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
      for (let y = 0; y < h; y += gp) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75)
      vig.addColorStop(0, 'transparent')
      vig.addColorStop(1, 'rgba(7,9,13,0.7)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, w, h)

      const nodes = nodesDef.map(n => ({ ...n, x: n.rx * w, y: n.ry * h }))

      // Draw edges
      edges.forEach(([si, ti], ei) => {
        const S = nodes[si], T = nodes[ti]
        const col = nodeColor(T.id, cycle)
        // Edge glow
        ctx.strokeStyle = col + '22'
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(T.x, T.y); ctx.stroke()
        ctx.strokeStyle = col + '44'
        ctx.lineWidth = 0.8
        ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(T.x, T.y); ctx.stroke()

        // Particles
        particles[ei].forEach(p => {
          p.t = (p.t + p.sp) % 1
          const px = S.x + (T.x - S.x) * p.t
          const py = S.y + (T.y - S.y) * p.t
          ctx.shadowBlur = 8; ctx.shadowColor = col
          ctx.fillStyle = col
          ctx.globalAlpha = 0.9
          ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill()
          ctx.shadowBlur = 0; ctx.globalAlpha = 1
        })
      })

      // Draw nodes
      nodes.forEach(n => {
        const col = nodeColor(n.id, cycle)
        // Outer pulse ring
        const pulse = Math.sin(t * 2 + n.rx * 10) * 0.5 + 0.5
        if (n.ring) {
          ctx.strokeStyle = col + '30'
          ctx.lineWidth = 1
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 16 + pulse * 8, 0, Math.PI * 2); ctx.stroke()
        }
        // Glow halo
        const grd = ctx.createRadialGradient(n.x, n.y, n.r * 0.5, n.x, n.y, n.r * 3)
        grd.addColorStop(0, col + '30')
        grd.addColorStop(1, 'transparent')
        ctx.fillStyle = grd
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2); ctx.fill()

        // Node fill
        ctx.shadowBlur = 20; ctx.shadowColor = col
        ctx.fillStyle = col
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0

        // Label
        ctx.font = "700 9px 'JetBrains Mono', monospace"
        ctx.textAlign = 'center'
        ctx.fillStyle = col; ctx.globalAlpha = 0.8
        ctx.fillText(n.label.toUpperCase(), n.x, n.y - n.r - 7)
        ctx.globalAlpha = 1; ctx.textAlign = 'left'
      })

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
}

// ─── Scanline overlay ─────────────────────────────────────────────────────────
function Scanlines() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
    }} />
  )
}

// ─── Typed text effect ────────────────────────────────────────────────────────
function TypedLine({ text, delay = 0, speed = 40, color = '#4A5568' }: { text: string; delay?: number; speed?: number; color?: string }) {
  const [shown, setShown] = useState('')
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t1)
  }, [delay])
  useEffect(() => {
    if (!started) return
    let i = 0
    const iv = setInterval(() => {
      setShown(text.slice(0, ++i))
      if (i >= text.length) clearInterval(iv)
    }, speed)
    return () => clearInterval(iv)
  }, [started, text, speed])
  return (
    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color, letterSpacing: 1, display: 'block' }}>
      {shown}<span style={{ opacity: shown.length < text.length ? 1 : 0, animation: 'blink 0.8s infinite', display: 'inline-block', width: 8, height: 11, background: color, verticalAlign: 'middle', marginLeft: 2 }} />
    </span>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const GitHubIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="#E8EDF3">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
)

const EyeIcon = ({ show }: { show: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    {show
      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
    }
  </svg>
)

// ─── Animated input ───────────────────────────────────────────────────────────
function AnimatedInput({
  label, type, placeholder, value, onChange, delay = 0, extra
}: {
  label: string; type: string; placeholder: string; value: string;
  onChange: (v: string) => void; delay?: number; extra?: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      <label style={{
        fontSize: 10, color: focused ? '#6366F1' : '#4A5568',
        fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2.5,
        display: 'block', marginBottom: 7, transition: 'color 0.2s',
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {/* Focus border animation */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 8, pointerEvents: 'none',
          border: `1px solid ${focused ? '#6366F1' : '#1E2530'}`,
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12), 0 0 20px rgba(99,102,241,0.08)' : 'none',
          transition: 'all 0.25s ease', zIndex: 1,
        }} />
        {/* Scanning line on focus */}
        {focused && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, #6366F1, transparent)',
            borderRadius: '8px 8px 0 0', zIndex: 2,
            animation: 'scanH 1.5s ease-in-out infinite',
          }} />
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: '12px 14px',
            paddingRight: extra ? '42px' : '14px',
            borderRadius: 8,
            background: focused ? '#0D1118' : '#0A0D12',
            border: '1px solid transparent',
            color: '#E8EDF3', fontSize: 14,
            fontFamily: "'DM Sans',sans-serif",
            outline: 'none', transition: 'background 0.2s',
            boxSizing: 'border-box',
          }}
        />
        {extra && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 3 }}>
            {extra}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Particle burst on submit ─────────────────────────────────────────────────
function ParticleBurst({ active }: { active: boolean }) {
  if (!active) return null

  // Generate deterministic but pseudo-random looking particles based on index
  // to adhere to render purity rules without using state in useEffect
  const particles = Array.from({ length: 12 }, (_, i) => {
    // Simple deterministic hash based on index
    const pseudoRandom1 = ((i * 186.12) % 100) / 100
    const pseudoRandom2 = ((i * 382.74) % 100) / 100
    return {
      angle: (i / 12) * 360,
      dist: 40 + pseudoRandom1 * 40,
      size: 2 + pseudoRandom2 * 3,
      color: ['#6366F1', '#EF4444', '#10B981', '#06B6D4'][i % 4],
    }
  })

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 10 }}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: '50%', top: '50%',
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: p.color,
          animation: `burst${i} 0.6s ease-out forwards`,
        }} />
      ))}
      <style>{particles.map((p, i) => `
        @keyframes burst${i} {
          0%{transform:translate(-50%,-50%) translate(0,0);opacity:1}
          100%{transform:translate(-50%,-50%) translate(${Math.cos(p.angle * Math.PI / 180) * p.dist}px,${Math.sin(p.angle * Math.PI / 180) * p.dist}px);opacity:0}
        }
      `).join('')}</style>
    </div>
  )
}

// ─── MAIN AUTH COMPONENT ──────────────────────────────────────────────────────
export function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const loginStore = useAuthStore(s => s.login)
  const state = location.state as { mode?: 'register' | 'login' } | null

  const [mode, setMode] = useState<'login' | 'register'>(state?.mode === 'register' ? 'register' : 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [burst, setBurst] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [modeTransition, setModeTransition] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      import('../lib/supabase').then(({ supabase }) => {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            loginStore(
              { id: data.session.user.id, email: data.session.user.email || '', name: data.session.user.user_metadata?.name || data.session.user.email || '' },
              data.session.access_token
            )
            navigate('/editor')
          }
        })
      })
    }
  }, [loginStore, navigate])

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider); setError(null)
    try {
      const { supabase } = await import('../lib/supabase')
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/editor` }
      })
      if (error) throw error
    } catch (e) {
      setError(e instanceof Error ? e.message : `${provider} auth failed`)
      setOauthLoading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || (mode === 'register' && !name)) {
      setError('Please fill in all fields.'); return
    }
    setLoading(true); setError(null); setSuccess(null)
    try {
      const { supabase } = await import('../lib/supabase')
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
        if (error) throw error
        if (data.session) {
          setBurst(true)
          setTimeout(() => {
            loginStore({ id: data.user!.id, email: data.user!.email || email, name }, data.session!.access_token)
            navigate('/editor')
          }, 600)
        } else {
          setSuccess('Check your email to verify your account.')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.session) {
          setBurst(true)
          setTimeout(() => {
            loginStore({ id: data.user.id, email: data.user.email || email, name: data.user.user_metadata?.name || email.split('@')[0] }, data.session.access_token)
            navigate('/editor')
          }, 600)
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = useCallback(() => {
    setModeTransition(true)
    setTimeout(() => {
      setMode(m => m === 'login' ? 'register' : 'login')
      setError(null); setSuccess(null)
      setModeTransition(false)
    }, 200)
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: '#07090D',
      fontFamily: "'DM Sans',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        * { box-sizing:border-box; }

        @keyframes fadeUp {
          from{opacity:0;transform:translateY(24px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes fadeIn {
          from{opacity:0} to{opacity:1}
        }
        @keyframes slideRight {
          from{opacity:0;transform:translateX(-40px)}
          to{opacity:1;transform:translateX(0)}
        }
        @keyframes scanH {
          0%{transform:translateX(-100%)} 100%{transform:translateX(400%)}
        }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse-ring {
          0%{transform:scale(1);opacity:0.6}
          100%{transform:scale(1.8);opacity:0}
        }
        @keyframes shimmer-line {
          0%{transform:translateX(-100%)}
          100%{transform:translateX(100%)}
        }
        @keyframes error-shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)}
          60%{transform:translateX(-4px)}
          80%{transform:translateX(4px)}
        }
        @keyframes status-bar-fill {
          from{width:0%} to{width:100%}
        }
        @keyframes float {
          0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)}
        }

        input::placeholder { color:#2A3140; }
        input { caret-color:#6366F1; }

        .oauth-btn {
          transition: all 0.2s ease !important;
          position:relative;
          overflow:hidden;
        }
        .oauth-btn::before {
          content:'';
          position:absolute;
          inset:0;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent);
          transform:translateX(-100%);
          transition:transform 0.4s ease;
        }
        .oauth-btn:hover::before { transform:translateX(100%); }
        .oauth-btn:hover {
          border-color:#2D3748 !important;
          background:#111620 !important;
          transform:translateY(-1px) !important;
          box-shadow:0 8px 20px rgba(0,0,0,0.4) !important;
        }
        .oauth-btn:active { transform:scale(0.98) !important; }

        .submit-btn {
          position:relative;
          overflow:hidden;
          transition:all 0.2s ease !important;
        }
        .submit-btn::after {
          content:'';
          position:absolute;
          inset:0;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);
          transform:translateX(-100%);
        }
        .submit-btn:not(:disabled):hover::after { animation:shimmer-line 0.6s ease; }
        .submit-btn:not(:disabled):hover {
          transform:translateY(-1px) !important;
          box-shadow:0 8px 30px rgba(99,102,241,0.4) !important;
        }
        .submit-btn:not(:disabled):active { transform:scale(0.98) !important; }

        .mode-link {
          position:relative;
          transition:color 0.2s !important;
        }
        .mode-link::after {
          content:'';
          position:absolute;
          bottom:-1px; left:0; right:0; height:1px;
          background:#6366F1;
          transform:scaleX(0);
          transform-origin:left;
          transition:transform 0.2s ease;
        }
        .mode-link:hover::after { transform:scaleX(1); }
        .mode-link:hover { color:#6366F1 !important; }

        .stat-card {
          transition:all 0.2s ease;
          animation:float 4s ease-in-out infinite;
        }
        .stat-card:nth-child(2) { animation-delay:0.5s; }
        .stat-card:nth-child(3) { animation-delay:1s; }

        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#07090D; }
        ::-webkit-scrollbar-thumb { background:#1E2530; border-radius:2px; }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
        borderRight: '1px solid #111720',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}>
        {/* Canvas */}
        <NeuralCanvas />
        <Scanlines />

        {/* Corner decorations */}
        {[{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute', ...pos, width: 20, height: 20,
            borderTop: i < 2 ? '1px solid #6366F130' : 'none',
            borderBottom: i >= 2 ? '1px solid #6366F130' : 'none',
            borderLeft: i % 2 === 0 ? '1px solid #6366F130' : 'none',
            borderRight: i % 2 === 1 ? '1px solid #6366F130' : 'none',
            zIndex: 3,
          }} />
        ))}

        {/* Status bar top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: '#0D1118', zIndex: 4, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #6366F1, #EF4444, #10B981, #6366F1)',
            backgroundSize: '200%',
            animation: 'status-bar-fill 3s ease-out forwards, shimmer-line 3s 3s linear infinite',
          }} />
        </div>

        {/* System log overlay */}
        <div style={{
          position: 'absolute', top: 24, left: 24, zIndex: 3,
          background: 'rgba(7,9,13,0.7)', backdropFilter: 'blur(8px)',
          border: '1px solid #1E2530', borderRadius: 6,
          padding: '12px 14px', minWidth: 200,
          animation: 'slideRight 0.8s 0.4s both ease',
        }}>
          <div style={{ fontSize: 9, color: '#4A5568', fontFamily: "'JetBrains Mono'", letterSpacing: 2, marginBottom: 8 }}>SYSTEM LOG</div>
          <TypedLine text="$ archaos init --chaos" delay={600} color="#10B981" />
          <TypedLine text="> nodes: 7 | edges: 8" delay={1400} color="#6366F1" />
          <TypedLine text="> cascade: ACTIVE" delay={2200} color="#EF4444" />
          <TypedLine text="> ai-narrator: ON" delay={3000} color="#06B6D4" />
        </div>

        {/* Overlay gradient + hero text */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', padding: 48,
          background: 'linear-gradient(to top, #07090DEE 35%, transparent 65%)',
        }}>
          <div style={{ animation: 'fadeUp 0.8s 0.2s both ease' }}>
            <div style={{
              fontFamily: "'Bebas Neue'", fontSize: 58, letterSpacing: 3,
              color: '#E8EDF3', lineHeight: 0.92, marginBottom: 16,
            }}>
              WATCH<br />SYSTEMS<br />
              <GlitchText text="FAIL." style={{ color: '#EF4444' }} />
              <br />LEARN<br />WHY.
            </div>
            <p style={{ fontSize: 12, color: '#8B95A3', lineHeight: 1.8, maxWidth: 300, fontFamily: "'DM Sans'" }}>
              8 failure scenarios. Real distributed patterns. AI narration that predicts the next failure before it happens.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 16, marginTop: 28, animation: 'fadeUp 0.8s 0.4s both ease' }}>
            {[['8', 'Scenarios'], ['60fps', 'Canvas'], ['7', 'Node Types'], ['AI', 'Narrator']].map(([n, l]) => (
              <div key={l} className="stat-card" style={{
                background: 'rgba(14,17,23,0.8)', backdropFilter: 'blur(8px)',
                border: '1px solid #1E2530', borderRadius: 8, padding: '10px 14px',
              }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 24, color: '#6366F1', lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: 9, color: '#4A5568', fontFamily: "'JetBrains Mono'", letterSpacing: 1.5, marginTop: 2 }}>{l.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 44px',
        background: '#07090D',
        position: 'relative', overflow: 'hidden',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateX(0)' : 'translateX(20px)',
        transition: 'opacity 0.8s 0.1s ease, transform 0.8s 0.1s ease',
      }}>

        {/* Background accent glow */}
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80,
          width: 240, height: 240, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ marginBottom: 44, animation: 'fadeUp 0.6s 0.3s both ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            {/* Logo mark */}
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #6366F1, #4338CA)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99,102,241,0.3)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)',
                animation: 'shimmer-line 2s 1s ease',
              }} />
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="3" cy="8" r="2" fill="white" opacity="0.9" />
                <circle cx="13" cy="8" r="2.5" fill="white" opacity="0.9" />
                <circle cx="8" cy="4" r="1.5" fill="white" opacity="0.7" />
                <circle cx="8" cy="12" r="1.5" fill="white" opacity="0.7" />
                <line x1="5" y1="8" x2="11" y2="8" stroke="white" strokeWidth="0.8" opacity="0.4" />
                <line x1="8" y1="5.5" x2="8" y2="10.5" stroke="white" strokeWidth="0.8" opacity="0.4" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: 4, color: '#E8EDF3', lineHeight: 1 }}>ARCHAOS</div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: '#4A5568', letterSpacing: 2.5 }}>DISTRIBUTED SYSTEMS SIMULATOR</div>
            </div>
          </div>
        </div>

        {/* Mode heading */}
        <div style={{
          marginBottom: 28,
          opacity: modeTransition ? 0 : 1,
          transform: modeTransition ? 'translateY(-8px)' : 'translateY(0)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}>
          <h1 style={{
            fontSize: 26, fontWeight: 700, color: '#E8EDF3',
            marginBottom: 7, lineHeight: 1.2, letterSpacing: -0.5,
          }}>
            {mode === 'register' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: 13, color: '#8B95A3', lineHeight: 1.6 }}>
            {mode === 'register'
              ? 'Start simulating distributed failures in seconds.'
              : 'Sign in to access your topologies and simulation history.'}
          </p>
        </div>

        {/* OAuth buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, animation: 'fadeUp 0.5s 0.5s both ease' }}>
          {(['google', 'github'] as const).map((p) => (
            <button key={p} className="oauth-btn"
              onClick={() => handleOAuth(p)}
              disabled={!!oauthLoading || loading}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 9, padding: '11px 16px', borderRadius: 9,
                background: '#0D1118', border: '1px solid #1A2030',
                color: '#E8EDF3', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', opacity: (oauthLoading && oauthLoading !== p) ? 0.4 : 1,
              }}>
              {oauthLoading === p
                ? <span style={{ width: 16, height: 16, border: '2px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                : p === 'google' ? <GoogleIcon /> : <GitHubIcon />
              }
              <span>{oauthLoading === p ? 'Redirecting…' : p === 'google' ? 'Google' : 'GitHub'}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, animation: 'fadeUp 0.5s 0.6s both ease' }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #1E2530)' }} />
          <span style={{ fontSize: 10, color: '#2A3140', fontFamily: "'JetBrains Mono'", letterSpacing: 3 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #1E2530)' }} />
        </div>

        {/* Error / Success alerts */}
        {error && (
          <div style={{
            padding: '11px 14px', borderRadius: 8, marginBottom: 16,
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#EF4444', fontSize: 12, display: 'flex', gap: 8, alignItems: 'flex-start',
            animation: 'error-shake 0.4s ease, fadeIn 0.2s ease',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            padding: '11px 14px', borderRadius: 8, marginBottom: 16,
            background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)',
            color: '#10B981', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center',
            animation: 'fadeIn 0.3s ease',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex', flexDirection: 'column', gap: 18,
          opacity: modeTransition ? 0 : 1,
          transform: modeTransition ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}>
          {mode === 'register' && (
            <AnimatedInput
              label="FULL NAME" type="text" placeholder="Your name"
              value={name} onChange={setName} delay={100}
            />
          )}
          <AnimatedInput
            label="EMAIL" type="email" placeholder="you@example.com"
            value={email} onChange={setEmail}
            delay={mode === 'register' ? 200 : 100}
          />
          <AnimatedInput
            label="PASSWORD" type={showPass ? 'text' : 'password'}
            placeholder={mode === 'register' ? 'Min. 8 characters' : '••••••••'}
            value={password} onChange={setPassword}
            delay={mode === 'register' ? 300 : 200}
            extra={
              <button type="button" onClick={() => setShowPass(s => !s)} style={{
                background: 'none', border: 'none', color: '#4A5568', cursor: 'pointer',
                padding: 3, display: 'flex', alignItems: 'center', transition: 'color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#8B95A3')}
                onMouseLeave={e => (e.currentTarget.style.color = '#4A5568')}
              >
                <EyeIcon show={showPass} />
              </button>
            }
          />

          {/* Submit */}
          <div style={{
            position: 'relative', marginTop: 4,
            opacity: 1,
            animation: 'fadeUp 0.5s 0.7s both ease',
          }}>
            <ParticleBurst active={burst} />
            <button type="submit" className="submit-btn"
              disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: 10,
                fontSize: 14, fontWeight: 600, letterSpacing: 0.5,
                background: loading
                  ? '#0D1118'
                  : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #4338CA 100%)',
                color: loading ? '#4A5568' : '#fff',
                border: loading ? '1px solid #1E2530' : '1px solid transparent',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.25)',
              }}>
              {loading ? (
                <>
                  <span style={{ width: 15, height: 15, border: '2px solid #2D3748', borderTopColor: '#6366F1', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, letterSpacing: 2 }}>PROCESSING...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'register' ? 'Create Account' : 'Sign In'}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Mode switch */}
        <div style={{
          marginTop: 22, textAlign: 'center', fontSize: 13, color: '#4A5568',
          animation: 'fadeUp 0.5s 0.8s both ease',
        }}>
          {mode === 'register' ? 'Already have an account? ' : "Don't have an account? "}
          <button className="mode-link"
            onClick={switchMode}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#8B95A3', fontWeight: 600, fontSize: 13,
            }}>
            {mode === 'register' ? 'Log in' : 'Sign up for free'}
          </button>
        </div>

        {/* Footer note */}
        <p style={{
          marginTop: 28, fontSize: 10, color: '#2A3140', textAlign: 'center',
          lineHeight: 1.7, fontFamily: "'JetBrains Mono'", letterSpacing: 0.5,
          animation: 'fadeUp 0.5s 0.9s both ease',
        }}>
          NO ADS · NO DATA SELLING · ALL 8 SCENARIOS RUN WITHOUT AN ACCOUNT
        </p>
      </div>
    </div>
  )
}