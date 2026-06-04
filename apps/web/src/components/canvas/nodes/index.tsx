import { memo } from 'react'
import { type NodeProps, type Node } from '@xyflow/react'
import { BaseNode } from './BaseNode'
import { Cpu, Database, Layers, GitMerge, Zap, Globe, Server } from 'lucide-react'
import type { NodeConfig } from '../../../types/topology'

type CustomNode = Node<{ label: string; config: NodeConfig }>

export const ServiceNode = memo((props: NodeProps<CustomNode>) => (
  <BaseNode {...props} icon={<Cpu size={14} />} accentColor="#6366f1" typeLabel="Service" showReplicas />
))

export const DatabaseNode = memo((props: NodeProps<CustomNode>) => (
  <BaseNode {...props} icon={<Database size={14} />} accentColor="#06b6d4" typeLabel="Database" />
))

export const QueueNode = memo((props: NodeProps<CustomNode>) => (
  <BaseNode {...props} icon={<Layers size={14} />} accentColor="#f59e0b" typeLabel="Message Queue" />
))

export const LoadBalancerNode = memo((props: NodeProps<CustomNode>) => (
  <BaseNode {...props} icon={<GitMerge size={14} />} accentColor="#8b5cf6" typeLabel="Load Balancer" />
))

export const ApiGatewayNode = memo((props: NodeProps<CustomNode>) => (
  <BaseNode {...props} icon={<Zap size={14} />} accentColor="#ec4899" typeLabel="API Gateway" />
))

export const CdnNode = memo((props: NodeProps<CustomNode>) => (
  <BaseNode {...props} icon={<Globe size={14} />} accentColor="#10b981" typeLabel="CDN" />
))

export const ExternalServiceNode = memo((props: NodeProps<CustomNode>) => (
  <BaseNode {...props} icon={<Server size={14} />} accentColor="#64748b" typeLabel="External Service" />
))

export const KafkaNode = memo((props: NodeProps<CustomNode>) => (
  <BaseNode {...props} icon={<Layers size={14} />} accentColor="#ef4444" typeLabel="Kafka Broker" />
))

export const RabbitMqNode = memo((props: NodeProps<CustomNode>) => (
  <BaseNode {...props} icon={<Layers size={14} />} accentColor="#f97316" typeLabel="RabbitMQ" />
))

export const ElasticsearchNode = memo((props: NodeProps<CustomNode>) => (
  <BaseNode {...props} icon={<Database size={14} />} accentColor="#facc15" typeLabel="Elasticsearch" />
))

export const RedisNode = memo((props: NodeProps<CustomNode>) => (
  <BaseNode {...props} icon={<Database size={14} />} accentColor="#dc2626" typeLabel="Redis Cache" />
))

export const CdnEdgeNode = memo((props: NodeProps<CustomNode>) => (
  <BaseNode {...props} icon={<Globe size={14} />} accentColor="#10b981" typeLabel="CDN Edge" />
))

// eslint-disable-next-line react-refresh/only-export-components
export const nodeTypes = {
  service:         ServiceNode,
  database:        DatabaseNode,
  message_queue:   QueueNode,
  load_balancer:   LoadBalancerNode,
  api_gateway:     ApiGatewayNode,
  cdn:             CdnNode,
  external_service: ExternalServiceNode,
  kafka:           KafkaNode,
  rabbitmq:        RabbitMqNode,
  elasticsearch:   ElasticsearchNode,
  redis:           RedisNode,
  cdn_edge:        CdnEdgeNode,
}
