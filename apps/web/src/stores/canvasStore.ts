import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'
import type { NodeConfig, EdgeConfig } from '../types/topology'

interface CanvasStore {
  nodes: Node[]
  edges: Edge[]
  nodeConfigs: Record<string, NodeConfig>
  edgeConfigs: Record<string, EdgeConfig>
  selectedNodeId: string | null
  selectedEdgeId: string | null
  topologyName: string
  topologyId: string | null
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setNodeConfig: (id: string, config: Partial<NodeConfig>) => void
  setEdgeConfig: (id: string, config: Partial<EdgeConfig>) => void
  setSelectedNodeId: (id: string | null) => void
  setSelectedEdgeId: (id: string | null) => void
  setTopologyName: (name: string) => void
  setTopologyId: (id: string | null) => void
  loadTopology: (nodes: NodeConfig[], edges: EdgeConfig[]) => void
  reset: () => void
}

const DEFAULT_NODES: Node[] = []
const DEFAULT_EDGES: Edge[] = []

export const useCanvasStore = create<CanvasStore>((set) => ({
  nodes: DEFAULT_NODES,
  edges: DEFAULT_EDGES,
  nodeConfigs: {},
  edgeConfigs: {},
  selectedNodeId: null,
  selectedEdgeId: null,
  topologyName: 'Untitled Topology',
  topologyId: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  setNodeConfig: (id, config) =>
    set((state) => ({
      nodeConfigs: {
        ...state.nodeConfigs,
        [id]: { ...state.nodeConfigs[id], ...config },
      },
    })),

  setEdgeConfig: (id, config) =>
    set((state) => ({
      edgeConfigs: {
        ...state.edgeConfigs,
        [id]: { ...state.edgeConfigs[id], ...config },
      },
    })),

  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  setTopologyName: (name) => set({ topologyName: name }),
  setTopologyId: (id) => set({ topologyId: id }),

  loadTopology: (nodeConfigs, edgeConfigs) => {
    const nodes: Node[] = nodeConfigs.map((nc) => ({
      id: nc.id,
      type: nc.type.toLowerCase(),
      position: { x: nc.x, y: nc.y },
      data: { label: nc.label, config: nc },
    }))
    const edges: Edge[] = edgeConfigs.map((ec) => ({
      id: ec.id,
      source: ec.sourceId,
      target: ec.targetId,
      type: ec.type.toLowerCase(),
      data: { config: ec },
    }))
    const ncMap: Record<string, NodeConfig> = {}
    nodeConfigs.forEach((nc) => { ncMap[nc.id] = nc })
    const ecMap: Record<string, EdgeConfig> = {}
    edgeConfigs.forEach((ec) => { ecMap[ec.id] = ec })

    set({ nodes, edges, nodeConfigs: ncMap, edgeConfigs: ecMap })
  },

  reset: () =>
    set({
      nodes: [],
      edges: [],
      nodeConfigs: {},
      edgeConfigs: {},
      selectedNodeId: null,
      selectedEdgeId: null,
    }),
}))
