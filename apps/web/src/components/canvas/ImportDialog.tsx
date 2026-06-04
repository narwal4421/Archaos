import React, { useState } from 'react'
import { X, Upload, Check, AlertCircle, FileCode } from 'lucide-react'
import { parseDockerCompose, parseKubernetesYaml, parseTerraform } from '../../utils/infrastructureParser'
import { useCanvasStore } from '../../stores/canvasStore'

interface ImportDialogProps {
  onClose: () => void
}

export function ImportDialog({ onClose }: ImportDialogProps) {
  const [activeTab, setActiveTab] = useState<'compose' | 'k8s' | 'tf'>('compose')
  const [inputText, setInputText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { loadTopology, setTopologyName } = useCanvasStore()

  const handleImport = () => {
    setError(null)
    setSuccess(false)
    if (!inputText.trim()) {
      setError("Please paste your configuration code first.")
      return
    }

    try {
      let result
      if (activeTab === 'compose') {
        result = parseDockerCompose(inputText)
        setTopologyName("Docker Compose Import")
      } else if (activeTab === 'k8s') {
        result = parseKubernetesYaml(inputText)
        setTopologyName("Kubernetes Import")
      } else {
        result = parseTerraform(inputText)
        setTopologyName("Terraform Import")
      }

      loadTopology(result.nodes, result.edges)
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (e: any) {
      setError(e.message || "Failed to parse the provided configuration.")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setInputText(text)
    }
    reader.readAsText(file)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(5, 5, 8, 0.85)',
      backdropFilter: 'blur(12px)',
      animation: 'fadeIn 0.25s ease-out',
    }}>
      <div style={{
        width: 640,
        background: '#090C12',
        border: '1px solid #141820',
        borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'between',
          padding: '16px 20px',
          borderBottom: '1px solid #0D1018',
        }} className="flex justify-between items-center">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6366F1',
            }}>
              <Upload size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#E8EDF3', fontFamily: "'DM Sans', sans-serif" }}>
                Import Infrastructure
              </h3>
              <p style={{ fontSize: 10, color: '#4A5568', fontFamily: "'JetBrains Mono', monospace" }}>
                Auto-generate topology from configurations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#4A5568', cursor: 'pointer',
              padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#E8EDF3'}
            onMouseLeave={e => e.currentTarget.style.color = '#4A5568'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Format selection tabs */}
          <div style={{ display: 'flex', background: '#07090D', border: '1px solid #141820', borderRadius: 8, padding: 3, gap: 4 }}>
            {(['compose', 'k8s', 'tf'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setError(null); }}
                style={{
                  flex: 1, padding: '8px 12px', border: 'none', borderRadius: 6,
                  fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                  background: activeTab === tab ? '#6366F1' : 'transparent',
                  color: activeTab === tab ? '#FFFFFF' : '#4A5568',
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'compose' ? 'docker-compose.yml' : tab === 'k8s' ? 'Kubernetes YAML' : 'Terraform TF'}
              </button>
            ))}
          </div>

          {/* Paste area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="flex justify-between items-center">
              <label style={{ fontSize: 10, color: '#4A5568', fontFamily: "'JetBrains Mono', monospace" }}>
                PASTE CONFIGURATION CODE
              </label>
              <label style={{
                fontSize: 10, color: '#6366F1', fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <FileCode size={12} /> Upload File
                <input
                  type="file"
                  accept=".yml,.yaml,.tf"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <textarea
              placeholder={
                activeTab === 'compose'
                  ? "version: '3.8'\nservices:\n  web:\n    image: node:alpine\n    depends_on:\n      - redis\n  redis:\n    image: redis:alpine"
                  : activeTab === 'k8s'
                  ? "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-deployment\nspec:\n  replicas: 3\n..."
                  : "resource \"aws_instance\" \"api_service\" {\n  ami = \"ami-123456\"\n}\nresource \"aws_db_instance\" \"postgres_db\" {\n..."
              }
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              style={{
                width: '100%', height: 200, background: '#07090D', border: '1px solid #141820',
                borderRadius: 8, padding: 12, fontSize: 11, color: '#C8D0DA',
                fontFamily: "'JetBrains Mono', monospace", outline: 'none', resize: 'none',
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Feedback Area */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 8, color: '#EF4444', fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 8, color: '#10B981', fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
            }}>
              <Check size={14} style={{ flexShrink: 0 }} />
              <span>Infrastructure successfully imported and rendered on canvas!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px',
          borderTop: '1px solid #0D1018', background: '#07090D',
        }} className="flex justify-end items-center gap-3">
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', background: 'transparent', border: '1px solid #141820',
              borderRadius: 8, color: '#8B95A3', fontSize: 11, fontWeight: 500,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            style={{
              padding: '8px 18px', background: '#6366F1', border: 'none',
              borderRadius: 8, color: '#FFFFFF', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
            }}
          >
            Generate Topology
          </button>
        </div>
      </div>
    </div>
  )
}
