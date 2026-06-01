import { useCanvasStore } from '../../stores/canvasStore'
import { useChaos } from '../../hooks/useChaos'
import { X, AlertTriangle, RefreshCw, Zap, Shield } from 'lucide-react'

export function EdgeConfigPanel() {
  const { selectedEdgeId, setSelectedEdgeId, edgeConfigs, setEdgeConfig } = useCanvasStore()
  const chaos = useChaos()

  if (!selectedEdgeId) return null

  const config = edgeConfigs[selectedEdgeId]
  if (!config) return null

  const handleUpdate = (field: string, val: any) => {
    setEdgeConfig(selectedEdgeId, { [field]: val })
  }

  return (
    <div className="fixed top-20 right-4 bottom-4 w-96 bg- border border- rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden text-slate-100 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border- bg-">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
            Configure Edge
          </h3>
          <p className="text-xs text-slate-400 font-mono">{config.id}</p>
        </div>
        <button
          onClick={() => setSelectedEdgeId(null)}
          className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-100"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Connection Type Info */}
        <div className="bg- border border- rounded-lg p-3 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Source:</span>
            <span className="font-mono text-slate-200">{config.sourceId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Target:</span>
            <span className="font-mono text-slate-200">{config.targetId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Protocol:</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-semibold border border-">{config.type}</span>
          </div>
        </div>

        {/* Resilience Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Shield size={15} className="text-indigo-400" />
            Resilience & Retries
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Timeout (ms)</label>
                <input
                  type="number"
                  min={50}
                  max={10000}
                  value={config.timeoutMs ?? 1000}
                  onChange={(e) => handleUpdate('timeoutMs', parseInt(e.target.value) || 1000)}
                  className="w-full bg-slate-950 border border- rounded px-2.5 py-1.5 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Max Retries</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={config.maxRetries ?? 0}
                  onChange={(e) => handleUpdate('maxRetries', parseInt(e.target.value) ?? 0)}
                  className="w-full bg-slate-950 border border- rounded px-2.5 py-1.5 text-sm focus:outline-none"
                />
              </div>
            </div>

            {Number(config.maxRetries) > 0 && (
              <div className="grid grid-cols-2 gap-3 p-3 bg- border border- rounded-lg animate-fade-in">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Retry Delay (ms)</label>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={config.retryDelayMs ?? 100}
                    onChange={(e) => handleUpdate('retryDelayMs', parseInt(e.target.value) || 100)}
                    className="w-full bg-slate-950 border border- rounded px-2.5 py-1.5 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Backoff Pattern</label>
                  <select
                    value={config.retryBackoff ?? 'FIXED'}
                    onChange={(e) => handleUpdate('retryBackoff', e.target.value)}
                    className="w-full bg-slate-950 border border- rounded px-2.5 py-1.5 text-sm focus:outline-none text-slate-100 font-sans"
                  >
                    <option value="FIXED">Fixed</option>
                    <option value="EXPONENTIAL">Exponential</option>
                    <option value="EXPONENTIAL_JITTER">Exp + Jitter</option>
                  </select>
                </div>
              </div>
            )}

            {/* Circuit Breaker Toggle */}
            <div className="flex items-center justify-between p-3 bg- border border- rounded-lg">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200">Circuit Breaker</span>
                <span className="text-[10px] text-slate-400">Prevent cascading downstreams</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!config.circuitBreakerEnabled}
                  onChange={(e) => handleUpdate('circuitBreakerEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-650" />
              </label>
            </div>

            {config.circuitBreakerEnabled && (
              <div className="grid grid-cols-2 gap-3 p-3 bg- border border- rounded-lg animate-fade-in">
                <div>
                  <label className="text-[10px] text-indigo-300 block mb-1">Error Threshold (%)</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={config.cbErrorThresholdPercent ?? 30}
                    onChange={(e) => handleUpdate('cbErrorThresholdPercent', parseInt(e.target.value) || 30)}
                    className="w-full bg-slate-950 border border- rounded px-2.5 py-1.5 text-xs text-indigo-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-indigo-300 block mb-1">Half-Open Delay (s)</label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={config.cbHalfOpenAfterSecs ?? 15}
                    onChange={(e) => handleUpdate('cbHalfOpenAfterSecs', parseInt(e.target.value) || 15)}
                    className="w-full bg-slate-950 border border- rounded px-2.5 py-1.5 text-xs text-indigo-200 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Network Chaos Section */}
        <div className="space-y-4 border-t border-slate-850 pt-5">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-amber-500" />
            Inject Edge Chaos
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => chaos.partitionNetwork(config.id)}
                className="py-2 px-3 bg- hover:bg- border border- hover:border- rounded-lg text-xs font-medium text-red-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <Zap size={14} className="rotate-12" />
                Network Partition
              </button>
              <button
                onClick={() => {
                  // Simply reset edge status on simulation worker
                  handleUpdate('addedLatencyMs', 0)
                  handleUpdate('packetLossPercent', 0)
                  handleUpdate('isPartitioned', false)
                  chaos.recoverNode(config.id)
                }}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-750 border border- rounded-lg text-xs text-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} />
                Reset Edge
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 flex justify-between mb-1">
                <span>Add Latency (ms)</span>
                <span className="font-semibold text-indigo-400">{config.addedLatencyMs ?? 0}ms</span>
              </label>
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={config.addedLatencyMs ?? 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0
                  handleUpdate('addedLatencyMs', val)
                  chaos.addLatency(config.id, val)
                }}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 flex justify-between mb-1">
                <span>Packet Loss (%)</span>
                <span className="font-semibold text-rose-400">{config.packetLossPercent ?? 0}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={config.packetLossPercent ?? 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0
                  handleUpdate('packetLossPercent', val)
                  chaos.dropPackets(config.id, val)
                }}
                className="w-full accent-rose-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
