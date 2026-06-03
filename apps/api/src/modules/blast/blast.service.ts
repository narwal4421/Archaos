import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TopologyNode {
  id: string;
}

export interface TopologyEdge {
  sourceId: string;
  targetId: string;
  weight?: number;
  circuitBreakerEnabled?: boolean | string;
}

export interface BlastRadiusResult {
  rootNodeId: string;
  affectedNodes: {
    nodeId: string;
    depth: number;
    trafficPercent: number;
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    isProtectedByCircuitBreaker: boolean;
  }[];
  totalAffectedTrafficPercent: number;
  criticalPaths: string[][];
}

@Injectable()
export class BlastService {
  constructor(private prisma: PrismaService) {}

  async calculateBlastRadius(
    nodeId: string,
    topologyId: string,
  ): Promise<BlastRadiusResult> {
    const topology = await this.prisma.topology.findUnique({
      where: { id: topologyId },
    });

    let nodes: TopologyNode[] = [];
    let edges: TopologyEdge[] = [];

    if (topology) {
      nodes = (topology.nodesJson ?? []) as unknown as TopologyNode[];
      edges = (topology.edgesJson ?? []) as unknown as TopologyEdge[];
    } else {
      const scenario = await this.prisma.scenario.findUnique({
        where: { id: topologyId },
      });
      if (!scenario) {
        throw new NotFoundException('Topology or Scenario not found');
      }
      nodes = (scenario.nodesJson ?? []) as unknown as TopologyNode[];
      edges = (scenario.edgesJson ?? []) as unknown as TopologyEdge[];
    }

    return this.calculateBlastRadiusFromData(nodes, edges, nodeId);
  }

  calculateBlastRadiusFromData(
    nodes: TopologyNode[],
    edges: TopologyEdge[],
    rootNodeId: string,
  ): BlastRadiusResult {
    const targetNode = nodes.find((n) => n.id === rootNodeId);
    if (!targetNode) {
      throw new NotFoundException('Node not found in topology');
    }

    const getTotalInboundWeight = (
      nodeIdStr: string,
      edgesList: TopologyEdge[],
    ) => {
      const inbound = edgesList.filter((e) => e.targetId === nodeIdStr);
      if (inbound.length === 0) return 1;
      return inbound.reduce((sum, e) => sum + (e.weight ?? 1), 0);
    };

    const visited = new Map<
      string,
      { depth: number; trafficPercent: number }
    >();
    const queue = [{ nodeId: rootNodeId, depth: 0, trafficPercent: 100 }];

    while (queue.length > 0) {
      const { nodeId: current, depth, trafficPercent } = queue.shift()!;

      if (visited.has(current)) {
        const prev = visited.get(current)!;
        if (prev.trafficPercent >= trafficPercent) {
          continue;
        }
      }

      if (depth > 5) continue;

      visited.set(current, { depth, trafficPercent });

      const inboundEdges = edges.filter((e) => e.targetId === current);
      for (const edge of inboundEdges) {
        const totalWeight = getTotalInboundWeight(current, edges);
        const edgeWeight = edge.weight ?? 1;
        const upstreamTrafficPercent =
          trafficPercent * (edgeWeight / totalWeight);
        queue.push({
          nodeId: edge.sourceId,
          depth: depth + 1,
          trafficPercent: upstreamTrafficPercent,
        });
      }

      const outboundEdges = edges.filter((e) => e.sourceId === current);
      for (const edge of outboundEdges) {
        queue.push({
          nodeId: edge.targetId,
          depth: depth + 1,
          trafficPercent: trafficPercent * 0.8,
        });
      }
    }

    const affectedNodes = Array.from(visited.entries()).map(([id, data]) => {
      let riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (data.depth === 0) riskLevel = 'CRITICAL';
      else if (data.depth === 1) riskLevel = 'HIGH';
      else if (data.depth <= 3) riskLevel = 'MEDIUM';

      const isProtectedByCircuitBreaker = edges.some(
        (e) =>
          e.targetId === id &&
          (e.circuitBreakerEnabled === true ||
            e.circuitBreakerEnabled === 'true'),
      );

      return {
        nodeId: id,
        depth: data.depth,
        trafficPercent: Math.round(data.trafficPercent),
        riskLevel,
        isProtectedByCircuitBreaker,
      };
    });

    const totalAffectedTrafficPercent = Math.round(
      Math.min(
        100,
        affectedNodes.reduce((sum, n) => sum + n.trafficPercent, 0) /
          Math.max(1, affectedNodes.length),
      ),
    );

    const criticalPaths = this.findCriticalPaths(rootNodeId, edges);

    return {
      rootNodeId,
      affectedNodes,
      totalAffectedTrafficPercent,
      criticalPaths,
    };
  }

  private findCriticalPaths(
    startId: string,
    edges: TopologyEdge[],
  ): string[][] {
    const paths: string[][] = [];
    const traverse = (currentId: string, currentPath: string[]) => {
      const nextEdges = edges.filter((e) => e.sourceId === currentId);
      if (nextEdges.length === 0) {
        paths.push(currentPath);
        return;
      }
      for (const edge of nextEdges) {
        if (!currentPath.includes(edge.targetId)) {
          traverse(edge.targetId, [...currentPath, edge.targetId]);
        } else {
          paths.push(currentPath);
        }
      }
    };
    try {
      traverse(startId, [startId]);
    } catch {
      // Catch circular loops
    }
    return paths.sort((a, b) => b.length - a.length).slice(0, 3);
  }
}
