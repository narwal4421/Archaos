import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCanvasStore } from '../stores/canvasStore'
import { useSimulation } from '../hooks/useSimulation'
import { useSimulationStore } from '../stores/simulationStore'
import { Navbar } from '../components/layout/Navbar'
import { CanvasWrapper } from '../components/canvas/CanvasWrapper'
import { api } from '../lib/api'
import { Play, Pause, RotateCcw, HelpCircle, Award, CheckCircle2, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react'

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

// Resilience Fallback: Pre-baked scenarios matching backend seeds
const SCENARIO_FALLBACKS: Record<string, ScenarioFallback> = {
  'the-cascade': {
    name: "The Cascade",
    category: "CASCADE",
    difficulty: "BEGINNER",
    description: "A database slowdown cascades upstream through 6 services in 90 seconds, freezing the entire application.",
    nodesJson: [
      { id: "api-gateway", type: "API_GATEWAY", label: "API Gateway", x: 80, y: 250 },
      { id: "gateway-service", type: "SERVICE", label: "Gateway Service", x: 220, y: 250, replicas: 2, processingTimeMs: 30 },
      { id: "order-service", type: "SERVICE", label: "Order Service", x: 380, y: 160, replicas: 2, processingTimeMs: 40 },
      { id: "user-service", type: "SERVICE", label: "User Service", x: 380, y: 340, replicas: 2, processingTimeMs: 40 },
      { id: "inventory-service", type: "SERVICE", label: "Inventory Service", x: 540, y: 100, replicas: 1, processingTimeMs: 30 },
      { id: "payment-service", type: "SERVICE", label: "Payment Service", x: 540, y: 220, replicas: 1, processingTimeMs: 60 },
      { id: "billing-service", type: "SERVICE", label: "Billing Service", x: 700, y: 220, replicas: 1, processingTimeMs: 40 },
      { id: "postgres-db", type: "DATABASE", label: "PostgreSQL DB", x: 860, y: 220, dbType: "POSTGRESQL", connectionPoolSize: 20 }
    ],
    edgesJson: [
      { id: "edge-gw-gateway", type: "HTTP", sourceId: "api-gateway", targetId: "gateway-service" },
      { id: "edge-gateway-order", type: "HTTP", sourceId: "gateway-service", targetId: "order-service" },
      { id: "edge-gateway-user", type: "HTTP", sourceId: "gateway-service", targetId: "user-service" },
      { id: "edge-order-inventory", type: "HTTP", sourceId: "order-service", targetId: "inventory-service" },
      { id: "edge-order-payment", type: "HTTP", sourceId: "order-service", targetId: "payment-service" },
      { id: "edge-payment-billing", type: "HTTP", sourceId: "payment-service", targetId: "billing-service" },
      { id: "edge-billing-db", type: "DATABASE_CONN", sourceId: "billing-service", targetId: "postgres-db" }
    ],
    chaosScript: [
      { atSec: 15, action: { type: "ADD_LATENCY", targetId: "edge-billing-db", value: 4000 } }
    ],
    walkthroughScript: [
      { atSec: 20, pause: true, question: "We just injected 4000ms of database latency. With no circuit breakers, what happens first?", options: ["PostgreSQL DB restarts automatically", "Billing Service queries back up, causing thread exhaustion as it blocks waiting for Postgres", "The API Gateway drops all traffic immediately", "The entire layout scales up in replica count"], correct: 1 },
      { atSec: 50, pause: true, question: "The latency is cascading back through Payment, Order, and Gateway services. Why does this freeze the entire frontend?", options: ["A frontend script crashed", "A network partition occurred", "Each hop blocks its own thread pool waiting for downstream responses, propagating the delay all the way back to the gateway", "The load balancer algorithm changed to IP Hash"], correct: 2 }
    ]
  },
  'graceful-degradation': {
    name: "Graceful Degradation",
    category: "GRACEFUL_DEGRADATION",
    difficulty: "BEGINNER",
    description: "The EXACT same topology and database chaos as The Cascade, but with circuit breakers enabled. The slowdown is isolated, and the system survives.",
    nodesJson: [
      { id: "api-gateway", type: "API_GATEWAY", label: "API Gateway", x: 80, y: 250 },
      { id: "gateway-service", type: "SERVICE", label: "Gateway Service", x: 220, y: 250, replicas: 2, processingTimeMs: 30 },
      { id: "order-service", type: "SERVICE", label: "Order Service", x: 380, y: 160, replicas: 2, processingTimeMs: 40 },
      { id: "user-service", type: "SERVICE", label: "User Service", x: 380, y: 340, replicas: 2, processingTimeMs: 40 },
      { id: "inventory-service", type: "SERVICE", label: "Inventory Service", x: 540, y: 100, replicas: 1, processingTimeMs: 30 },
      { id: "payment-service", type: "SERVICE", label: "Payment Service", x: 540, y: 220, replicas: 1, processingTimeMs: 60 },
      { id: "billing-service", type: "SERVICE", label: "Billing Service", x: 700, y: 220, replicas: 1, processingTimeMs: 40 },
      { id: "postgres-db", type: "DATABASE", label: "PostgreSQL DB", x: 860, y: 220, dbType: "POSTGRESQL", connectionPoolSize: 20 }
    ],
    edgesJson: [
      { id: "edge-gw-gateway", type: "HTTP", sourceId: "api-gateway", targetId: "gateway-service" },
      { id: "edge-gateway-order", type: "HTTP", sourceId: "gateway-service", targetId: "order-service", timeoutMs: 1000, circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: "edge-gateway-user", type: "HTTP", sourceId: "gateway-service", targetId: "user-service" },
      { id: "edge-order-inventory", type: "HTTP", sourceId: "order-service", targetId: "inventory-service" },
      { id: "edge-order-payment", type: "HTTP", sourceId: "order-service", targetId: "payment-service", timeoutMs: 1000, circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: "edge-payment-billing", type: "HTTP", sourceId: "payment-service", targetId: "billing-service", timeoutMs: 1000, circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: "edge-billing-db", type: "DATABASE_CONN", sourceId: "billing-service", targetId: "postgres-db" }
    ],
    chaosScript: [
      { atSec: 15, action: { type: "ADD_LATENCY", targetId: "edge-billing-db", value: 4000 } }
    ],
    walkthroughScript: [
      { atSec: 25, pause: true, question: "This is the EXACT same failure as Scenario 1. However, circuit breakers are enabled. What happens when Billing Service gets slow?", options: ["The database automatically recovers", "The circuit breaker on edge-payment-billing trips open, failing fast and protecting the upstream Order and Gateway services", "The API Gateway restarts", "Nothing, the entire system still freezes"], correct: 1 }
    ]
  },
  'the-retry-storm': {
    name: "The Retry Storm",
    category: "RETRY_STORM",
    difficulty: "INTERMEDIATE",
    description: "Aggressive retries without backoff or jitter amplify load 4x on a struggling service, turning a minor slowdown into a complete meltdown.",
    nodesJson: [
      { id: "api-gateway", type: "API_GATEWAY", label: "API Gateway", x: 100, y: 200 },
      { id: "order-service", type: "SERVICE", label: "Order Service", x: 320, y: 200, replicas: 2, processingTimeMs: 40 },
      { id: "payment-service", type: "SERVICE", label: "Payment Service", x: 580, y: 200, replicas: 1, processingTimeMs: 100 }
    ],
    edgesJson: [
      { id: "edge-gw-order", type: "HTTP", sourceId: "api-gateway", targetId: "order-service" },
      { id: "edge-order-payment", type: "HTTP", sourceId: "order-service", targetId: "payment-service", timeoutMs: 200, maxRetries: 3, retryBackoff: "FIXED", retryDelayMs: 50 }
    ],
    chaosScript: [
      { atSec: 15, action: { type: "CPU_SPIKE", targetId: "payment-service" } }
    ],
    walkthroughScript: [
      { atSec: 25, pause: true, question: "Payment Service response times now exceed Order Service's 200ms timeout. Since maxRetries is 3, what is the effect of fixed retries?", options: ["It provides a safety net by healing errors", "It amplifies the traffic load on Payment Service by 4x, preventing it from ever recovering", "It triggers an automatic scale-out of Payment Service", "It shuts down the API Gateway to prevent overload"], correct: 1 }
    ]
  },
  'the-thundering-herd': {
    name: "The Thundering Herd",
    category: "THUNDERING_HERD",
    difficulty: "INTERMEDIATE",
    description: "A critical cache item expires, sending a stampede of concurrent requests directly to the PostgreSQL database, exhausting connection pools.",
    nodesJson: [
      { id: "api-gateway", type: "API_GATEWAY", label: "API Gateway", x: 100, y: 200 },
      { id: "catalog-service", type: "SERVICE", label: "Catalog Service", x: 320, y: 200, replicas: 3, processingTimeMs: 30 },
      { id: "redis-cache", type: "DATABASE", label: "Redis Cache", x: 550, y: 100, dbType: "REDIS" },
      { id: "postgres-db", type: "DATABASE", label: "PostgreSQL DB", x: 550, y: 300, dbType: "POSTGRESQL", connectionPoolSize: 5 }
    ],
    edgesJson: [
      { id: "edge-gw-catalog", type: "HTTP", sourceId: "api-gateway", targetId: "catalog-service" },
      { id: "edge-catalog-cache", type: "DATABASE_CONN", sourceId: "catalog-service", targetId: "redis-cache" },
      { id: "edge-catalog-db", type: "DATABASE_CONN", sourceId: "catalog-service", targetId: "postgres-db" }
    ],
    chaosScript: [
      { atSec: 15, action: { type: "CACHE_EXPIRE", targetId: "postgres-db" } }
    ],
    walkthroughScript: [
      { atSec: 20, pause: true, question: "The Redis cache key has expired under heavy traffic. Without cache-aside locking, what occurs?", options: ["Catalog Service routes queries to the load balancer", "Catalog Service falls back to an in-memory queue", "All concurrent queries hit PostgreSQL simultaneously, exhausting the database connection pool", "Postgres automatically increases its connections limit"], correct: 2 }
    ]
  },
  'split-brain': {
    name: "Split Brain",
    category: "SPLIT_BRAIN",
    difficulty: "ADVANCED",
    description: "A network partition separates primary and replica databases. Both think the other is dead and accept writes independently, causing massive data divergence.",
    nodesJson: [
      { id: "gw-east", type: "API_GATEWAY", label: "GW East", x: 100, y: 150 },
      { id: "gw-west", type: "API_GATEWAY", label: "GW West", x: 100, y: 350 },
      { id: "db-east", type: "DATABASE", label: "DB East (Leader)", x: 400, y: 150, dbType: "POSTGRESQL", replicationMode: "PRIMARY_REPLICA" },
      { id: "db-west", type: "DATABASE", label: "DB West (Follower)", x: 400, y: 350, dbType: "POSTGRESQL", replicationMode: "PRIMARY_REPLICA" }
    ],
    edgesJson: [
      { id: "edge-east-gw-db", type: "DATABASE_CONN", sourceId: "gw-east", targetId: "db-east" },
      { id: "edge-west-gw-db", type: "DATABASE_CONN", sourceId: "gw-west", targetId: "db-west" },
      { id: "db-east-db-west-sync", type: "DATABASE_CONN", sourceId: "db-east", targetId: "db-west" }
    ],
    chaosScript: [
      { atSec: 15, action: { type: "NETWORK_PARTITION", targetId: "db-east-db-west-sync" } }
    ],
    walkthroughScript: [
      { atSec: 25, pause: true, question: "The database replication link is partitioned. If both databases promote themselves to write-leaders, what is this divergence state called?", options: ["Brain Drain", "Consensus Storm", "Split Brain", "Partition Exhaustion"], correct: 2 }
    ]
  },
  'the-queue-flood': {
    name: "The Queue Flood",
    category: "QUEUE_FLOOD",
    difficulty: "INTERMEDIATE",
    description: "The consumer service dies, causing a Kafka message queue to build up. Producers experience backpressure and block. Consumer recovers, and the queue drains.",
    nodesJson: [
      { id: "api-gateway", type: "API_GATEWAY", label: "API Gateway", x: 100, y: 200 },
      { id: "producer-service", type: "SERVICE", label: "Producer Service", x: 320, y: 200, replicas: 2, processingTimeMs: 40 },
      { id: "kafka-queue", type: "MESSAGE_QUEUE", label: "Kafka Queue", x: 550, y: 200, queueType: "KAFKA", maxQueueDepth: 300 },
      { id: "consumer-service", type: "SERVICE", label: "Consumer Service", x: 780, y: 200, replicas: 1, processingTimeMs: 50 }
    ],
    edgesJson: [
      { id: "edge-gw-prod", type: "HTTP", sourceId: "api-gateway", targetId: "producer-service" },
      { id: "edge-prod-queue", type: "HTTP", sourceId: "producer-service", targetId: "kafka-queue" },
      { id: "edge-queue-cons", type: "HTTP", sourceId: "kafka-queue", targetId: "consumer-service" }
    ],
    chaosScript: [
      { atSec: 15, action: { type: "KILL_NODE", targetId: "consumer-service" } },
      { atSec: 45, action: { type: "RECOVER_NODE", targetId: "consumer-service" } }
    ],
    walkthroughScript: [
      { atSec: 25, pause: true, question: "The Consumer Service is dead, and the queue depth is rising. What happens when the message queue reaches its maxQueueDepth limit?", options: ["It routes messages to PostgreSQL", "Producers experience backpressure and fail to publish, blocking upstream requests", "The queue deletes old messages automatically", "Kafka restarts the consumer"], correct: 1 },
      { atSec: 50, pause: true, question: "Now that the Consumer Service has recovered, the backlog is draining. What is the main advantage of having a message queue buffer here?", options: ["It guarantees strict instantaneous execution", "It allows the system to absorb high ingestion spikes and process them asynchronously without losing messages", "It eliminates database reads", "It reduces CPU usage to 0%"], correct: 1 }
    ]
  },
  'the-memory-leak': {
    name: "The Memory Leak",
    category: "MEMORY_LEAK",
    difficulty: "INTERMEDIATE",
    description: "A slow memory leak in the service heap causes memory usage to climb continuously until an Out-Of-Memory (OOM) crash restarts the process, repeating the cycle.",
    nodesJson: [
      { id: "api-gateway", type: "API_GATEWAY", label: "API Gateway", x: 100, y: 200 },
      { id: "leak-service", type: "SERVICE", label: "Leak Service", x: 350, y: 200, replicas: 1, processingTimeMs: 40 },
      { id: "postgres-db", type: "DATABASE", label: "PostgreSQL DB", x: 600, y: 200, dbType: "POSTGRESQL" }
    ],
    edgesJson: [
      { id: "edge-gw-leak", type: "HTTP", sourceId: "api-gateway", targetId: "leak-service" },
      { id: "edge-leak-db", type: "DATABASE_CONN", sourceId: "leak-service", targetId: "postgres-db" }
    ],
    chaosScript: [
      { atSec: 15, action: { type: "MEMORY_PRESSURE", targetId: "leak-service" } }
    ],
    walkthroughScript: [
      { atSec: 25, pause: true, question: "Leak Service memory is climbing. What happens when it hits 100% memory usage?", options: ["The database shuts down", "The operating system's OOM Killer will crash the process, causing a temporary outage until it restarts", "It automatically doubles its physical RAM", "It switches to using static files instead"], correct: 1 }
    ]
  },
  'traffic-spike-survival': {
    name: "Traffic Spike Survival",
    category: "TRAFFIC_SPIKE",
    difficulty: "ADVANCED",
    description: "A massive 10x traffic spike tests the system limits. Your service replication and database pool sizes determine whether you survive or crash.",
    nodesJson: [
      { id: "api-gateway", type: "API_GATEWAY", label: "API Gateway", x: 100, y: 200 },
      { id: "load-balancer", type: "LOAD_BALANCER", label: "Load Balancer", x: 250, y: 200, algorithm: "ROUND_ROBIN" },
      { id: "web-service", type: "SERVICE", label: "Web Service", x: 450, y: 120, replicas: 2, processingTimeMs: 30 },
      { id: "api-service", type: "SERVICE", label: "API Service", x: 450, y: 280, replicas: 2, processingTimeMs: 50 },
      { id: "postgres-db", type: "DATABASE", label: "PostgreSQL DB", x: 680, y: 200, dbType: "POSTGRESQL", connectionPoolSize: 10 }
    ],
    edgesJson: [
      { id: "edge-gw-lb", type: "HTTP", sourceId: "api-gateway", targetId: "load-balancer" },
      { id: "edge-lb-web", type: "HTTP", sourceId: "load-balancer", targetId: "web-service" },
      { id: "edge-lb-api", type: "HTTP", sourceId: "load-balancer", targetId: "api-service" },
      { id: "edge-web-db", type: "DATABASE_CONN", sourceId: "web-service", targetId: "postgres-db" },
      { id: "edge-api-db", type: "DATABASE_CONN", sourceId: "api-service", targetId: "postgres-db" }
    ],
    chaosScript: [
      { atSec: 15, action: { type: "TRAFFIC_SPIKE", targetId: "api-gateway", value: 10 } }
    ],
    walkthroughScript: [
      { atSec: 25, pause: true, question: "A 10x traffic spike has hit the entry gateway. Under heavy load, which bottleneck is most likely to fail first if not scaled properly?", options: ["The API Gateway itself", "The Database (due to connection pool exhaustion) or Web/API Services (due to CPU limits)", "The animated canvas links", "The static files hosting"], correct: 1 }
    ]
  }
}

export function Learn() {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const navigate = useNavigate()
  const { loadTopology } = useCanvasStore()
  const { start, pause, resume, reset, injectChaos } = useSimulation()
  const currentTimeSec = useSimulationStore(s => s.simState.currentTimeSec)
  const isSimRunning = useSimulationStore(s => s.simState.status === 'RUNNING')

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
    isBuiltIn?: boolean
    playCount?: number
  }

  const [scenario, setScenario] = useState<ScenarioDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Chaos & walkthrough trigger registries to avoid duplicate executions
  const executedChaos = useRef<Set<number>>(new Set())
  const executedWalkthrough = useRef<Set<number>>(new Set())

  // Walkthrough State
  const [currentQuestion, setCurrentQuestion] = useState<WalkthroughQuestion | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null)
  const [completed, setCompleted] = useState(false)

  // Load scenario topology & configurations
  useEffect(() => {
    async function load() {
      if (!scenarioId) return
      setLoading(true)
      try {
        const data = await api.scenarios.get(scenarioId)
        // Convert json columns if necessary
        const nodes = typeof data.nodesJson === 'string' ? JSON.parse(data.nodesJson) : data.nodesJson
        const edges = typeof data.edgesJson === 'string' ? JSON.parse(data.edgesJson) : data.edgesJson
        const chaos = typeof data.chaosScript === 'string' ? JSON.parse(data.chaosScript) : data.chaosScript
        const wkt = typeof data.walkthroughScript === 'string' ? JSON.parse(data.walkthroughScript) : data.walkthroughScript

        const full = { ...data, nodesJson: nodes, edgesJson: edges, chaosScript: chaos, walkthroughScript: wkt }
        setScenario(full)
        loadTopology(nodes, edges)
      } catch {
        // Fall back gracefully to built-in scenario registry!
        const fallback = SCENARIO_FALLBACKS[scenarioId]
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

  // Reset local lists when scenario changes or resets
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

  // Handle active simulation triggers (Chaos injection & walkthough question pauses)
  useEffect(() => {
    if (!scenario || !isSimRunning) return

    // 1. Process Chaos script injection
    const chaosScript = scenario.chaosScript || []
    chaosScript.forEach((item: { atSec: number; action: ChaosAction }) => {
      if (currentTimeSec >= item.atSec && !executedChaos.current.has(item.atSec)) {
        executedChaos.current.add(item.atSec)
        injectChaos(item.action)
      }
    })

    // 2. Process walkthrough pauses / interactive questions
    const wktScript = scenario.walkthroughScript || []
    wktScript.forEach((item: WalkthroughQuestion) => {
      if (currentTimeSec >= item.atSec && !executedWalkthrough.current.has(item.atSec)) {
        executedWalkthrough.current.add(item.atSec)
        // Automatically pause simulation!
        pause()
        setCurrentQuestion(item)
        setSelectedAnswer(null)
        setAnswerCorrect(null)
      }
    })

    // Check if walkthrough is completed
    const maxTime = Math.max(...(scenario.walkthroughScript || []).map((w: WalkthroughQuestion) => w.atSec), 30)
    if (currentTimeSec >= maxTime && executedWalkthrough.current.size === (scenario.walkthroughScript || []).length) {
      setCompleted(true)
    }
  }, [currentTimeSec, scenario, isSimRunning, injectChaos, pause])

  const handleAnswerSelect = (index: number) => {
    if (answerCorrect) return
    setSelectedAnswer(index)
  }

  const handleVerifyAnswer = () => {
    if (selectedAnswer === null || !currentQuestion) return
    const correct = selectedAnswer === currentQuestion.correct
    setAnswerCorrect(correct)
  }

  const handleResume = () => {
    setCurrentQuestion(null)
    setSelectedAnswer(null)
    setAnswerCorrect(null)
    resume()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-4">
          <RotateCcw className="animate-spin text-indigo-500" size={32} />
          <p className="font-mono text-sm tracking-widest text-indigo-400">LOADING SCENARIO...</p>
        </div>
      </div>
    )
  }

  if (errorMsg || !scenario) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-4">
        <AlertCircle className="text-rose-500" size={48} />
        <h2 className="text-xl font-bold">{errorMsg || 'Scenario Loading Failed'}</h2>
        <button onClick={() => navigate('/scenarios')} className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 text-sm flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Scenarios
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-hidden text-slate-100">
      <Navbar />

      {/* Main Two-Panel Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 pt-16 h-[calc(100vh-4rem)]">
        {/* Left Side: Guided Narrative / Walkthrough Card */}
        <div className="lg:col-span-1 bg- border-r border- p-5 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <button onClick={() => navigate('/scenarios')} className="text-xs text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 mb-3">
                <ArrowLeft size={12} /> Scenarios
              </button>
              <h2 className="text-xl font-bold tracking-tight text-indigo-400">{scenario.name}</h2>
              <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                scenario.difficulty === 'BEGINNER' ? 'bg- text-emerald-400 border border-' :
                scenario.difficulty === 'INTERMEDIATE' ? 'bg- text-amber-400 border border-' :
                'bg- text-rose-400 border border-'
              }`}>
                {scenario.difficulty}
              </span>
              <p className="mt-3.5 text-xs text-slate-350 leading-relaxed">{scenario.description}</p>
            </div>

            {/* Sim Controller Panel */}
            <div className="p-4 bg- border border- rounded-xl space-y-4">
              <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                <span>SIMULATION TIME:</span>
                <span className="text-indigo-400 font-bold">{Math.round(currentTimeSec)}s</span>
              </div>
              <div className="flex items-center gap-3">
                {!isSimRunning ? (
                  <button onClick={handleStart} className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                    <Play size={14} /> Start
                  </button>
                ) : (
                  <button onClick={pause} className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                    <Pause size={14} /> Pause
                  </button>
                )}
                <button onClick={handleReset} className="p-2 bg-slate-850 hover:bg-slate-800 border border- rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Timed Question Modal/Block when simulation pauses */}
            {currentQuestion && (
              <div className="p-4 bg- border border- rounded-xl space-y-4 shadow-lg shadow-indigo-950/20 animate-fade-in">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wide">
                  <HelpCircle size={15} />
                  System Question
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">{currentQuestion.question}</p>
                <div className="space-y-2">
                  {currentQuestion.options.map((option: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(idx)}
                      disabled={answerCorrect === true}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs leading-relaxed transition-all cursor-pointer ${
                        selectedAnswer === idx
                          ? 'bg- border- text-indigo-200 font-semibold'
                          : 'bg- border- text-slate-350 hover:bg-'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {answerCorrect === null ? (
                  <button
                    onClick={handleVerifyAnswer}
                    disabled={selectedAnswer === null}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg- disabled:text-slate-500 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Submit Answer
                  </button>
                ) : answerCorrect ? (
                  <div className="space-y-3 pt-1 animate-scale-in">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 size={16} />
                      Correct Answer! Excellent analysis.
                    </div>
                    <button
                      onClick={handleResume}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Resume Simulation
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 animate-shake">
                    <div className="text-xs text-rose-400 font-semibold flex items-center gap-1.5">
                      <AlertCircle size={14} />
                      Incorrect. Think about the component bottlenecks and retry!
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Completion Success Card */}
            {completed && !currentQuestion && (
              <div className="p-4 bg- border border- rounded-xl space-y-3.5 shadow-lg animate-scale-in">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                  <Award size={16} />
                  Scenario Complete!
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Congratulations! You've successfully navigated the interactive walkthrough of <strong>{scenario.name}</strong> and analyzed how system limits fail.
                </p>
                <button
                  onClick={() => navigate('/scenarios')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  Return to Scenario Grid
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center/Right Side: Live Visual Interactive Canvas */}
        <div className="lg:col-span-3 h-full relative">
          <CanvasWrapper />
        </div>
      </div>
    </div>
  )
}
