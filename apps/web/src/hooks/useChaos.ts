import { useSimulation } from './useSimulation'
import type { ChaosType } from '../types/simulation'

export function useChaos() {
  const { injectChaos } = useSimulation()

  const inject = (type: ChaosType, targetId: string, value?: number, durationSecs?: number) => {
    injectChaos({
      type,
      targetId,
      value,
      durationSecs,
    })
  }

  const killNode = (nodeId: string) => inject('KILL_NODE', nodeId)
  
  const recoverNode = (nodeId: string) => inject('RECOVER_NODE', nodeId)

  const spikeCpu = (nodeId: string) => inject('CPU_SPIKE', nodeId)

  const applyMemoryPressure = (nodeId: string) => inject('MEMORY_PRESSURE', nodeId)

  const killReplica = (nodeId: string) => inject('KILL_ONE_REPLICA', nodeId)

  const exhaustConnections = (nodeId: string) => inject('EXHAUST_CONNECTIONS', nodeId)

  const addLatency = (edgeId: string, latencyMs: number) => inject('ADD_LATENCY', edgeId, latencyMs)

  const dropPackets = (edgeId: string, lossPercent: number) => inject('PACKET_LOSS', edgeId, lossPercent)

  const partitionNetwork = (edgeId: string) => inject('NETWORK_PARTITION', edgeId)

  const triggerCacheExpiration = (nodeId: string) => inject('CACHE_EXPIRE', nodeId)

  return {
    inject,
    killNode,
    recoverNode,
    spikeCpu,
    applyMemoryPressure,
    killReplica,
    exhaustConnections,
    addLatency,
    dropPackets,
    partitionNetwork,
    triggerCacheExpiration,
  }
}
