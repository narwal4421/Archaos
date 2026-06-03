import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useNarrationStore } from '../stores/narrationStore'
import type { SimEvent, SimulationState } from '../types/simulation'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function useNarration(sessionId: string) {
  const socketRef = useRef<Socket | null>(null)
  const { startStreaming, appendToken, finishStreaming } = useNarrationStore()

  useEffect(() => {
    const socket = io(`${API_URL}/narration`, {
      transports: ['websocket'],
      autoConnect: true,
    })

    socket.on('connect', () => {
      socket.emit('narration:subscribe', { sessionId })
    })

    socket.on('narration:token', ({ token }: { token: string }) => {
      appendToken(token)
    })

    socket.on('narration:model', ({ model }: { model: string }) => {
      useNarrationStore.getState().setModelUsed(model)
    })

    socket.on('narration:done', ({ concept, prediction, watchFor }: { concept?: string; prediction?: string; watchFor?: string }) => {
      finishStreaming(concept || 'System Event', prediction || '', watchFor || '')
    })

    socket.on('narration:error', (e: unknown) => {
      console.error('Narration error:', e)
    })

    socketRef.current = socket

    return () => { socket.disconnect() }
  }, [sessionId, appendToken, finishStreaming])

  const sendEvent = (event: SimEvent, state: SimulationState, topology: unknown) => {
    if (!socketRef.current?.connected) return
    startStreaming()
    socketRef.current.emit('narration:event', { event, state, topology })
  }

  return { sendEvent }
}
