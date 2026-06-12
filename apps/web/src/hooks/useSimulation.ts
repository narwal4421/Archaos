import { useEffect, useRef, useCallback } from 'react'
import { useSimulationStore } from '../stores/simulationStore'
import { useCanvasStore } from '../stores/canvasStore'
import { useNarrationStore } from '../stores/narrationStore'
import type { ChaosAction, TrafficProfile } from '../types/simulation'
import type { NodeConfig, EdgeConfig } from '../types/topology'

export function useSimulation() {
  const workerRef = useRef<Worker | null>(null)
  const { setWorker, applyTick, appendEvent } = useSimulationStore()
  const { nodeConfigs, edgeConfigs } = useCanvasStore()

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/simulation.worker.ts', import.meta.url),
      { type: 'module' }
    )

    worker.onmessage = (e) => {
      const { type, state, event } = e.data
      if (type === 'TICK') applyTick(state)
      if (type === 'EVENT') {
        appendEvent(event)
        
        // Auto-confirm prediction if event matches watchFor
        const { currentEntry, confirmPrediction } = useNarrationStore.getState()
        if (
          currentEntry &&
          !currentEntry.predictionConfirmed &&
          currentEntry.watchFor &&
          (event.nodeId === currentEntry.watchFor ||
           event.edgeId === currentEntry.watchFor ||
           event.message?.toLowerCase().includes(currentEntry.watchFor.toLowerCase()))
        ) {
          confirmPrediction(currentEntry.id)
        }
      }
    }

    workerRef.current = worker
    setWorker(worker)

    return () => {
      worker.terminate()
      setWorker(null)
    }
  }, [appendEvent, applyTick, setWorker])

  const getTopology = useCallback(() => {
    const nodes: NodeConfig[] = Object.values(nodeConfigs)
    const edges: EdgeConfig[] = Object.values(edgeConfigs)
    return { nodes, edges }
  }, [nodeConfigs, edgeConfigs])

  const initialize = useCallback((traffic: TrafficProfile) => {
    const topology = getTopology()
    workerRef.current?.postMessage({ type: 'INITIALIZE', payload: { topology, traffic } })
  }, [getTopology])

  const start = useCallback((traffic: TrafficProfile) => {
    initialize(traffic)
    workerRef.current?.postMessage({ type: 'START' })
  }, [initialize])

  const pause = useCallback(() => {
    workerRef.current?.postMessage({ type: 'PAUSE' })
  }, [])

  const resume = useCallback(() => {
    workerRef.current?.postMessage({ type: 'RESUME' })
  }, [])

  const reset = useCallback(() => {
    workerRef.current?.postMessage({ type: 'RESET' })
  }, [])

  const setSpeed = useCallback((multiplier: number) => {
    workerRef.current?.postMessage({ type: 'SET_SPEED', payload: { multiplier } })
  }, [])

  const setTraffic = useCallback((profile: TrafficProfile) => {
    workerRef.current?.postMessage({ type: 'SET_TRAFFIC', payload: { profile } })
  }, [])

  const injectChaos = useCallback((action: ChaosAction) => {
    workerRef.current?.postMessage({ type: 'INJECT_CHAOS', payload: { action } })
  }, [])

  const scheduleChaos = useCallback((timeSec: number, action: ChaosAction) => {
    workerRef.current?.postMessage({ type: 'SCHEDULE_CHAOS', payload: { timeSec, action } })
  }, [])

  return { start, pause, resume, reset, setSpeed, setTraffic, injectChaos, scheduleChaos }
}
