import { useEffect, useRef } from 'react'
import { useSimulationStore } from '../stores/simulationStore'
import { useCanvasStore } from '../stores/canvasStore'
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
      if (type === 'EVENT') appendEvent(event)
    }

    workerRef.current = worker
    setWorker(worker)

    return () => {
      worker.terminate()
      setWorker(null)
    }
  }, [appendEvent, applyTick, setWorker])

  const getTopology = () => {
    const nodes: NodeConfig[] = Object.values(nodeConfigs)
    const edges: EdgeConfig[] = Object.values(edgeConfigs)
    return { nodes, edges }
  }

  const initialize = (traffic: TrafficProfile) => {
    const topology = getTopology()
    workerRef.current?.postMessage({ type: 'INITIALIZE', payload: { topology, traffic } })
  }

  const start = (traffic: TrafficProfile) => {
    initialize(traffic)
    workerRef.current?.postMessage({ type: 'START' })
  }

  const pause = () => workerRef.current?.postMessage({ type: 'PAUSE' })
  const resume = () => workerRef.current?.postMessage({ type: 'RESUME' })
  const reset = () => workerRef.current?.postMessage({ type: 'RESET' })

  const setSpeed = (multiplier: number) =>
    workerRef.current?.postMessage({ type: 'SET_SPEED', payload: { multiplier } })

  const setTraffic = (profile: TrafficProfile) =>
    workerRef.current?.postMessage({ type: 'SET_TRAFFIC', payload: { profile } })

  const injectChaos = (action: ChaosAction) =>
    workerRef.current?.postMessage({ type: 'INJECT_CHAOS', payload: { action } })

  return { start, pause, resume, reset, setSpeed, setTraffic, injectChaos }
}
