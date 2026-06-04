// ShareScenarioModal.tsx — Archaos
// Publish a topology as a shareable scenario to the community marketplace.

import { useState } from 'react'
import { X, Globe, Lock, Zap, CheckCircle2, AlertCircle } from 'lucide-react'
import { api } from '../../lib/api'
import type { NodeConfig, EdgeConfig } from '../../types/topology'

interface Props {
  onClose: () => void
  nodes: NodeConfig[]
  edges: EdgeConfig[]
  topologyName: string
}

const CATEGORY_OPTIONS = [
  { id: 'RESILIENCE', label: 'Resilience', color: '#10B981', desc: 'Circuit breakers, fallbacks, graceful degradation' },
  { id: 'TRAFFIC',    label: 'Traffic',    color: '#F59E0B', desc: 'Overload, spikes, retry storms, throttling' },
  { id: 'DATABASE',   label: 'Database',   color: '#06B6D4', desc: 'Partition, split-brain, connection pool' },
  { id: 'CACHING',    label: 'Caching',    color: '#8B5CF6', desc: 'Cache stampede, eviction, cold start' },
  { id: 'NETWORK',    label: 'Network',    color: '#3B82F6', desc: 'Latency, packet loss, DNS failures' },
  { id: 'MEMORY',     label: 'Memory',     color: '#F97316', desc: 'Leaks, OOM kills, GC pressure' },
]

const DIFFICULTY_OPTIONS = [
  { id: 'BEGINNER',     label: 'BEGINNER',     color: '#10B981' },
  { id: 'INTERMEDIATE', label: 'INTERMEDIATE', color: '#F59E0B' },
  { id: 'ADVANCED',     label: 'ADVANCED',     color: '#EF4444' },
]

export function ShareScenarioModal({ onClose, nodes, edges, topologyName }: Props) {
  const [name, setName] = useState(topologyName || '')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('RESILIENCE')
  const [difficulty, setDifficulty] = useState('INTERMEDIATE')
  const [isPublic, setIsPublic] = useState(true)
  const [focused, setFocused] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handlePublish = async () => {
    if (!name.trim() || !description.trim()) return
    setStatus('loading')
    setErrorMsg('')
    try {
      await api.scenarios.create({
        name: name.trim(),
        description: description.trim(),
        category,
        difficulty,
        isPublic,
        nodesJson: JSON.stringify(nodes),
        edgesJson: JSON.stringify(edges),
        chaosScript: JSON.stringify([]),
        walkthroughScript: JSON.stringify([]),
      })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Failed to publish. Please try again.')
    }
  }

  const selectedCategory = CATEGORY_OPTIONS.find(c => c.id === category)!

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(5,7,11,0.9)', backdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'fadeIn 0.2s ease',
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes float-up { from{opacity:0;transform:translateY(20px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>

      <div style={{
        width: '100%', maxWidth: 520,
        border: '1px solid #1A2030', borderRadius: 18,
        overflow: 'hidden',
        background: '#07090D',
        animation: 'slideUp 0.25s ease',
        boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.08)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '16px 20px',
          borderBottom: '1px solid #141820',
          background: 'rgba(99,102,241,0.04)',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1', boxShadow: '0 0 8px #6366F1' }} />
          <Globe size={13} style={{ color: '#6366F1' }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#8B95A3', letterSpacing: 2.5, flex: 1 }}>
            PUBLISH TO MARKETPLACE
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5568', padding: 4, display: 'flex', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#E8EDF3'}
            onMouseLeave={e => e.currentTarget.style.color = '#4A5568'}
          ><X size={15} /></button>
        </div>

        {/* Success state */}
        {status === 'success' ? (
          <div style={{
            padding: '48px 32px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 16, animation: 'float-up 0.4s ease',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={28} style={{ color: '#10B981' }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: '#E8EDF3', textAlign: 'center', letterSpacing: 2 }}>
                SCENARIO PUBLISHED!
              </div>
              <p style={{ fontSize: 12, color: '#4A5568', textAlign: 'center', marginTop: 6, lineHeight: 1.7, fontFamily: "'DM Sans',sans-serif" }}>
                Your scenario is now live in the community marketplace.<br/>
                Others can discover, upvote, and simulate it.
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '11px 32px', borderRadius: 10,
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Topology summary */}
            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: '#0A0D12', border: '1px solid #141820',
              display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${selectedCategory.color}12`,
                border: `1px solid ${selectedCategory.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Zap size={14} style={{ color: selectedCategory.color }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#E8EDF3', fontFamily: "'DM Sans',sans-serif" }}>
                  {nodes.length} nodes · {edges.length} edges
                </div>
                <div style={{ fontSize: 10, color: '#4A5568', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5, marginTop: 2 }}>
                  {nodes.map(n => n.type).filter((v, i, a) => a.indexOf(v) === i).join(' · ')}
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label style={{ fontSize: 9, color: focused === 'name' ? '#6366F1' : '#4A5568', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2.5, display: 'block', marginBottom: 6, transition: 'color 0.2s' }}>
                SCENARIO NAME
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 8, border: `1px solid ${focused === 'name' ? '#6366F1' : '#1A2030'}`, boxShadow: focused === 'name' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none', transition: 'all 0.2s', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="e.g. Multi-Zone Partition Failure"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, background: '#0A0D12', border: '1px solid transparent', color: '#E8EDF3', fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: 9, color: focused === 'desc' ? '#6366F1' : '#4A5568', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2.5, display: 'block', marginBottom: 6, transition: 'color 0.2s' }}>
                DESCRIPTION
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 8, border: `1px solid ${focused === 'desc' ? '#6366F1' : '#1A2030'}`, boxShadow: focused === 'desc' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none', transition: 'all 0.2s', pointerEvents: 'none' }} />
                <textarea
                  placeholder="Describe what failure mode this scenario tests and what users will learn..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onFocus={() => setFocused('desc')}
                  onBlur={() => setFocused(null)}
                  rows={3}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, background: '#0A0D12', border: '1px solid transparent', color: '#E8EDF3', fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={{ fontSize: 9, color: '#4A5568', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2.5, display: 'block', marginBottom: 8 }}>
                CATEGORY
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {CATEGORY_OPTIONS.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    style={{
                      padding: '8px 6px', borderRadius: 8, cursor: 'pointer',
                      background: category === cat.id ? `${cat.color}12` : '#0A0D12',
                      border: `1px solid ${category === cat.id ? cat.color + '40' : '#141820'}`,
                      color: category === cat.id ? cat.color : '#4A5568',
                      fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
                      letterSpacing: 0.5, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (category !== cat.id) { e.currentTarget.style.borderColor = `${cat.color}20`; e.currentTarget.style.color = cat.color + '80' } }}
                    onMouseLeave={e => { if (category !== cat.id) { e.currentTarget.style.borderColor = '#141820'; e.currentTarget.style.color = '#4A5568' } }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label style={{ fontSize: 9, color: '#4A5568', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2.5, display: 'block', marginBottom: 8 }}>
                DIFFICULTY
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {DIFFICULTY_OPTIONS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
                      background: difficulty === d.id ? `${d.color}12` : '#0A0D12',
                      border: `1px solid ${difficulty === d.id ? d.color + '40' : '#141820'}`,
                      color: difficulty === d.id ? d.color : '#4A5568',
                      fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
                      letterSpacing: 0.5, transition: 'all 0.15s',
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { val: true,  icon: <Globe size={11} />,  label: 'Public',  desc: 'Community can see & upvote', color: '#6366F1' },
                { val: false, icon: <Lock size={11} />,   label: 'Private', desc: 'Only visible to you',       color: '#4A5568' },
              ].map(opt => (
                <button
                  key={String(opt.val)}
                  onClick={() => setIsPublic(opt.val)}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    background: isPublic === opt.val ? `${opt.color}08` : '#0A0D12',
                    border: `1px solid ${isPublic === opt.val ? opt.color + '40' : '#141820'}`,
                    transition: 'all 0.15s',
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isPublic === opt.val ? opt.color : '#4A5568', fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
                    {opt.icon} {opt.label}
                  </div>
                  <div style={{ fontSize: 10, color: '#3A4455', fontFamily: "'DM Sans',sans-serif" }}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Error */}
            {status === 'error' && (
              <div style={{
                padding: '10px 12px', borderRadius: 8,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <AlertCircle size={13} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: '#EF4444', fontFamily: "'DM Sans',sans-serif" }}>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '11px', borderRadius: 9,
                  background: '#0D1118', border: '1px solid #1A2030',
                  color: '#8B95A3', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D3748'; e.currentTarget.style.color = '#E8EDF3' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A2030'; e.currentTarget.style.color = '#8B95A3' }}
              >Cancel</button>
              <button
                onClick={handlePublish}
                disabled={!name.trim() || !description.trim() || status === 'loading'}
                style={{
                  flex: 2, padding: '11px', borderRadius: 9,
                  background: (!name.trim() || !description.trim()) ? '#0D1118' : 'linear-gradient(135deg, #6366F1, #4338CA)',
                  border: `1px solid ${(!name.trim() || !description.trim()) ? '#1A2030' : 'transparent'}`,
                  color: (!name.trim() || !description.trim()) ? '#4A5568' : '#fff',
                  fontSize: 13, fontWeight: 600,
                  cursor: (!name.trim() || !description.trim() || status === 'loading') ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s',
                  boxShadow: (!name.trim() || !description.trim()) ? 'none' : '0 4px 16px rgba(99,102,241,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}
              >
                {status === 'loading' ? (
                  <>
                    <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Publishing...
                  </>
                ) : (
                  <><Globe size={14} /> Publish Scenario</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
