import { create } from 'zustand'
import {
  applyNodeChanges, applyEdgeChanges,
  type Node, type Edge, type NodeChange, type EdgeChange
} from '@xyflow/react'
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
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  setNodeConfig: (id: string, config: Partial<NodeConfig>) => void
  setEdgeConfig: (id: string, config: Partial<EdgeConfig>) => void
  setSelectedNodeId: (id: string | null) => void
  setSelectedEdgeId: (id: string | null) => void
  setTopologyName: (name: string) => void
  setTopologyId: (id: string | null) => void
  loadTopology: (nodes: NodeConfig[], edges: EdgeConfig[]) => void
  reset: () => void
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  nodes: [],
  edges: [],
  nodeConfigs: {},
  edgeConfigs: {},
  selectedNodeId: null,
  selectedEdgeId: null,
  topologyName: 'Untitled Topology',
  topologyId: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set((state) => {
      const nextNodes = applyNodeChanges(changes, state.nodes)
      const nextNodeConfigs = { ...state.nodeConfigs }
      nextNodes.forEach((n) => {
        if (nextNodeConfigs[n.id]) {
          const config = n.data?.config as NodeConfig || {}
          nextNodeConfigs[n.id] = {
            ...nextNodeConfigs[n.id],
            ...config,
            x: n.position.x,
            y: n.position.y,
          }
        }
      })
      return { nodes: nextNodes, nodeConfigs: nextNodeConfigs }
    })
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }))
  },

  setNodeConfig: (id, config) =>
    set((state) => {
      const updatedConfig = { ...state.nodeConfigs[id], ...config }
      const updatedNodes = state.nodes.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              label: updatedConfig.label || n.data?.label,
              config: updatedConfig,
            },
          }
        }
        return n
      })
      return {
        nodeConfigs: {
          ...state.nodeConfigs,
          [id]: updatedConfig,
        },
        nodes: updatedNodes,
      }
    }),

  setEdgeConfig: (id, config) =>
    set((state) => {
      const updatedConfig = { ...state.edgeConfigs[id], ...config }
      const updatedEdges = state.edges.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            data: {
              ...e.data,
              config: updatedConfig,
            },
          }
        }
        return e
      })
      return {
        edgeConfigs: {
          ...state.edgeConfigs,
          [id]: updatedConfig,
        },
        edges: updatedEdges,
      }
    }),

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
