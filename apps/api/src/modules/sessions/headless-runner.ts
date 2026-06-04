export interface ChaosAction {
  time?: number
  timeSec?: number
  type: string
  targetId: string
  value?: number
}

export interface HeadlessSimResult {
  durationSecs: number
  totalRps: number
  avgErrorRatePercent: number
  peakErrorRatePercent: number
  nodesKilled: number
  slaCompliant: boolean
  timeline: { timeSec: number; errorRatePercent: number; activeFailures: string[] }[]
}

export function runHeadlessSim(
  nodes: any[],
  edges: any[],
  chaosScript: ChaosAction[],
  durationSecs = 30
): HeadlessSimResult {
  let activeFailures: string[] = []
  let totalErrorRateSum = 0
  let peakErrorRate = 0
  let nodesKilled = 0
  const timeline: any[] = []

  // Simple step-by-step tick execution
  for (let t = 1; t <= durationSecs; t++) {
    // 1. Process chaos events scheduled at time t
    const currentActions = chaosScript.filter(a => a.time === t || (a as any).timeSec === t)
    currentActions.forEach(action => {
      const type = action.type
      const target = action.targetId
      
      if (type === 'KILL_NODE') {
        activeFailures.push(target)
        nodesKilled++
      } else if (type === 'RECOVER_NODE') {
        activeFailures = activeFailures.filter(f => f !== target)
      }
    })

    // 2. Compute simulated error rates based on topology dependencies
    // If an API gateway points to a service that is killed, error rate goes to 100% on that path
    let currentErrors = 0
    let totalRequests = 1000 // base load

    // Trace path: Gateways -> Services -> Databases
    const gateways = nodes.filter(n => n.type === 'API_GATEWAY')
    const failedServices = nodes.filter(n => activeFailures.includes(n.id))

    if (failedServices.length > 0) {
      // Calculate fraction of system down
      const affectedFraction = failedServices.length / nodes.length
      currentErrors = totalRequests * affectedFraction * 0.95
    }

    const currentErrorRate = (currentErrors / totalRequests) * 100
    totalErrorRateSum += currentErrorRate
    if (currentErrorRate > peakErrorRate) {
      peakErrorRate = currentErrorRate
    }

    timeline.push({
      timeSec: t,
      errorRatePercent: parseFloat(currentErrorRate.toFixed(2)),
      activeFailures: [...activeFailures],
    })
  }

  const avgErrorRatePercent = parseFloat((totalErrorRateSum / durationSecs).toFixed(2))

  return {
    durationSecs,
    totalRps: 1000,
    avgErrorRatePercent,
    peakErrorRatePercent: parseFloat(peakErrorRate.toFixed(2)),
    nodesKilled,
    slaCompliant: avgErrorRatePercent < 5.0, // SLA breached if avg error rate >= 5%
    timeline,
  }
}
