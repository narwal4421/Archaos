// Editor.tsx — Archaos
// Heavily animated, production-grade editor shell.
// All imported sub-components (CanvasWrapper, SimControls, MetricsPanel,
// NarrationPanel, EventTimeline, NodeConfigPanel, EdgeConfigPanel) are
// unchanged — this file only overhauls the layout shell + chrome.

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useCanvasStore } from '../stores/canvasStore'
import { useSimulation } from '../hooks/useSimulation'
import { useNarration } from '../hooks/useNarration'
import { useSimulationStore } from '../stores/simulationStore'
import { CanvasWrapper } from '../components/canvas/CanvasWrapper'
import { SimControls } from '../components/simulation/SimControls'
import { MetricsPanel } from '../components/simulation/MetricsPanel'
import { NarrationPanel } from '../components/simulation/NarrationPanel'
import { EventTimeline } from '../components/simulation/EventTimeline'
import { NodeConfigPanel } from '../components/canvas/NodeConfigPanel'
import { EdgeConfigPanel } from '../components/canvas/EdgeConfigPanel'
import { api } from '../lib/api'
import { ImportDialog } from '../components/canvas/ImportDialog'
import { ChaosScriptEditor } from '../components/canvas/ChaosScriptEditor'
import { ShareScenarioModal } from '../components/canvas/ShareScenarioModal'
import { autoLayoutTopology } from '../utils/infrastructureParser'
import {
  ArrowLeft, Pencil, Save, Cpu, Database, Layers, GitMerge,
  Zap, Globe, Server, ChevronDown, Activity, Cpu as CpuIcon,
  TerminalSquare, Clock, Upload, Code, Share2,
} from 'lucide-react'
import type { NodeConfig, EdgeConfig, NodeType } from '../types/topology'

// ─── Scenario blueprints ──────────────────────────────────────────────────────
const SCENARIO_BLUEPRINTS: Record<string, { nodes: NodeConfig[]; edges: EdgeConfig[]; label: string; color: string; desc: string }> = {
  'the-cascade': {
    label: 'The Cascade', color: '#EF4444', desc: 'DB overwhelm triggers total service collapse',
    nodes: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 80, y: 250 },
      { id: 'gateway-service', type: 'SERVICE', label: 'Gateway Service', x: 280, y: 250, replicas: 2, processingTimeMs: 30 },
      { id: 'order-service', type: 'SERVICE', label: 'Order Service', x: 480, y: 160, replicas: 2, processingTimeMs: 40 },
      { id: 'user-service', type: 'SERVICE', label: 'User Service', x: 480, y: 340, replicas: 2, processingTimeMs: 40 },
      { id: 'inventory-service', type: 'SERVICE', label: 'Inventory Service', x: 680, y: 100, replicas: 1, processingTimeMs: 30 },
      { id: 'payment-service', type: 'SERVICE', label: 'Payment Service', x: 680, y: 280, replicas: 1, processingTimeMs: 60 },
      { id: 'billing-service', type: 'SERVICE', label: 'Billing Service', x: 880, y: 280, replicas: 1, processingTimeMs: 40 },
      { id: 'postgres-db', type: 'DATABASE', label: 'PostgreSQL DB', x: 1060, y: 280, dbType: 'POSTGRESQL', connectionPoolSize: 20 },
    ],
    edges: [
      { id: 'e1', type: 'HTTP', sourceId: 'api-gateway', targetId: 'gateway-service' },
      { id: 'e2', type: 'HTTP', sourceId: 'gateway-service', targetId: 'order-service' },
      { id: 'e3', type: 'HTTP', sourceId: 'gateway-service', targetId: 'user-service' },
      { id: 'e4', type: 'HTTP', sourceId: 'order-service', targetId: 'inventory-service' },
      { id: 'e5', type: 'HTTP', sourceId: 'order-service', targetId: 'payment-service' },
      { id: 'e6', type: 'HTTP', sourceId: 'payment-service', targetId: 'billing-service' },
      { id: 'e7', type: 'DATABASE_CONN', sourceId: 'billing-service', targetId: 'postgres-db' },
    ],
  },
  'graceful-degradation': {
    label: 'Graceful Degradation', color: '#10B981', desc: 'Circuit breakers prevent full meltdown',
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
      { id: 'e1', type: 'HTTP', sourceId: 'api-gateway', targetId: 'gateway-service', circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: 'e2', type: 'HTTP', sourceId: 'gateway-service', targetId: 'order-service', circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: 'e3', type: 'HTTP', sourceId: 'gateway-service', targetId: 'user-service', circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: 'e4', type: 'HTTP', sourceId: 'order-service', targetId: 'inventory-service', circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: 'e5', type: 'HTTP', sourceId: 'order-service', targetId: 'payment-service', circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: 'e6', type: 'HTTP', sourceId: 'payment-service', targetId: 'billing-service', circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
      { id: 'e7', type: 'DATABASE_CONN', sourceId: 'billing-service', targetId: 'postgres-db', circuitBreakerEnabled: true, cbErrorThresholdPercent: 30, cbHalfOpenAfterSecs: 15 },
    ],
  },
  'the-retry-storm': {
    label: 'Retry Storm', color: '#F59E0B', desc: 'Aggressive retries amplify overload',
    nodes: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 100, y: 200 },
      { id: 'order-service', type: 'SERVICE', label: 'Order Service', x: 350, y: 200, replicas: 2, processingTimeMs: 40 },
      { id: 'payment-service', type: 'SERVICE', label: 'Payment Service', x: 620, y: 200, replicas: 1, processingTimeMs: 100 },
    ],
    edges: [
      { id: 'e1', type: 'HTTP', sourceId: 'api-gateway', targetId: 'order-service' },
      { id: 'e2', type: 'HTTP', sourceId: 'order-service', targetId: 'payment-service', timeoutMs: 200, maxRetries: 3, retryBackoff: 'FIXED', retryDelayMs: 50 },
    ],
  },
  'the-thundering-herd': {
    label: 'Thundering Herd', color: '#8B5CF6', desc: 'Cache stampede overwhelms cold DB',
    nodes: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 100, y: 200 },
      { id: 'catalog-service', type: 'SERVICE', label: 'Catalog Service', x: 320, y: 200, replicas: 3, processingTimeMs: 30 },
      { id: 'redis-cache', type: 'DATABASE', label: 'Redis Cache', x: 560, y: 100, dbType: 'REDIS' },
      { id: 'postgres-db', type: 'DATABASE', label: 'PostgreSQL DB', x: 560, y: 310, dbType: 'POSTGRESQL', connectionPoolSize: 5 },
    ],
    edges: [
      { id: 'e1', type: 'HTTP', sourceId: 'api-gateway', targetId: 'catalog-service' },
      { id: 'e2', type: 'DATABASE_CONN', sourceId: 'catalog-service', targetId: 'redis-cache' },
      { id: 'e3', type: 'DATABASE_CONN', sourceId: 'catalog-service', targetId: 'postgres-db' },
    ],
  },
  'split-brain': {
    label: 'Split Brain', color: '#06B6D4', desc: 'Network partition creates conflicting leaders',
    nodes: [
      { id: 'gw-east', type: 'API_GATEWAY', label: 'GW East', x: 100, y: 150 },
      { id: 'gw-west', type: 'API_GATEWAY', label: 'GW West', x: 100, y: 350 },
      { id: 'db-east', type: 'DATABASE', label: 'DB East (Leader)', x: 420, y: 150, dbType: 'POSTGRESQL', replicationMode: 'PRIMARY_REPLICA' },
      { id: 'db-west', type: 'DATABASE', label: 'DB West (Follower)', x: 420, y: 350, dbType: 'POSTGRESQL', replicationMode: 'PRIMARY_REPLICA' },
    ],
    edges: [
      { id: 'e1', type: 'DATABASE_CONN', sourceId: 'gw-east', targetId: 'db-east' },
      { id: 'e2', type: 'DATABASE_CONN', sourceId: 'gw-west', targetId: 'db-west' },
      { id: 'e3', type: 'DATABASE_CONN', sourceId: 'db-east', targetId: 'db-west' },
    ],
  },
  'the-queue-flood': {
    label: 'Queue Flood', color: '#EC4899', desc: 'Producers overwhelm consumers, queue depth explodes',
    nodes: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 80, y: 200 },
      { id: 'producer-service', type: 'SERVICE', label: 'Producer Service', x: 300, y: 200, replicas: 2, processingTimeMs: 40 },
      { id: 'kafka-queue', type: 'MESSAGE_QUEUE', label: 'Kafka Queue', x: 540, y: 200, queueType: 'KAFKA', maxQueueDepth: 300 },
      { id: 'consumer-service', type: 'SERVICE', label: 'Consumer Service', x: 780, y: 200, replicas: 1, processingTimeMs: 50 },
    ],
    edges: [
      { id: 'e1', type: 'HTTP', sourceId: 'api-gateway', targetId: 'producer-service' },
      { id: 'e2', type: 'HTTP', sourceId: 'producer-service', targetId: 'kafka-queue' },
      { id: 'e3', type: 'HTTP', sourceId: 'kafka-queue', targetId: 'consumer-service' },
    ],
  },
  'the-memory-leak': {
    label: 'Memory Leak', color: '#F97316', desc: 'Gradual heap growth causes cascading OOM kills',
    nodes: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 100, y: 200 },
      { id: 'leak-service', type: 'SERVICE', label: 'Leak Service', x: 360, y: 200, replicas: 1, processingTimeMs: 40 },
      { id: 'postgres-db', type: 'DATABASE', label: 'PostgreSQL DB', x: 620, y: 200, dbType: 'POSTGRESQL' },
    ],
    edges: [
      { id: 'e1', type: 'HTTP', sourceId: 'api-gateway', targetId: 'leak-service' },
      { id: 'e2', type: 'DATABASE_CONN', sourceId: 'leak-service', targetId: 'postgres-db' },
    ],
  },
  'traffic-spike-survival': {
    label: 'Traffic Spike', color: '#3B82F6', desc: 'Load balancer absorbs sudden 10x traffic surge',
    nodes: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'API Gateway', x: 80, y: 200 },
      { id: 'load-balancer', type: 'LOAD_BALANCER', label: 'Load Balancer', x: 260, y: 200, algorithm: 'ROUND_ROBIN' },
      { id: 'web-service', type: 'SERVICE', label: 'Web Service', x: 460, y: 120, replicas: 2, processingTimeMs: 30 },
      { id: 'api-service', type: 'SERVICE', label: 'API Service', x: 460, y: 290, replicas: 2, processingTimeMs: 50 },
      { id: 'postgres-db', type: 'DATABASE', label: 'PostgreSQL DB', x: 700, y: 200, dbType: 'POSTGRESQL', connectionPoolSize: 10 },
    ],
    edges: [
      { id: 'e1', type: 'HTTP', sourceId: 'api-gateway', targetId: 'load-balancer' },
      { id: 'e2', type: 'HTTP', sourceId: 'load-balancer', targetId: 'web-service' },
      { id: 'e3', type: 'HTTP', sourceId: 'load-balancer', targetId: 'api-service' },
      { id: 'e4', type: 'DATABASE_CONN', sourceId: 'web-service', targetId: 'postgres-db' },
      { id: 'e5', type: 'DATABASE_CONN', sourceId: 'api-service', targetId: 'postgres-db' },
    ],
  },
  'aws-3-tier': {
    label: 'AWS 3-Tier App', color: '#FF9900', desc: 'One-click AWS web app setup with API Gateway, ALB, ECS, and RDS',
    nodes: [
      { id: 'api-gateway', type: 'API_GATEWAY', label: 'AWS API Gateway', x: 80, y: 250 },
      { id: 'load-balancer', type: 'LOAD_BALANCER', label: 'AWS ALB', x: 260, y: 250 },
      { id: 'auth-service', type: 'SERVICE', label: 'ECS Auth Service', x: 460, y: 120, replicas: 2 },
      { id: 'order-service', type: 'SERVICE', label: 'ECS Order Service', x: 460, y: 380, replicas: 3 },
      { id: 'redis-cache', type: 'REDIS', label: 'ElastiCache Redis', x: 680, y: 120 },
      { id: 'rds-postgres', type: 'DATABASE', label: 'RDS PostgreSQL', x: 680, y: 380 },
    ],
    edges: [
      { id: 'e1', type: 'HTTP', sourceId: 'api-gateway', targetId: 'load-balancer' },
      { id: 'e2', type: 'HTTP', sourceId: 'load-balancer', targetId: 'auth-service' },
      { id: 'e3', type: 'HTTP', sourceId: 'load-balancer', targetId: 'order-service' },
      { id: 'e4', type: 'DATABASE_CONN', sourceId: 'auth-service', targetId: 'redis-cache' },
      { id: 'e5', type: 'DATABASE_CONN', sourceId: 'order-service', targetId: 'rds-postgres' },
    ],
  },
  'netflix-stack': {
    label: 'Netflix Microservices', color: '#E50914', desc: 'Netflix architecture with Eureka, playback, and recommendation API',
    nodes: [
      { id: 'zuul-gateway', type: 'API_GATEWAY', label: 'Zuul Gateway', x: 80, y: 250 },
      { id: 'playback-service', type: 'SERVICE', label: 'Playback Service', x: 300, y: 150, replicas: 4 },
      { id: 'recommendation', type: 'SERVICE', label: 'Recommendation API', x: 300, y: 350, replicas: 2 },
      { id: 'kafka-bus', type: 'KAFKA', label: 'Kafka Telemetry', x: 520, y: 250 },
      { id: 'cassandra-db', type: 'DATABASE', label: 'Cassandra Storage', x: 740, y: 250 },
    ],
    edges: [
      { id: 'e1', type: 'HTTP', sourceId: 'zuul-gateway', targetId: 'playback-service' },
      { id: 'e2', type: 'HTTP', sourceId: 'zuul-gateway', targetId: 'recommendation' },
      { id: 'e3', type: 'HTTP', sourceId: 'playback-service', targetId: 'kafka-bus' },
      { id: 'e4', type: 'HTTP', sourceId: 'recommendation', targetId: 'cassandra-db' },
    ],
  },
}

const NODE_PALETTE: { type: NodeType; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { type: 'API_GATEWAY', label: 'API Gateway', icon: <Zap size={14} />, color: '#EC4899', desc: 'Entry point' },
  { type: 'SERVICE', label: 'Service', icon: <Cpu size={14} />, color: '#7C3AED', desc: 'Microservice' },
  { type: 'DATABASE', label: 'Database', icon: <Database size={14} />, color: '#06B6D4', desc: 'SQL / NoSQL' },
  { type: 'MESSAGE_QUEUE', label: 'Queue', icon: <Layers size={14} />, color: '#F59E0B', desc: 'Standard MQ' },
  { type: 'LOAD_BALANCER', label: 'Load Balancer', icon: <GitMerge size={14} />, color: '#10B981', desc: 'Traffic split' },
  { type: 'CDN', label: 'CDN', icon: <Globe size={14} />, color: '#3B82F6', desc: 'Edge cache' },
  { type: 'EXTERNAL_SERVICE', label: 'External API', icon: <Server size={14} />, color: '#888888', desc: 'Third-party' },
  { type: 'KAFKA', label: 'Kafka', icon: <Layers size={14} />, color: '#ef4444', desc: 'Apache Kafka' },
  { type: 'RABBITMQ', label: 'RabbitMQ', icon: <Layers size={14} />, color: '#f97316', desc: 'RabbitMQ Broker' },
  { type: 'ELASTICSEARCH', label: 'Elasticsearch', icon: <Database size={14} />, color: '#facc15', desc: 'Search engine' },
  { type: 'REDIS', label: 'Redis Cache', icon: <Database size={14} />, color: '#dc2626', desc: 'In-memory cache' },
  { type: 'CDN_EDGE', label: 'CDN Edge', icon: <Globe size={14} />, color: '#06b6d4', desc: 'Cache edge' },
]

// ─── Scenario picker dropdown ─────────────────────────────────────────────────
function ScenarioPicker({
  current, onSelect,
}: {
  current: string | null
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const active = current ? SCENARIO_BLUEPRINTS[current] : null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', borderRadius: 8,
          background: open ? '#0D1118' : '#090C12',
          border: `1px solid ${open ? '#2D3748' : '#141820'}`,
          color: active ? active.color : '#4A5568',
          cursor: 'pointer', fontSize: 11, fontWeight: 600,
          fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
          transition: 'all 0.18s',
          whiteSpace: 'nowrap',
        }}
      >
        {active && (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: active.color, flexShrink: 0, boxShadow: `0 0 6px ${active.color}` }} />
        )}
        <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {active ? active.label.toUpperCase() : 'SCENARIOS'}
        </span>
        <ChevronDown size={11} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          width: 260, zIndex: 200,
          border: '1px solid #1A2030', borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          animation: 'dropIn 0.15s ease',
          background: '#090C12',
        }}>
          <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid #141820' }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#2A3140', letterSpacing: 2.5 }}>SELECT SCENARIO</span>
          </div>
          {Object.entries(SCENARIO_BLUEPRINTS).map(([id, s]) => (
            <div
              key={id}
              onClick={() => { onSelect(id); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', cursor: 'pointer',
                transition: 'background 0.15s',
                background: current === id ? `${s.color}0A` : 'transparent',
                borderLeft: `2px solid ${current === id ? s.color : 'transparent'}`,
              }}
              onMouseEnter={e => { if (current !== id) e.currentTarget.style.background = '#0D1118' }}
              onMouseLeave={e => { if (current !== id) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: current === id ? `0 0 8px ${s.color}` : 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: current === id ? s.color : '#C8D0DA', fontFamily: "'DM Sans',sans-serif", marginBottom: 1 }}>{s.label}</div>
                <div style={{ fontSize: 9, color: '#2A3140', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Animated section header ──────────────────────────────────────────────────
function PanelHeader({
  icon, label, accent = '#6366F1', actions,
}: {
  icon: React.ReactNode; label: string; accent?: string; actions?: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      paddingBottom: 10, marginBottom: 10,
      borderBottom: '1px solid #111720',
      flexShrink: 0,
    }}>
      <div style={{ color: accent, display: 'flex', alignItems: 'center' }}>{icon}</div>
      <span style={{
        fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
        color: '#4A5568', letterSpacing: 2.5, flex: 1,
      }}>{label}</span>
      {/* Live pulse dot */}
      <span style={{
        width: 5, height: 5, borderRadius: '50%', background: accent,
        opacity: 0.7, animation: 'pulse-dot 2s infinite',
        flexShrink: 0,
      }} />
      {actions}
    </div>
  )
}

// ─── Draggable node palette item ──────────────────────────────────────────────
function PaletteItem({ item, idx }: { item: typeof NODE_PALETTE[0]; idx: number }) {
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('application/archaos-node-type', item.type)
        e.dataTransfer.effectAllowed = 'move'
        setDragging(true)
      }}
      onDragEnd={() => setDragging(false)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        padding: '10px 6px', borderRadius: 10,
        border: `1px solid ${hovered || dragging ? item.color + '40' : '#141820'}`,
        background: hovered || dragging ? `${item.color}08` : '#0A0D12',
        cursor: 'grab',
        transition: 'all 0.18s ease',
        transform: dragging ? 'scale(0.94) rotate(-1deg)' : hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? `0 6px 18px ${item.color}14` : 'none',
        userSelect: 'none',
        animation: `fadeUp 0.4s ${idx * 0.04 + 0.1}s both ease`,
        opacity: dragging ? 0.6 : 1,
        minHeight: 72,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Shimmer on hover */}
      {hovered && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `linear-gradient(90deg, transparent, ${item.color}10, transparent)`,
          animation: 'shimmer 0.6s ease',
        }} />
      )}
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: `${item.color}18`,
        border: `1px solid ${item.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: item.color,
        boxShadow: hovered ? `0 0 12px ${item.color}30` : 'none',
        transition: 'box-shadow 0.2s',
      }}>
        {item.icon}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: hovered ? item.color : '#8B95A3', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5, lineHeight: 1.4, transition: 'color 0.2s' }}>
          {item.label.toUpperCase()}
        </div>
        <div style={{ fontSize: 8, color: '#2A3140', fontFamily: "'JetBrains Mono',monospace", marginTop: 1 }}>{item.desc}</div>
      </div>
    </div>
  )
}

// ─── Status bar ───────────────────────────────────────────────────────────────
function StatusBar({ scenario, topologyId }: { scenario: string | null; topologyId: string | null }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  const bp = scenario ? SCENARIO_BLUEPRINTS[scenario] : null
  const nodeCount = bp ? bp.nodes.length : 0
  const edgeCount = bp ? bp.edges.length : 0

  return (
    <div style={{
      height: 26, flexShrink: 0,
      background: '#060810', borderTop: '1px solid #0D1018',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 20,
      fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
      color: '#2A3140', letterSpacing: 1,
      overflow: 'hidden',
    }}>
      {/* Left: mode indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 2s infinite' }} />
        <span style={{ color: '#10B981' }}>READY</span>
      </div>

      <div style={{ width: 1, height: 12, background: '#141820' }} />

      {bp && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: bp.color }}>●</span>
            <span>{bp.label.toUpperCase()}</span>
          </div>
          <div style={{ width: 1, height: 12, background: '#141820' }} />
        </>
      )}

      {topologyId && (
        <>
          <span>TOPOLOGY: {topologyId.substring(0, 8)}</span>
          <div style={{ width: 1, height: 12, background: '#141820' }} />
        </>
      )}

      <span>{nodeCount} NODES</span>
      <span style={{ color: '#141820' }}>|</span>
      <span>{edgeCount} EDGES</span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right: version + time */}
      <span>ARCHAOS v1.0 (TICK: {tick})</span>
      <div style={{ width: 1, height: 12, background: '#141820' }} />
      <span style={{ color: '#3A4455' }}>
        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  )
}

// ─── MAIN EDITOR ──────────────────────────────────────────────────────────────
export function Editor() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { loadTopology, topologyName, setTopologyName, reset: resetCanvas } = useCanvasStore()
  const { reset: resetSim } = useSimulation()

  const [sessionId] = useState(() => Math.random().toString(36).slice(2))
  const { sendEvent } = useNarration(sessionId)
  const simState = useSimulationStore(s => s.simState)
  const canvasStore = useCanvasStore()

  useEffect(() => {
    const eventLog = simState.eventLog
    if (eventLog.length === 0) return
    const latestEvent = eventLog[0]
    
    // Only send events that warrant narration
    if (
      latestEvent.type === 'NODE_STATE_CHANGE' ||
      latestEvent.type === 'CIRCUIT_BREAKER' ||
      latestEvent.type === 'CHAOS_INJECTED'
    ) {
      const topology = {
        nodes: Object.values(canvasStore.nodeConfigs),
        edges: Object.values(canvasStore.edgeConfigs),
      }
      sendEvent(latestEvent, simState, topology)
    }
  }, [simState.eventLog, canvasStore.nodeConfigs, canvasStore.edgeConfigs, sendEvent, simState])

  const [isEditingName, setIsEditingName] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [topologyVersions, setTopologyVersions] = useState<{ id: string; name: string; timestamp: string; nodes: NodeConfig[]; edges: EdgeConfig[] }[]>([])
  const [selectedDiffIndex, setSelectedDiffIndex] = useState<number | null>(null)
  const [showChaosScript, setShowChaosScript] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const handleSaveVersion = () => {
    const nodeConfigs = Object.values(canvasStore.nodeConfigs)
    const edgeConfigs = Object.values(canvasStore.edgeConfigs)
    const newVersion = {
      id: Math.random().toString(36).substring(7),
      name: `v${topologyVersions.length + 1} (${topologyName || 'Untitled'})`,
      timestamp: new Date().toLocaleTimeString(),
      nodes: nodeConfigs,
      edges: edgeConfigs,
    }
    setTopologyVersions(prev => [...prev, newVersion])
  }

  const handleChaosScriptExecute = (steps: { atSec: number; type: string; targetId: string; value?: number; durationSecs?: number }[]) => {
    // Dispatch each step as a scheduled custom event; the simulation worker picks these up
    steps.forEach(step => {
      window.dispatchEvent(new CustomEvent('archaos:scheduled-chaos', { detail: step }))
    })
  }

  const handleAutoLayout = () => {
    const nodeConfigs = Object.values(canvasStore.nodeConfigs)
    const edgeConfigs = Object.values(canvasStore.edgeConfigs)
    const positioned = autoLayoutTopology(nodeConfigs, edgeConfigs)
    loadTopology(positioned, edgeConfigs)
  }

  const scenarioParam = searchParams.get('scenario')
  const topologyIdParam = searchParams.get('id')

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  // Load topology / scenario
  useEffect(() => {
    async function load() {
      if (scenarioParam) {
        resetCanvas(); resetSim()
        setActiveScenario(scenarioParam)
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
        resetCanvas(); resetSim()
        setActiveScenario(null)
        try {
          const data = await api.topologies.get(topologyIdParam)
          const nodes = typeof data.nodesJson === 'string' ? JSON.parse(data.nodesJson) : data.nodesJson
          const edges = typeof data.edgesJson === 'string' ? JSON.parse(data.edgesJson) : data.edgesJson
          loadTopology(nodes, edges)
        } catch (err) {
          console.warn('Failed loading topology', err)
        }
      }
    }
    load()
  }, [scenarioParam, topologyIdParam, loadTopology, resetCanvas, resetSim])

  const handleScenarioSelect = useCallback((id: string) => {
    setSearchParams({ scenario: id })
  }, [setSearchParams])

  const activeBp = activeScenario ? SCENARIO_BLUEPRINTS[activeScenario] : null

  return (
    <div style={{
      height: '100vh', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: '#07090D',
      fontFamily: "'DM Sans',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }

        @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes slideLeft { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideRight{ from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes dropIn    { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes shimmer   { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }

        @keyframes pulse-dot {
          0%,100%{opacity:0.5;transform:scale(0.9)}
          50%{opacity:1;transform:scale(1.2)}
        }
        @keyframes status-fill {
          from{width:0} to{width:100%}
        }
        @keyframes scan-v {
          0%{top:-2px} 100%{top:100%}
        }
        @keyframes panel-glow {
          0%,100%{box-shadow:none}
          50%{box-shadow:inset 0 0 30px rgba(99,102,241,0.03)}
        }

        input::placeholder, textarea::placeholder { color:#1E2530; }
        input { caret-color:#6366F1; }

        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#141820; border-radius:2px; }

        .left-panel  { animation: slideLeft  0.4s 0.1s both ease; }
        .right-panel { animation: slideRight 0.4s 0.15s both ease; }
        .center-panel{ animation: fadeIn     0.5s 0.05s both ease; }

        .panel-section {
          transition: background 0.2s;
        }
        .panel-section:hover {
          background: rgba(99,102,241,0.01);
        }
      `}</style>

      {/* ── TOP CHROME BAR ── */}
      <div style={{
        height: 52, flexShrink: 0,
        background: '#07090D',
        borderBottom: '1px solid #0D1018',
        display: 'flex', alignItems: 'center',
        padding: '0 12px',
        gap: 10,
        position: 'relative', zIndex: 50,
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}>
        {/* Progress bar at very top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#0D1018', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: activeBp ? `linear-gradient(90deg, ${activeBp.color}, ${activeBp.color}80)` : 'linear-gradient(90deg, #6366F1, #4338CA)',
            animation: 'status-fill 1.2s 0.2s both ease-out',
            width: '100%',
          }} />
        </div>

        {/* Back button */}
        <Link
          to="/dashboard"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 8,
            background: '#0A0D12', border: '1px solid #141820',
            color: '#4A5568', textDecoration: 'none',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D3748'; e.currentTarget.style.color = '#E8EDF3' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#141820'; e.currentTarget.style.color = '#4A5568' }}
        >
          <ArrowLeft size={13} />
        </Link>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: '#141820', flexShrink: 0 }} />

        {/* Logo mark */}
        <div style={{
          fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 3,
          color: '#E8EDF3', flexShrink: 0,
        }}>ARCHAOS</div>

        <div style={{ width: 1, height: 20, background: '#141820', flexShrink: 0 }} />

        {/* Topology name editor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: '0 1 200px' }}>
          {isEditingName ? (
            <input
              autoFocus
              value={topologyName}
              onChange={e => setTopologyName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
              style={{
                flex: 1, background: '#0A0D12',
                border: '1px solid #6366F1',
                borderRadius: 6, padding: '4px 8px',
                fontSize: 11, color: '#E8EDF3',
                outline: 'none',
                fontFamily: "'JetBrains Mono',monospace",
                boxShadow: '0 0 0 3px rgba(99,102,241,0.1)',
              }}
            />
          ) : (
            <span
              onClick={() => setIsEditingName(true)}
              style={{
                fontSize: 11, fontWeight: 600, color: '#8B95A3',
                cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', flex: 1,
                fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5,
              }}
            >{topologyName || 'Untitled Topology'}</span>
          )}
          <button
            onClick={() => setIsEditingName(v => !v)}
            style={{
              background: 'none', border: 'none',
              color: '#2A3140', cursor: 'pointer',
              padding: 4, display: 'flex', alignItems: 'center',
              transition: 'color 0.2s', flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#8B95A3'}
            onMouseLeave={e => e.currentTarget.style.color = '#2A3140'}
          >
            {isEditingName ? <Save size={12} /> : <Pencil size={12} />}
          </button>
        </div>

        <div style={{ width: 1, height: 20, background: '#141820', flexShrink: 0 }} />

        {/* Scenario picker */}
        <ScenarioPicker current={activeScenario} onSelect={handleScenarioSelect} />

        <button
          onClick={() => setShowImport(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            background: '#090C12', border: '1px solid #141820',
            color: '#E8EDF3', cursor: 'pointer', fontSize: 11, fontWeight: 600,
            fontFamily: "'JetBrains Mono',monospace", transition: 'all 0.18s',
            marginLeft: 6,
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#6366F1'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#141820'}
        >
          <Upload size={12} /> IMPORT INFRA
        </button>

        <button
          onClick={handleAutoLayout}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            background: '#090C12', border: '1px solid #141820',
            color: '#E8EDF3', cursor: 'pointer', fontSize: 11, fontWeight: 600,
            fontFamily: "'JetBrains Mono',monospace", transition: 'all 0.18s',
            marginLeft: 6,
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#6366F1'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#141820'}
        >
          <GitMerge size={12} /> AUTO LAYOUT
        </button>

        {/* ── Chaos Script button ── */}
        <button
          onClick={() => setShowChaosScript(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#EF4444', cursor: 'pointer', fontSize: 11, fontWeight: 700,
            fontFamily: "'JetBrains Mono',monospace", transition: 'all 0.18s',
            marginLeft: 6,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)' }}
          title="Write custom YAML chaos scripts"
        >
          <Code size={12} /> CHAOS SCRIPT
        </button>

        {/* ── Share to marketplace button ── */}
        <button
          onClick={() => setShowShare(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
            color: '#8B9CF8', cursor: 'pointer', fontSize: 11, fontWeight: 700,
            fontFamily: "'JetBrains Mono',monospace", transition: 'all 0.18s',
            marginLeft: 6,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)' }}
          title="Publish this topology to the marketplace"
        >
          <Share2 size={12} /> SHARE
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Panel toggles */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setLeftCollapsed(v => !v)}
            title="Toggle left panel"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7,
              background: leftCollapsed ? 'rgba(99,102,241,0.1)' : '#0A0D12',
              border: `1px solid ${leftCollapsed ? 'rgba(99,102,241,0.3)' : '#141820'}`,
              color: leftCollapsed ? '#6366F1' : '#4A5568',
              cursor: 'pointer', fontSize: 9,
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
              transition: 'all 0.2s',
            }}>
            <Layers size={11} /> {leftCollapsed ? 'SHOW' : 'HIDE'}
          </button>
          <button
            onClick={() => setRightCollapsed(v => !v)}
            title="Toggle right panel"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7,
              background: rightCollapsed ? 'rgba(99,102,241,0.1)' : '#0A0D12',
              border: `1px solid ${rightCollapsed ? 'rgba(99,102,241,0.3)' : '#141820'}`,
              color: rightCollapsed ? '#6366F1' : '#4A5568',
              cursor: 'pointer', fontSize: 9,
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
              transition: 'all 0.2s',
            }}>
            <Activity size={11} /> {rightCollapsed ? 'SHOW' : 'HIDE'}
          </button>
        </div>
      </div>

      {/* ── THREE-PANEL BODY ── */}
      <div style={{
        display: 'flex', flex: 1,
        overflow: 'hidden',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.4s 0.1s ease',
      }}>

        {/* ══ LEFT PANEL ══ */}
        <div
          className="left-panel"
          style={{
            width: leftCollapsed ? 0 : 252,
            flexShrink: 0,
            borderRight: '1px solid #0D1018',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
            background: '#090C12',
          }}
        >
          <div style={{ width: 252, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Scenario info strip */}
            {activeBp && (
              <div style={{
                padding: '10px 14px',
                background: `${activeBp.color}08`,
                borderBottom: `1px solid ${activeBp.color}20`,
                animation: 'fadeIn 0.3s ease',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeBp.color, boxShadow: `0 0 8px ${activeBp.color}` }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: activeBp.color, letterSpacing: 2, fontWeight: 700 }}>
                    {activeBp.label.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize: 10, color: '#4A5568', fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5 }}>{activeBp.desc}</p>
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Node palette */}
              <div className="panel-section" style={{ borderRadius: 8, padding: 4 }}>
                <PanelHeader icon={<Cpu size={11} />} label="NODE PALETTE" accent="#7C3AED" />
                <p style={{ fontSize: 9, color: '#2A3140', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginBottom: 10 }}>DRAG → CANVAS</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                  {NODE_PALETTE.map((item, i) => (
                    <PaletteItem key={item.type} item={item} idx={i} />
                  ))}
                </div>
              </div>

              {/* Sim Controls */}
              <div className="panel-section" style={{ borderRadius: 8, padding: 4 }}>
                <PanelHeader icon={<Zap size={11} />} label="SIMULATION" accent="#EF4444" />
                <SimControls />
              </div>

              {/* Version Control & Diff */}
              <div className="panel-section" style={{ borderRadius: 8, padding: 4, borderTop: '1px solid #141820', paddingTop: 14 }}>
                <PanelHeader icon={<GitMerge size={11} />} label="VERSION HISTORY" accent="#6366F1" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={handleSaveVersion}
                    style={{
                      width: '100%', padding: '6px 10px', borderRadius: 8,
                      background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                      color: '#A5B4FC', fontSize: 10, fontWeight: 600,
                      cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    + SAVE CURRENT VERSION
                  </button>

                  {topologyVersions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 8, color: '#3A4455', fontFamily: "'JetBrains Mono',monospace" }}>COMPARE WITH:</span>
                      <select
                        value={selectedDiffIndex !== null ? selectedDiffIndex : ''}
                        onChange={e => setSelectedDiffIndex(e.target.value === '' ? null : Number(e.target.value))}
                        style={{
                          width: '100%', padding: '5px 8px', borderRadius: 6,
                          background: '#07090D', border: '1px solid #141820',
                          color: '#C8D0DA', fontSize: 9, fontFamily: 'monospace',
                          outline: 'none', cursor: 'pointer',
                        }}
                      >
                        <option value="">None (Current)</option>
                        {topologyVersions.map((v, i) => (
                          <option key={v.id} value={i}>{v.name} ({v.timestamp})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedDiffIndex !== null && topologyVersions[selectedDiffIndex] && (
                    <div style={{
                      background: '#07090D', border: '1px solid #141820', borderRadius: 8,
                      padding: 8, fontSize: 9, fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: 6,
                    }}>
                      <div style={{ color: '#6366F1', fontWeight: 'bold', borderBottom: '1px solid #141820', paddingBottom: 4 }}>
                        DIFF: {topologyVersions[selectedDiffIndex].name}
                      </div>
                      {(() => {
                        const currentNodes = Object.values(canvasStore.nodeConfigs)
                        const diffVer = topologyVersions[selectedDiffIndex]
                        const added = currentNodes.filter(n => !diffVer.nodes.some((dn) => dn.id === n.id))
                        const removed = diffVer.nodes.filter((dn) => !currentNodes.some(n => n.id === dn.id))
                        
                        return (
                          <>
                            {added.length === 0 && removed.length === 0 && (
                              <div style={{ color: '#8B95A3' }}>No structural changes detected.</div>
                            )}
                            {added.map(n => (
                              <div key={n.id} style={{ color: '#10B981' }}>+ Added Node: {n.label}</div>
                            ))}
                            {removed.map(n => (
                              <div key={n.id} style={{ color: '#EF4444' }}>- Removed Node: {n.label}</div>
                            ))}
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ══ CENTER CANVAS ══ */}
        <div
          className="center-panel"
          style={{
            flex: 1, position: 'relative',
            background: '#07090D',
            overflow: 'hidden',
          }}
        >
          {/* Subtle scan line */}
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg,transparent,rgba(99,102,241,0.06),transparent)',
            pointerEvents: 'none', zIndex: 2,
            animation: 'scan-v 8s linear infinite',
          }} />

          {/* Grid background */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.025) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }} />

          {/* Corner brackets */}
          {[{ top: 8, left: 8 }, { top: 8, right: 8 }, { bottom: 8, left: 8 }, { bottom: 8, right: 8 }].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute', ...pos, width: 14, height: 14,
              borderTop: i < 2 ? '1px solid rgba(99,102,241,0.15)' : 'none',
              borderBottom: i >= 2 ? '1px solid rgba(99,102,241,0.15)' : 'none',
              borderLeft: i % 2 === 0 ? '1px solid rgba(99,102,241,0.15)' : 'none',
              borderRight: i % 2 === 1 ? '1px solid rgba(99,102,241,0.15)' : 'none',
              zIndex: 3, pointerEvents: 'none',
            }} />
          ))}

          {/* Active scenario badge overlay */}
          {activeBp && (
            <div style={{
              position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
              zIndex: 10, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(7,9,13,0.85)', backdropFilter: 'blur(8px)',
              border: `1px solid ${activeBp.color}30`,
              borderRadius: 20, padding: '5px 14px',
              animation: 'fadeIn 0.4s ease',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeBp.color, boxShadow: `0 0 8px ${activeBp.color}`, animation: 'pulse-dot 2s infinite' }} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: activeBp.color, letterSpacing: 2 }}>
                {activeBp.label.toUpperCase()}
              </span>
            </div>
          )}

          <CanvasWrapper />
          <NodeConfigPanel />
          <EdgeConfigPanel />
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div
          className="right-panel"
          style={{
            width: rightCollapsed ? 0 : 292,
            flexShrink: 0,
            background: '#090C12',
            borderLeft: '1px solid #0D1018',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <div style={{ width: 292, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Metrics — 33% */}
            <div style={{
              height: '33%', flexShrink: 0,
              borderBottom: '1px solid #0D1018',
              padding: '12px 14px',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <PanelHeader icon={<CpuIcon size={11} />} label="SYSTEM METRICS" accent="#10B981" />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <MetricsPanel />
              </div>
            </div>

            {/* AI Narration — 33% */}
            <div style={{
              height: '33%', flexShrink: 0,
              borderBottom: '1px solid #0D1018',
              padding: '12px 14px',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <PanelHeader icon={<TerminalSquare size={11} />} label="AI NARRATION" accent="#8B5CF6" />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <NarrationPanel />
              </div>
            </div>

            {/* Event Timeline — 34% */}
            <div style={{
              flex: 1,
              padding: '12px 14px',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <PanelHeader icon={<Clock size={11} />} label="EVENT TIMELINE" accent="#F59E0B" />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <EventTimeline />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── STATUS BAR ── */}
      <StatusBar scenario={activeScenario} topologyId={topologyIdParam} />

      {/* ── IMPORT DIALOG ── */}
      {showImport && <ImportDialog onClose={() => setShowImport(false)} />}

      {/* ── CHAOS SCRIPT EDITOR ── */}
      {showChaosScript && (
        <ChaosScriptEditor
          onClose={() => setShowChaosScript(false)}
          onExecute={(steps) => { handleChaosScriptExecute(steps); setShowChaosScript(false) }}
          nodeIds={Object.keys(canvasStore.nodeConfigs)}
        />
      )}

      {/* ── SHARE SCENARIO MODAL ── */}
      {showShare && (
        <ShareScenarioModal
          onClose={() => setShowShare(false)}
          nodes={Object.values(canvasStore.nodeConfigs)}
          edges={Object.values(canvasStore.edgeConfigs)}
          topologyName={topologyName || 'My Topology'}
        />
      )}
    </div>
  )
}