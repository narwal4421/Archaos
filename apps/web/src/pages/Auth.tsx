import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Navbar } from '../components/layout/Navbar'
import { Activity, ShieldAlert, CheckCircle2, User, Mail, Lock } from 'lucide-react'

interface LocationState {
  mode?: 'register' | 'login'
}

export function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const loginStore = useAuthStore(s => s.login)

  const state = location.state as LocationState | null
  const [isRegister, setIsRegister] = useState(() => {
    return state?.mode === 'register'
  })

  // Safely synchronize component mode inside an effect when routing triggers it
  React.useEffect(() => {
    if (state?.mode) {
      setIsRegister(state.mode === 'register')
    }
  }, [state?.mode])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!email || !password || (isRegister && !name)) {
      setErrorMsg('Please fill in all required fields.')
      setLoading(false)
      return
    }

    try {
      const { supabase } = await import('../lib/supabase')
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        })
        if (error) throw error
        if (data.session) {
          loginStore(
            {
              id: data.user?.id || '',
              email: data.user?.email || email,
              name: data.user?.user_metadata?.name || name,
            },
            data.session.access_token
          )
          setSuccessMsg('Account registered successfully!')
          setTimeout(() => navigate('/editor'), 1000)
        } else {
          setSuccessMsg('Registration successful! Please check your email for verification.')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        if (data.session) {
          loginStore(
            {
              id: data.user?.id || '',
              email: data.user?.email || email,
              name: data.user?.user_metadata?.name || email.split('@')[0],
            },
            data.session.access_token
          )
          setSuccessMsg('Logged in successfully!')
          setTimeout(() => navigate('/editor'), 1000)
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please check credentials.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none relative">
      <Navbar />

      {/* Background Decorative Glow */}
      <div className="absolute w-[350px] h-[350px] bg- rounded-full blur-[100px] pointer-events-none" />

      {/* Card Wrapper */}
      <div className="w-full max-w-md bg- border border- rounded-2xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 animate-scale-in">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-indigo-400 font-bold text-base uppercase tracking-wider mb-2">
            <Activity className="animate-pulse" size={20} />
            Archaos Auth
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {isRegister ? 'Start simulating and mapping blast radii' : 'Sign in to access your custom topologies'}
          </p>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-3 bg- border border- rounded-lg text-xs text-red-400 flex items-center gap-2 animate-shake">
            <ShieldAlert size={14} className="shrink-0" />
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg- border border- rounded-lg text-xs text-emerald-400 flex items-center gap-2 animate-scale-in">
            <CheckCircle2 size={14} className="shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {isRegister && (
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-500"><User size={15} /></span>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg- border border- rounded-lg px-10 py-2.5 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-500"><Mail size={15} /></span>
              <input
                type="email"
                placeholder="jane.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg- border border- rounded-lg px-10 py-2.5 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Password</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-500"><Lock size={15} /></span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg- border border- rounded-lg px-10 py-2.5 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg- disabled:text-slate-550 rounded-xl font-bold transition-all text-xs tracking-wide uppercase cursor-pointer"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center text-xs text-slate-400">
          {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <button
            onClick={() => {
              setIsRegister(!isRegister)
              setErrorMsg(null)
              setSuccessMsg(null)
            }}
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors underline cursor-pointer"
          >
            {isRegister ? 'Log in' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  )
}
