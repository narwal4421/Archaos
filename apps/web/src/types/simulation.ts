
export type NodeHealthState = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'FAILED' | 'RECOVERING'
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface NodeRuntimeState {
  id: string
  health: NodeHealthState
  requestsPerSec: number
  errorRatePercent: number
  p99LatencyMs: number
  cpuPercent: number
  memoryPercent: number
  queueDepth: number
  activeConnections: number
  healthyReplicas: number
  blastRadiusPercent?: number
  // New realism fields
  droppedRps: number
  saturationPercent: number
}

export interface EdgeRuntimeState {
  id: string
  requestsPerSec: number
  errorRatePercent: number
  avgLatencyMs: number
  circuitBreakerState: CircuitBreakerState
  addedLatencyMs: number
  packetLossPercent: number
  isPartitioned: boolean
  bandwidthThrottlePercent: number
}

export interface SimulationState {
  status: 'IDLE' | 'RUNNING' | 'PAUSED'
  currentTimeSec: number
  speedMultiplier: number
  totalRps: number
  totalErrorRatePercent: number
  systemP99LatencyMs: number
  failedNodeCount: number
  nodes: Record<string, NodeRuntimeState>
  edges: Record<string, EdgeRuntimeState>
  eventLog: SimEvent[]
}

export interface SimEvent {
  id: string
  timeSec: number
  type: 'NODE_STATE_CHANGE' | 'CIRCUIT_BREAKER' | 'CHAOS_INJECTED' | 'PREDICTION_CHECKPOINT'
  nodeId?: string
  edgeId?: string
  message: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
}

export interface TrafficProfile {
  baseRps: number
  pattern: 'CONSTANT' | 'SINUSOIDAL' | 'SPIKE' | 'RAMP'
  spikeMultiplier?: number
  rampTargetRps?: number
  rampDurationSecs?: number
}

export type ChaosType =
  | 'KILL_NODE'
  | 'CPU_SPIKE'
  | 'MEMORY_PRESSURE'
  | 'KILL_ONE_REPLICA'
  | 'SLOW_START'
  | 'EXHAUST_CONNECTIONS'
  | 'ADD_LATENCY'
  | 'PACKET_LOSS'
  | 'NETWORK_PARTITION'
  | 'BANDWIDTH_THROTTLE'
  | 'TRAFFIC_SPIKE'
  | 'CACHE_EXPIRE'
  | 'RECOVER_NODE'

export interface ChaosAction {
  type: ChaosType
  targetId: string
  value?: number
  durationSecs?: number
}

export interface BlastRadiusResult {
  rootNodeId: string
  affectedNodes: {
    nodeId: string
    depth: number
    trafficPercent: number
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    isProtectedByCircuitBreaker: boolean
  }[]
  totalAffectedTrafficPercent: number
  criticalPaths: string[][]
}
