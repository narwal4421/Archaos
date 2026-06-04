import { useNarrationStore } from '../../stores/narrationStore'
import { Brain, ExternalLink } from 'lucide-react'

const CONCEPT_COLORS: Record<string, string> = {
  'Cascading Failure':     '#EF4444',
  'Circuit Breaker Pattern': '#7C3AED',
  'Retry Storm':           '#F97316',
  'Thundering Herd':       '#F59E0B',
  'Split Brain':           '#EC4899',
  'Backpressure':          '#06B6D4',
  'Connection Exhaustion': '#EF4444',
  'Cache Stampede':        '#F59E0B',
  'Chaos Engineering':     '#3B82F6',
}

/** Maps known concept names to their Wikipedia article slugs. */
const CONCEPT_WIKI_SLUGS: Record<string, string> = {
  'Cascading Failure':       'Cascading_failure',
  'Circuit Breaker Pattern': 'Circuit_breaker_design_pattern',
  'Retry Storm':             'Thundering_herd_problem',
  'Thundering Herd':         'Thundering_herd_problem',
  'Split Brain':             'Split-brain_(computing)',
  'Backpressure':            'Back_pressure',
  'Connection Exhaustion':   'Cascading_failure',
  'Cache Stampede':          'Cache_stampede',
  'Chaos Engineering':       'Chaos_engineering',
  'Eventual Consistency':    'Eventual_consistency',
  'Distributed Systems Resilience': 'Fault_tolerance',
}

function getWikiLink(concept?: string): string {
  if (!concept) return 'https://en.wikipedia.org/wiki/Distributed_computing'
  const slug = CONCEPT_WIKI_SLUGS[concept]
  return slug
    ? `https://en.wikipedia.org/wiki/${slug}`
    : `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(concept)}`
}

export function NarrationPanel() {
  const { isStreaming, streamBuffer, currentEntry, modelUsed } = useNarrationStore()

  const displayText = isStreaming
    ? (() => {
        try { 
          return JSON.parse(streamBuffer)?.narration || streamBuffer 
        } catch { 
          const match = streamBuffer.match(/"narration"\s*:\s*"((?:[^"\\]|\\.)*)/)
          if (match) {
            return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
          }
          return streamBuffer 
        }
      })()
    : currentEntry?.narration || ''

  const conceptColor = currentEntry?.concept
    ? (CONCEPT_COLORS[currentEntry.concept] || '#7C3AED')
    : '#444444'

  const tokens = displayText ? displayText.split(' ') : []

  return (
    <div className="h-full flex flex-col justify-between font-['Inter']">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]">
        <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#444444] flex items-center gap-1.5">
          <Brain size={12} className="text-[#7C3AED]" />
          AI Narration
        </span>
        <div className="flex items-center gap-2">
          {modelUsed && (
            <span style={{
              fontSize: 8,
              fontFamily: 'JetBrains Mono',
              padding: '1px 5px',
              borderRadius: 3,
              border: `1px solid ${modelUsed.includes('kimi') ? '#F59E0B44' : '#2D3748'}`,
              color: modelUsed.includes('kimi') ? '#F59E0B' : '#8B95A3',
            }}>
              {modelUsed.includes('kimi') ? 'Kimi K2.6 (fallback)' : 'GPT-OSS-120B'}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[9px] font-semibold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      {/* Narrative & Prediction body */}
      <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
        {/* Concept Badge */}
        {currentEntry?.concept && (
          <div>
            <span
              className="badge text-[10px] font-bold"
              style={{
                background: `${conceptColor}15`,
                color: conceptColor,
                borderColor: `${conceptColor}33`,
              }}
            >
              🔴 {currentEntry.concept}
            </span>
          </div>
        )}

        {/* Narration streaming text (Typewriter) */}
        {displayText ? (
          <div className="text-[13px] leading-relaxed text-[#888888] font-sans">
            {tokens.map((token: string, idx: number) => (
              <span
                key={idx}
                className="narration-token inline-block mr-1"
                style={{ animationDelay: `${idx * 0.02}s` }}
              >
                {token}
              </span>
            ))}
            {isStreaming && (
              <span className="w-1.5 h-4 ml-0.5 bg-[#7C3AED] inline-block animate-pulse" />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-[#444444]">
            <Brain size={24} className="mb-2 opacity-50" />
            <p className="text-[11px] font-medium leading-relaxed">
              Start simulation. The AI will analyze system bottlenecks and narrate live failures.
            </p>
          </div>
        )}

        {/* Prediction Box */}
        {currentEntry?.prediction && !isStreaming && (
          <div className="bg-[#111111] border border-[#7C3AED]/40 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[#7C3AED]">
              <span className="flex items-center gap-1.5">
                📡 Prediction
              </span>
              {currentEntry.predictionConfirmed && (
                <span className="text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded border border-[#10B981]/25 text-[9px] font-bold">
                  ✓ Confirmed
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#888888] leading-relaxed">
              {currentEntry.prediction}
            </p>
            {currentEntry.watchFor && (
              <div className="text-[10px] text-[#444444] border-t border-[#222222] pt-1.5 flex items-center justify-between">
                <span>Watch parameter:</span>
                <span className="text-[#888888] font-mono">{currentEntry.watchFor}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explain more link */}
      {displayText && (
        <div className="pt-3 border-t border-[#1A1A1A] text-right">
          <a
            href={getWikiLink(currentEntry?.concept)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-[#06B6D4] hover:underline cursor-pointer"
          >
            Explain More <ExternalLink size={10} />
          </a>
        </div>
      )}
    </div>
  )
}
