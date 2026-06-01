import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { LogOut, User } from 'lucide-react'

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
    <nav className="fixed top-0 left-0 right-0 h-[60px] bg-black/80 backdrop-blur-[12px] border-b border-[#1A1A1A] z-[1000] px-6 flex items-center justify-between text-white">
      {/* Left: Brand Logo */}
      <Link
        to="/"
        className="font-['Space_Grotesk'] text-[18px] font-bold tracking-[3px] text-white hover:opacity-90 transition-opacity"
      >
        ARCHAOS
      </Link>

      {/* Center: Navigation Links */}
      <div className="flex items-center gap-8 text-[14px] font-['Inter'] font-medium">
        <Link
          to="/editor"
          className={`transition-colors duration-150 ${
            isActive('/editor') ? 'text-white font-semibold' : 'text-[#888888] hover:text-white'
          }`}
        >
          Playground
        </Link>
        <Link
          to="/scenarios"
          className={`transition-colors duration-150 ${
            isActive('/scenarios') ? 'text-white font-semibold' : 'text-[#888888] hover:text-white'
          }`}
        >
          Scenarios
        </Link>
        {isAuthenticated() && (
          <Link
            to="/dashboard"
            className={`transition-colors duration-150 ${
              isActive('/dashboard') ? 'text-white font-semibold' : 'text-[#888888] hover:text-white'
            }`}
          >
            Dashboard
          </Link>
        )}
      </div>

      {/* Right: User / Auth Profile Section */}
      <div className="flex items-center gap-4 text-[14px] font-['Inter']">
        {isAuthenticated() ? (
          <div className="flex items-center gap-3.5 bg-[#0A0A0A] px-3.5 py-1.5 border border-[#222222] rounded-lg">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-xs font-semibold text-white">{user?.name}</span>
              <span className="text-[9px] text-[#888888] font-mono">{user?.email}</span>
            </div>
            <div className="w-7 h-7 rounded-md bg-[#111111] border border-[#222222] text-[#7C3AED] flex items-center justify-center font-bold text-xs uppercase shadow-inner">
              {user?.name ? user.name.slice(0, 2) : <User size={13} />}
            </div>
            <button
              onClick={handleLogout}
              className="p-1 hover:bg-[#111111] border border-transparent hover:border-[#222222] rounded text-[#888888] hover:text-[#EF4444] transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              state={{ mode: 'login' }}
              className="px-4 py-2 text-xs text-[#888888] hover:text-white transition-colors font-medium"
            >
              Log In
            </Link>
            <Link
              to="/auth"
              state={{ mode: 'register' }}
              className="px-5 py-2 text-xs bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white font-semibold rounded-lg shadow-lg hover:opacity-85 active:scale-[0.98] transition-all cursor-pointer"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
