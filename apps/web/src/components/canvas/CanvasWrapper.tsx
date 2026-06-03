import { useCallback, useRef } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, type Connection, type Node, type Edge,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { nodeTypes } from './nodes'
import { AnimatedEdge } from './edges'
import { useCanvasStore } from '../../stores/canvasStore'
import type { NodeConfig, NodeType } from '../../types/topology'

const edgeTypes = {
  http: AnimatedEdge,
  grpc: AnimatedEdge,
  message: AnimatedEdge,
  database_conn: AnimatedEdge,
}

let idCounter = 1
const genId = () => `node-${idCounter++}`
const genEdgeId = () => `edge-${idCounter++}`

const typeToNodeType: Record<NodeType, string> = {
  SERVICE:         'service',
  DATABASE:        'database',
  MESSAGE_QUEUE:   'message_queue',
  LOAD_BALANCER:   'load_balancer',
  API_GATEWAY:     'api_gateway',
  CDN:             'cdn',
  EXTERNAL_SERVICE:'external_service',
}

const TYPE_DEFAULTS: Record<NodeType, string> = {
  SERVICE:         'Service',
  DATABASE:        'Database',
  MESSAGE_QUEUE:   'Message Queue',
  LOAD_BALANCER:   'Load Balancer',
  API_GATEWAY:     'API Gateway',
  CDN:             'CDN',
  EXTERNAL_SERVICE:'External API',
}

export function CanvasWrapper() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const {
    nodes, edges, setNodes, setEdges,
    onNodesChange, onEdgesChange,
    setSelectedNodeId, setSelectedEdgeId,
    setNodeConfig, setEdgeConfig,
  } = useCanvasStore()

  const onConnect = useCallback((connection: Connection) => {
    const edgeId = genEdgeId()
    const newEdge: Edge = {
      ...connection,
      id: edgeId,
      type: 'http',
      data: { config: { id: edgeId, type: 'HTTP', sourceId: connection.source!, targetId: connection.target! } }
    }
    const updated = addEdge(newEdge, edges)
    setEdges(updated)
    setEdgeConfig(edgeId, {
      id: edgeId, type: 'HTTP',
      sourceId: connection.source!, targetId: connection.target!,
    })
  }, [edges, setEdges, setEdgeConfig])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const nodeType = e.dataTransfer.getData('application/archaos-node-type') as NodeType
    if (!nodeType || !reactFlowWrapper.current) return

    const rect = reactFlowWrapper.current.getBoundingClientRect()
    const x = e.clientX - rect.left - 80
    const y = e.clientY - rect.top - 40

    const id = genId()
    const label = `${TYPE_DEFAULTS[nodeType]} ${idCounter}`
    const config: NodeConfig = {
      id, type: nodeType, label, x, y,
      replicas: nodeType === 'SERVICE' ? 1 : undefined,
      processingTimeMs: nodeType === 'SERVICE' ? 50 : undefined,
      cpuLimit: nodeType === 'SERVICE' ? 100 : undefined,
      connectionPoolSize: nodeType === 'DATABASE' ? 20 : undefined,
    }
    const newNode: Node = {
      id, position: { x, y },
      type: typeToNodeType[nodeType],
      data: { label, config },
    }
    const updated = [...nodes, newNode]
    setNodes(updated)
    setNodeConfig(id, config)
  }, [nodes, setNodes, setNodeConfig])

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    setSelectedNodeId(node.id)
  }, [setSelectedNodeId])

  const onEdgeClick = useCallback((_: unknown, edge: Edge) => {
    setSelectedEdgeId(edge.id)
  }, [setSelectedEdgeId])

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
  }, [setSelectedNodeId, setSelectedEdgeId])

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        defaultEdgeOptions={{ type: 'http', animated: false }}
        style={{ background: '#050505' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#222222"
        />
        <Controls />
        <MiniMap
          nodeColor={n => {
            const type = n.type || ''
            if (type === 'service') return '#6366f1'
            if (type === 'database') return '#06b6d4'
            if (type === 'api_gateway') return '#ec4899'
            return '#525c72'
          }}
          maskColor="rgba(10,11,15,0.7)"
        />
      </ReactFlow>
    </div>
  )
}
