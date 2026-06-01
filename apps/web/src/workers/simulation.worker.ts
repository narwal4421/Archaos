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

// ============================================================
// PRIORITY QUEUE
// ============================================================
/*
class PriorityQueue<T extends { time: number }> {
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
*/

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

  private requestsThisTick = 0
  private errorsThisTick = 0
  private latencies: number[] = []
  private prevHealth: NodeHealthState = 'HEALTHY'
  private oomRecoveryTimer = 0

  constructor(config: NodeConfig) {
    this.id = config.id
    this.config = config
    this.healthyReplicas = config.replicas ?? 1
  }

  addRequest(latencyMs: number, isError: boolean) {
    this.requestsThisTick++
    if (isError) this.errorsThisTick++
    this.latencies.push(latencyMs)
    if (this.latencies.length > 500) this.latencies.shift()
  }

  tick(tickDurationMs: number): boolean {
    this.prevHealth = this.health

    // Handle memory pressure leak
    if (this.isLeakingMemory && this.health !== 'FAILED') {
      // Memory leaks at 1.5% per second, scaled by speed
      this.memoryPercent = Math.min(100, this.memoryPercent + 1.5 * (tickDurationMs / 1000))
      if (this.memoryPercent >= 100) {
        this.kill() // OOM crash!
        this.oomRecoveryTimer = 50 // 5 seconds (50 ticks of 100ms) to restart
      }
    }

    if (this.health === 'FAILED') {
      this.memoryPercent = 0
      this.requestsPerSec = 0
      this.errorRatePercent = 100
      this.cpuPercent = 0
      if (this.oomRecoveryTimer > 0) {
        this.oomRecoveryTimer--
        if (this.oomRecoveryTimer === 0) {
          this.recover()
        }
      }
    } else {
      const ticksPerSec = 1000 / tickDurationMs
      this.requestsPerSec = this.requestsThisTick * ticksPerSec
      this.errorRatePercent = this.requestsThisTick > 0
        ? (this.errorsThisTick / this.requestsThisTick) * 100 : 0

      if (this.latencies.length > 0) {
        const sorted = [...this.latencies].sort((a, b) => a - b)
        this.p99LatencyMs = sorted[Math.floor(sorted.length * 0.99)] ?? sorted[sorted.length - 1]
      }

      const capacity = (this.config.cpuLimit ?? 100) * (this.healthyReplicas / (this.config.replicas ?? 1))
      this.cpuPercent = Math.min(100, (this.requestsPerSec / Math.max(1, capacity)) * 80 + Math.random() * 5)
    }

    this.updateHealthState()
    this.requestsThisTick = 0
    this.errorsThisTick = 0

    return this.health !== this.prevHealth
  }

  private updateHealthState() {
    if (this.health === 'FAILED') return

    if (this.cpuPercent > 95 || this.errorRatePercent > 50 ||
        (this.config.maxQueueDepth && this.queueDepth > this.config.maxQueueDepth * 0.9)) {
      this.health = 'UNHEALTHY'
    } else if (this.cpuPercent > 75 || this.errorRatePercent > 10 ||
               (this.config.maxQueueDepth && this.queueDepth > this.config.maxQueueDepth * 0.7)) {
      this.health = 'DEGRADED'
    } else if (this.health === 'RECOVERING') {
      if (this.cpuPercent < 50 && this.errorRatePercent < 2) {
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
  }

  recover() {
    this.health = 'RECOVERING'
    this.errorRatePercent = 0
    this.memoryPercent = 10
    this.healthyReplicas = this.config.replicas ?? 1
  }

  killReplica() {
    if (this.healthyReplicas > 1) { this.healthyReplicas-- }
    else { this.kill() }
  }

  serialize(): NodeRuntimeState {
    return {
      id: this.id, health: this.health,
      requestsPerSec: Math.round(this.requestsPerSec),
      errorRatePercent: Math.round(this.errorRatePercent * 10) / 10,
      p99LatencyMs: Math.round(this.p99LatencyMs),
      cpuPercent: Math.round(this.cpuPercent),
      memoryPercent: Math.round(this.memoryPercent),
      queueDepth: Math.round(this.queueDepth),
      activeConnections: this.activeConnections,
      healthyReplicas: this.healthyReplicas,
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
    }
  }
}

// ============================================================
// CIRCUIT BREAKER
// ============================================================
class CircuitBreaker {
  state: CircuitBreakerState = 'CLOSED'
  private errorCount = 0
  private totalCount = 0
  private openedAt = 0
  private prevState: CircuitBreakerState = 'CLOSED'

  private config: EdgeConfig

  constructor(config: EdgeConfig) {
    this.config = config
  }

  recordResult(isError: boolean, currentTimeSec: number): boolean {
    this.prevState = this.state
    this.totalCount++
    if (isError) this.errorCount++

    const errorRate = this.totalCount > 5
      ? (this.errorCount / this.totalCount) * 100 : 0

    if (this.state === 'CLOSED' && errorRate > (this.config.cbErrorThresholdPercent ?? 50)) {
      this.state = 'OPEN'
      this.openedAt = currentTimeSec
    }

    if (this.state === 'OPEN') {
      const halfOpenAfter = this.config.cbHalfOpenAfterSecs ?? 30
      if (currentTimeSec - this.openedAt > halfOpenAfter) {
        this.state = 'HALF_OPEN'
        this.errorCount = 0
        this.totalCount = 0
      }
    }

    if (this.state === 'HALF_OPEN' && !isError) {
      this.state = 'CLOSED'
    }

    return this.state !== this.prevState
  }

  isOpen() { return this.state === 'OPEN' }

  reset() {
    this.state = 'CLOSED'
    this.errorCount = 0
    this.totalCount = 0
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
      case 'KILL_NODE':           node?.kill(); break
      case 'CPU_SPIKE':           if (node) node.cpuPercent = 96; break
      case 'MEMORY_PRESSURE':     
        if (node) {
          node.isLeakingMemory = true
          node.memoryPercent = 30
        }
        break
      case 'KILL_ONE_REPLICA':    node?.killReplica(); break
      case 'EXHAUST_CONNECTIONS': if (node) node.activeConnections = node.config.connectionPoolSize ?? 20; break
      case 'ADD_LATENCY':         if (edge) edge.addedLatencyMs = action.value ?? 500; break
      case 'PACKET_LOSS':         if (edge) edge.packetLossPercent = action.value ?? 20; break
      case 'NETWORK_PARTITION':   if (edge) edge.isPartitioned = true; break
      case 'BANDWIDTH_THROTTLE':  break
      case 'TRAFFIC_SPIKE':
        this.trafficProfile = { ...this.trafficProfile, baseRps: this.trafficProfile.baseRps * (action.value ?? 10) }
        break
      case 'CACHE_EXPIRE':
        const dbNode = this.nodes.get(action.targetId)
        if (dbNode) {
          for (let i = 0; i < 80; i++) {
            dbNode.addRequest(Math.random() * 200 + 100, false)
          }
        }
        break
      case 'RECOVER_NODE' as any:
        if (node) {
          node.recover()
          node.isLeakingMemory = false
          node.memoryPercent = 10
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
    this.routeTraffic()

    this.nodes.forEach((node) => {
      const changed = node.tick(this.tickIntervalMs)
      if (changed) {
        this.logEvent({
          type: 'NODE_STATE_CHANGE',
          message: `${node.id} → ${node.health}`,
          severity: node.health === 'FAILED' ? 'CRITICAL' : node.health === 'UNHEALTHY' ? 'WARNING' : 'INFO',
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
      allNodeIds.slice(0, 1).forEach(id => this.propagateRequest(id, currentRps))
    } else {
      const rpsPerEntry = currentRps / entryNodes.length
      for (const entryId of entryNodes) {
        this.propagateRequest(entryId, rpsPerEntry)
      }
    }

    // Process asynchronous MESSAGE_QUEUE nodes to pull messages and send downstream
    this.nodes.forEach((node) => {
      if (node.config.type === 'MESSAGE_QUEUE') {
        const downstreamIds = this.adjacency.get(node.id) ?? []
        for (const downstreamId of downstreamIds) {
          const consumerNode = this.nodes.get(downstreamId)
          if (consumerNode && consumerNode.health !== 'FAILED') {
            const pullCapacityRps = 40 * consumerNode.healthyReplicas // 40 RPS per replica
            const pullAmount = Math.min(node.queueDepth, pullCapacityRps * (this.tickIntervalMs / 1000))
            node.queueDepth -= pullAmount
            const pullRps = pullAmount * (1000 / this.tickIntervalMs)

            // Record on the connecting edge
            const edgeConfig = this.topology.edges.find(e => e.sourceId === node.id && e.targetId === downstreamId)
            if (edgeConfig) {
              const edge = this.edges.get(edgeConfig.id)
              edge?.addRequest(10, false)
            }

            this.propagateRequest(downstreamId, pullRps, new Set([node.id]))
          }
        }
      }
    })
  }

  private propagateRequest(nodeId: string, rps: number, visited = new Set<string>()) {
    if (visited.has(nodeId) || visited.size > 10) return
    visited.add(nodeId)

    const node = this.nodes.get(nodeId)
    if (!node) return

    if (node.health === 'FAILED') {
      node.addRequest(0, true)
      return
    }

    if (node.config.type === 'MESSAGE_QUEUE') {
      // Accumulate requests in queue
      const addedRequests = rps * (this.tickIntervalMs / 1000)
      const isFull = node.queueDepth >= (node.config.maxQueueDepth ?? 1000)
      node.queueDepth = Math.min(node.config.maxQueueDepth ?? 1000, node.queueDepth + addedRequests)
      node.addRequest(10, isFull)
      return // Asynchronous queueing, do not propagate downstream synchronously!
    }

    const baseLatency = node.config.processingTimeMs ?? 50
    const loadFactor = 1 + (node.cpuPercent / 100) * 3
    const latency = baseLatency * loadFactor + Math.random() * 20
    const isError = Math.random() < (node.errorRatePercent / 100) * 0.3

    node.addRequest(latency, isError)

    const downstreamIds = this.adjacency.get(nodeId) ?? []
    for (const downstreamId of downstreamIds) {
      const edgeConfig = this.topology.edges.find(
        e => e.sourceId === nodeId && e.targetId === downstreamId
      )
      if (!edgeConfig) continue

      const edge = this.edges.get(edgeConfig.id)!
      const cb = this.circuitBreakers.get(edgeConfig.id)

      if (cb?.isOpen()) { edge.circuitBreakerState = 'OPEN'; continue }
      if (edge.isPartitioned) continue
      if (Math.random() < edge.packetLossPercent / 100) continue

      const downstreamNode = this.nodes.get(downstreamId)
      // Check if downstream queue is full
      const isQueueFull = downstreamNode?.config.type === 'MESSAGE_QUEUE' && downstreamNode.queueDepth >= (downstreamNode.config.maxQueueDepth ?? 1000)

      const edgeLatency = 5 + edge.addedLatencyMs + Math.random() * 5
      const edgeError = isQueueFull || (edgeConfig.timeoutMs ? edgeLatency > edgeConfig.timeoutMs : false)

      edge.addRequest(edgeLatency, edgeError)

      const cbChanged = cb?.recordResult(edgeError, this.currentTimeSec)
      if (cbChanged && cb) {
        edge.circuitBreakerState = cb.state
        this.logEvent({
          type: 'CIRCUIT_BREAKER',
          message: `Circuit breaker ${cb.state} on edge ${edgeConfig.sourceId}→${edgeConfig.targetId}`,
          severity: cb.state === 'OPEN' ? 'CRITICAL' : 'INFO',
          edgeId: edgeConfig.id,
        })
      }

      let retryMultiplier = 1
      if (edgeError && (edgeConfig.maxRetries ?? 0) > 0) {
        retryMultiplier = 1 + (edgeConfig.maxRetries ?? 0)
      }
      this.propagateRequest(downstreamId, rps * retryMultiplier, new Set(visited))
    }
  }

  private calculateCurrentRps(): number {
    const { baseRps, pattern, spikeMultiplier, rampTargetRps, rampDurationSecs } = this.trafficProfile
    switch (pattern) {
      case 'CONSTANT':   return baseRps
      case 'SINUSOIDAL': return baseRps * (0.5 + 0.5 * Math.sin(this.currentTimeSec * 0.1))
      case 'SPIKE':
        const spikeAt = 60
        return this.currentTimeSec > spikeAt && this.currentTimeSec < spikeAt + 30
          ? baseRps * (spikeMultiplier ?? 10) : baseRps
      case 'RAMP':
        const p = Math.min(1, this.currentTimeSec / (rampDurationSecs ?? 120))
        return baseRps + p * ((rampTargetRps ?? baseRps * 5) - baseRps)
      default: return baseRps
    }
  }

  private logEvent(event: Omit<SimEvent, 'id' | 'timeSec'>) {
    const full: SimEvent = {
      id: Math.random().toString(36).slice(2),
      timeSec: this.currentTimeSec,
      ...event,
    }
    this.eventLog.unshift(full)
    if (this.eventLog.length > 200) this.eventLog.pop()
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
      currentTimeSec: Math.round(this.currentTimeSec),
      speedMultiplier: this.speedMultiplier,
      totalRps: Math.round(allNodes.reduce((s, n) => s + n.requestsPerSec, 0)),
      totalErrorRatePercent: activeNodes.length > 0
        ? Math.round(activeNodes.reduce((s, n) => s + n.errorRatePercent, 0) / activeNodes.length * 10) / 10
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
    case 'SET_SPEED':   engine.setSpeed(payload.multiplier); break
    case 'SET_TRAFFIC': engine.setTraffic(payload.profile); break
    case 'INJECT_CHAOS': engine.injectChaos(payload.action); break
  }
}
