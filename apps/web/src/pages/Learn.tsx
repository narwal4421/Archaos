// Learn.tsx — Archaos Walkthrough Engine
// Full aesthetic overhaul: war-room terminal, cinematic chaos injection,
// animated quiz checkpoints, mission-completion sequence.
// Logic is 100% preserved from the original.

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
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
  Zap, Terminal, Target, Clock,
} from 'lucide-react'
import type { NodeConfig, EdgeConfig } from '../types/topology'
import type { ChaosAction } from '../types/simulation'

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Fallback data (unchanged from original) ─────────────────────────────────
const SCENARIO_FALLBACKS: Record<string, ScenarioFallback> = {
  'the-cascade': {
    name: 'The Cascade', category: 'CASCADE', difficulty: 'BEGINNER',
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
    name: 'Graceful Degradation', category: 'GRACEFUL_DEGRADATION', difficulty: 'BEGINNER',
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
      { atSec: 25, pause: true, question: 'This is the EXACT same failure as Scenario 1. Circuit breakers are enabled. What happens when Billing Service gets slow?', options: ['The database automatically recovers', 'The circuit breaker on edge-payment-billing trips open, failing fast and protecting upstream services', 'The API Gateway restarts', 'Nothing, the entire system still freezes'], correct: 1 },
    ],
  },
  'the-retry-storm': {
    name: 'The Retry Storm', category: 'RETRY_STORM', difficulty: 'INTERMEDIATE',
    description: 'Aggressive retries without backoff or jitter amplify load 4x on a struggling service.',
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
      { atSec: 25, pause: true, question: 'Payment Service response times exceed the 200ms timeout. With maxRetries=3 and fixed backoff, what happens?', options: ['It provides safety by healing errors', 'It amplifies load on Payment Service by 4x, preventing recovery', 'It triggers automatic scale-out', 'It shuts down the API Gateway'], correct: 1 },
    ],
  },
  'the-thundering-herd': {
    name: 'The Thundering Herd', category: 'THUNDERING_HERD', difficulty: 'INTERMEDIATE',
    description: 'A critical cache item expires, sending a stampede of concurrent requests directly to PostgreSQL.',
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
    name: 'Split Brain', category: 'SPLIT_BRAIN', difficulty: 'ADVANCED',
    description: 'A network partition separates primary and replica databases. Both accept writes independently, causing data divergence.',
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
      { atSec: 25, pause: true, question: 'The database replication link is partitioned. If both databases promote to write-leaders, what is this divergence state called?', options: ['Brain Drain', 'Consensus Storm', 'Split Brain', 'Partition Exhaustion'], correct: 2 },
    ],
  },
  'the-queue-flood': {
    name: 'The Queue Flood', category: 'QUEUE_FLOOD', difficulty: 'INTERMEDIATE',
    description: 'The consumer service dies, causing a Kafka queue to build up. Consumer recovers and drains the backlog.',
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
      { atSec: 25, pause: true, question: 'The Consumer Service is dead and queue depth is rising. What happens at maxQueueDepth?', options: ['Routes messages to PostgreSQL', 'Producers experience backpressure and fail to publish, blocking upstream', 'The queue auto-deletes old messages', 'Kafka restarts the consumer'], correct: 1 },
      { atSec: 50, pause: true, question: 'Consumer has recovered and the backlog is draining. What is the main advantage of the message queue buffer?', options: ['Guarantees strict instantaneous execution', 'Allows the system to absorb spikes and process them asynchronously without losing messages', 'Eliminates database reads', 'Reduces CPU usage to 0%'], correct: 1 },
    ],
  },
  'the-memory-leak': {
    name: 'The Memory Leak', category: 'MEMORY_LEAK', difficulty: 'INTERMEDIATE',
    description: 'A slow memory leak causes heap growth until an OOM Killer restart triggers cyclical downtime.',
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
      { atSec: 25, pause: true, question: 'Leak Service memory is climbing. What happens when it hits 100% memory usage?', options: ['The database shuts down', "The OS OOM Killer crashes the process, causing temporary outage until restart", 'It doubles its physical RAM', 'It switches to static files'], correct: 1 },
    ],
  },
  'traffic-spike-survival': {
    name: 'Traffic Spike Survival', category: 'TRAFFIC_SPIKE', difficulty: 'ADVANCED',
    description: 'A massive 10x traffic spike tests system limits. Your configurations decide what crashes first.',
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
      { atSec: 25, pause: true, question: 'A 10x traffic spike has hit the gateway. Which bottleneck fails first if not properly scaled?', options: ['The API Gateway itself', 'Database (connection pool exhaustion) or services (CPU limits)', 'The canvas animation links', 'Static file hosting'], correct: 1 },
    ],
  },
}

// ─── Difficulty config ────────────────────────────────────────────────────────
const DIFF_META: Record<string, { color: string; glow: string }> = {
  BEGINNER: { color: '#10B981', glow: 'rgba(16,185,129,0.12)' },
  INTERMEDIATE: { color: '#F59E0B', glow: 'rgba(245,158,11,0.12)' },
  ADVANCED: { color: '#EF4444', glow: 'rgba(239,68,68,0.12)' },
}

// ─── Chaos event flash overlay ────────────────────────────────────────────────
function ChaosFlash({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none',
      background: 'rgba(239,68,68,0.04)',
      animation: 'chaosFlash 0.6s ease forwards',
    }} />
  )
}

// ─── Animated progress bar ────────────────────────────────────────────────────
function ProgressBar({ progress, color = '#6366F1' }: { progress: number; color?: string }) {
  return (
    <div style={{
      height: 3, background: '#0D1018', borderRadius: 2,
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        height: '100%', borderRadius: 2,
        background: `linear-gradient(90deg, ${color}, ${color}99)`,
        width: `${Math.min(100, progress)}%`,
        transition: 'width 0.8s ease',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Shimmer */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)',
          animation: 'shimmer 2s linear infinite',
        }} />
      </div>
    </div>
  )
}

// ─── Checkpoint question panel ────────────────────────────────────────────────
function QuestionPanel({
  question, onAnswerSubmit, onSkip,
}: {
  question: WalkthroughQuestion
  onAnswerSubmit: (correct: boolean) => void
  onSkip: () => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 20) }, [])

  const submit = () => {
    if (selected === null) return
    const correct = selected === question.correct
    setResult(correct ? 'correct' : 'wrong')
    if (correct) setTimeout(() => onAnswerSubmit(true), 800)
  }

  return (
    <div style={{
      background: '#090C12',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: 14, overflow: 'hidden',
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      boxShadow: '0 0 40px rgba(99,102,241,0.08)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(99,102,241,0.06)',
        borderBottom: '1px solid rgba(99,102,241,0.15)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {/* Animated pulse */}
        <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1', display: 'block' }} />
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#6366F1', animation: 'pulse-ring 1.4s infinite' }} />
        </div>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#6366F1', letterSpacing: 2.5, fontWeight: 700 }}>
          PREDICTION CHECKPOINT
        </span>
        <div style={{ flex: 1 }} />
        <HelpCircle size={12} style={{ color: '#6366F1', opacity: 0.6 }} />
      </div>

      <div style={{ padding: '16px' }}>
        {/* Question text */}
        <p style={{
          fontSize: 12, color: '#C8D0DA', lineHeight: 1.8,
          fontFamily: "'DM Sans',sans-serif", marginBottom: 16,
          fontWeight: 500,
        }}>{question.question}</p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
          {question.options.map((opt, idx) => {
            const isSelected = selected === idx
            const isCorrect = result === 'correct' && isSelected
            const isWrong = result === 'wrong' && isSelected
            const isReveal = result === 'correct' && idx === question.correct && !isSelected

            let bg = '#0A0D12', border = '#141820', color = '#4A5568'
            if (isSelected && result === null) { bg = 'rgba(99,102,241,0.08)'; border = 'rgba(99,102,241,0.4)'; color = '#E8EDF3' }
            if (isCorrect) { bg = 'rgba(16,185,129,0.08)'; border = 'rgba(16,185,129,0.4)'; color = '#10B981' }
            if (isWrong) { bg = 'rgba(239,68,68,0.08)'; border = 'rgba(239,68,68,0.4)'; color = '#EF4444' }
            if (isReveal) { bg = 'rgba(16,185,129,0.05)'; border = 'rgba(16,185,129,0.2)'; color = '#10B981' }

            return (
              <button
                key={idx}
                onClick={() => { if (!result) setSelected(idx) }}
                disabled={result === 'correct'}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '10px 12px', borderRadius: 8,
                  background: bg, border: `1px solid ${border}`, color,
                  fontSize: 11, lineHeight: 1.6, cursor: result ? 'default' : 'pointer',
                  fontFamily: "'DM Sans',sans-serif",
                  transition: 'all 0.18s ease',
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  animation: `fadeUp 0.3s ${idx * 0.06}s both ease`,
                }}>
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                  color: isSelected || isReveal ? color : '#2A3140',
                  flexShrink: 0, marginTop: 2, letterSpacing: 1, fontWeight: 700,
                }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
                {(isCorrect || isReveal) && <CheckCircle2 size={12} style={{ marginLeft: 'auto', flexShrink: 0, marginTop: 2 }} />}
                {isWrong && <AlertCircle size={12} style={{ marginLeft: 'auto', flexShrink: 0, marginTop: 2 }} />}
              </button>
            )
          })}
        </div>

        {/* Submit / feedback */}
        {result === null && (
          <button
            onClick={submit}
            disabled={selected === null}
            style={{
              width: '100%', padding: '10px',
              background: selected !== null ? 'linear-gradient(135deg, #6366F1, #4338CA)' : '#0D1018',
              border: `1px solid ${selected !== null ? 'transparent' : '#141820'}`,
              borderRadius: 9, color: selected !== null ? '#fff' : '#2A3140',
              fontSize: 11, fontWeight: 700, cursor: selected !== null ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Sans',sans-serif",
              transition: 'all 0.2s',
              boxShadow: selected !== null ? '0 4px 16px rgba(99,102,241,0.25)' : 'none',
            }}>
            Submit Answer
          </button>
        )}

        {result === 'correct' && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 8, marginBottom: 10,
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
            }}>
              <CheckCircle2 size={13} style={{ color: '#10B981' }} />
              <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
                Correct — excellent analysis.
              </span>
            </div>
          </div>
        )}

        {result === 'wrong' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadeUp 0.3s ease' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <AlertCircle size={13} style={{ color: '#EF4444' }} />
              <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
                Incorrect — reconsider the bottleneck.
              </span>
            </div>
            <button
              onClick={onSkip}
              style={{
                width: '100%', padding: '9px',
                background: '#0A0D12', border: '1px solid #1A2030',
                borderRadius: 8, color: '#8B95A3',
                fontSize: 11, cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.2s',
              }}>
              Skip & Continue <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Mission complete card ────────────────────────────────────────────────────
function MissionComplete({ scenarioName, onBack }: { scenarioName: string; onBack: () => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  return (
    <div style={{
      background: 'rgba(16,185,129,0.05)',
      border: '1px solid rgba(16,185,129,0.25)',
      borderRadius: 14, overflow: 'hidden',
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.98)',
      transition: 'all 0.4s ease',
      boxShadow: '0 0 40px rgba(16,185,129,0.08)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(16,185,129,0.08)',
        borderBottom: '1px solid rgba(16,185,129,0.15)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Award size={13} style={{ color: '#10B981' }} />
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#10B981', letterSpacing: 2.5, fontWeight: 700 }}>
          MISSION COMPLETE
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        <p style={{ fontSize: 12, color: '#8B95A3', lineHeight: 1.8, marginBottom: 16, fontFamily: "'DM Sans',sans-serif" }}>
          You've successfully navigated{' '}
          <strong style={{ color: '#E8EDF3' }}>{scenarioName}</strong>
          {' '}and analyzed the failure propagation pattern.
        </p>
        <button
          onClick={onBack}
          style={{
            width: '100%', padding: '11px',
            background: '#10B981', border: '1px solid transparent',
            borderRadius: 9, color: '#07090D',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'DM Sans',sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#059669'}
          onMouseLeave={e => e.currentTarget.style.background = '#10B981'}
        >
          Return to Scenario Grid <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Chaos event log item ─────────────────────────────────────────────────────
function ChaosLogItem({ text, color, delay }: { text: string; color: string; delay: number }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 0',
      borderBottom: '1px solid #0D1018',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : 'translateX(-8px)',
      transition: 'all 0.3s ease',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}` }} />
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#4A5568', letterSpacing: 0.5, lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}

// ─── MAIN LEARN PAGE ──────────────────────────────────────────────────────────
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
    id?: string; name: string; category: string; difficulty: string
    description: string; nodesJson: unknown; edgesJson: unknown
    chaosScript: { atSec: number; action: ChaosAction }[]
    walkthroughScript: WalkthroughQuestion[]
  }

  const [scenario, setScenario] = useState<ScenarioDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [chaosFlash, setChaosFlash] = useState(false)
  const [chaosLog, setChaosLog] = useState<{ text: string; color: string; ts: number }[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<WalkthroughQuestion | null>(null)
  // `completed` is derived — no useState needed. It recomputes automatically
  // when currentTimeSec or executedWalkthroughSet change, avoiding any
  // synchronous setState calls inside effects.

  const executedChaos = useRef<Set<number>>(new Set())
  // useState (not useRef) so reads during render are safe and trigger re-renders
  const [executedWalkthroughSet, setExecutedWalkthroughSet] = useState<Set<number>>(() => new Set())

  const completed = useMemo(() => {
    if (!scenario) return false
    const maxTime = Math.max(...(scenario.walkthroughScript || []).map((w: WalkthroughQuestion) => w.atSec), 30)
    return (
      currentTimeSec >= maxTime &&
      executedWalkthroughSet.size === (scenario.walkthroughScript || []).length &&
      executedWalkthroughSet.size > 0
    )
  }, [scenario, currentTimeSec, executedWalkthroughSet])

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  // Load scenario
  useEffect(() => {
    if (!scenarioId) return
    // setLoading moved inside the async IIFE — avoids calling setState synchronously
    // in the effect body which would cause a cascading render.
    void (async () => {
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
        const fb = SCENARIO_FALLBACKS[scenarioId!]
        if (fb) { setScenario(fb); loadTopology(fb.nodesJson, fb.edgesJson) }
        else setErrorMsg('Scenario not found')
      } finally { setLoading(false) }
    })()
  }, [scenarioId, loadTopology])

  const handleReset = useCallback(() => {
    reset()
    executedChaos.current.clear()
    setExecutedWalkthroughSet(new Set())
    setCurrentQuestion(null)
    setChaosLog([])
  }, [reset])

  const handleStart = useCallback(() => {
    handleReset()
    start({ baseRps: 60, pattern: 'CONSTANT' })
  }, [handleReset, start])

  const handleResume = useCallback(() => {
    setCurrentQuestion(null)
    resume()
  }, [resume])

  // Simulation tick — chaos injection + walkthrough checkpoints
  useEffect(() => {
    if (!scenario || !isSimRunning) return

    scenario.chaosScript?.forEach(item => {
      if (currentTimeSec >= item.atSec && !executedChaos.current.has(item.atSec)) {
        executedChaos.current.add(item.atSec)
        injectChaos(item.action)
        setChaosFlash(true)
        setTimeout(() => setChaosFlash(false), 700)
        setChaosLog(prev => [{
          text: `t+${item.atSec}s — CHAOS: ${item.action.type.replace(/_/g, ' ')} → ${item.action.targetId}`,
          color: '#EF4444',
          ts: Date.now(),
        }, ...prev.slice(0, 7)])
      }
    })

    scenario.walkthroughScript?.forEach((item: WalkthroughQuestion) => {
      if (currentTimeSec >= item.atSec && !executedWalkthroughSet.has(item.atSec)) {
        setExecutedWalkthroughSet(prev => new Set(prev).add(item.atSec))
        pause()
        setCurrentQuestion(item)
      }
    })
  }, [currentTimeSec, scenario, isSimRunning, injectChaos, pause, executedWalkthroughSet])

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = Math.floor(sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const progressPct = (currentTimeSec / 90) * 100
  const diff = scenario ? (DIFF_META[scenario.difficulty] || DIFF_META.ADVANCED) : null

  // ── Loading state ──
  if (loading) return (
    <div style={{ height: '100vh', background: '#07090D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid #141820', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#2A3140', letterSpacing: 3 }}>LOADING SCENARIO...</span>
    </div>
  )

  // ── Error state ──
  if (errorMsg || !scenario) return (
    <div style={{ height: '100vh', background: '#07090D', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <AlertCircle size={40} style={{ color: '#EF4444' }} />
      <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: '#E8EDF3', letterSpacing: 2 }}>{errorMsg || 'SCENARIO NOT FOUND'}</h2>
      <button onClick={() => navigate('/scenarios')} style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#6366F1,#4338CA)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to Scenarios
      </button>
    </div>
  )

  return (
    <div style={{
      height: '100vh', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: '#07090D',
      fontFamily: "'DM Sans',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes shimmer   { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes chaosFlash{ 0%{opacity:1} 100%{opacity:0} }
        @keyframes pulse-ring{ 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(2.2);opacity:0} }
        @keyframes scan-v    { 0%{top:-1px} 100%{top:100%} }
        @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes status-fill{from{width:0} to{width:100%}}
        @keyframes shake     { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }

        ::placeholder{ color:#1A2030; }
        input{ caret-color:#6366F1; }
        ::-webkit-scrollbar{ width:3px; }
        ::-webkit-scrollbar-track{ background:transparent; }
        ::-webkit-scrollbar-thumb{ background:#141820; border-radius:2px; }
      `}</style>

      <ChaosFlash active={chaosFlash} />
      <Navbar />

      {/* ── Top status bar ── */}
      <div style={{
        height: 3, background: '#0D1018', flexShrink: 0, overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          height: '100%',
          background: isSimRunning
            ? `linear-gradient(90deg, #6366F1, #EF4444)`
            : '#141820',
          width: `${progressPct}%`,
          transition: 'width 0.8s ease',
        }} />
      </div>

      {/* ── Main layout ── */}
      <div style={{
        display: 'flex', flex: 1,
        height: 'calc(100vh - 55px)',
        overflow: 'hidden',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}>

        {/* ══ LEFT PANEL ══ */}
        <div style={{
          width: 360, flexShrink: 0,
          background: '#090C12',
          borderRight: '1px solid #0D1018',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto', overflowX: 'hidden',
          animation: 'fadeIn 0.4s 0.1s both ease',
        }}>

          {/* Back nav */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid #0D1018',
            flexShrink: 0,
          }}>
            <button
              onClick={() => navigate('/scenarios')}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'none', border: 'none',
                color: '#4A5568', cursor: 'pointer', fontSize: 11,
                fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
                transition: 'color 0.2s', padding: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#8B95A3'}
              onMouseLeave={e => e.currentTarget.style.color = '#4A5568'}
            >
              <ArrowLeft size={12} /> BACK TO SCENARIOS
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ─ Scenario Header ─ */}
            <div style={{ animation: 'fadeUp 0.4s 0.15s both ease' }}>
              {/* Category + difficulty row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                  color: '#2A3140', letterSpacing: 2,
                }}>{scenario.category.replace(/_/g, ' ')}</span>
                {diff && (
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
                    color: diff.color, letterSpacing: 1.5, fontWeight: 700,
                    background: diff.glow,
                    border: `1px solid ${diff.color}40`,
                    borderRadius: 4, padding: '2px 7px',
                  }}>{scenario.difficulty}</span>
                )}
              </div>

              <h1 style={{
                fontFamily: "'Bebas Neue'", fontSize: 34, letterSpacing: 2,
                color: '#E8EDF3', lineHeight: 0.95, marginBottom: 12,
              }}>{scenario.name}</h1>

              <p style={{
                fontSize: 11, color: '#4A5568', lineHeight: 1.8,
                fontFamily: "'DM Sans',sans-serif",
              }}>{scenario.description}</p>
            </div>

            {/* ─ Simulation controls ─ */}
            <div style={{
              background: '#07090D',
              border: '1px solid #141820', borderRadius: 12,
              overflow: 'hidden', flexShrink: 0,
              animation: 'fadeUp 0.4s 0.2s both ease',
            }}>
              {/* Timer header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: '1px solid #0D1018',
                background: 'rgba(99,102,241,0.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Clock size={11} style={{ color: '#6366F1' }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#4A5568', letterSpacing: 2 }}>SIM TIME</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 18,
                    color: isSimRunning ? '#6366F1' : '#2A3140',
                    fontWeight: 700, letterSpacing: 2,
                    transition: 'color 0.3s',
                    textShadow: isSimRunning ? '0 0 12px rgba(99,102,241,0.5)' : 'none',
                  }}>{formatTime(currentTimeSec)}</span>
                  {isSimRunning && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'blink 1s infinite' }} />
                  )}
                </div>
              </div>

              {/* Progress */}
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #0D1018' }}>
                <ProgressBar progress={progressPct} color={isSimRunning ? '#6366F1' : '#2A3140'} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: '#2A3140', letterSpacing: 1 }}>0:00</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: '#2A3140', letterSpacing: 1 }}>1:30</span>
                </div>
              </div>

              {/* Control buttons */}
              <div style={{ padding: '12px 14px', display: 'flex', gap: 8 }}>
                {simStatus === 'IDLE' && (
                  <button onClick={handleStart} style={{
                    flex: 1, padding: '10px', borderRadius: 9,
                    background: 'linear-gradient(135deg, #6366F1, #4338CA)',
                    border: 'none', color: '#fff',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    fontFamily: "'DM Sans',sans-serif",
                    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    <Play size={13} style={{ fill: 'white' }} /> Start Walkthrough
                  </button>
                )}
                {isSimRunning && (
                  <button onClick={pause} style={{
                    flex: 1, padding: '10px', borderRadius: 9,
                    background: '#0D1118', border: '1px solid #1A2030', color: '#8B95A3',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s',
                  }}>
                    <Pause size={13} /> Pause
                  </button>
                )}
                {isSimPaused && !currentQuestion && (
                  <button onClick={handleResume} style={{
                    flex: 1, padding: '10px', borderRadius: 9,
                    background: 'linear-gradient(135deg, #6366F1, #4338CA)',
                    border: 'none', color: '#fff',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    fontFamily: "'DM Sans',sans-serif",
                    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                  }}>
                    <Play size={13} style={{ fill: 'white' }} /> Resume
                  </button>
                )}
                <button onClick={handleReset} style={{
                  padding: '10px 12px', borderRadius: 9,
                  background: '#0D1118', border: '1px solid #141820',
                  color: '#4A5568', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D3748'; e.currentTarget.style.color = '#8B95A3' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#141820'; e.currentTarget.style.color = '#4A5568' }}
                >
                  <RotateCcw size={13} />
                </button>
              </div>

              {/* Chaos timeline preview */}
              {scenario.chaosScript?.length > 0 && (
                <div style={{ padding: '0 14px 12px' }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: '#2A3140', letterSpacing: 2, marginBottom: 7 }}>CHAOS EVENTS</div>
                  {scenario.chaosScript.map((item, i) => {
                    const pct = (item.atSec / 90) * 100
                    const fired = currentTimeSec >= item.atSec
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: '#2A3140', width: 28, flexShrink: 0 }}>{item.atSec}s</span>
                        <div style={{ flex: 1, height: 2, background: '#141820', borderRadius: 1, position: 'relative', overflow: 'hidden' }}>
                          <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0,
                            width: fired ? '100%' : `${pct}%`,
                            background: fired ? '#EF4444' : '#2A3140',
                            transition: 'all 0.4s ease',
                          }} />
                          <div style={{
                            position: 'absolute', top: -3, left: `${pct}%`,
                            width: 6, height: 6, borderRadius: '50%',
                            background: fired ? '#EF4444' : '#2A3140',
                            transform: 'translateX(-50%)',
                            boxShadow: fired ? '0 0 8px #EF4444' : 'none',
                            transition: 'all 0.3s',
                          }} />
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7, color: fired ? '#EF4444' : '#2A3140', width: 50, flexShrink: 0, letterSpacing: 0.5 }}>
                          {item.action.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ─ Quiz checkpoint ─ */}
            {currentQuestion && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <QuestionPanel
                  question={currentQuestion}
                  onAnswerSubmit={() => handleResume()}
                  onSkip={handleResume}
                />
              </div>
            )}

            {/* ─ Mission complete ─ */}
            {completed && !currentQuestion && (
              <MissionComplete scenarioName={scenario.name} onBack={() => navigate('/scenarios')} />
            )}

            {/* ─ Chaos event log ─ */}
            {chaosLog.length > 0 && (
              <div style={{
                background: '#07090D', border: '1px solid #0D1018',
                borderRadius: 12, overflow: 'hidden',
                animation: 'fadeIn 0.3s ease', flexShrink: 0,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '10px 14px', borderBottom: '1px solid #0D1018',
                  background: 'rgba(239,68,68,0.03)',
                }}>
                  <Terminal size={10} style={{ color: '#EF4444' }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#4A5568', letterSpacing: 2 }}>CHAOS LOG</span>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#EF4444', marginLeft: 'auto', animation: 'blink 1.2s infinite' }} />
                </div>
                <div style={{ padding: '8px 14px' }}>
                  {chaosLog.map((entry, i) => (
                    <ChaosLogItem key={entry.ts} text={entry.text} color={entry.color} delay={i * 60} />
                  ))}
                </div>
              </div>
            )}

            {/* ─ Checkpoint progress ─ */}
            {(scenario.walkthroughScript?.length || 0) > 0 && (
              <div style={{
                background: '#07090D', border: '1px solid #0D1018',
                borderRadius: 12, padding: '12px 14px',
                animation: 'fadeUp 0.4s 0.25s both ease', flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <Target size={10} style={{ color: '#6366F1' }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#4A5568', letterSpacing: 2 }}>CHECKPOINTS</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#2A3140', marginLeft: 'auto' }}>
                    {executedWalkthroughSet.size}/{scenario.walkthroughScript?.length || 0}
                  </span>
                </div>
                {scenario.walkthroughScript?.map((item: WalkthroughQuestion, i: number) => {
                  const done = executedWalkthroughSet.has(item.atSec)
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 0',
                      borderBottom: i < (scenario.walkthroughScript?.length || 0) - 1 ? '1px solid #0D1018' : 'none',
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        background: done ? 'rgba(16,185,129,0.1)' : '#0A0D12',
                        border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : '#141820'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.3s',
                      }}>
                        {done
                          ? <CheckCircle2 size={10} style={{ color: '#10B981' }} />
                          : <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: '#2A3140' }}>{i + 1}</span>
                        }
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: done ? '#8B95A3' : '#2A3140', letterSpacing: 0.3 }}>
                        t+{item.atSec}s
                      </span>
                      <span style={{ fontSize: 10, color: done ? '#4A5568' : '#1E2530', fontFamily: "'DM Sans',sans-serif", flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.question.substring(0, 40)}…
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══ CANVAS ══ */}
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          background: '#07090D',
          animation: 'fadeIn 0.5s 0.05s both ease',
        }}>
          {/* Subtle grid */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '44px 44px',
          }} />

          {/* Scan line */}
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg,transparent,rgba(99,102,241,0.05),transparent)',
            zIndex: 2, pointerEvents: 'none',
            animation: 'scan-v 10s linear infinite',
          }} />

          {/* Active simulation badge */}
          {isSimRunning && (
            <div style={{
              position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
              zIndex: 10, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(7,9,13,0.85)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 20, padding: '5px 14px',
              animation: 'fadeIn 0.4s ease',
            }}>
              <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'block' }} />
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#EF4444', animation: 'pulse-ring 1.2s infinite' }} />
              </span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#EF4444', letterSpacing: 2 }}>
                SIMULATION RUNNING
              </span>
            </div>
          )}

          {/* Chaos flash warning banner */}
          {chaosFlash && (
            <div style={{
              position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
              zIndex: 10, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,0.12)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 20, padding: '7px 18px',
              animation: 'fadeIn 0.1s ease',
            }}>
              <Zap size={12} style={{ color: '#EF4444' }} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#EF4444', letterSpacing: 2 }}>
                CHAOS INJECTED
              </span>
            </div>
          )}

          {/* Paused overlay */}
          {isSimPaused && currentQuestion && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
              background: 'rgba(7,9,13,0.3)',
              backdropFilter: 'blur(1px)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              paddingBottom: 20,
            }}>
              <div style={{
                background: 'rgba(7,9,13,0.9)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 20, padding: '7px 18px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Pause size={11} style={{ color: '#6366F1' }} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#6366F1', letterSpacing: 2 }}>
                  PAUSED — CHECKPOINT ACTIVE
                </span>
              </div>
            </div>
          )}

          {/* Corner brackets */}
          {[{ top: 8, left: 8 }, { top: 8, right: 8 }, { bottom: 8, left: 8 }, { bottom: 8, right: 8 }].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute', ...pos, width: 14, height: 14,
              borderTop: i < 2 ? '1px solid rgba(99,102,241,0.12)' : 'none',
              borderBottom: i >= 2 ? '1px solid rgba(99,102,241,0.12)' : 'none',
              borderLeft: i % 2 === 0 ? '1px solid rgba(99,102,241,0.12)' : 'none',
              borderRight: i % 2 === 1 ? '1px solid rgba(99,102,241,0.12)' : 'none',
              zIndex: 3, pointerEvents: 'none',
            }} />
          ))}

          <CanvasWrapper />
        </div>
      </div>
    </div>
  )
}