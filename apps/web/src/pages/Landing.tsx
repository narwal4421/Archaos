import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play, Skull, Brain, ShieldAlert } from 'lucide-react'

export function Landing() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Animated Background Loop
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

    // Setup network nodes for visualization
    const nodes = [
      { id: 'gateway', label: 'API Gateway', px: 0.25, py: 0.5, size: 10, color: '#06B6D4', pulse: 0, state: 'HEALTHY' },
      { id: 'order', label: 'Order Svc', px: 0.5, py: 0.35, size: 8, color: '#10B981', pulse: 0, state: 'HEALTHY' },
      { id: 'payment', label: 'Payment Svc', px: 0.5, py: 0.65, size: 8, color: '#10B981', pulse: 0, state: 'HEALTHY' },
      { id: 'db', label: 'Postgres DB', px: 0.75, py: 0.5, size: 12, color: '#3B82F6', pulse: 0, state: 'HEALTHY' },
    ]

    const edges = [
      { source: 0, target: 1, progress: [0, 0.3, 0.65] },
      { source: 0, target: 2, progress: [0.15, 0.5, 0.8] },
      { source: 1, target: 3, progress: [0.1, 0.45, 0.75] },
      { source: 2, target: 3, progress: [0.2, 0.6, 0.9] },
    ]

    let time = 0

    const render = () => {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)

      // Add a subtle grid
      ctx.strokeStyle = '#080808'
      ctx.lineWidth = 1
      const gridSize = 40
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      time += 0.015

      // Transition the Order service to degraded/failed state periodically
      const cycle = (time * 0.25) % Math.PI
      const failureRatio = Math.sin(cycle) // 0 to 1
      const orderNode = nodes[1]
      if (failureRatio > 0.7) {
        orderNode.state = 'FAILED'
        orderNode.color = '#EF4444'
      } else if (failureRatio > 0.4) {
        orderNode.state = 'DEGRADED'
        orderNode.color = '#F59E0B'
      } else {
        orderNode.state = 'HEALTHY'
        orderNode.color = '#10B981'
      }

      // Draw Edges
      edges.forEach((edge) => {
        const nSource = nodes[edge.source]
        const nTarget = nodes[edge.target]
        const x1 = nSource.px * width
        const y1 = nSource.py * height
        const x2 = nTarget.px * width
        const y2 = nTarget.py * height

        ctx.strokeStyle = '#1A1A1A'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        // Draw flowing traffic particles
        ctx.fillStyle = nTarget.color
        edge.progress = edge.progress.map((p) => {
          let nextP = p + 0.005
          if (nextP > 1) nextP = 0
          const px = x1 + (x2 - x1) * nextP
          const py = y1 + (y2 - y1) * nextP
          ctx.beginPath()
          ctx.arc(px, py, 3, 0, Math.PI * 2)
          ctx.fill()
          return nextP
        })
      })

      // Draw Nodes
      nodes.forEach((n) => {
        const nx = n.px * width
        const ny = n.py * height

        n.pulse = Math.sin(time * 3 + (n.id === 'order' ? 3 : 0)) * 6 + 12

        // Glow ring
        ctx.shadowBlur = n.pulse
        ctx.shadowColor = n.color
        ctx.fillStyle = n.color
        ctx.beginPath()
        ctx.arc(nx, ny, n.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0 // reset

        // Label
        ctx.fillStyle = '#888888'
        ctx.font = "11px 'JetBrains Mono', monospace"
        ctx.textAlign = 'center'
        ctx.fillText(n.label, nx, ny - n.size - 10)
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="bg-black text-white font-['Inter'] min-h-screen flex flex-col relative overflow-x-hidden selection:bg-[#7C3AED]/30 selection:text-white">
      {/* BACKGROUND CANVAS */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0" />

      {/* FIXED NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 h-[60px] bg-black/80 backdrop-blur-[12px] border-b border-[#1A1A1A] z-[1000] px-6 flex items-center justify-between">
        <Link to="/" className="font-['Space_Grotesk'] text-[18px] font-bold tracking-[3px] text-white">
          ARCHAOS
        </Link>
        <div className="flex items-center gap-8 text-[14px]">
          <Link to="/editor" className="text-[#888888] hover:text-white transition-colors">
            Playground
          </Link>
          <Link to="/scenarios" className="text-[#888888] hover:text-white transition-colors">
            Scenarios
          </Link>
          <Link
            to="/auth"
            state={{ mode: 'register' }}
            className="px-5 py-1.5 text-xs bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white font-semibold rounded-lg shadow-lg hover:opacity-85 active:scale-[0.98] transition-all cursor-pointer"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="h-screen w-screen flex flex-col items-center justify-center px-6 relative z-10 select-none text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-[64px] font-bold font-['Space_Grotesk'] leading-[1.05] tracking-tight text-white max-w-3xl mx-auto">
            Watch your architecture fail. Safely.
          </h1>
          <p className="text-[20px] text-[#888888] font-light max-w-2xl mx-auto">
            Build any distributed system. Inject chaos. Watch what breaks.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/editor')}
              className="px-6 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-[#7C3AED]/20 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer text-sm"
            >
              <Play size={14} className="fill-white" />
              Start Simulating
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('scenario-preview')
                element?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-6 py-3.5 bg-transparent border border-[#222222] hover:border-[#888888] text-[#888888] hover:text-white font-semibold rounded-lg transition-all text-sm cursor-pointer"
            >
              View Scenarios
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2 — SCENARIO PREVIEW */}
      <section id="scenario-preview" className="py-20 px-6 max-w-6xl mx-auto w-full z-10 relative bg-black">
        <h2 className="text-3xl font-bold font-['Space_Grotesk'] text-center mb-4">Resilience Scenarios</h2>
        <p className="text-[#888888] text-center max-w-lg mx-auto text-sm mb-12">
          Discover pre-designed distributed bottlenecks and launch them directly.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: The Cascade */}
          <div
            onClick={() => navigate('/learn/the-cascade')}
            className="group bg-[#0A0A0A] border border-[#222222] hover:border-[#7C3AED] hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] rounded-xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between h-56"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#888888]">Resilience</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20 font-bold">
                  BEGINNER
                </span>
              </div>
              <h3 className="text-lg font-bold font-['Space_Grotesk'] group-hover:text-[#7C3AED] transition-colors">
                The Cascade
              </h3>
              <p className="text-xs text-[#888888] mt-2 leading-relaxed line-clamp-3">
                Watch downstream latency propogate upstream and freeze an unprotected thread pool.
              </p>
            </div>
            <button className="w-full mt-4 py-2 bg-transparent hover:bg-[#7C3AED] border border-[#222222] group-hover:border-[#7C3AED] text-xs text-white rounded-lg transition-all font-semibold flex items-center justify-center gap-1.5">
              <Play size={12} className="fill-white" /> Launch
            </button>
          </div>

          {/* Card 2: Retry Storm */}
          <div
            onClick={() => navigate('/learn/the-retry-storm')}
            className="group bg-[#0A0A0A] border border-[#222222] hover:border-[#7C3AED] hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] rounded-xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between h-56"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#888888]">Traffic</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/20 font-bold">
                  INTERMEDIATE
                </span>
              </div>
              <h3 className="text-lg font-bold font-['Space_Grotesk'] group-hover:text-[#7C3AED] transition-colors">
                Retry Storm
              </h3>
              <p className="text-xs text-[#888888] mt-2 leading-relaxed line-clamp-3">
                See client retries multiply load and crash a struggling microservice.
              </p>
            </div>
            <button className="w-full mt-4 py-2 bg-transparent hover:bg-[#7C3AED] border border-[#222222] group-hover:border-[#7C3AED] text-xs text-white rounded-lg transition-all font-semibold flex items-center justify-center gap-1.5">
              <Play size={12} className="fill-white" /> Launch
            </button>
          </div>

          {/* Card 3: Graceful Degradation */}
          <div
            onClick={() => navigate('/learn/graceful-degradation')}
            className="group bg-[#0A0A0A] border border-[#222222] hover:border-[#7C3AED] hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] rounded-xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between h-56"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#888888]">Resilience</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20 font-bold">
                  BEGINNER
                </span>
              </div>
              <h3 className="text-lg font-bold font-['Space_Grotesk'] group-hover:text-[#7C3AED] transition-colors">
                Graceful Degradation
              </h3>
              <p className="text-xs text-[#888888] mt-2 leading-relaxed line-clamp-3">
                Tripping circuit breakers to isolate service failures and keep key flows online.
              </p>
            </div>
            <button className="w-full mt-4 py-2 bg-transparent hover:bg-[#7C3AED] border border-[#222222] group-hover:border-[#7C3AED] text-xs text-white rounded-lg transition-all font-semibold flex items-center justify-center gap-1.5">
              <Play size={12} className="fill-white" /> Launch
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3 — FEATURE ROW */}
      <section className="py-20 px-6 max-w-6xl mx-auto w-full z-10 relative bg-black border-t border-[#1A1A1A]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          {/* Feature 1 */}
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center mx-auto md:mx-0">
              <Skull className="text-[#EF4444]" size={20} />
            </div>
            <h3 className="text-xl font-bold font-['Space_Grotesk']">🔴 Chaos Injection</h3>
            <p className="text-xs text-[#888888] leading-relaxed">
              Kill service instances, partition network paths, simulate Slow Loris API dependencies, or trigger artificial CPU leaks.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center mx-auto md:mx-0">
              <Brain className="text-[#7C3AED]" size={20} />
            </div>
            <h3 className="text-xl font-bold font-['Space_Grotesk']">🤖 AI Narration</h3>
            <p className="text-xs text-[#888888] leading-relaxed">
              A live streaming AI Copilot analyzes queue backups, rates, and patterns, predicting failure cascades in real-time.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center mx-auto md:mx-0">
              <ShieldAlert className="text-[#06B6D4]" size={20} />
            </div>
            <h3 className="text-xl font-bold font-['Space_Grotesk']">📡 Blast Radius</h3>
            <p className="text-xs text-[#888888] leading-relaxed">
              Analyze exactly what percentage of users are impacted by dependent failures using deep graph traversal logic.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1A1A1A] py-8 text-center text-xs text-[#444444] font-mono mt-auto">
        &copy; {new Date().getFullYear()} ARCHAOS. All rights reserved.
      </footer>
    </div>
  )
}
