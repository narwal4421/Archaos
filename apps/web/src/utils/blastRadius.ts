/**
 * Client-side blast radius calculator.
 * Pure graph algorithm — works entirely in the browser, no API call needed.
 * Port of apps/api/src/modules/blast/blast.service.ts
 */

interface TopoEdge {
  id: string
  source: string    // React Flow field name
  target: string    // React Flow field name
  sourceId?: string // NodeConfig field name (fallback)
  targetId?: string // NodeConfig field name (fallback)
  data?: { config?: { circuitBreakerEnabled?: boolean; weight?: number } }
}

interface TopoNode {
  id: string
}

export interface BlastRadiusResult {
  rootNodeId: string
  affectedNodes: {
    nodeId: string
    depth: number
    trafficPercent: number
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    isProtectedByCircuitBreaker: boolean
  }[]
  totalAffectedTrafficPercent: number
  criticalPaths: string[][]
}

function src(e: TopoEdge) { return e.source || e.sourceId || '' }
function tgt(e: TopoEdge) { return e.target || e.targetId || '' }

function getTotalInboundWeight(nodeId: string, edges: TopoEdge[]) {
  const inbound = edges.filter(e => tgt(e) === nodeId)
  if (inbound.length === 0) return 1
  return inbound.reduce((sum, e) => sum + (e.data?.config?.weight ?? 1), 0)
}

function findCriticalPaths(startId: string, edges: TopoEdge[]): string[][] {
  const paths: string[][] = []
  const traverse = (currentId: string, path: string[]) => {
    const next = edges.filter(e => src(e) === currentId)
    if (next.length === 0) { paths.push(path); return }
    for (const edge of next) {
      if (!path.includes(tgt(edge))) {
        traverse(tgt(edge), [...path, tgt(edge)])
      } else {
        paths.push(path)
      }
    }
  }
  try { traverse(startId, [startId]) } catch { /* circular */ }
  return paths.sort((a, b) => b.length - a.length).slice(0, 3)
}

export function calculateBlastRadius(
  nodes: TopoNode[],
  edges: TopoEdge[],
  rootNodeId: string,
): BlastRadiusResult {
  const found = nodes.find(n => n.id === rootNodeId)
  if (!found) throw new Error(`Node '${rootNodeId}' not found in topology`)

  const visited = new Map<string, { depth: number; trafficPercent: number }>()
  const queue = [{ nodeId: rootNodeId, depth: 0, trafficPercent: 100 }]

  while (queue.length > 0) {
    const { nodeId: current, depth, trafficPercent } = queue.shift()!

    if (visited.has(current)) {
      const prev = visited.get(current)!
      if (prev.trafficPercent >= trafficPercent) continue
    }
    if (depth > 5) continue

    visited.set(current, { depth, trafficPercent })

    // Walk INBOUND edges (upstream callers affected)
    for (const edge of edges.filter(e => tgt(e) === current)) {
      const totalWeight = getTotalInboundWeight(current, edges)
      const edgeWeight = edge.data?.config?.weight ?? 1
      queue.push({
        nodeId: src(edge),
        depth: depth + 1,
        trafficPercent: trafficPercent * (edgeWeight / totalWeight),
      })
    }

    // Walk OUTBOUND edges (downstream dependencies affected)
    for (const edge of edges.filter(e => src(e) === current)) {
      queue.push({
        nodeId: tgt(edge),
        depth: depth + 1,
        trafficPercent: trafficPercent * 0.8,
      })
    }
  }

  const affectedNodes = Array.from(visited.entries()).map(([id, data]) => {
    let riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
    if (data.depth === 0) riskLevel = 'CRITICAL'
    else if (data.depth === 1) riskLevel = 'HIGH'
    else if (data.depth <= 3) riskLevel = 'MEDIUM'

    const isProtectedByCircuitBreaker = edges.some(
      e => tgt(e) === id && !!e.data?.config?.circuitBreakerEnabled,
    )

    return {
      nodeId: id,
      depth: data.depth,
      trafficPercent: Math.round(data.trafficPercent),
      riskLevel,
      isProtectedByCircuitBreaker,
    }
  })

  const totalAffectedTrafficPercent = Math.round(
    Math.min(
      100,
      affectedNodes.reduce((sum, n) => sum + n.trafficPercent, 0) /
        Math.max(1, affectedNodes.length),
    ),
  )

  return {
    rootNodeId,
    affectedNodes: affectedNodes.sort((a, b) => a.depth - b.depth),
    totalAffectedTrafficPercent,
    criticalPaths: findCriticalPaths(rootNodeId, edges),
  }
}
