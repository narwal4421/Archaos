import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Activity, LogOut, LayoutGrid, Award, Settings, User } from 'lucide-react'

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg- border-b border- z-40 px-6 flex items-center justify-between text-slate-100">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 hover:opacity-90 transition-opacity">
        <Activity className="text-indigo-500 animate-pulse" size={22} />
        ARCHAOS
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium">
        <Link
          to="/editor"
          className={`transition-colors flex items-center gap-1.5 ${
            isActive('/editor') ? 'text-indigo-400 font-semibold' : 'text-slate-350 hover:text-slate-150'
          }`}
        >
          <Settings size={15} />
          Playground
        </Link>
        <Link
          to="/scenarios"
          className={`transition-colors flex items-center gap-1.5 ${
            isActive('/scenarios') ? 'text-indigo-400 font-semibold' : 'text-slate-350 hover:text-slate-150'
          }`}
        >
          <LayoutGrid size={15} />
          Scenarios
        </Link>
        {isAuthenticated() && (
          <Link
            to="/dashboard"
            className={`transition-colors flex items-center gap-1.5 ${
              isActive('/dashboard') ? 'text-indigo-400 font-semibold' : 'text-slate-350 hover:text-slate-150'
            }`}
          >
            <Award size={15} />
            Dashboard
          </Link>
        )}
      </div>

      {/* Auth Profile Section */}
      <div className="flex items-center gap-4">
        {isAuthenticated() ? (
          <div className="flex items-center gap-3.5 bg- px-3 py-1.5 border border- rounded-xl">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-xs font-semibold text-slate-200">{user?.name}</span>
              <span className="text-[9px] text-slate-500 font-mono">{user?.email}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border- text-indigo-400 flex items-center justify-center font-bold text-sm shadow-inner uppercase">
              {user?.name ? user.name.slice(0, 2) : <User size={14} />}
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 bg- hover:bg- border border- hover:border- rounded-lg text-slate-400 hover:text-red-400 transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              state={{ mode: 'login' }}
              className="px-4 py-1.5 text-xs text-slate-350 hover:text-slate-100 transition-colors font-medium"
            >
              Log In
            </Link>
            <Link
              to="/auth"
              state={{ mode: 'register' }}
              className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-semibold rounded-xl border border- shadow-indigo-950 shadow-md transition-all active:scale-[0.98]"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
