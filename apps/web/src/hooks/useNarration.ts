import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useNarrationStore } from '../stores/narrationStore'
import type { NarrationStatus } from '../stores/narrationStore'
import type { SimEvent, SimulationState } from '../types/simulation'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/** Maximum number of auto-reconnect attempts before giving up. */
const MAX_RECONNECT_ATTEMPTS = 8

/**
 * Exponential back-off: 1s, 2s, 4s, 8s … capped at 30s.
 * Adds ±20% jitter to prevent thundering-herd on server restart.
 */
function backoffMs(attempt: number): number {
  const base = Math.min(1000 * 2 ** attempt, 30_000)
  return base * (0.8 + Math.random() * 0.4)
}

export function useNarration(sessionId: string) {
  const socketRef = useRef<Socket | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { startStreaming, appendToken, finishStreaming, setConnectionStatus } = useNarrationStore()
  const [status, setStatus] = useState<NarrationStatus>('connecting')

  // Keep store in sync initially
  useEffect(() => {
    setConnectionStatus(status)
  }, [status, setConnectionStatus])

  useEffect(() => {
    let destroyed = false

    function connect() {
      if (destroyed) return
      setStatus('connecting')

      const socket = io(`${API_URL}/narration`, {
        // Allow polling as fallback — critical for Railway/Heroku deployments
        // where raw WebSocket upgrades can be blocked by load balancers.
        transports: ['polling', 'websocket'],
        // Disable socket.io's own reconnection — we handle it ourselves
        // with exponential backoff so we can track attempt counts properly.
        reconnection: false,
        timeout: 15_000,
        withCredentials: true,
      })

      socket.on('connect', () => {
        reconnectAttemptRef.current = 0
        setStatus('connected')
        socket.emit('narration:subscribe', { sessionId })
        console.info('[useNarration] Connected to narration server at', API_URL)
      })

      socket.on('narration:token', ({ token }: { token: string }) => {
        appendToken(token)
      })

      socket.on('narration:model', ({ model }: { model: string }) => {
        useNarrationStore.getState().setModelUsed(model)
      })

      socket.on(
        'narration:done',
        ({
          concept,
          prediction,
          watchFor,
        }: {
          concept?: string
          prediction?: string
          watchFor?: string
        }) => {
          finishStreaming(concept || 'System Event', prediction || '', watchFor || '')
        },
      )

      socket.on('narration:error', (e: unknown) => {
        console.error('[useNarration] Server error:', e)
      })

      socket.on('disconnect', (reason) => {
        if (destroyed) return
        setStatus('disconnected')
        console.warn(`[useNarration] Disconnected: ${reason}`)

        const attempt = reconnectAttemptRef.current
        if (attempt >= MAX_RECONNECT_ATTEMPTS) {
          console.error('[useNarration] Max reconnect attempts reached. Giving up.')
          setStatus('failed')
          return
        }

        const delay = backoffMs(attempt)
        console.info(`[useNarration] Reconnecting in ${Math.round(delay)}ms (attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS})`)
        reconnectAttemptRef.current += 1
        reconnectTimerRef.current = setTimeout(() => {
          socketRef.current?.removeAllListeners()
          socketRef.current?.disconnect()
          connect()
        }, delay)
      })

      socket.on('connect_error', (err) => {
        console.warn('[useNarration] Connection error:', err.message, '| API URL:', API_URL)
        setStatus('disconnected')
        // disconnect will fire after this and trigger the backoff above
      })

      socketRef.current = socket
    }

    connect()

    return () => {
      destroyed = true
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      socketRef.current?.removeAllListeners()
      socketRef.current?.disconnect()
    }
  }, [sessionId, appendToken, finishStreaming])

  const sendEvent = (event: SimEvent, state: SimulationState, topology: unknown) => {
    if (!socketRef.current?.connected) {
      console.warn('[useNarration] Cannot send event — socket not connected. Status:', status)
      return
    }
    startStreaming()
    socketRef.current.emit('narration:event', { event, state, topology })
  }

  return { sendEvent, status }
}
