import { motion, AnimatePresence } from 'framer-motion'
import { useNarrationStore } from '../../stores/narrationStore'
import { Brain, Eye, CheckCircle } from 'lucide-react'

const CONCEPT_COLORS: Record<string, string> = {
  'Cascading Failure':     '#ef4444',
  'Circuit Breaker Pattern': '#8b5cf6',
  'Retry Storm':           '#f97316',
  'Thundering Herd':       '#eab308',
  'Split Brain':           '#ec4899',
  'Backpressure':          '#06b6d4',
  'Connection Exhaustion': '#ef4444',
  'Cache Stampede':        '#f59e0b',
  'Chaos Engineering':     '#6366f1',
}

export function NarrationPanel() {
  const { isStreaming, streamBuffer, currentEntry } = useNarrationStore()

  const displayText = isStreaming
    ? (() => {
        try { return JSON.parse(streamBuffer)?.narration || streamBuffer }
        catch { return streamBuffer }
      })()
    : currentEntry?.narration || ''

  const conceptColor = currentEntry?.concept
    ? (CONCEPT_COLORS[currentEntry.concept] || 'var(--accent)')
    : 'var(--text-muted)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Brain size={11} /> AI Narration
        </span>
        {isStreaming && (
          <span className="badge badge-blue" style={{ fontSize: 9 }}>
            <span className="animate-spin" style={{ display: 'inline-block', width: 8, height: 8, border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', marginRight: 4 }} />
            Generating…
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {/* Concept badge */}
        {currentEntry?.concept && (
          <div className="mb-2">
            <span className="badge" style={{
              background: conceptColor + '22',
              color: conceptColor,
              border: `1px solid ${conceptColor}44`,
            }}>
              🔴 {currentEntry.concept}
            </span>
          </div>
        )}

        {/* Narration text */}
        <AnimatePresence mode="wait">
          {(isStreaming || displayText) && (
            <motion.div
              key={currentEntry?.id || 'streaming'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs leading-relaxed mb-3"
              style={{ color: 'var(--text-secondary)' }}
            >
              {displayText}
              {isStreaming && <span className="animate-pulse" style={{ color: 'var(--accent)' }}>▌</span>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prediction box */}
        {currentEntry?.prediction && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg p-3"
            style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.25)',
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Eye size={11} style={{ color: 'var(--accent-bright)' }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--accent-bright)' }}>
                Prediction
              </span>
              {currentEntry.predictionConfirmed && (
                <span className="flex items-center gap-1 ml-auto text-[10px] font-bold"
                  style={{ color: '#22c55e' }}>
                  <CheckCircle size={10} /> Confirmed ✓
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {currentEntry.prediction}
            </p>
            {currentEntry.watchFor && (
              <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(99,102,241,0.2)' }}>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  👁 Watch: <span style={{ color: 'var(--text-secondary)' }}>{currentEntry.watchFor}</span>
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* No activity state */}
        {!isStreaming && !displayText && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Brain size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Start a simulation — the AI will narrate significant events and make predictions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
