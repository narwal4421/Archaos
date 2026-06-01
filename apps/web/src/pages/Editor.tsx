import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useCanvasStore } from '../stores/canvasStore'
import { useSimulation } from '../hooks/useSimulation'
import { Navbar } from '../components/layout/Navbar'
import { CanvasWrapper } from '../components/canvas/CanvasWrapper'
import { SimControls } from '../components/simulation/SimControls'
import { MetricsPanel } from '../components/simulation/MetricsPanel'
import { NarrationPanel } from '../components/simulation/NarrationPanel'
import { EventTimeline } from '../components/simulation/EventTimeline'
import { NodeConfigPanel } from '../components/canvas/NodeConfigPanel'
import { EdgeConfigPanel } from '../components/canvas/EdgeConfigPanel'
import { api } from '../lib/api'
import { ArrowLeft, Pencil, Save } from 'lucide-react'
import {
  Cpu, Database, Layers, GitMerge, Zap, Globe, Server,
} from 'lucide-react'

import type { NodeConfig, EdgeConfig, NodeType } from '../types/topology'

// Local scenario blueprints fallback
const SCENARIO_BLUEPRINTS: Record<string, { nodes: NodeConfig[]; edges: EdgeConfig[] }> = {
  'the-cascade': {
    nodes: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 80, y: 250 },
      { id: 'gateway-service', type: 'SERVICE', label: 'Gateway Service', x: 280, y: 250, replicas: 2, processingTimeMs: 30 },
      { id: 'order-service', type: 'SERVICE', label: 'Order Service', x: 480, y: 160, replicas: 2, processingTimeMs: 40 },
      { id: 'user-service', type: 'SERVICE', label: 'User Service', x: 480, y: 340, replicas: 2, processingTimeMs: 40 },
      { id: 'inventory-service', type: 'SERVICE', label: 'Inventory Service', x: 680, y: 100, replicas: 1, processingTimeMs: 30 },
      { id: 'payment-service', type: 'SERVICE', label: 'Payment Service', x: 680, y: 280, replicas: 1, processingTimeMs: 60 },
      { id: 'billing-service', type: 'SERVICE', label: 'Billing Service', x: 880, y: 280, replicas: 1, processingTimeMs: 40 },
      { id: 'postgres-db', type: 'DATABASE', label: 'PostgreSQL DB', x: 1060, y: 280, dbType: 'POSTGRESQL', connectionPoolSize: 20 }
    ],
    edges: [
      { id: 'edge-gw-gateway', type: 'HTTP', sourceId: 'api-gateway', targetId: 'gateway-service' },
      { id: 'edge-gateway-order', type: 'HTTP', sourceId: 'gateway-service', targetId: 'order-service' },
      { id: 'edge-gateway-user', type: 'HTTP', sourceId: 'gateway-service', targetId: 'user-service' },
      { id: 'edge-order-inventory', type: 'HTTP', sourceId: 'order-service', targetId: 'inventory-service' },
      { id: 'edge-order-payment', type: 'HTTP', sourceId: 'order-service', targetId: 'payment-service' },
      { id: 'edge-payment-billing', type: 'HTTP', sourceId: 'payment-service', targetId: 'billing-service' },
      { id: 'edge-billing-db', type: 'DATABASE_CONN', sourceId: 'billing-service', targetId: 'postgres-db' },
    ],
  },
  'graceful-degradation': {
    nodes: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 80, y: 250 },
      { id: 'gateway-service', type: 'SERVICE', label: 'Gateway Service', x: 280, y: 250, replicas: 2, processingTimeMs: 30 },
      { id: 'order-service', type: 'SERVICE', label: 'Order Service', x: 480, y: 160, replicas: 2, processingTimeMs: 40 },
      { id: 'user-service', type: 'SERVICE', label: 'User Service', x: 480, y: 340, replicas: 2, processingTimeMs: 40 },
      { id: 'payment-service', type: 'SERVICE', label: 'Payment Service', x: 680, y: 220, replicas: 1, processingTimeMs: 60 },
      { id: 'billing-service', type: 'SERVICE', label: 'Billing Service', x: 880, y: 280, replicas: 1, processingTimeMs: 40 },
      { id: 'postgres-db', type: 'DATABASE', label: 'PostgreSQL DB', x: 1060, y: 280, dbType: 'POSTGRESQL', connectionPoolSize: 20 }
    ],
    edges: [
      { id: 'edge-gw-gateway', type: 'HTTP', sourceId: 'api-gateway', targetId: 'gateway-service' },
      { id: 'edge-gateway-order', type: 'HTTP', sourceId: 'gateway-service', targetId: 'order-service', timeoutMs: 1000, circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: 'edge-gateway-user', type: 'HTTP', sourceId: 'gateway-service', targetId: 'user-service' },
      { id: 'edge-order-payment', type: 'HTTP', sourceId: 'order-service', targetId: 'payment-service', timeoutMs: 1000, circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: 'edge-payment-billing', type: 'HTTP', sourceId: 'payment-service', targetId: 'billing-service', timeoutMs: 1000, circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: 'edge-billing-db', type: 'DATABASE_CONN', sourceId: 'billing-service', targetId: 'postgres-db' },
    ],
  },
  'the-retry-storm': {
    nodes: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 100, y: 200 },
      { id: 'order-service', type: 'SERVICE', label: 'Order Service', x: 350, y: 200, replicas: 2, processingTimeMs: 40 },
      { id: 'payment-service', type: 'SERVICE', label: 'Payment Service', x: 620, y: 200, replicas: 1, processingTimeMs: 100 }
    ],
    edges: [
      { id: 'edge-gw-order', type: 'HTTP', sourceId: 'api-gateway', targetId: 'order-service' },
      { id: 'edge-order-payment', type: 'HTTP', sourceId: 'order-service', targetId: 'payment-service', timeoutMs: 200, maxRetries: 3, retryBackoff: 'FIXED', retryDelayMs: 50 },
    ],
  },
  'the-thundering-herd': {
    nodes: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 100, y: 200 },
      { id: 'catalog-service', type: 'SERVICE', label: 'Catalog Service', x: 320, y: 200, replicas: 3, processingTimeMs: 30 },
      { id: 'redis-cache', type: 'DATABASE', label: 'Redis Cache', x: 560, y: 100, dbType: 'REDIS' },
      { id: 'postgres-db', type: 'DATABASE', label: 'PostgreSQL DB', x: 560, y: 310, dbType: 'POSTGRESQL', connectionPoolSize: 5 }
    ],
    edges: [
      { id: 'edge-gw-catalog', type: 'HTTP', sourceId: 'api-gateway', targetId: 'catalog-service' },
      { id: 'edge-catalog-cache', type: 'DATABASE_CONN', sourceId: 'catalog-service', targetId: 'redis-cache' },
      { id: 'edge-catalog-db', type: 'DATABASE_CONN', sourceId: 'catalog-service', targetId: 'postgres-db' },
    ],
  },
  'split-brain': {
    nodes: [
      { id: 'gw-east', type: 'API_GATEWAY', label: 'GW East', x: 100, y: 150 },
      { id: 'gw-west', type: 'API_GATEWAY', label: 'GW West', x: 100, y: 350 },
      { id: 'db-east', type: 'DATABASE', label: 'DB East (Leader)', x: 420, y: 150, dbType: 'POSTGRESQL', replicationMode: 'PRIMARY_REPLICA' },
      { id: 'db-west', type: 'DATABASE', label: 'DB West (Follower)', x: 420, y: 350, dbType: 'POSTGRESQL', replicationMode: 'PRIMARY_REPLICA' }
    ],
    edges: [
      { id: 'edge-east-gw-db', type: 'DATABASE_CONN', sourceId: 'gw-east', targetId: 'db-east' },
      { id: 'edge-west-gw-db', type: 'DATABASE_CONN', sourceId: 'gw-west', targetId: 'db-west' },
      { id: 'db-east-db-west-sync', type: 'DATABASE_CONN', sourceId: 'db-east', targetId: 'db-west' },
    ],
  },
  'the-queue-flood': {
    nodes: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 80, y: 200 },
      { id: 'producer-service', type: 'SERVICE', label: 'Producer Service', x: 300, y: 200, replicas: 2, processingTimeMs: 40 },
      { id: 'kafka-queue', type: 'MESSAGE_QUEUE', label: 'Kafka Queue', x: 540, y: 200, queueType: 'KAFKA', maxQueueDepth: 300 },
      { id: 'consumer-service', type: 'SERVICE', label: 'Consumer Service', x: 780, y: 200, replicas: 1, processingTimeMs: 50 }
    ],
    edges: [
      { id: 'edge-gw-prod', type: 'HTTP', sourceId: 'api-gateway', targetId: 'producer-service' },
      { id: 'edge-prod-queue', type: 'HTTP', sourceId: 'producer-service', targetId: 'kafka-queue' },
      { id: 'edge-queue-cons', type: 'HTTP', sourceId: 'kafka-queue', targetId: 'consumer-service' },
    ],
  },
  'the-memory-leak': {
    nodes: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 100, y: 200 },
      { id: 'leak-service', type: 'SERVICE', label: 'Leak Service', x: 360, y: 200, replicas: 1, processingTimeMs: 40 },
      { id: 'postgres-db', type: 'DATABASE', label: 'PostgreSQL DB', x: 620, y: 200, dbType: 'POSTGRESQL' }
    ],
    edges: [
      { id: 'edge-gw-leak', type: 'HTTP', sourceId: 'api-gateway', targetId: 'leak-service' },
      { id: 'edge-leak-db', type: 'DATABASE_CONN', sourceId: 'leak-service', targetId: 'postgres-db' },
    ],
  },
  'traffic-spike-survival': {
    nodes: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 80, y: 200 },
      { id: 'load-balancer', type: 'LOAD_BALANCER', label: 'Load Balancer', x: 260, y: 200, algorithm: 'ROUND_ROBIN' },
      { id: 'web-service', type: 'SERVICE', label: 'Web Service', x: 460, y: 120, replicas: 2, processingTimeMs: 30 },
      { id: 'api-service', type: 'SERVICE', label: 'API Service', x: 460, y: 290, replicas: 2, processingTimeMs: 50 },
      { id: 'postgres-db', type: 'DATABASE', label: 'PostgreSQL DB', x: 700, y: 200, dbType: 'POSTGRESQL', connectionPoolSize: 10 }
    ],
    edges: [
      { id: 'edge-gw-lb', type: 'HTTP', sourceId: 'api-gateway', targetId: 'load-balancer' },
      { id: 'edge-lb-web', type: 'HTTP', sourceId: 'load-balancer', targetId: 'web-service' },
      { id: 'edge-lb-api', type: 'HTTP', sourceId: 'load-balancer', targetId: 'api-service' },
      { id: 'edge-web-db', type: 'DATABASE_CONN', sourceId: 'web-service', targetId: 'postgres-db' },
      { id: 'edge-api-db', type: 'DATABASE_CONN', sourceId: 'api-service', targetId: 'postgres-db' },
    ],
  },
}

const NODE_PALETTE: { type: NodeType; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { type: 'API_GATEWAY',     label: 'API Gateway',    icon: <Zap size={16} />,      color: '#EC4899', desc: 'Entry point' },
  { type: 'SERVICE',         label: 'Service',        icon: <Cpu size={16} />,      color: '#7C3AED', desc: 'Microservice' },
  { type: 'DATABASE',        label: 'Database',       icon: <Database size={16} />, color: '#06B6D4', desc: 'SQL / NoSQL' },
  { type: 'MESSAGE_QUEUE',   label: 'Queue',          icon: <Layers size={16} />,   color: '#F59E0B', desc: 'Kafka / RabbitMQ' },
  { type: 'LOAD_BALANCER',   label: 'Load Balancer',  icon: <GitMerge size={16} />, color: '#10B981', desc: 'Traffic routing' },
  { type: 'CDN',             label: 'CDN',            icon: <Globe size={16} />,    color: '#3B82F6', desc: 'Edge cache' },
  { type: 'EXTERNAL_SERVICE',label: 'External API',   icon: <Server size={16} />,   color: '#888888', desc: 'Third-party' },
]

export function Editor() {
  const [searchParams] = useSearchParams()
  const { loadTopology, topologyName, setTopologyName, reset: resetCanvas } = useCanvasStore()
  const { reset: resetSim } = useSimulation()
  const [isEditingName, setIsEditingName] = useState(false)

  const scenarioParam = searchParams.get('scenario')
  const topologyIdParam = searchParams.get('id')

  useEffect(() => {
    async function load() {
      if (scenarioParam) {
        resetCanvas()
        resetSim()
        try {
          const data = await api.scenarios.get(scenarioParam)
          const nodes = typeof data.nodesJson === 'string' ? JSON.parse(data.nodesJson) : data.nodesJson
          const edges = typeof data.edgesJson === 'string' ? JSON.parse(data.edgesJson) : data.edgesJson
          loadTopology(nodes, edges)
        } catch {
          const bp = SCENARIO_BLUEPRINTS[scenarioParam]
          if (bp) loadTopology(bp.nodes, bp.edges)
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
    <div
      style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#000000' }}
      className="text-white font-['Inter']"
    >
      {/* ── FIXED NAVBAR 60px ── */}
      <Navbar />

      {/* ── THREE-PANEL LAYOUT ── */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          height: 'calc(100vh - 60px)',
          marginTop: 60,
          overflow: 'hidden',
        }}
      >
        {/* ══ LEFT PANEL (260px fixed) ══ */}
        <div
          style={{
            width: 260,
            flexShrink: 0,
            background: '#0A0A0A',
            borderRight: '1px solid #1A1A1A',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {/* Topology Name Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]">
            <Link to="/scenarios" className="text-[#888888] hover:text-white transition-colors">
              <ArrowLeft size={14} />
            </Link>
            {isEditingName ? (
              <input
                autoFocus
                value={topologyName}
                onChange={e => setTopologyName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
                className="flex-1 mx-2 bg-[#111111] border border-[#7C3AED] rounded px-2 py-0.5 text-xs text-white focus:outline-none"
              />
            ) : (
              <span
                className="flex-1 mx-2 text-xs font-semibold text-white truncate cursor-text"
                onClick={() => setIsEditingName(true)}
              >
                {topologyName}
              </span>
            )}
            <button
              onClick={() => setIsEditingName(v => !v)}
              className="text-[#888888] hover:text-white transition-colors p-1"
            >
              {isEditingName ? <Save size={13} /> : <Pencil size={13} />}
            </button>
          </div>

          <div className="flex flex-col gap-5 p-4 flex-1 overflow-y-auto">
            {/* ─ NODE PALETTE ─ */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#444444] mb-3">
                Node Palette
              </div>
              <p className="text-[10px] text-[#444444] mb-3">Drag items onto the canvas</p>
              <div className="grid grid-cols-2 gap-1.5">
                {NODE_PALETTE.map(item => (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('application/archaos-node-type', item.type)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border border-[#222222] bg-[#111111] cursor-grab active:cursor-grabbing transition-all duration-150 hover:border-[#7C3AED] hover:bg-[#7C3AED]/5 select-none"
                    style={{ minHeight: 60 }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${item.color}20`, color: item.color }}
                    >
                      {item.icon}
                    </div>
                    <span className="text-[9px] font-semibold text-[#888888] text-center leading-tight">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ─ SIM CONTROLS ─ */}
            <SimControls />
          </div>
        </div>

        {/* ══ CENTER CANVAS (flex: 1) ══ */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            background: '#050505',
            overflow: 'hidden',
          }}
        >
          <CanvasWrapper />
          {/* Node/Edge config panels slide in over canvas */}
          <NodeConfigPanel />
          <EdgeConfigPanel />
        </div>

        {/* ══ RIGHT PANEL (300px fixed) ══ */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            background: '#0A0A0A',
            borderLeft: '1px solid #1A1A1A',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Section 1 – System Metrics (33% height) */}
          <div
            style={{
              height: '33%',
              borderBottom: '1px solid #1A1A1A',
              padding: '14px 16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <MetricsPanel />
          </div>

          {/* Section 2 – AI Narration (33% height) */}
          <div
            style={{
              height: '33%',
              borderBottom: '1px solid #1A1A1A',
              padding: '14px 16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <NarrationPanel />
          </div>

          {/* Section 3 – Event Timeline (34% height) */}
          <div
            style={{
              height: '34%',
              padding: '14px 16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <EventTimeline />
          </div>
        </div>
      </div>
    </div>
  )
}
