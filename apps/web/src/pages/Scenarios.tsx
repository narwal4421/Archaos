import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Play } from 'lucide-react'

const SCENARIOS = [
  {
    id: "the-cascade",
    name: "The Cascade",
    desc: "A database slowdown cascades upstream through 6 services in 90 seconds, causing complete thread exhaustion.",
    category: "RESILIENCE",
    difficulty: "BEGINNER",
    highlights: ["Cascading Timeout", "Thread Exhaustion", "Synchronous Hops"]
  },
  {
    id: "the-retry-storm",
    name: "The Retry Storm",
    desc: "Aggressive client retries without exponential backoff or jitter amplify load 4x on a struggling service.",
    category: "TRAFFIC",
    difficulty: "INTERMEDIATE",
    highlights: ["Traffic Amplification", "Fixed Retries", "Self-Inflicted DDOS"]
  },
  {
    id: "the-thundering-herd",
    name: "The Thundering Herd",
    desc: "A critical cache item expires under heavy traffic, sending a stampede of simultaneous requests to Postgres.",
    category: "CACHING",
    difficulty: "INTERMEDIATE",
    highlights: ["Cache Stampede", "Connection Pool Exhaustion", "Mutex Locks"]
  },
  {
    id: "split-brain",
    name: "Split Brain",
    desc: "A network partition isolates a primary database from its follower. Both promote themselves, and writes diverge.",
    category: "DATABASE",
    difficulty: "ADVANCED",
    highlights: ["CAP Theorem", "Network Partition", "Active-Active Split"]
  },
  {
    id: "graceful-degradation",
    name: "Graceful Degradation",
    desc: "EXACT same database slowdown as The Cascade, but circuit breakers enabled upstream isolate and save the app.",
    category: "RESILIENCE",
    difficulty: "BEGINNER",
    highlights: ["Circuit Breaker", "Fast-Fail Fallback", "Blast Isolation"]
  },
  {
    id: "the-queue-flood",
    name: "The Queue Flood",
    desc: "Consumer dies, a Kafka queue grows, producing services throttle, consumer recovers and drains.",
    category: "TRAFFIC",
    difficulty: "INTERMEDIATE",
    highlights: ["Asynchronous Buffering", "Backpressure", "Backlog Draining"]
  },
  {
    id: "the-memory-leak",
    name: "The Memory Leak",
    desc: "Service heap memory grows slowly until an OOM Killer restart triggers, causing cyclical downtime.",
    category: "DATABASE",
    difficulty: "INTERMEDIATE",
    highlights: ["Heap Leak", "OOM Crash", "Process Recovery"]
  },
  {
    id: "traffic-spike-survival",
    name: "Traffic Spike Survival",
    desc: "A massive 10x traffic spike tests system limits. Your replica layouts and pool configs decide what crashes first.",
    category: "TRAFFIC",
    difficulty: "ADVANCED",
    highlights: ["10x Traffic Run", "Load Balancer Ratios", "Resource Bottleneck"]
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
    <div className="min-h-screen bg-black text-white flex flex-col relative select-none">
      <Navbar />

      {/* Main Page Layout Container */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full pt-[100px] px-6 pb-12">
        {/* HEADER */}
        <div className="text-left space-y-2">
          <h1 className="text-[40px] font-bold font-['Space_Grotesk'] text-white leading-none">
            Scenario Library
          </h1>
          <p className="text-[16px] font-['Inter'] text-[#888888]">
            Choose a guided walkthrough to learn core engineering patterns or load the systems directly into the visual editor sandbox.
          </p>
        </div>

        {/* FILTER BAR */}
        <div className="mt-8 flex items-center gap-3 overflow-x-auto pb-2">
          {FILTER_CATEGORIES.map((cat) => {
            const isActive = filter === cat
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`text-[13px] font-semibold font-['Inter'] px-4 py-2 rounded-[20px] border transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#7C3AED]/15 border-[#7C3AED] text-white shadow-[0_0_12px_rgba(124,58,237,0.15)]'
                    : 'bg-[#111111] border-[#222222] text-[#888888] hover:border-[#555555] hover:text-white'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* SCENARIO GRID */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s) => {
            const isBeginner = s.difficulty === 'BEGINNER'
            const isIntermediate = s.difficulty === 'INTERMEDIATE'
            const diffClass = isBeginner
              ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]'
              : isIntermediate
              ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]'
              : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]'

            return (
              <div
                key={s.id}
                className="group bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#7C3AED] hover:shadow-[0_0_24px_rgba(124,58,237,0.15)] rounded-xl p-6 transition-all duration-200 ease-out hover:-translate-y-[2px] flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Category & Difficulty Badge Row */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[#888888] font-mono font-bold tracking-wider">{s.category}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase ${diffClass}`}>
                      {s.difficulty}
                    </span>
                  </div>

                  {/* Scenario Name & Description */}
                  <div className="space-y-2">
                    <h4 className="font-['Space_Grotesk'] text-[20px] font-bold text-white group-hover:text-[#7C3AED] transition-colors">
                      {s.name}
                    </h4>
                    <p className="text-sm font-['Inter'] text-[#888888] leading-relaxed line-clamp-3 h-14 overflow-hidden">
                      {s.desc}
                    </p>
                  </div>

                  {/* Concept Highlights */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {s.highlights.map((h) => (
                      <span key={h} className="text-[11px] bg-[#111111] border border-[#222222] text-[#888888] rounded px-2 py-0.5 font-mono">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Walkthrough & Sandbox Action Row */}
                <div className="flex items-center gap-2 mt-6">
                  <Link
                    to={`/learn/${s.id}`}
                    className="py-2.5 px-3 bg-transparent border border-[#333333] hover:border-[#7C3AED] text-[#888888] hover:text-white rounded-lg text-[13px] font-bold transition-all duration-200 flex-1 flex items-center justify-center gap-1.5"
                  >
                    <Play size={11} className="fill-[#888888] group-hover:fill-white" />
                    Walkthrough
                  </Link>
                  <button
                    onClick={() => navigate(`/editor?scenario=${s.id}`)}
                    className="py-2.5 px-3 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white hover:opacity-90 rounded-lg text-[13px] font-bold transition-all duration-200 flex-1 flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-[#7C3AED]/20"
                  >
                    ⊙ Sandbox
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
