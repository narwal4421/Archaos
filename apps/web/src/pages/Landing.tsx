import { Link, useNavigate } from 'react-router-dom'
import { Activity, ShieldCheck, Zap, Cpu, ArrowRight, Play, Eye } from 'lucide-react'

const SCENARIOS = [
  {
    id: "the-cascade",
    name: "The Cascade",
    desc: "A database slowdown cascades upstream through 6 services in 90 seconds.",
    category: "Resilience",
    difficulty: "Beginner",
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "the-retry-storm",
    name: "The Retry Storm",
    desc: "Aggressive retries amplify load 4x on a struggling downstream service.",
    category: "Traffic",
    difficulty: "Intermediate",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "the-thundering-herd",
    name: "The Thundering Herd",
    desc: "A cache expires under heavy traffic, flooding the main PostgreSQL database.",
    category: "Caching",
    difficulty: "Intermediate",
    color: "from-cyan-500 to-teal-500",
  },
  {
    id: "split-brain",
    name: "Split Brain",
    desc: "A replication link is partitioned, creating two write-conflicting leaders.",
    category: "Database",
    difficulty: "Advanced",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "graceful-degradation",
    name: "Graceful Degradation",
    desc: "EXACT same slowdown as The Cascade, but circuit breakers enable system survival.",
    category: "Resilience",
    difficulty: "Beginner",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "the-queue-flood",
    name: "The Queue Flood",
    desc: "Consumer dies, Kafka queue fills, backpressure triggers, consumer recovers and drains.",
    category: "Queueing",
    difficulty: "Intermediate",
    color: "from-purple-500 to-violet-500",
  },
  {
    id: "the-memory-leak",
    name: "The Memory Leak",
    desc: "Service memory rises slowly until OOM crash and restart, creating outage cycles.",
    category: "Infrastructure",
    difficulty: "Intermediate",
    color: "from-indigo-500 to-purple-500",
  },
  {
    id: "traffic-spike-survival",
    name: "Traffic Spike",
    desc: "10x traffic spike with no other chaos. Your service configs determine what fails first.",
    category: "Scaling",
    difficulty: "Advanced",
    color: "from-fuchsia-500 to-pink-500",
  }
]

export function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg- selection:text-indigo-200">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg- rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg- rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg- border-b border- z-50 px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">
          <Activity className="text-indigo-500" size={22} />
          ARCHAOS
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/editor" className="text-xs text-slate-350 hover:text-slate-100 transition-colors font-medium">
            Playground
          </Link>
          <Link to="/scenarios" className="text-xs text-slate-350 hover:text-slate-100 transition-colors font-medium">
            Scenarios
          </Link>
          <Link to="/auth" className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold border border- transition-all shadow-lg">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 flex flex-col items-center text-center max-w-4xl mx-auto space-y-8 z-10">
        <div className="inline-flex items-center gap-2 bg- border border-indigo-850 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300">
          <Zap size={13} className="animate-bounce" />
          Interactive Visual Distributed Systems Simulator
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-slate-50 via-slate-100 to-slate-400">
          Master Complex Architectures <br className="hidden sm:block" />
          Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">Controlled Chaos</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl font-medium">
          Drag and drop services, CDN caches, databases, and message queues on an interactive canvas. Inject network partitions, OOM leaks, database connection pool storms, and see failures cascade in real time.
        </p>

        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            to="/editor"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-slate-100 font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-sm"
          >
            Launch Sandbox
            <ArrowRight size={16} />
          </Link>
          <a
            href="#scenarios"
            className="px-6 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-300 font-semibold text-sm transition-all cursor-pointer"
          >
            Explore Library
          </a>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 z-10">
        <div className="p-6 bg- border border- rounded-2xl space-y-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-950 border border- text-indigo-400 flex items-center justify-center">
            <Cpu size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Discrete-Event Engine</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            State changes are processed inside a low-latency Web Worker, maintaining a fluid 60 FPS visual canvas displaying animated flowing HTTP, gRPC, and queue traffic.
          </p>
        </div>

        <div className="p-6 bg- border border- rounded-2xl space-y-4">
          <div className="w-10 h-10 rounded-xl bg-purple-950 border border- text-purple-400 flex items-center justify-center">
            <Zap size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Controlled Failures</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Manually trigger CPU spikes, kill database leaders, break synchronization replication bridges, or schedule timed chaos scripts to test resilience thresholds.
          </p>
        </div>

        <div className="p-6 bg- border border- rounded-2xl space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border- text-emerald-400 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Guided Walkthroughs</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Experience interactive scenarios. The simulation auto-pauses at critical points to test your diagnosis skills with interactive quizzes before continuing.
          </p>
        </div>
      </section>

      {/* Scenario Grid Section */}
      <section id="scenarios" className="py-20 px-6 max-w-6xl mx-auto space-y-12 z-10 scroll-mt-16">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">Scenario Library</h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Explore 8 pre-built system vulnerabilities and comparison models
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SCENARIOS.map((s) => (
            <div
              key={s.id}
              className="group relative bg- hover:bg- border border-slate-850 hover:border- rounded-2xl p-5 flex flex-col justify-between space-y-6 shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">{s.category}</span>
                  <span className="text-[9px] bg- px-2 py-0.5 rounded-full border border- font-bold">{s.difficulty}</span>
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-100 group-hover:text-indigo-400 transition-colors">{s.name}</h4>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>

              {/* CTA buttons inside card */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-">
                <Link
                  to={`/learn/${s.id}`}
                  className="py-2 px-2.5 bg- hover:bg- border border- rounded-xl text-[10px] font-bold text-indigo-300 transition-colors flex items-center justify-center gap-1"
                >
                  <Play size={10} />
                  Walkthrough
                </Link>
                <button
                  onClick={() => {
                    // Navigate to Editor and load topology fallback directly
                    navigate(`/editor?scenario=${s.id}`)
                  }}
                  className="py-2 px-2.5 bg- hover:bg-slate-800 border border-slate-800 hover:border- rounded-xl text-[10px] font-bold text-slate-350 hover:text-slate-150 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye size={10} />
                  Sandbox
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg- py-8 px-6 text-center text-xs text-slate-500 font-mono">
        &copy; {new Date().getFullYear()} Archaos Distributed Systems. All rights reserved.
      </footer>
    </div>
  )
}
