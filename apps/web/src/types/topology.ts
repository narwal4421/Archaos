export type NodeType =
  | 'SERVICE'
  | 'DATABASE'
  | 'MESSAGE_QUEUE'
  | 'LOAD_BALANCER'
  | 'API_GATEWAY'
  | 'CDN'
  | 'EXTERNAL_SERVICE'

export type EdgeType = 'HTTP' | 'GRPC' | 'MESSAGE' | 'DATABASE_CONN'

export type LoadBalancerAlgorithm = 'ROUND_ROBIN' | 'LEAST_CONNECTIONS' | 'IP_HASH'

export type DatabaseType = 'POSTGRESQL' | 'MONGODB' | 'REDIS' | 'CASSANDRA'

export type QueueType = 'KAFKA' | 'RABBITMQ' | 'SQS'

export interface NodeConfig {
  id: string
  type: NodeType
  label: string
  x: number
  y: number
  // SERVICE
  replicas?: number
  cpuLimit?: number
  memoryLimitMB?: number
  processingTimeMs?: number
  startupTimeMs?: number
  // DATABASE
  dbType?: DatabaseType
  replicationMode?: 'PRIMARY_REPLICA' | 'CLUSTER' | 'NONE'
  connectionPoolSize?: number
  replicaLagMs?: number
  // MESSAGE_QUEUE
  queueType?: QueueType
  maxQueueDepth?: number
  messageRetentionMs?: number
  // LOAD_BALANCER
  algorithm?: LoadBalancerAlgorithm
  healthCheckIntervalMs?: number
  unhealthyThreshold?: number
  // EXTERNAL_SERVICE
  reliabilityPercent?: number
  externalLatencyMs?: number
}

export interface EdgeConfig {
  id: string
  type: EdgeType
  sourceId: string
  targetId: string
  timeoutMs?: number
  maxRetries?: number
  retryDelayMs?: number
  retryBackoff?: 'FIXED' | 'EXPONENTIAL' | 'EXPONENTIAL_JITTER'
  circuitBreakerEnabled?: boolean
  cbErrorThresholdPercent?: number
  cbWindowSecs?: number
  cbHalfOpenAfterSecs?: number
  deliveryGuarantee?: 'AT_MOST_ONCE' | 'AT_LEAST_ONCE' | 'EXACTLY_ONCE'
  weight?: number
  // Runtime chaos state (reflected from simulation worker)
  addedLatencyMs?: number
  packetLossPercent?: number
  isPartitioned?: boolean
}

export interface Topology {
  id: string
  userId?: string
  name: string
  description?: string | null
  isPublic?: boolean
  nodesJson: unknown
  edgesJson: unknown
  thumbnail?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Scenario {
  id: string
  name: string
  description: string
  category: string
  difficulty: string
  nodesJson: unknown
  edgesJson: unknown
  chaosScript: unknown
  walkthroughScript: unknown
  isBuiltIn: boolean
  playCount: number
  createdAt: string
}
