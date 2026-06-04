import { useCanvasStore } from '../../stores/canvasStore'
import { useChaos } from '../../hooks/useChaos'
import { useBlastRadius } from '../../hooks/useBlastRadius'
import { X, Play, RefreshCw, AlertTriangle, ShieldAlert, Cpu, Database, Layers, Radio } from 'lucide-react'

export function NodeConfigPanel() {
  const { selectedNodeId, setSelectedNodeId, nodeConfigs, setNodeConfig, nodes, edges } = useCanvasStore()
  const chaos = useChaos()
  const { result: blastResult, loading: blastLoading, analyze: runBlast } = useBlastRadius()

  if (!selectedNodeId) return null

  const config = nodeConfigs[selectedNodeId]
  if (!config) return null

  const handleUpdate = (field: string, val: unknown) => {
    setNodeConfig(selectedNodeId, { [field]: val })
  }

  const handleRunBlast = () => {
    runBlast(nodes, edges, selectedNodeId)
  }

  return (
    <div className="fixed top-20 right-4 bottom-4 w-96 bg- border border- rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden text-slate-100 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border- bg-">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            Configure Node
          </h3>
          <p className="text-xs text-slate-400 font-mono">{config.id}</p>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-100"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Parameters */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Parameters</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Label</label>
              <input
                type="text"
                value={config.label}
                onChange={(e) => handleUpdate('label', e.target.value)}
                className="w-full bg-slate-950 border border- rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Logical Layer</label>
              <select
                value={config.layer ?? ''}
                onChange={(e) => handleUpdate('layer', e.target.value || undefined)}
                className="w-full bg-slate-950 border border- rounded px-2.5 py-1.5 text-sm focus:outline-none text-slate-100"
              >
                <option value="">None</option>
                <option value="FRONTEND">Frontend Layer</option>
                <option value="API">API Layer</option>
                <option value="DATA">Data Layer</option>
              </select>
            </div>

            {config.type === 'SERVICE' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Replicas</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={config.replicas ?? 1}
                      onChange={(e) => handleUpdate('replicas', parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border- rounded px-2.5 py-1.5 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Latency (ms)</label>
                    <input
                      type="number"
                      min={10}
                      max={5000}
                      value={config.processingTimeMs ?? 50}
                      onChange={(e) => handleUpdate('processingTimeMs', parseInt(e.target.value) || 50)}
                      className="w-full bg-slate-950 border border- rounded px-2.5 py-1.5 text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">CPU Limit (%)</label>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    step={10}
                    value={config.cpuLimit ?? 100}
                    onChange={(e) => handleUpdate('cpuLimit', parseInt(e.target.value) || 100)}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>50%</span>
                    <span>{config.cpuLimit ?? 100}% CPU</span>
                    <span>200%</span>
                  </div>
                </div>
              </>
            )}

            {(config.type === 'DATABASE' || config.type === 'ELASTICSEARCH' || config.type === 'REDIS') && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Pool Size</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={config.connectionPoolSize ?? 20}
                      onChange={(e) => handleUpdate('connectionPoolSize', parseInt(e.target.value) || 20)}
                      className="w-full bg-slate-950 border border- rounded px-2.5 py-1.5 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Engine</label>
                    <select
                      value={config.dbType ?? 'POSTGRESQL'}
                      onChange={(e) => handleUpdate('dbType', e.target.value)}
                      className="w-full bg-slate-950 border border- rounded px-2.5 py-1.5 text-sm focus:outline-none text-slate-100"
                    >
                      <option value="POSTGRESQL">PostgreSQL</option>
                      <option value="REDIS">Redis Cache</option>
                      <option value="MONGODB">MongoDB</option>
                      <option value="CASSANDRA">Cassandra</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {(config.type === 'MESSAGE_QUEUE' || config.type === 'KAFKA' || config.type === 'RABBITMQ') && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Max Queue Size</label>
                    <input
                      type="number"
                      min={10}
                      max={10000}
                      value={config.maxQueueDepth ?? 300}
                      onChange={(e) => handleUpdate('maxQueueDepth', parseInt(e.target.value) || 300)}
                      className="w-full bg-slate-950 border border- rounded px-2.5 py-1.5 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Broker Type</label>
                    <select
                      value={config.queueType ?? 'KAFKA'}
                      onChange={(e) => handleUpdate('queueType', e.target.value)}
                      className="w-full bg-slate-950 border border- rounded px-2.5 py-1.5 text-sm focus:outline-none text-slate-100"
                    >
                      <option value="KAFKA">Apache Kafka</option>
                      <option value="RABBITMQ">RabbitMQ</option>
                      <option value="SQS">AWS SQS</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {config.type === 'LOAD_BALANCER' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Algorithm</label>
                <select
                  value={config.algorithm ?? 'ROUND_ROBIN'}
                  onChange={(e) => handleUpdate('algorithm', e.target.value)}
                  className="w-full bg-slate-950 border border- rounded px-2.5 py-1.5 text-sm focus:outline-none text-slate-100"
                >
                  <option value="ROUND_ROBIN">Round Robin</option>
                  <option value="LEAST_CONNECTIONS">Least Connections</option>
                  <option value="IP_HASH">IP Hash</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Inject Chaos Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-amber-500" />
            Inject Chaos
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => chaos.killNode(config.id)}
              className="py-2 px-3 bg- hover:bg- border border- hover:border- rounded-lg text-xs font-medium text-red-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldAlert size={14} />
              Kill Node
            </button>
            <button
              onClick={() => chaos.recoverNode(config.id)}
              className="py-2 px-3 bg- hover:bg- border border- hover:border- rounded-lg text-xs font-medium text-emerald-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={14} className="animate-spin-slow" />
              Recover
            </button>

            {config.type === 'SERVICE' && (
              <>
                <button
                  onClick={() => chaos.spikeCpu(config.id)}
                  className="py-2 px-3 bg- hover:bg-slate-750 border border- rounded-lg text-xs text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Cpu size={14} className="text-indigo-400" />
                  Spike CPU
                </button>
                <button
                  onClick={() => chaos.applyMemoryPressure(config.id)}
                  className="py-2 px-3 bg- hover:bg-slate-750 border border- rounded-lg text-xs text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Layers size={14} className="text-amber-400" />
                  Leak Memory
                </button>
                {(config.replicas ?? 1) > 1 && (
                  <button
                    onClick={() => chaos.killReplica(config.id)}
                    className="col-span-2 py-2 px-3 bg- hover:bg-slate-750 border border- rounded-lg text-xs text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Radio size={14} className="text-rose-400" />
                    Kill 1 Replica
                  </button>
                )}
              </>
            )}

            {(config.type === 'DATABASE' || config.type === 'ELASTICSEARCH' || config.type === 'REDIS') && (
              <>
                <button
                  onClick={() => chaos.exhaustConnections(config.id)}
                  className="py-2 px-3 bg- hover:bg-slate-750 border border- rounded-lg text-xs text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Database size={14} className="text-cyan-400" />
                  Exhaust Pool
                </button>
                <button
                  onClick={() => chaos.triggerCacheExpiration(config.id)}
                  className="py-2 px-3 bg- hover:bg-slate-750 border border- rounded-lg text-xs text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={14} className="text-orange-400" />
                  Expire Cache
                </button>
              </>
            )}
          </div>
        </div>

        {/* Blast Radius Analysis Section */}
        <div className="space-y-4 border-t border- pt-5">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={15} className="text-red-500 animate-pulse" />
              Blast Radius Analysis
            </h4>
            <button
              onClick={handleRunBlast}
              disabled={blastLoading}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Play size={10} />
              {blastLoading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>

          {blastResult && (
            <div className="bg- border border- rounded-lg p-3 space-y-3.5 text-xs text-slate-300 font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-">
                <span>Affected Traffic:</span>
                <span className="text-red-400 font-semibold">{blastResult.totalAffectedTrafficPercent}%</span>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-sans font-bold">Risk Matrix:</p>
                {blastResult.affectedNodes.map((n) => (
                  <div key={n.nodeId} className="flex justify-between items-center">
                    <span className="text-slate-200 text-xs">{n.nodeId}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">D:{n.depth}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold ${
                          n.riskLevel === 'CRITICAL'
                            ? 'bg- text-red-400 border border-'
                            : n.riskLevel === 'HIGH'
                            ? 'bg- text-orange-400 border border-'
                            : n.riskLevel === 'MEDIUM'
                            ? 'bg- text-amber-400 border border-'
                            : 'bg- text-emerald-400 border border-'
                        }`}
                      >
                        {n.riskLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
