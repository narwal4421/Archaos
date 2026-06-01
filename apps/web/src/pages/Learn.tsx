import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCanvasStore } from '../stores/canvasStore'
import { useSimulation } from '../hooks/useSimulation'
import { useSimulationStore } from '../stores/simulationStore'
import { Navbar } from '../components/layout/Navbar'
import { CanvasWrapper } from '../components/canvas/CanvasWrapper'
import { api } from '../lib/api'
import {
  Play, Pause, RotateCcw, HelpCircle, Award,
  CheckCircle2, ChevronRight, AlertCircle, ArrowLeft,
} from 'lucide-react'

import type { NodeConfig, EdgeConfig } from '../types/topology'
import type { ChaosAction } from '../types/simulation'

interface WalkthroughQuestion {
  atSec: number
  pause: boolean
  question: string
  options: string[]
  correct: number
}

interface ScenarioFallback {
  name: string
  category: string
  difficulty: string
  description: string
  nodesJson: NodeConfig[]
  edgesJson: EdgeConfig[]
  chaosScript: { atSec: number; action: ChaosAction }[]
  walkthroughScript: WalkthroughQuestion[]
}

const SCENARIO_FALLBACKS: Record<string, ScenarioFallback> = {
  'the-cascade': {
    name: 'The Cascade',
    category: 'CASCADE',
    difficulty: 'BEGINNER',
    description: 'A database slowdown cascades upstream through 6 services in 90 seconds, freezing the entire application.',
    nodesJson: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 80, y: 250 },
      { id: 'gateway-service', type: 'SERVICE', label: 'Gateway Service', x: 260, y: 250, replicas: 2, processingTimeMs: 30 },
      { id: 'order-service', type: 'SERVICE', label: 'Order Service', x: 440, y: 160, replicas: 2, processingTimeMs: 40 },
      { id: 'user-service', type: 'SERVICE', label: 'User Service', x: 440, y: 340, replicas: 2, processingTimeMs: 40 },
      { id: 'payment-service', type: 'SERVICE', label: 'Payment Service', x: 630, y: 220, replicas: 1, processingTimeMs: 60 },
      { id: 'billing-service', type: 'SERVICE', label: 'Billing Service', x: 810, y: 220, replicas: 1, processingTimeMs: 40 },
      { id: 'postgres-db', type: 'DATABASE', label: 'PostgreSQL DB', x: 990, y: 220, dbType: 'POSTGRESQL', connectionPoolSize: 20 },
    ],
    edgesJson: [
      { id: 'edge-gw-gateway', type: 'HTTP', sourceId: 'api-gateway', targetId: 'gateway-service' },
      { id: 'edge-gateway-order', type: 'HTTP', sourceId: 'gateway-service', targetId: 'order-service' },
      { id: 'edge-gateway-user', type: 'HTTP', sourceId: 'gateway-service', targetId: 'user-service' },
      { id: 'edge-order-payment', type: 'HTTP', sourceId: 'order-service', targetId: 'payment-service' },
      { id: 'edge-payment-billing', type: 'HTTP', sourceId: 'payment-service', targetId: 'billing-service' },
      { id: 'edge-billing-db', type: 'DATABASE_CONN', sourceId: 'billing-service', targetId: 'postgres-db' },
    ],
    chaosScript: [{ atSec: 15, action: { type: 'ADD_LATENCY', targetId: 'edge-billing-db', value: 4000 } }],
    walkthroughScript: [
      { atSec: 20, pause: true, question: 'We just injected 4000ms of database latency. With no circuit breakers, what happens first?', options: ['PostgreSQL DB restarts automatically', 'Billing Service queries back up, causing thread exhaustion', 'The API Gateway drops all traffic immediately', 'The system scales up in replica count'], correct: 1 },
      { atSec: 50, pause: true, question: 'The latency is cascading back through Payment, Order, and Gateway services. Why does this freeze the entire frontend?', options: ['A frontend script crashed', 'A network partition occurred', 'Each hop blocks its own thread pool waiting for downstream responses', 'The load balancer algorithm changed to IP Hash'], correct: 2 },
    ],
  },
  'graceful-degradation': {
    name: 'Graceful Degradation',
    category: 'GRACEFUL_DEGRADATION',
    difficulty: 'BEGINNER',
    description: 'The EXACT same topology and database chaos as The Cascade, but with circuit breakers enabled. The slowdown is isolated, and the system survives.',
    nodesJson: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 80, y: 250 },
      { id: 'gateway-service', type: 'SERVICE', label: 'Gateway Service', x: 260, y: 250, replicas: 2, processingTimeMs: 30 },
      { id: 'order-service', type: 'SERVICE', label: 'Order Service', x: 440, y: 160, replicas: 2, processingTimeMs: 40 },
      { id: 'user-service', type: 'SERVICE', label: 'User Service', x: 440, y: 340, replicas: 2, processingTimeMs: 40 },
      { id: 'payment-service', type: 'SERVICE', label: 'Payment Service', x: 630, y: 220, replicas: 1, processingTimeMs: 60 },
      { id: 'billing-service', type: 'SERVICE', label: 'Billing Service', x: 810, y: 220, replicas: 1, processingTimeMs: 40 },
      { id: 'postgres-db', type: 'DATABASE', label: 'PostgreSQL DB', x: 990, y: 220, dbType: 'POSTGRESQL', connectionPoolSize: 20 },
    ],
    edgesJson: [
      { id: 'edge-gw-gateway', type: 'HTTP', sourceId: 'api-gateway', targetId: 'gateway-service' },
      { id: 'edge-gateway-order', type: 'HTTP', sourceId: 'gateway-service', targetId: 'order-service', timeoutMs: 1000, circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: 'edge-gateway-user', type: 'HTTP', sourceId: 'gateway-service', targetId: 'user-service' },
      { id: 'edge-order-payment', type: 'HTTP', sourceId: 'order-service', targetId: 'payment-service', timeoutMs: 1000, circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: 'edge-payment-billing', type: 'HTTP', sourceId: 'payment-service', targetId: 'billing-service', timeoutMs: 1000, circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: 'edge-billing-db', type: 'DATABASE_CONN', sourceId: 'billing-service', targetId: 'postgres-db' },
    ],
    chaosScript: [{ atSec: 15, action: { type: 'ADD_LATENCY', targetId: 'edge-billing-db', value: 4000 } }],
    walkthroughScript: [
      { atSec: 25, pause: true, question: 'This is the EXACT same failure as Scenario 1. Circuit breakers are enabled. What happens when Billing Service gets slow?', options: ['The database automatically recovers', 'The circuit breaker on edge-payment-billing trips open, failing fast and protecting the upstream services', 'The API Gateway restarts', 'Nothing, the entire system still freezes'], correct: 1 },
    ],
  },
  'the-retry-storm': {
    name: 'The Retry Storm',
    category: 'RETRY_STORM',
    difficulty: 'INTERMEDIATE',
    description: 'Aggressive retries without backoff or jitter amplify load 4x on a struggling service, turning a minor slowdown into a complete meltdown.',
    nodesJson: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 100, y: 200 },
      { id: 'order-service', type: 'SERVICE', label: 'Order Service', x: 340, y: 200, replicas: 2, processingTimeMs: 40 },
      { id: 'payment-service', type: 'SERVICE', label: 'Payment Service', x: 600, y: 200, replicas: 1, processingTimeMs: 100 },
    ],
    edgesJson: [
      { id: 'edge-gw-order', type: 'HTTP', sourceId: 'api-gateway', targetId: 'order-service' },
      { id: 'edge-order-payment', type: 'HTTP', sourceId: 'order-service', targetId: 'payment-service', timeoutMs: 200, maxRetries: 3, retryBackoff: 'FIXED', retryDelayMs: 50 },
    ],
    chaosScript: [{ atSec: 15, action: { type: 'CPU_SPIKE', targetId: 'payment-service' } }],
    walkthroughScript: [
      { atSec: 25, pause: true, question: 'Payment Service response times exceed the 200ms timeout. With maxRetries=3 and fixed backoff, what happens?', options: ['It provides safety by healing errors', 'It amplifies load on Payment Service by 4x, preventing it from ever recovering', 'It triggers automatic scale-out', 'It shuts down the API Gateway'], correct: 1 },
    ],
  },
  'the-thundering-herd': {
    name: 'The Thundering Herd',
    category: 'THUNDERING_HERD',
    difficulty: 'INTERMEDIATE',
    description: 'A critical cache item expires, sending a stampede of concurrent requests directly to the PostgreSQL database, exhausting connection pools.',
    nodesJson: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 100, y: 200 },
      { id: 'catalog-service', type: 'SERVICE', label: 'Catalog Service', x: 320, y: 200, replicas: 3, processingTimeMs: 30 },
      { id: 'redis-cache', type: 'DATABASE', label: 'Redis Cache', x: 560, y: 100, dbType: 'REDIS' },
      { id: 'postgres-db', type: 'DATABASE', label: 'PostgreSQL DB', x: 560, y: 310, dbType: 'POSTGRESQL', connectionPoolSize: 5 },
    ],
    edgesJson: [
      { id: 'edge-gw-catalog', type: 'HTTP', sourceId: 'api-gateway', targetId: 'catalog-service' },
      { id: 'edge-catalog-cache', type: 'DATABASE_CONN', sourceId: 'catalog-service', targetId: 'redis-cache' },
      { id: 'edge-catalog-db', type: 'DATABASE_CONN', sourceId: 'catalog-service', targetId: 'postgres-db' },
    ],
    chaosScript: [{ atSec: 15, action: { type: 'CACHE_EXPIRE', targetId: 'postgres-db' } }],
    walkthroughScript: [
      { atSec: 20, pause: true, question: 'The Redis cache key has expired under heavy traffic. Without cache-aside locking, what occurs?', options: ['Catalog Service routes queries to the load balancer', 'Catalog Service falls back to in-memory queue', 'All concurrent queries hit PostgreSQL simultaneously, exhausting the connection pool', 'Postgres automatically increases connection limits'], correct: 2 },
    ],
  },
  'split-brain': {
    name: 'Split Brain',
    category: 'SPLIT_BRAIN',
    difficulty: 'ADVANCED',
    description: 'A network partition separates primary and replica databases. Both think the other is dead and accept writes independently, causing data divergence.',
    nodesJson: [
      { id: 'gw-east', type: 'API_GATEWAY', label: 'GW East', x: 100, y: 150 },
      { id: 'gw-west', type: 'API_GATEWAY', label: 'GW West', x: 100, y: 350 },
      { id: 'db-east', type: 'DATABASE', label: 'DB East (Leader)', x: 420, y: 150, dbType: 'POSTGRESQL', replicationMode: 'PRIMARY_REPLICA' },
      { id: 'db-west', type: 'DATABASE', label: 'DB West (Follower)', x: 420, y: 350, dbType: 'POSTGRESQL', replicationMode: 'PRIMARY_REPLICA' },
    ],
    edgesJson: [
      { id: 'edge-east-gw-db', type: 'DATABASE_CONN', sourceId: 'gw-east', targetId: 'db-east' },
      { id: 'edge-west-gw-db', type: 'DATABASE_CONN', sourceId: 'gw-west', targetId: 'db-west' },
      { id: 'db-east-db-west-sync', type: 'DATABASE_CONN', sourceId: 'db-east', targetId: 'db-west' },
    ],
    chaosScript: [{ atSec: 15, action: { type: 'NETWORK_PARTITION', targetId: 'db-east-db-west-sync' } }],
    walkthroughScript: [
      { atSec: 25, pause: true, question: 'The database replication link is partitioned. If both databases promote themselves to write-leaders, what is this divergence state called?', options: ['Brain Drain', 'Consensus Storm', 'Split Brain', 'Partition Exhaustion'], correct: 2 },
    ],
  },
  'the-queue-flood': {
    name: 'The Queue Flood',
    category: 'QUEUE_FLOOD',
    difficulty: 'INTERMEDIATE',
    description: 'The consumer service dies, causing a Kafka message queue to build up. Producers experience backpressure and block. Consumer recovers, and the queue drains.',
    nodesJson: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 80, y: 200 },
      { id: 'producer-service', type: 'SERVICE', label: 'Producer Service', x: 300, y: 200, replicas: 2, processingTimeMs: 40 },
      { id: 'kafka-queue', type: 'MESSAGE_QUEUE', label: 'Kafka Queue', x: 540, y: 200, queueType: 'KAFKA', maxQueueDepth: 300 },
      { id: 'consumer-service', type: 'SERVICE', label: 'Consumer Service', x: 780, y: 200, replicas: 1, processingTimeMs: 50 },
    ],
    edgesJson: [
      { id: 'edge-gw-prod', type: 'HTTP', sourceId: 'api-gateway', targetId: 'producer-service' },
      { id: 'edge-prod-queue', type: 'HTTP', sourceId: 'producer-service', targetId: 'kafka-queue' },
      { id: 'edge-queue-cons', type: 'HTTP', sourceId: 'kafka-queue', targetId: 'consumer-service' },
    ],
    chaosScript: [
      { atSec: 15, action: { type: 'KILL_NODE', targetId: 'consumer-service' } },
      { atSec: 45, action: { type: 'RECOVER_NODE', targetId: 'consumer-service' } },
    ],
    walkthroughScript: [
      { atSec: 25, pause: true, question: 'The Consumer Service is dead, and the queue depth is rising. What happens when the message queue reaches its maxQueueDepth limit?', options: ['It routes messages to PostgreSQL', 'Producers experience backpressure and fail to publish, blocking upstream requests', 'The queue deletes old messages automatically', 'Kafka restarts the consumer'], correct: 1 },
      { atSec: 50, pause: true, question: 'Now that Consumer Service has recovered and the backlog is draining — what is the main advantage of the message queue buffer?', options: ['It guarantees strict instantaneous execution', 'It allows the system to absorb spikes and process them asynchronously without losing messages', 'It eliminates database reads', 'It reduces CPU usage to 0%'], correct: 1 },
    ],
  },
  'the-memory-leak': {
    name: 'The Memory Leak',
    category: 'MEMORY_LEAK',
    difficulty: 'INTERMEDIATE',
    description: 'A slow memory leak in the service heap causes memory usage to climb continuously until an Out-Of-Memory (OOM) crash restarts the process, repeating the cycle.',
    nodesJson: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 100, y: 200 },
      { id: 'leak-service', type: 'SERVICE', label: 'Leak Service', x: 360, y: 200, replicas: 1, processingTimeMs: 40 },
      { id: 'postgres-db', type: 'DATABASE', label: 'PostgreSQL DB', x: 620, y: 200, dbType: 'POSTGRESQL' },
    ],
    edgesJson: [
      { id: 'edge-gw-leak', type: 'HTTP', sourceId: 'api-gateway', targetId: 'leak-service' },
      { id: 'edge-leak-db', type: 'DATABASE_CONN', sourceId: 'leak-service', targetId: 'postgres-db' },
    ],
    chaosScript: [{ atSec: 15, action: { type: 'MEMORY_PRESSURE', targetId: 'leak-service' } }],
    walkthroughScript: [
      { atSec: 25, pause: true, question: 'Leak Service memory is climbing. What happens when it hits 100% memory usage?', options: ['The database shuts down', "The operating system's OOM Killer will crash the process, causing a temporary outage until it restarts", 'It automatically doubles its physical RAM', 'It switches to using static files instead'], correct: 1 },
    ],
  },
  'traffic-spike-survival': {
    name: 'Traffic Spike Survival',
    category: 'TRAFFIC_SPIKE',
    difficulty: 'ADVANCED',
    description: 'A massive 10x traffic spike tests the system limits. Your service replication and database pool sizes determine whether you survive or crash.',
    nodesJson: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 80, y: 200 },
      { id: 'load-balancer', type: 'LOAD_BALANCER', label: 'Load Balancer', x: 260, y: 200, algorithm: 'ROUND_ROBIN' },
      { id: 'web-service', type: 'SERVICE', label: 'Web Service', x: 460, y: 120, replicas: 2, processingTimeMs: 30 },
      { id: 'api-service', type: 'SERVICE', label: 'API Service', x: 460, y: 290, replicas: 2, processingTimeMs: 50 },
      { id: 'postgres-db', type: 'DATABASE', label: 'PostgreSQL DB', x: 700, y: 200, dbType: 'POSTGRESQL', connectionPoolSize: 10 },
    ],
    edgesJson: [
      { id: 'edge-gw-lb', type: 'HTTP', sourceId: 'api-gateway', targetId: 'load-balancer' },
      { id: 'edge-lb-web', type: 'HTTP', sourceId: 'load-balancer', targetId: 'web-service' },
      { id: 'edge-lb-api', type: 'HTTP', sourceId: 'load-balancer', targetId: 'api-service' },
      { id: 'edge-web-db', type: 'DATABASE_CONN', sourceId: 'web-service', targetId: 'postgres-db' },
      { id: 'edge-api-db', type: 'DATABASE_CONN', sourceId: 'api-service', targetId: 'postgres-db' },
    ],
    chaosScript: [{ atSec: 15, action: { type: 'TRAFFIC_SPIKE', targetId: 'api-gateway', value: 10 } }],
    walkthroughScript: [
      { atSec: 25, pause: true, question: 'A 10x traffic spike has hit the entry gateway. Under heavy load, which bottleneck is most likely to fail first if not scaled properly?', options: ['The API Gateway itself', 'The Database (connection pool exhaustion) or Web/API Services (CPU limits)', 'The animated canvas links', 'The static files hosting'], correct: 1 },
    ],
  },
}

export function Learn() {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const navigate = useNavigate()
  const { loadTopology } = useCanvasStore()
  const { start, pause, resume, reset, injectChaos } = useSimulation()
  const currentTimeSec = useSimulationStore(s => s.simState.currentTimeSec)
  const simStatus = useSimulationStore(s => s.simState.status)
  const isSimRunning = simStatus === 'RUNNING'
  const isSimPaused = simStatus === 'PAUSED'

  interface ScenarioDetail {
    id?: string
    name: string
    category: string
    difficulty: string
    description: string
    nodesJson: unknown
    edgesJson: unknown
    chaosScript: { atSec: number; action: ChaosAction }[]
    walkthroughScript: WalkthroughQuestion[]
  }

  const [scenario, setScenario] = useState<ScenarioDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const executedChaos = useRef<Set<number>>(new Set())
  const executedWalkthrough = useRef<Set<number>>(new Set())

  const [currentQuestion, setCurrentQuestion] = useState<WalkthroughQuestion | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    async function load() {
      if (!scenarioId) return
      setLoading(true)
      try {
        const data = await api.scenarios.get(scenarioId)
        const nodes = typeof data.nodesJson === 'string' ? JSON.parse(data.nodesJson) : data.nodesJson
        const edges = typeof data.edgesJson === 'string' ? JSON.parse(data.edgesJson) : data.edgesJson
        const chaos = typeof data.chaosScript === 'string' ? JSON.parse(data.chaosScript) : data.chaosScript
        const wkt = typeof data.walkthroughScript === 'string' ? JSON.parse(data.walkthroughScript) : data.walkthroughScript
        setScenario({ ...data, nodesJson: nodes, edgesJson: edges, chaosScript: chaos, walkthroughScript: wkt })
        loadTopology(nodes, edges)
      } catch {
        const fallback = SCENARIO_FALLBACKS[scenarioId!]
        if (fallback) {
          setScenario(fallback)
          loadTopology(fallback.nodesJson, fallback.edgesJson)
        } else {
          setErrorMsg('Scenario not found')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [scenarioId, loadTopology])

  const handleReset = () => {
    reset()
    executedChaos.current.clear()
    executedWalkthrough.current.clear()
    setCurrentQuestion(null)
    setSelectedAnswer(null)
    setAnswerCorrect(null)
    setCompleted(false)
  }

  const handleStart = () => {
    handleReset()
    start({ baseRps: 60, pattern: 'CONSTANT' })
  }

  useEffect(() => {
    if (!scenario || !isSimRunning) return
    const chaosScript = scenario.chaosScript || []
    chaosScript.forEach((item) => {
      if (currentTimeSec >= item.atSec && !executedChaos.current.has(item.atSec)) {
        executedChaos.current.add(item.atSec)
        injectChaos(item.action)
      }
    })
    const wktScript = scenario.walkthroughScript || []
    wktScript.forEach((item: WalkthroughQuestion) => {
      if (currentTimeSec >= item.atSec && !executedWalkthrough.current.has(item.atSec)) {
        executedWalkthrough.current.add(item.atSec)
        pause()
        setCurrentQuestion(item)
        setSelectedAnswer(null)
        setAnswerCorrect(null)
      }
    })
    const maxTime = Math.max(...(scenario.walkthroughScript || []).map((w) => w.atSec), 30)
    if (currentTimeSec >= maxTime && executedWalkthrough.current.size === (scenario.walkthroughScript || []).length) {
      setCompleted(true)
    }
  }, [currentTimeSec, scenario, isSimRunning, injectChaos, pause])

  const handleResume = () => {
    setCurrentQuestion(null)
    setSelectedAnswer(null)
    setAnswerCorrect(null)
    resume()
  }

  const diffBadgeStyle = (difficulty: string) => {
    if (difficulty === 'BEGINNER') return 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
    if (difficulty === 'INTERMEDIATE') return 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
    return 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = Math.floor(sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <RotateCcw className="animate-spin text-[#7C3AED]" size={32} />
          <p className="font-['JetBrains_Mono',monospace] text-sm tracking-widest text-[#888888]">
            LOADING SCENARIO...
          </p>
        </div>
      </div>
    )
  }

  if (errorMsg || !scenario) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <AlertCircle className="text-[#EF4444]" size={48} />
        <h2 className="text-xl font-bold font-['Space_Grotesk']">{errorMsg || 'Scenario Loading Failed'}</h2>
        <button
          onClick={() => navigate('/scenarios')}
          className="px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] rounded-lg hover:opacity-85 text-sm flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Scenarios
        </button>
      </div>
    )
  }

  return (
    <div
      style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#000000' }}
      className="text-white font-['Inter']"
    >
      <Navbar />

      {/* ── TWO-PANEL LAYOUT ── */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          height: 'calc(100vh - 60px)',
          marginTop: 60,
          overflow: 'hidden',
        }}
      >
        {/* ══ LEFT INFO PANEL (380px fixed) ══ */}
        <div
          style={{
            width: 380,
            flexShrink: 0,
            background: '#0A0A0A',
            borderRight: '1px solid #1A1A1A',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Back Link */}
          <button
            onClick={() => navigate('/scenarios')}
            className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-white transition-colors cursor-pointer w-fit"
          >
            <ArrowLeft size={12} /> Back to Scenarios
          </button>

          {/* ─ Scenario Header ─ */}
          {/* ONE h1 ONLY — fixes the doubled title bug */}
          <div>
            <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white leading-tight">
              {scenario.name}
            </h1>
            <span className={`inline-block mt-2 px-2 py-0.5 rounded border text-[9px] font-bold tracking-wide uppercase ${diffBadgeStyle(scenario.difficulty)}`}>
              {scenario.difficulty}
            </span>
            <p className="mt-3 text-sm text-[#888888] leading-relaxed">
              {scenario.description}
            </p>
          </div>

          {/* ─ Simulation Controls ─ */}
          <div className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-4 space-y-4">
            <div className="flex justify-between items-center text-xs font-['JetBrains_Mono',monospace] text-[#888888]">
              <span>SIMULATION TIME</span>
              <span className="text-[#7C3AED] font-bold">{formatTime(currentTimeSec)}</span>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (currentTimeSec / 90) * 100)}%` }}
              />
            </div>

            <div className="flex items-center gap-2">
              {simStatus === 'IDLE' && (
                <button
                  onClick={handleStart}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-85 transition-all active:scale-[0.98]"
                >
                  <Play size={14} className="fill-white" /> Start
                </button>
              )}
              {isSimRunning && (
                <button
                  onClick={pause}
                  className="flex-1 py-2 px-3 bg-[#1A1A1A] border border-[#333333] hover:border-[#888888] text-[#888888] hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Pause size={14} /> Pause
                </button>
              )}
              {isSimPaused && !currentQuestion && (
                <button
                  onClick={handleResume}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-85 transition-all active:scale-[0.98]"
                >
                  <Play size={14} className="fill-white" /> Resume
                </button>
              )}
              <button
                onClick={handleReset}
                className="py-2 px-3 bg-[#1A1A1A] border border-[#333333] hover:border-[#888888] text-[#888888] hover:text-white rounded-lg cursor-pointer transition-all"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* ─ Prediction Checkpoint / Walkthrough Question ─ */}
          {currentQuestion && (
            <div className="bg-[#0A0A0A] border border-[#7C3AED]/40 rounded-xl p-4 space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-[#7C3AED] font-semibold text-xs uppercase tracking-wide">
                <HelpCircle size={14} />
                Prediction Checkpoint
              </div>
              <p className="text-sm text-white leading-relaxed font-medium">{currentQuestion.question}</p>
              <div className="space-y-2">
                {currentQuestion.options.map((option: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (answerCorrect === true) return
                      setSelectedAnswer(idx)
                    }}
                    disabled={answerCorrect === true}
                    className={`w-full text-left p-3 rounded-lg border text-xs leading-relaxed transition-all cursor-pointer ${
                      selectedAnswer === idx
                        ? 'bg-[#7C3AED]/15 border-[#7C3AED] text-white font-semibold'
                        : 'bg-[#111111] border-[#222222] text-[#888888] hover:bg-[#1A1A1A] hover:text-white'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {answerCorrect === null && (
                <button
                  onClick={() => {
                    if (selectedAnswer === null || !currentQuestion) return
                    setAnswerCorrect(selectedAnswer === currentQuestion.correct)
                  }}
                  disabled={selectedAnswer === null}
                  className="w-full py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] disabled:opacity-40 rounded-lg text-xs font-bold cursor-pointer hover:opacity-85 transition-all active:scale-[0.98]"
                >
                  Submit Answer
                </button>
              )}
              {answerCorrect === true && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#10B981]">
                    <CheckCircle2 size={16} /> Correct! Excellent analysis.
                  </div>
                  <button
                    onClick={handleResume}
                    className="w-full py-2.5 bg-[#10B981] hover:bg-[#059669] rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Continue Simulation <ChevronRight size={14} />
                  </button>
                </div>
              )}
              {answerCorrect === false && (
                <div className="text-xs text-[#EF4444] font-semibold flex items-center gap-1.5 animate-fade-in">
                  <AlertCircle size={14} /> Incorrect — think about the bottleneck and retry.
                </div>
              )}
            </div>
          )}

          {/* ─ Completion Card ─ */}
          {completed && !currentQuestion && (
            <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-4 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-[#10B981] font-bold text-xs uppercase tracking-wide">
                <Award size={16} /> Scenario Complete!
              </div>
              <p className="text-xs text-[#888888] leading-relaxed">
                You've successfully navigated <strong className="text-white">{scenario.name}</strong> and analyzed how system limits fail.
              </p>
              <button
                onClick={() => navigate('/scenarios')}
                className="w-full py-2 bg-[#10B981] hover:bg-[#059669] rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                Return to Scenario Grid
              </button>
            </div>
          )}
        </div>

        {/* ══ CANVAS (flex: 1) ══ */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#050505' }}>
          <CanvasWrapper />
        </div>
      </div>
    </div>
  )
}
