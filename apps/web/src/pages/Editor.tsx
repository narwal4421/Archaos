import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCanvasStore } from '../stores/canvasStore'
import { useSimulation } from '../hooks/useSimulation'
import { Navbar } from '../components/layout/Navbar'
import { CanvasWrapper } from '../components/canvas/CanvasWrapper'
import { NodePalette } from '../components/canvas/NodePalette'
import { SimControls } from '../components/simulation/SimControls'
import { MetricsPanel } from '../components/simulation/MetricsPanel'
import { NarrationPanel } from '../components/simulation/NarrationPanel'
import { EventTimeline } from '../components/simulation/EventTimeline'
import { NodeConfigPanel } from '../components/canvas/NodeConfigPanel'
import { EdgeConfigPanel } from '../components/canvas/EdgeConfigPanel'
import { api } from '../lib/api'
import { Layout, Info, Cpu } from 'lucide-react'

import type { NodeConfig, EdgeConfig } from '../types/topology'

// Local scenario blueprints fallback
const SCENARIO_BLUEPRINTS: Record<string, { nodes: NodeConfig[]; edges: EdgeConfig[] }> = {
  'the-cascade': {
    nodes: [
      { id: "api-gateway", type: "API_GATEWAY", label: "API Gateway", x: 80, y: 250 },
      { id: "gateway-service", type: "SERVICE", label: "Gateway Service", x: 220, y: 250, replicas: 2, processingTimeMs: 30 },
      { id: "order-service", type: "SERVICE", label: "Order Service", x: 380, y: 160, replicas: 2, processingTimeMs: 40 },
      { id: "user-service", type: "SERVICE", label: "User Service", x: 380, y: 340, replicas: 2, processingTimeMs: 40 },
      { id: "inventory-service", type: "SERVICE", label: "Inventory Service", x: 540, y: 100, replicas: 1, processingTimeMs: 30 },
      { id: "payment-service", type: "SERVICE", label: "Payment Service", x: 540, y: 220, replicas: 1, processingTimeMs: 60 },
      { id: "billing-service", type: "SERVICE", label: "Billing Service", x: 700, y: 220, replicas: 1, processingTimeMs: 40 },
      { id: "postgres-db", type: "DATABASE", label: "PostgreSQL DB", x: 860, y: 220, dbType: "POSTGRESQL", connectionPoolSize: 20 }
    ],
    edges: [
      { id: "edge-gw-gateway", type: "HTTP", sourceId: "api-gateway", targetId: "gateway-service" },
      { id: "edge-gateway-order", type: "HTTP", sourceId: "gateway-service", targetId: "order-service" },
      { id: "edge-gateway-user", type: "HTTP", sourceId: "gateway-service", targetId: "user-service" },
      { id: "edge-order-inventory", type: "HTTP", sourceId: "order-service", targetId: "inventory-service" },
      { id: "edge-order-payment", type: "HTTP", sourceId: "order-service", targetId: "payment-service" },
      { id: "edge-payment-billing", type: "HTTP", sourceId: "payment-service", targetId: "billing-service" },
      { id: "edge-billing-db", type: "DATABASE_CONN", sourceId: "billing-service", targetId: "postgres-db" }
    ]
  },
  'graceful-degradation': {
    nodes: [
      { id: "api-gateway", type: "API_GATEWAY", label: "API Gateway", x: 80, y: 250 },
      { id: "gateway-service", type: "SERVICE", label: "Gateway Service", x: 220, y: 250, replicas: 2, processingTimeMs: 30 },
      { id: "order-service", type: "SERVICE", label: "Order Service", x: 380, y: 160, replicas: 2, processingTimeMs: 40 },
      { id: "user-service", type: "SERVICE", label: "User Service", x: 380, y: 340, replicas: 2, processingTimeMs: 40 },
      { id: "inventory-service", type: "SERVICE", label: "Inventory Service", x: 540, y: 100, replicas: 1, processingTimeMs: 30 },
      { id: "payment-service", type: "SERVICE", label: "Payment Service", x: 540, y: 220, replicas: 1, processingTimeMs: 60 },
      { id: "billing-service", type: "SERVICE", label: "Billing Service", x: 700, y: 220, replicas: 1, processingTimeMs: 40 },
      { id: "postgres-db", type: "DATABASE", label: "PostgreSQL DB", x: 860, y: 220, dbType: "POSTGRESQL", connectionPoolSize: 20 }
    ],
    edges: [
      { id: "edge-gw-gateway", type: "HTTP", sourceId: "api-gateway", targetId: "gateway-service" },
      { id: "edge-gateway-order", type: "HTTP", sourceId: "gateway-service", targetId: "order-service", timeoutMs: 1000, circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: "edge-gateway-user", type: "HTTP", sourceId: "gateway-service", targetId: "user-service" },
      { id: "edge-order-inventory", type: "HTTP", sourceId: "order-service", targetId: "inventory-service" },
      { id: "edge-order-payment", type: "HTTP", sourceId: "order-service", targetId: "payment-service", timeoutMs: 1000, circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: "edge-payment-billing", type: "HTTP", sourceId: "payment-service", targetId: "billing-service", timeoutMs: 1000, circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: "edge-billing-db", type: "DATABASE_CONN", sourceId: "billing-service", targetId: "postgres-db" }
    ]
  },
  'the-retry-storm': {
    nodes: [
      { id: "api-gateway", type: "API_GATEWAY", label: "API Gateway", x: 100, y: 200 },
      { id: "order-service", type: "SERVICE", label: "Order Service", x: 320, y: 200, replicas: 2, processingTimeMs: 40 },
      { id: "payment-service", type: "SERVICE", label: "Payment Service", x: 580, y: 200, replicas: 1, processingTimeMs: 100 }
    ],
    edges: [
      { id: "edge-gw-order", type: "HTTP", sourceId: "api-gateway", targetId: "order-service" },
      { id: "edge-order-payment", type: "HTTP", sourceId: "order-service", targetId: "payment-service", timeoutMs: 200, maxRetries: 3, retryBackoff: "FIXED", retryDelayMs: 50 }
    ]
  },
  'the-thundering-herd': {
    nodes: [
      { id: "api-gateway", type: "API_GATEWAY", label: "API Gateway", x: 100, y: 200 },
      { id: "catalog-service", type: "SERVICE", label: "Catalog Service", x: 320, y: 200, replicas: 3, processingTimeMs: 30 },
      { id: "redis-cache", type: "DATABASE", label: "Redis Cache", x: 550, y: 100, dbType: "REDIS" },
      { id: "postgres-db", type: "DATABASE", label: "PostgreSQL DB", x: 550, y: 300, dbType: "POSTGRESQL", connectionPoolSize: 5 }
    ],
    edges: [
      { id: "edge-gw-catalog", type: "HTTP", sourceId: "api-gateway", targetId: "catalog-service" },
      { id: "edge-catalog-cache", type: "DATABASE_CONN", sourceId: "catalog-service", targetId: "redis-cache" },
      { id: "edge-catalog-db", type: "DATABASE_CONN", sourceId: "catalog-service", targetId: "postgres-db" }
    ]
  },
  'split-brain': {
    nodes: [
      { id: "gw-east", type: "API_GATEWAY", label: "GW East", x: 100, y: 150 },
      { id: "gw-west", type: "API_GATEWAY", label: "GW West", x: 100, y: 350 },
      { id: "db-east", type: "DATABASE", label: "DB East (Leader)", x: 400, y: 150, dbType: "POSTGRESQL", replicationMode: "PRIMARY_REPLICA" },
      { id: "db-west", type: "DATABASE", label: "DB West (Follower)", x: 400, y: 350, dbType: "POSTGRESQL", replicationMode: "PRIMARY_REPLICA" }
    ],
    edges: [
      { id: "edge-east-gw-db", type: "DATABASE_CONN", sourceId: "gw-east", targetId: "db-east" },
      { id: "edge-west-gw-db", type: "DATABASE_CONN", sourceId: "gw-west", targetId: "db-west" },
      { id: "db-east-db-west-sync", type: "DATABASE_CONN", sourceId: "db-east", targetId: "db-west" }
    ]
  },
  'the-queue-flood': {
    nodes: [
      { id: "api-gateway", type: "API_GATEWAY", label: "API Gateway", x: 100, y: 200 },
      { id: "producer-service", type: "SERVICE", label: "Producer Service", x: 320, y: 200, replicas: 2, processingTimeMs: 40 },
      { id: "kafka-queue", type: "MESSAGE_QUEUE", label: "Kafka Queue", x: 550, y: 200, queueType: "KAFKA", maxQueueDepth: 300 },
      { id: "consumer-service", type: "SERVICE", label: "Consumer Service", x: 780, y: 200, replicas: 1, processingTimeMs: 50 }
    ],
    edges: [
      { id: "edge-gw-prod", type: "HTTP", sourceId: "api-gateway", targetId: "producer-service" },
      { id: "edge-prod-queue", type: "HTTP", sourceId: "producer-service", targetId: "kafka-queue" },
      { id: "edge-queue-cons", type: "HTTP", sourceId: "kafka-queue", targetId: "consumer-service" }
    ]
  },
  'the-memory-leak': {
    nodes: [
      { id: "api-gateway", type: "API_GATEWAY", label: "API Gateway", x: 100, y: 200 },
      { id: "leak-service", type: "SERVICE", label: "Leak Service", x: 350, y: 200, replicas: 1, processingTimeMs: 40 },
      { id: "postgres-db", type: "DATABASE", label: "PostgreSQL DB", x: 600, y: 200, dbType: "POSTGRESQL" }
    ],
    edges: [
      { id: "edge-gw-leak", type: "HTTP", sourceId: "api-gateway", targetId: "leak-service" },
      { id: "edge-leak-db", type: "DATABASE_CONN", sourceId: "leak-service", targetId: "postgres-db" }
    ]
  },
  'traffic-spike-survival': {
    nodes: [
      { id: "api-gateway", type: "API_GATEWAY", label: "API Gateway", x: 100, y: 200 },
      { id: "load-balancer", type: "LOAD_BALANCER", label: "Load Balancer", x: 250, y: 200, algorithm: "ROUND_ROBIN" },
      { id: "web-service", type: "SERVICE", label: "Web Service", x: 450, y: 120, replicas: 2, processingTimeMs: 30 },
      { id: "api-service", type: "SERVICE", label: "API Service", x: 450, y: 280, replicas: 2, processingTimeMs: 50 },
      { id: "postgres-db", type: "DATABASE", label: "PostgreSQL DB", x: 680, y: 200, dbType: "POSTGRESQL", connectionPoolSize: 10 }
    ],
    edges: [
      { id: "edge-gw-lb", type: "HTTP", sourceId: "api-gateway", targetId: "load-balancer" },
      { id: "edge-lb-web", type: "HTTP", sourceId: "load-balancer", targetId: "web-service" },
      { id: "edge-lb-api", type: "HTTP", sourceId: "load-balancer", targetId: "api-service" },
      { id: "edge-web-db", type: "DATABASE_CONN", sourceId: "web-service", targetId: "postgres-db" },
      { id: "edge-api-db", type: "DATABASE_CONN", sourceId: "api-service", targetId: "postgres-db" }
    ]
  }
}

export function Editor() {
  const [searchParams] = useSearchParams()
  const { loadTopology, reset: resetCanvas } = useCanvasStore()
  const { reset: resetSim } = useSimulation()

  const scenarioParam = searchParams.get('scenario')
  const topologyIdParam = searchParams.get('id')

  // Auto-load scenario topologies from query parameters
  useEffect(() => {
    async function load() {
      if (scenarioParam) {
        // Clear canvas
        resetCanvas()
        resetSim()

        try {
          const data = await api.scenarios.get(scenarioParam)
          const nodes = typeof data.nodesJson === 'string' ? JSON.parse(data.nodesJson) : data.nodesJson
          const edges = typeof data.edgesJson === 'string' ? JSON.parse(data.edgesJson) : data.edgesJson
          loadTopology(nodes, edges)
        } catch {
          // Fall back gracefully to blueprints fallback if unseeded
          const bp = SCENARIO_BLUEPRINTS[scenarioParam]
          if (bp) {
            loadTopology(bp.nodes, bp.edges)
          }
        }
      } else if (topologyIdParam) {
        resetCanvas()
        resetSim()
        try {
          const data = await api.topologies.get(topologyIdParam)
          const nodes = typeof data.nodesJson === 'string' ? JSON.parse(data.nodesJson) : data.nodesJson
          const edges = typeof data.edgesJson === 'string' ? JSON.parse(data.edgesJson) : data.edgesJson
          loadTopology(nodes, edges)
        } catch (err) {
          console.warn('Failed loading topology from backend', err)
        }
      }
    }
    load()
  }, [scenarioParam, topologyIdParam, loadTopology, resetCanvas, resetSim])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <Navbar />

      {/* Main 3-Panel IDE Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 pt-16 h-[calc(100vh-4rem)]">
        {/* LEFT COLUMN (2/12): Palette & Sim Controls */}
        <div className="lg:col-span-2 bg- border-r border- flex flex-col overflow-y-auto shrink-0 select-none p-3 space-y-4">
          <div className="space-y-1 pb-2 border-b border-">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Services Palette</h2>
            <p className="text-[10px] text-slate-500">Drag items to add onto canvas</p>
          </div>
          <NodePalette />
          
          <div className="space-y-1 pt-2 border-t border-">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Global Controls</h2>
          </div>
          <SimControls />
        </div>

        {/* CENTER COLUMN (7/12): Reactive Visual Simulation Canvas */}
        <div className="lg:col-span-7 h-full relative border-r border- bg-slate-950">
          <CanvasWrapper />

          {/* Config sliding panels */}
          <NodeConfigPanel />
          <EdgeConfigPanel />
        </div>

        {/* RIGHT COLUMN (3/12): Sparkline Metrics, Real-Time AI, Timeline */}
        <div className="lg:col-span-3 bg- flex flex-col overflow-hidden select-none h-full divide-y divide-slate-850">
          {/* Sparkline Metrics */}
          <div className="p-4 shrink-0 bg-">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Cpu size={14} className="text-indigo-400" />
              System Metrics
            </h2>
            <MetricsPanel />
          </div>

          {/* AI Narrator Box */}
          <div className="flex-1 min-h-0 flex flex-col p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Info size={14} className="text-purple-400" />
              Real-Time AI Copilot
            </h2>
            <div className="flex-1 overflow-y-auto">
              <NarrationPanel />
            </div>
          </div>

          {/* Event Log Timeline */}
          <div className="h-60 shrink-0 p-4 bg- flex flex-col min-h-0">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layout size={14} className="text-amber-400" />
              Event Stream
            </h2>
            <div className="flex-1 overflow-y-auto min-h-0">
              <EventTimeline />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
