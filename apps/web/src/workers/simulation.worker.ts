import type { NodeConfig, EdgeConfig } from '../types/topology'
import type {
  NodeHealthState,
  CircuitBreakerState,
  NodeRuntimeState,
  EdgeRuntimeState,
  SimulationState,
  SimEvent,
  TrafficProfile,
  ChaosAction,
} from '../types/simulation'

export class PriorityQueue<T extends { time: number }> {
  private heap: T[] = []

  push(item: T) {
    this.heap.push(item)
    this.bubbleUp(this.heap.length - 1)
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined
    const top = this.heap[0]
    const last = this.heap.pop()!
    if (this.heap.length > 0) {
      this.heap[0] = last
      this.sinkDown(0)
    }
    return top
  }

  peek(): T | undefined { return this.heap[0] }
  get size() { return this.heap.length }

  private bubbleUp(i: number) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2)
      if (this.heap[parent].time <= this.heap[i].time) break
      ;[this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]]
      i = parent
    }
  }

  private sinkDown(i: number) {
    const n = this.heap.length
    while (true) {
      let smallest = i
      const l = 2 * i + 1, r = 2 * i + 2
      if (l < n && this.heap[l].time < this.heap[smallest].time) smallest = l
      if (r < n && this.heap[r].time < this.heap[smallest].time) smallest = r
      if (smallest === i) break
      ;[this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]]
      i = smallest
    }
  }
}

// ============================================================
// NODE STATE MACHINE
// ============================================================
class NodeSimState {
  id: string
  config: NodeConfig
  health: NodeHealthState = 'HEALTHY'
  requestsPerSec = 0
  errorRatePercent = 0
  p99LatencyMs = 0
  cpuPercent = 0
  memoryPercent = 10
  queueDepth = 0
  activeConnections = 0
  healthyReplicas: number
  isLeakingMemory = false
  droppedRps = 0
  saturationPercent = 0

  // CDN-specific
  cacheWarmedUp = false
  cacheWarmupRequests = 0
  cacheHitRate = 0

  private requestsThisTick = 0
  private errorsThisTick = 0
  private droppedThisTick = 0
  private latencies: number[] = []
  private prevHealth: NodeHealthState = 'HEALTHY'
  private oomRecoveryTimer = 0
  // Slow memory drift for alive-looking metrics
  private memDriftTarget = 0
  // LB round-robin state
  lbRoundRobinIndex = 0

  constructor(config: NodeConfig) {
    this.id = config.id
    this.config = config
    this.healthyReplicas = config.replicas ?? 1
    // Start memory at a realistic baseline (10–30%)
    this.memoryPercent = 10 + Math.random() * 20
    this.memDriftTarget = this.memoryPercent
  }

  addRequest(latencyMs: number, isError: boolean, isDropped = false) {
    this.requestsThisTick++
    if (isError) this.errorsThisTick++
    if (isDropped) this.droppedThisTick++
    else this.latencies.push(latencyMs)
    if (this.latencies.length > 500) this.latencies.shift()
  }

  /** Returns true if the node's queue is full and the request must be shed. */
  isOverloaded(): boolean {
    const maxQueue = this.config.maxQueueDepth ?? 500
    return this.queueDepth >= maxQueue
  }

  tick(tickDurationMs: number): boolean {
    this.prevHealth = this.health

    // ── Memory leak ─────────────────────────────────────────
    if (this.isLeakingMemory && this.health !== 'FAILED') {
      this.memoryPercent = Math.min(100, this.memoryPercent + 1.5 * (tickDurationMs / 1000))
      if (this.memoryPercent >= 100) {
        this.kill()
        this.oomRecoveryTimer = 50
      }
    }

    if (this.health === 'FAILED') {
      this.memoryPercent = 0
      this.requestsPerSec = 0
      this.errorRatePercent = 100
      this.cpuPercent = 0
      this.droppedRps = 0
      if (this.oomRecoveryTimer > 0) {
        this.oomRecoveryTimer--
        if (this.oomRecoveryTimer === 0) this.recover()
      }
      this.requestsThisTick = 0
      this.errorsThisTick = 0
      this.droppedThisTick = 0
      return this.health !== this.prevHealth
    }

    const ticksPerSec = 1000 / tickDurationMs
    this.requestsPerSec = this.requestsThisTick * ticksPerSec
    this.droppedRps = this.droppedThisTick * ticksPerSec
    this.errorRatePercent = this.requestsThisTick > 0
      ? (this.errorsThisTick / this.requestsThisTick) * 100 : 0

    if (this.latencies.length > 0) {
      const sorted = [...this.latencies].sort((a, b) => a - b)
      this.p99LatencyMs = sorted[Math.floor(sorted.length * 0.99)] ?? sorted[sorted.length - 1]
    }

    // ── CPU: work-based model with replica scaling ───────────
    const replicaScale = this.healthyReplicas / Math.max(1, this.config.replicas ?? 1)
    const capacity = (this.config.cpuLimit ?? 100) * replicaScale
    const rawCpu = (this.requestsPerSec / Math.max(1, capacity)) * 90
    // Small jitter so graphs look alive
    const jitter = (Math.random() - 0.5) * 4
    this.cpuPercent = Math.min(100, Math.max(0, rawCpu + jitter))

    // Saturation: how close to capacity (includes queue pressure)
    const maxQueue = this.config.maxQueueDepth ?? 500
    const queueSaturation = (this.queueDepth / Math.max(1, maxQueue)) * 100
    this.saturationPercent = Math.min(100, (this.cpuPercent * 0.7 + queueSaturation * 0.3))

    // ── Back-pressure: drain queue based on capacity ─────────
    if (this.queueDepth > 0) {
      const drainRate = capacity * (tickDurationMs / 1000) * replicaScale
      this.queueDepth = Math.max(0, this.queueDepth - drainRate)
    }

    // ── Memory: realistic drift ──────────────────────────────
    if (!this.isLeakingMemory) {
      // Memory is influenced by CPU pressure — high CPU = more heap churn
      const cpuInfluence = this.cpuPercent * 0.15
      // Drift slowly toward target
      this.memDriftTarget = Math.min(90, Math.max(5,
        10 + cpuInfluence + Math.sin(Date.now() / 30000 + parseFloat(this.id)) * 5
      ))
      // Smooth interpolation
      const drift = (this.memDriftTarget - this.memoryPercent) * 0.05
      this.memoryPercent = Math.min(95, Math.max(3, this.memoryPercent + drift + (Math.random() - 0.5) * 0.3))
    }

    // ── Active connections (DATABASE nodes) ──────────────────
    if (this.config.type === 'DATABASE') {
      const poolSize = this.config.connectionPoolSize ?? 20
      const usedFraction = Math.min(1, this.requestsPerSec / Math.max(1, capacity))
      this.activeConnections = Math.round(usedFraction * poolSize + (Math.random() - 0.5))
    }

    this.updateHealthState()
    this.requestsThisTick = 0
    this.errorsThisTick = 0
    this.droppedThisTick = 0

    return this.health !== this.prevHealth
  }

  private updateHealthState() {
    if (this.health === 'FAILED') return

    const queuePressure = this.queueDepth / (this.config.maxQueueDepth ?? 500)

    if (this.cpuPercent > 92 || this.errorRatePercent > 50 || queuePressure > 0.9) {
      this.health = 'UNHEALTHY'
    } else if (this.cpuPercent > 75 || this.errorRatePercent > 10 || queuePressure > 0.7) {
      this.health = 'DEGRADED'
    } else if (this.health === 'RECOVERING') {
      if (this.cpuPercent < 50 && this.errorRatePercent < 2 && queuePressure < 0.3) {
        this.health = 'HEALTHY'
      }
    } else {
      this.health = 'HEALTHY'
    }
  }

  kill() {
    this.health = 'FAILED'
    this.requestsPerSec = 0
    this.errorRatePercent = 100
    this.cpuPercent = 0
    this.memoryPercent = 0
    this.queueDepth = 0
    this.activeConnections = 0
  }

  recover() {
    this.health = 'RECOVERING'
    this.errorRatePercent = 0
    this.memoryPercent = 10 + Math.random() * 15
    this.healthyReplicas = this.config.replicas ?? 1
    this.isLeakingMemory = false
    this.queueDepth = 0
  }

  killReplica() {
    if (this.healthyReplicas > 1) { this.healthyReplicas-- }
    else { this.kill() }
  }

  serialize(): NodeRuntimeState {
    return {
      id: this.id,
      health: this.health,
      requestsPerSec: Math.round(this.requestsPerSec),
      errorRatePercent: Math.round(this.errorRatePercent * 10) / 10,
      p99LatencyMs: Math.round(this.p99LatencyMs),
      cpuPercent: Math.round(this.cpuPercent),
      memoryPercent: Math.round(this.memoryPercent),
      queueDepth: Math.round(this.queueDepth),
      activeConnections: this.activeConnections,
      healthyReplicas: this.healthyReplicas,
      droppedRps: Math.round(this.droppedRps),
      saturationPercent: Math.round(this.saturationPercent),
    }
  }
}

// ============================================================
// EDGE STATE
// ============================================================
class EdgeSimState {
  id: string
  config: EdgeConfig
  requestsPerSec = 0
  errorRatePercent = 0
  avgLatencyMs = 0
  circuitBreakerState: CircuitBreakerState = 'CLOSED'
  addedLatencyMs = 0
  packetLossPercent = 0
  isPartitioned = false
  bandwidthThrottlePercent = 0  // 0 = no throttle, 80 = only 20% gets through

  private requestsThisTick = 0
  private errorsThisTick = 0
  private latencies: number[] = []

  constructor(config: EdgeConfig) {
    this.id = config.id
    this.config = config
  }

  addRequest(latencyMs: number, isError: boolean) {
    this.requestsThisTick++
    if (isError) this.errorsThisTick++
    this.latencies.push(latencyMs)
    if (this.latencies.length > 200) this.latencies.shift()
  }

  /** Returns the effective RPS multiplier after throttle (0–1). */
  effectivePassRate(): number {
    if (this.bandwidthThrottlePercent <= 0) return 1
    return Math.max(0, 1 - this.bandwidthThrottlePercent / 100)
  }

  tick(tickDurationMs: number) {
    const ticksPerSec = 1000 / tickDurationMs
    this.requestsPerSec = this.requestsThisTick * ticksPerSec
    this.errorRatePercent = this.requestsThisTick > 0
      ? (this.errorsThisTick / this.requestsThisTick) * 100 : 0
    this.avgLatencyMs = this.latencies.length > 0
      ? this.latencies.reduce((s, v) => s + v, 0) / this.latencies.length : 0
    this.requestsThisTick = 0
    this.errorsThisTick = 0
  }

  reset() {
    this.addedLatencyMs = 0
    this.packetLossPercent = 0
    this.isPartitioned = false
    this.bandwidthThrottlePercent = 0
    this.circuitBreakerState = 'CLOSED'
  }

  serialize(): EdgeRuntimeState {
    return {
      id: this.id,
      requestsPerSec: Math.round(this.requestsPerSec),
      errorRatePercent: Math.round(this.errorRatePercent * 10) / 10,
      avgLatencyMs: Math.round(this.avgLatencyMs),
      circuitBreakerState: this.circuitBreakerState,
      addedLatencyMs: this.addedLatencyMs,
      packetLossPercent: this.packetLossPercent,
      isPartitioned: this.isPartitioned,
      bandwidthThrottlePercent: this.bandwidthThrottlePercent,
    }
  }
}

// ============================================================
// CIRCUIT BREAKER — Sliding time-window implementation
// ============================================================
class CircuitBreaker {
  state: CircuitBreakerState = 'CLOSED'
  private openedAt = 0
  private prevState: CircuitBreakerState = 'CLOSED'
  // Ring buffer: [timestamp, isError][]
  private readonly windowSecs: number
  private readonly errorThreshold: number
  private readonly halfOpenAfter: number
  private events: Array<{ ts: number; isError: boolean }> = []

  constructor(config: EdgeConfig) {
    this.windowSecs = config.cbWindowSecs ?? 10
    this.errorThreshold = config.cbErrorThresholdPercent ?? 50
    this.halfOpenAfter = config.cbHalfOpenAfterSecs ?? 30
  }

  recordResult(isError: boolean, currentTimeSec: number): boolean {
    this.prevState = this.state

    // Add event to ring buffer
    this.events.push({ ts: currentTimeSec, isError })
    // Prune events outside the sliding window
    const cutoff = currentTimeSec - this.windowSecs
    this.events = this.events.filter(e => e.ts >= cutoff)

    const windowTotal = this.events.length
    const windowErrors = this.events.filter(e => e.isError).length

    // Require at least 5 samples before tripping
    const errorRate = windowTotal >= 5 ? (windowErrors / windowTotal) * 100 : 0

    if (this.state === 'CLOSED' && errorRate > this.errorThreshold) {
      this.state = 'OPEN'
      this.openedAt = currentTimeSec
    }

    if (this.state === 'OPEN') {
      if (currentTimeSec - this.openedAt >= this.halfOpenAfter) {
        this.state = 'HALF_OPEN'
      }
    }

    if (this.state === 'HALF_OPEN') {
      if (!isError) {
        this.state = 'CLOSED'
        this.events = [] // reset window
      } else {
        // Failed probe → re-open
        this.state = 'OPEN'
        this.openedAt = currentTimeSec
      }
    }

    return this.state !== this.prevState
  }

  isOpen() { return this.state === 'OPEN' }

  reset() {
    this.state = 'CLOSED'
    this.events = []
  }
}

// ============================================================
// SIMULATION ENGINE
// ============================================================
class SimulationEngine {
  private nodes = new Map<string, NodeSimState>()
  private edges = new Map<string, EdgeSimState>()
  private circuitBreakers = new Map<string, CircuitBreaker>()
  private eventLog: SimEvent[] = []
  private currentTimeSec = 0
  private tickIntervalMs = 100
  private status: 'IDLE' | 'RUNNING' | 'PAUSED' = 'IDLE'
  private trafficProfile: TrafficProfile = { baseRps: 100, pattern: 'CONSTANT' }
  private topology: { nodes: NodeConfig[]; edges: EdgeConfig[] } = { nodes: [], edges: [] }
  private speedMultiplier = 1
  private intervalId: ReturnType<typeof setInterval> | null = null
  private adjacency = new Map<string, string[]>()
  private edgeLookup = new Map<string, EdgeConfig>()
  private scheduledEvents: Array<{ timeSec: number; action: ChaosAction }> = []

  scheduleEvent(timeSec: number, action: ChaosAction) {
    this.scheduledEvents.push({ timeSec, action })
  }

  initialize(topology: { nodes: NodeConfig[]; edges: EdgeConfig[] }, traffic: TrafficProfile) {
    this.topology = topology
    this.trafficProfile = traffic
    this.nodes.clear()
    this.edges.clear()
    this.circuitBreakers.clear()
    this.adjacency.clear()
    this.edgeLookup.clear()

    for (const nc of topology.nodes) {
      this.nodes.set(nc.id, new NodeSimState(nc))
    }
    for (const ec of topology.edges) {
      this.edges.set(ec.id, new EdgeSimState(ec))
      this.edgeLookup.set(ec.id, ec)
      if (ec.circuitBreakerEnabled) {
        this.circuitBreakers.set(ec.id, new CircuitBreaker(ec))
      }
      if (!this.adjacency.has(ec.sourceId)) this.adjacency.set(ec.sourceId, [])
      this.adjacency.get(ec.sourceId)!.push(ec.targetId)
    }
  }

  start() {
    this.status = 'RUNNING'
    if (this.intervalId) clearInterval(this.intervalId)
    this.intervalId = setInterval(() => this.tick(), this.tickIntervalMs / this.speedMultiplier)
  }

  pause() {
    this.status = 'PAUSED'
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null }
  }

  resume() { this.start() }

  reset() {
    this.pause()
    this.currentTimeSec = 0
    this.eventLog = []
    this.nodes.forEach(n => n.recover())
    this.edges.forEach(e => e.reset())
    this.circuitBreakers.forEach(cb => cb.reset())
    this.status = 'IDLE'
    self.postMessage({ type: 'TICK', state: this.serializeState() })
  }

  setSpeed(multiplier: number) {
    this.speedMultiplier = multiplier
    if (this.status === 'RUNNING') this.start()
  }

  setTraffic(profile: TrafficProfile) {
    this.trafficProfile = profile
  }

  injectChaos(action: ChaosAction) {
    const node = this.nodes.get(action.targetId)
    const edge = this.edges.get(action.targetId)

    switch (action.type) {
      case 'KILL_NODE':
        node?.kill()
        break
      case 'CPU_SPIKE':
        if (node) node.cpuPercent = 95 + Math.random() * 5
        break
      case 'MEMORY_PRESSURE':
        if (node) {
          node.isLeakingMemory = true
          node.memoryPercent = Math.max(node.memoryPercent, 35)
        }
        break
      case 'KILL_ONE_REPLICA':
        node?.killReplica()
        break
      case 'EXHAUST_CONNECTIONS':
        if (node) {
          const poolSize = node.config.connectionPoolSize ?? 20
          node.activeConnections = poolSize
          node.cpuPercent = Math.min(100, node.cpuPercent + 40)
        }
        break
      case 'ADD_LATENCY':
        if (edge) edge.addedLatencyMs = action.value ?? 500
        break
      case 'PACKET_LOSS':
        if (edge) edge.packetLossPercent = action.value ?? 20
        break
      case 'NETWORK_PARTITION':
        if (edge) edge.isPartitioned = true
        break
      case 'BANDWIDTH_THROTTLE':
        // Throttle: action.value = percent of bandwidth to choke (e.g., 70 = 30% gets through)
        if (edge) edge.bandwidthThrottlePercent = action.value ?? 70
        break
      case 'TRAFFIC_SPIKE':
        this.trafficProfile = {
          ...this.trafficProfile,
          baseRps: this.trafficProfile.baseRps * (action.value ?? 10),
        }
        break
      case 'CACHE_EXPIRE': {
        // Force CDN to cold cache — simulate thundering-herd miss
        const cdnNode = this.nodes.get(action.targetId)
        if (cdnNode && cdnNode.config.type === 'CDN') {
          cdnNode.cacheWarmedUp = false
          cdnNode.cacheWarmupRequests = 0
          cdnNode.cacheHitRate = 0
        }
        // Also hammer downstream DB with a burst
        const dbNode = this.nodes.get(action.targetId)
        if (dbNode && dbNode.config.type === 'DATABASE') {
          for (let i = 0; i < 100; i++) {
            dbNode.addRequest(150 + Math.random() * 200, false)
          }
        }
        break
      }
      case 'RECOVER_NODE':
        if (node) {
          node.recover()
          node.isLeakingMemory = false
        }
        break
    }

    this.logEvent({
      type: 'CHAOS_INJECTED',
      message: `⚡ ${action.type} injected on ${action.targetId}`,
      severity: 'WARNING',
      nodeId: node ? action.targetId : undefined,
      edgeId: edge ? action.targetId : undefined,
    })
  }

  private tick() {
    this.currentTimeSec += (this.tickIntervalMs / 1000) * this.speedMultiplier

    // Fire scheduled chaos events
    this.scheduledEvents
      .filter(e => e.timeSec <= this.currentTimeSec)
      .forEach(e => this.injectChaos(e.action))
    this.scheduledEvents = this.scheduledEvents.filter(e => e.timeSec > this.currentTimeSec)

    this.routeTraffic()

    this.nodes.forEach((node) => {
      const changed = node.tick(this.tickIntervalMs)
      if (changed) {
        this.logEvent({
          type: 'NODE_STATE_CHANGE',
          message: `${node.id} → ${node.health}`,
          severity: node.health === 'FAILED' ? 'CRITICAL'
            : node.health === 'UNHEALTHY' ? 'WARNING'
            : 'INFO',
          nodeId: node.id,
        })
      }
    })

    this.edges.forEach((edge, edgeId) => {
      edge.tick(this.tickIntervalMs)
      const cb = this.circuitBreakers.get(edgeId)
      if (cb) edge.circuitBreakerState = cb.state
    })

    self.postMessage({ type: 'TICK', state: this.serializeState() })
  }

  private routeTraffic() {
    const currentRps = this.calculateCurrentRps()
    const allNodeIds = Array.from(this.nodes.keys())
    const targetNodeIds = new Set(this.topology.edges.map(e => e.targetId))
    const entryNodes = allNodeIds.filter(id => !targetNodeIds.has(id))

    if (entryNodes.length === 0) {
      const first = allNodeIds[0]
      if (first) this.propagateRequest(first, currentRps, new Set())
    } else {
      const rpsPerEntry = currentRps / entryNodes.length
      for (const entryId of entryNodes) {
        this.propagateRequest(entryId, rpsPerEntry, new Set())
      }
    }

    // Async MESSAGE_QUEUE draining
    this.nodes.forEach((node) => {
      if (node.config.type === 'MESSAGE_QUEUE') {
        const downstreamIds = this.adjacency.get(node.id) ?? []
        for (const downstreamId of downstreamIds) {
          const consumer = this.nodes.get(downstreamId)
          if (consumer && consumer.health !== 'FAILED') {
            const pullCapacity = 40 * consumer.healthyReplicas
            const pullAmount = Math.min(node.queueDepth, pullCapacity * (this.tickIntervalMs / 1000))
            node.queueDepth -= pullAmount
            const pullRps = pullAmount * (1000 / this.tickIntervalMs)

            const edgeConfig = this.topology.edges.find(
              e => e.sourceId === node.id && e.targetId === downstreamId
            )
            if (edgeConfig) {
              const edgeState = this.edges.get(edgeConfig.id)
              edgeState?.addRequest(10, false)
            }

            this.propagateRequest(downstreamId, pullRps, new Set([node.id]))
          }
        }
      }
    })
  }

  private propagateRequest(nodeId: string, rps: number, visited: Set<string>) {
    if (visited.has(nodeId) || visited.size > 12) return
    visited.add(nodeId)

    const node = this.nodes.get(nodeId)
    if (!node) return

    if (node.health === 'FAILED') {
      node.addRequest(0, true)
      return
    }

    // ── CDN node — cache hit model ────────────────────────────
    if (node.config.type === 'CDN') {
      const warmupThreshold = 200 // requests before cache is warm
      node.cacheWarmupRequests += rps * (this.tickIntervalMs / 1000)
      node.cacheWarmedUp = node.cacheWarmupRequests >= warmupThreshold
      // Hit rate ramps from 0% to 85% over warmup period
      node.cacheHitRate = node.cacheWarmedUp
        ? 0.85
        : (node.cacheWarmupRequests / warmupThreshold) * 0.85

      const missRps = rps * (1 - node.cacheHitRate)
      const hitLatency = 2 + Math.random() * 3   // CDN edge: ~2–5ms
      const missLatency = 20 + Math.random() * 10
      // Record cache hit requests (low latency)
      const hitCount = Math.round((rps - missRps) * (this.tickIntervalMs / 1000))
      for (let i = 0; i < hitCount; i++) node.addRequest(hitLatency, false)

      // Only propagate cache misses downstream
      if (missRps > 0) {
        node.addRequest(missLatency, false)
        const downstreamIds = this.adjacency.get(nodeId) ?? []
        for (const downstreamId of downstreamIds) {
          this.propagateRequest(downstreamId, missRps, new Set(visited))
        }
      }
      return
    }

    // ── LOAD_BALANCER node — distribute to downstream ─────────
    if (node.config.type === 'LOAD_BALANCER') {
      node.addRequest(1 + Math.random() * 2, false)
      const downstreamIds = (this.adjacency.get(nodeId) ?? [])
        .filter(id => {
          const dn = this.nodes.get(id)
          return dn && dn.health !== 'FAILED'
        })

      if (downstreamIds.length === 0) {
        // All backends failed — LB returns error
        node.addRequest(0, true)
        return
      }

      if (node.config.algorithm === 'ROUND_ROBIN' || !node.config.algorithm) {
        // True round-robin using per-node index counter
        node.lbRoundRobinIndex = node.lbRoundRobinIndex % downstreamIds.length
        const target = downstreamIds[node.lbRoundRobinIndex]
        node.lbRoundRobinIndex++
        this.propagateRequest(target, rps, new Set(visited))
      } else if (node.config.algorithm === 'LEAST_CONNECTIONS') {
        // Route to whichever downstream has the lowest RPS (as proxy for open connections)
        const target = downstreamIds.reduce((best, id) => {
          const n = this.nodes.get(id)!
          const b = this.nodes.get(best)!
          return n.requestsPerSec < b.requestsPerSec ? id : best
        })
        this.propagateRequest(target, rps, new Set(visited))
      } else {
        // IP_HASH or default — deterministic random split
        const rpsEach = rps / downstreamIds.length
        for (const id of downstreamIds) {
          this.propagateRequest(id, rpsEach, new Set(visited))
        }
      }
      return
    }

    // ── MESSAGE_QUEUE node — accumulate ───────────────────────
    if (node.config.type === 'MESSAGE_QUEUE') {
      const maxQueue = node.config.maxQueueDepth ?? 1000
      const addedRequests = rps * (this.tickIntervalMs / 1000)
      const isFull = node.queueDepth >= maxQueue
      node.queueDepth = Math.min(maxQueue, node.queueDepth + addedRequests)
      node.addRequest(10, isFull, isFull)
      return // async — do not propagate synchronously
    }

    // ── EXTERNAL_SERVICE node — reliability model ─────────────
    if (node.config.type === 'EXTERNAL_SERVICE') {
      const reliab = (node.config.reliabilityPercent ?? 95) / 100
      const extLatency = node.config.externalLatencyMs ?? 200
      // Add realistic variance — external latency is bursty
      const latency = extLatency * (0.5 + Math.random() * 1.5)
      const isError = Math.random() > reliab
      node.addRequest(latency, isError)
      // External services don't propagate further
      return
    }

    // ── Back-pressure: request shedding ───────────────────────
    // If the node's queue is full, shed the request (HTTP 503)
    if (node.isOverloaded()) {
      node.addRequest(0, true, true)
      return
    }

    // ── Normal SERVICE / API_GATEWAY / DATABASE processing ────
    const baseLatency = node.config.processingTimeMs ?? 50
    // Latency increases under CPU pressure (queuing theory: M/M/1 model approximation)
    const utilization = Math.min(0.99, node.cpuPercent / 100)
    const queuingFactor = 1 / Math.max(0.01, 1 - utilization)  // diverges near saturation
    const latency = baseLatency * Math.min(queuingFactor, 20) + Math.random() * 10

    // Error rate: base error + degradation under load
    const baseErrorRate = node.errorRatePercent / 100
    const isError = Math.random() < baseErrorRate * 0.3

    node.addRequest(latency, isError)

    // ── Queue fill under load ─────────────────────────────────
    const capacity = (node.config.cpuLimit ?? 100) * (node.healthyReplicas / Math.max(1, node.config.replicas ?? 1))
    const excessRps = Math.max(0, rps - capacity)
    if (excessRps > 0) {
      const maxQueue = node.config.maxQueueDepth ?? 500
      node.queueDepth = Math.min(maxQueue, node.queueDepth + excessRps * (this.tickIntervalMs / 1000))
    }

    // ── Propagate downstream ───────────────────────────────────
    const downstreamIds = this.adjacency.get(nodeId) ?? []
    for (const downstreamId of downstreamIds) {
      const edgeConfig = this.topology.edges.find(
        e => e.sourceId === nodeId && e.targetId === downstreamId
      )
      if (!edgeConfig) continue

      const edgeState = this.edges.get(edgeConfig.id)!
      const cb = this.circuitBreakers.get(edgeConfig.id)

      // Circuit breaker — OPEN means fast-fail
      if (cb?.isOpen()) {
        edgeState.circuitBreakerState = 'OPEN'
        // Record the fast-fail as an error on the edge
        edgeState.addRequest(1, true)
        continue
      }

      // Network partition
      if (edgeState.isPartitioned) {
        edgeState.addRequest(0, true)
        continue
      }

      // Bandwidth throttle — reduce effective RPS
      const effectiveRps = rps * edgeState.effectivePassRate()
      if (effectiveRps <= 0) {
        edgeState.addRequest(0, true)
        continue
      }

      // Packet loss — probabilistic drop
      if (Math.random() < edgeState.packetLossPercent / 100) {
        edgeState.addRequest(0, true)
        continue
      }

      const downstreamNode = this.nodes.get(downstreamId)
      const isQueueFull = downstreamNode?.isOverloaded() ?? false

      const edgeBaseLatency = 3 + edgeState.addedLatencyMs + Math.random() * 4
      // Timeout check
      const timedOut = edgeConfig.timeoutMs ? edgeBaseLatency > edgeConfig.timeoutMs : false
      const edgeError = isQueueFull || timedOut || isError

      edgeState.addRequest(edgeBaseLatency, edgeError)

      const cbChanged = cb?.recordResult(edgeError, this.currentTimeSec)
      if (cbChanged && cb) {
        edgeState.circuitBreakerState = cb.state
        this.logEvent({
          type: 'CIRCUIT_BREAKER',
          message: `Circuit breaker ${cb.state} on ${edgeConfig.sourceId}→${edgeConfig.targetId}`,
          severity: cb.state === 'OPEN' ? 'CRITICAL' : 'INFO',
          edgeId: edgeConfig.id,
        })
      }

      // Retry amplification with backoff model
      if (edgeError && (edgeConfig.maxRetries ?? 0) > 0) {
        const retries = edgeConfig.maxRetries ?? 0
        let retryRps = effectiveRps * retries

        if (edgeConfig.retryBackoff === 'EXPONENTIAL_JITTER') {
          // Exponential backoff with ±30% jitter reduces amplification over time
          const jitterFactor = 0.7 + Math.random() * 0.6
          retryRps = effectiveRps * retries * jitterFactor * 0.5
        } else if (edgeConfig.retryBackoff === 'EXPONENTIAL') {
          retryRps = effectiveRps * retries * 0.6
        }
        // FIXED backoff: full retry amplification
        this.propagateRequest(downstreamId, retryRps, new Set(visited))
      } else {
        this.propagateRequest(downstreamId, effectiveRps, new Set(visited))
      }
    }
  }

  private calculateCurrentRps(): number {
    const { baseRps, pattern, spikeMultiplier, rampTargetRps, rampDurationSecs } = this.trafficProfile
    switch (pattern) {
      case 'CONSTANT':
        return baseRps
      case 'SINUSOIDAL':
        // Realistic: daily traffic wave (peaks and troughs)
        return baseRps * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(this.currentTimeSec * 0.05)))
      case 'SPIKE': {
        const spikeAt = 60
        const spikeDuration = 30
        if (this.currentTimeSec > spikeAt && this.currentTimeSec < spikeAt + spikeDuration) {
          // Spike ramps up and down naturally
          const t = (this.currentTimeSec - spikeAt) / spikeDuration
          const envelope = Math.sin(t * Math.PI)
          return baseRps + envelope * baseRps * ((spikeMultiplier ?? 10) - 1)
        }
        return baseRps
      }
      case 'RAMP': {
        const p = Math.min(1, this.currentTimeSec / (rampDurationSecs ?? 120))
        return baseRps + p * ((rampTargetRps ?? baseRps * 5) - baseRps)
      }
      default:
        return baseRps
    }
  }

  private logEvent(event: Omit<SimEvent, 'id' | 'timeSec'>) {
    const full: SimEvent = {
      id: Math.random().toString(36).slice(2),
      timeSec: this.currentTimeSec,
      ...event,
    }
    this.eventLog.unshift(full)
    if (this.eventLog.length > 300) this.eventLog.pop()
    self.postMessage({ type: 'EVENT', event: full })
  }

  private serializeState(): SimulationState {
    const nodeStates: Record<string, NodeRuntimeState> = {}
    this.nodes.forEach((n, id) => { nodeStates[id] = n.serialize() })
    const edgeStates: Record<string, EdgeRuntimeState> = {}
    this.edges.forEach((e, id) => { edgeStates[id] = e.serialize() })

    const allNodes = Array.from(this.nodes.values())
    const activeNodes = allNodes.filter(n => n.health !== 'FAILED')

    return {
      status: this.status,
      currentTimeSec: Math.round(this.currentTimeSec * 10) / 10,
      speedMultiplier: this.speedMultiplier,
      totalRps: Math.round(activeNodes.reduce((s, n) => s + n.requestsPerSec, 0)),
      totalErrorRatePercent: activeNodes.length > 0
        ? Math.round(
            activeNodes.reduce((s, n) => s + n.errorRatePercent, 0) / activeNodes.length * 10
          ) / 10
        : 100,
      systemP99LatencyMs: Math.max(0, ...allNodes.map(n => n.p99LatencyMs)),
      failedNodeCount: allNodes.filter(n => n.health === 'FAILED').length,
      nodes: nodeStates,
      edges: edgeStates,
      eventLog: this.eventLog,
    }
  }
}

// ============================================================
// WEB WORKER MESSAGE HANDLER
// ============================================================
const engine = new SimulationEngine()

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data
  switch (type) {
    case 'INITIALIZE':
      engine.initialize(payload.topology, payload.traffic)
      break
    case 'START':   engine.start(); break
    case 'PAUSE':   engine.pause(); break
    case 'RESUME':  engine.resume(); break
    case 'RESET':   engine.reset(); break
    case 'SET_SPEED':    engine.setSpeed(payload.multiplier); break
    case 'SET_TRAFFIC':  engine.setTraffic(payload.profile); break
    case 'INJECT_CHAOS': engine.injectChaos(payload.action); break
    case 'SCHEDULE_CHAOS':
      engine.scheduleEvent(payload.timeSec, payload.action)
      break
  }
}
