import {
  Cpu, Database, Layers, GitMerge, Zap, Globe, Server
} from 'lucide-react'
import type { NodeType } from '../../types/topology'

const palette: { type: NodeType; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { type: 'SERVICE',        label: 'Service',        icon: <Cpu size={16} />,      color: '#6366f1', desc: 'Microservice / API' },
  { type: 'DATABASE',       label: 'Database',       icon: <Database size={16} />, color: '#06b6d4', desc: 'SQL / NoSQL / Cache' },
  { type: 'MESSAGE_QUEUE',  label: 'Queue',          icon: <Layers size={16} />,   color: '#f59e0b', desc: 'Kafka / RabbitMQ' },
  { type: 'LOAD_BALANCER',  label: 'Load Balancer',  icon: <GitMerge size={16} />, color: '#8b5cf6', desc: 'Round robin / LCF' },
  { type: 'API_GATEWAY',    label: 'API Gateway',    icon: <Zap size={16} />,      color: '#ec4899', desc: 'Entry point / Auth' },
  { type: 'CDN',            label: 'CDN',            icon: <Globe size={16} />,    color: '#10b981', desc: 'Edge cache layer' },
  { type: 'EXTERNAL_SERVICE', label: 'External API', icon: <Server size={16} />,  color: '#64748b', desc: 'Third-party service' },
]

export function NodePalette() {
  const onDragStart = (e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData('application/archaos-node-type', type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div>
      <div className="panel-header">
        <span className="panel-title">Nodes</span>
      </div>
      <div className="panel-body" style={{ padding: '8px' }}>
        <div className="grid grid-cols-1 gap-1">
          {palette.map(item => (
            <div
              key={item.type}
              draggable
              onDragStart={e => onDragStart(e, item.type)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-150"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = item.color + '66'
                ;(e.currentTarget as HTMLDivElement).style.background = item.color + '11'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
                ;(e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)'
              }}
            >
              <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: item.color + '22', color: item.color }}>
                {item.icon}
              </div>
              <div>
                <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
