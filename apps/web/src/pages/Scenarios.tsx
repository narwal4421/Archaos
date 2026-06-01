import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Play, Eye, Compass } from 'lucide-react'

const SCENARIOS = [
  {
    id: "the-cascade",
    name: "The Cascade",
    desc: "A database slowdown cascades upstream through 6 services in 90 seconds, causing complete thread exhaustion.",
    category: "RESILIENCE",
    difficulty: "BEGINNER",
    highlights: ["Cascading Timeout", "Thread Exhaustion", "Synchronous Hops"],
    color: "from-blue-500/20 to-indigo-500/10 border- text-blue-400"
  },
  {
    id: "the-retry-storm",
    name: "The Retry Storm",
    desc: "Aggressive client retries without exponential backoff or jitter amplify load 4x on a struggling service.",
    category: "TRAFFIC",
    difficulty: "INTERMEDIATE",
    highlights: ["Traffic Amplification", "Fixed Retries", "Self-Inflicted DDOS"],
    color: "from-amber-500/20 to-orange-500/10 border- text-amber-400"
  },
  {
    id: "the-thundering-herd",
    name: "The Thundering Herd",
    desc: "A critical cache item expires under heavy traffic, sending a stampede of simultaneous requests to Postgres.",
    category: "CACHING",
    difficulty: "INTERMEDIATE",
    highlights: ["Cache Stampede", "Connection Pool Exhaustion", "Mutex Locks"],
    color: "from-cyan-500/20 to-teal-500/10 border- text-cyan-400"
  },
  {
    id: "split-brain",
    name: "Split Brain",
    desc: "A network partition isolates a primary database from its follower. Both promote themselves, and writes diverge.",
    category: "DATABASE",
    difficulty: "ADVANCED",
    highlights: ["CAP Theorem", "Network Partition", "Active-Active Split"],
    color: "from-pink-500/20 to-rose-500/10 border- text-rose-400"
  },
  {
    id: "graceful-degradation",
    name: "Graceful Degradation",
    desc: "EXACT same database slowdown as The Cascade, but circuit breakers enabled upstream isolate and save the app.",
    category: "RESILIENCE",
    difficulty: "BEGINNER",
    highlights: ["Circuit Breaker", "Fast-Fail Fallback", "Blast Isolation"],
    color: "from-emerald-500/20 to-teal-500/10 border- text-emerald-400"
  },
  {
    id: "the-queue-flood",
    name: "The Queue Flood",
    desc: "Consumer dies, a Kafka queue grows, producing services throttle, consumer recovers and consumes the backlog.",
    category: "QUEUEING",
    difficulty: "INTERMEDIATE",
    highlights: ["Asynchronous Buffering", "Backpressure", "Backlog Draining"],
    color: "from-purple-500/20 to-violet-500/10 border- text-purple-400"
  },
  {
    id: "the-memory-leak",
    name: "The Memory Leak",
    desc: "Service heap memory grows slowly until an OOM Killer restart triggers, causing cyclical downtime.",
    category: "INFRASTRUCTURE",
    difficulty: "INTERMEDIATE",
    highlights: ["Heap Leak", "OOM Crash", "Process Recovery"],
    color: "from-indigo-500/20 to-purple-500/10 border- text-indigo-400"
  },
  {
    id: "traffic-spike-survival",
    name: "Traffic Spike Survival",
    desc: "A massive 10x traffic spike tests system limits. Your replica layouts and pool configs decide what crashes first.",
    category: "SCALING",
    difficulty: "ADVANCED",
    highlights: ["10x Traffic Run", "Load Balancer Ratios", "Resource Bottleneck"],
    color: "from-fuchsia-500/20 to-pink-500/10 border- text-fuchsia-400"
  }
]

const FILTER_CATEGORIES = ['ALL', 'RESILIENCE', 'TRAFFIC', 'DATABASE', 'CACHING'] as const

export function Scenarios() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<typeof FILTER_CATEGORIES[number]>('ALL')

  const filtered = filter === 'ALL'
    ? SCENARIOS
    : SCENARIOS.filter(s => s.category === filter)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative select-none">
      <Navbar />

      {/* Glow effect */}
      <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg- rounded-full blur-[120px] pointer-events-none" />

      <div className="flex-1 max-w-6xl mx-auto w-full pt-24 px-6 pb-12 space-y-10 z-10">
        {/* Title */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center justify-center gap-2">
            <Compass className="text-indigo-400" size={28} />
            Scenario Library
          </h2>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            Choose a guided walkthrough to learn core engineering patterns or load the systems directly into the visual editor sandbox.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center items-center gap-2 overflow-x-auto pb-2">
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                filter === cat
                  ? 'bg-indigo-600 border-indigo-500 text-slate-100 shadow-md'
                  : 'bg- border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s) => (
            <div
              key={s.id}
              className={`group bg- hover:bg- border rounded-2xl p-5 flex flex-col justify-between space-y-5 shadow-xl hover:-translate-y-0.5 transition-all`}
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider">{s.category}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    s.difficulty === 'BEGINNER' ? 'bg- text-emerald-400 border border-' :
                    s.difficulty === 'INTERMEDIATE' ? 'bg- text-amber-400 border border-' :
                    'bg- text-rose-400 border border-'
                  }`}>
                    {s.difficulty}
                  </span>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors text-base">{s.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 h-14">{s.desc}</p>
                </div>
                {/* Tech Highlights */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {s.highlights.map((h) => (
                    <span key={h} className="text-[9px] bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-slate-400 font-mono font-medium">
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-">
                <Link
                  to={`/learn/${s.id}`}
                  className="py-2.5 px-3 bg-indigo-650 hover:bg-indigo-500 hover:shadow-indigo-950/20 text-slate-100 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Play size={12} className="fill-slate-100" />
                  Walkthrough
                </Link>
                <button
                  onClick={() => navigate(`/editor?scenario=${s.id}`)}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 border border- rounded-xl text-xs font-bold text-slate-300 hover:text-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye size={12} />
                  Sandbox
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
