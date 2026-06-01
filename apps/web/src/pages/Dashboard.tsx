import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { api } from '../lib/api'
import { Navbar } from '../components/layout/Navbar'
import { Plus, Trash2, Play, BarChart4, Clock, Network, AlertTriangle } from 'lucide-react'
import type { Topology } from '../types/topology'

export function Dashboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [topologies, setTopologies] = useState<Topology[]>([])
  const [loading, setLoading] = useState(true)
  const [newTopologyName, setNewTopologyName] = useState('')
  const [newTopologyDesc, setNewTopologyDesc] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    async function load() {
      try {
        const list = await api.topologies.list()
        setTopologies(list)
      } catch {
        // Mock fallback if DB is unseeded or offline
        setTopologies([
          { id: 'custom-prod', name: 'Production Grid (Mock)', description: 'Simulated multi-datacenter setup with custom caching layers.', isPublic: false, updatedAt: new Date().toISOString(), nodesJson: [], edgesJson: [] },
          { id: 'cascade-test', name: 'Cascade Comparison Model (Mock)', description: 'Identical replica configuration testing CB threshold speeds.', isPublic: true, updatedAt: new Date().toISOString(), nodesJson: [], edgesJson: [] }
        ])
      } finally {
        setLoading(false)
      }
    }
    if (user) load()
  }, [user])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTopologyName) return
    try {
      const created = await api.topologies.create({
        name: newTopologyName,
        description: newTopologyDesc,
        nodesJson: [],
        edgesJson: [],
      })
      setTopologies([created, ...topologies])
      navigate(`/editor?id=${created.id}`)
    } catch {
      // Offline fallback creation
      const mockId = `mock-${Math.random().toString(36).substring(2, 9)}`
      const mockObj = { id: mockId, name: newTopologyName, description: newTopologyDesc, updatedAt: new Date().toISOString(), nodesJson: [], edgesJson: [] }
      setTopologies([mockObj, ...topologies])
      navigate(`/editor?id=${mockId}`)
    } finally {
      setNewTopologyName('')
      setNewTopologyDesc('')
      setShowCreateModal(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await api.topologies.delete(id)
      setTopologies(topologies.filter(t => t.id !== id))
    } catch {
      setTopologies(topologies.filter(t => t.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative select-none">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto w-full pt-24 px-6 pb-12 space-y-8 z-10">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg- border border- rounded-2xl p-6 shadow-xl">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome, {user?.name || 'Developer'}</h2>
            <p className="text-xs text-slate-400 mt-1">Manage your custom visual topologies and review active chaos runs.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/40 transition-colors cursor-pointer"
          >
            <Plus size={15} />
            Create Topology
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg- border border-slate-850 rounded-xl space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Simulations</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">42</span>
              <span className="text-xs font-semibold text-emerald-400 font-mono">+12%</span>
            </div>
            <div className="text-[9px] text-slate-500 flex items-center gap-1">
              <BarChart4 size={10} /> Active runs recorded
            </div>
          </div>
          <div className="p-4 bg- border border-slate-850 rounded-xl space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average Uptime</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">99.8%</span>
              <span className="text-xs font-semibold text-indigo-400 font-mono">+0.2%</span>
            </div>
            <div className="text-[9px] text-slate-500 flex items-center gap-1">
              <Clock size={10} /> Across all environments
            </div>
          </div>
          <div className="p-4 bg- border border-slate-850 rounded-xl space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Nodes Configured</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">84</span>
            </div>
            <div className="text-[9px] text-slate-500 flex items-center gap-1">
              <Network size={10} /> Live visual services
            </div>
          </div>
          <div className="p-4 bg- border border-slate-850 rounded-xl space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Incidents Injected</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-400">183</span>
            </div>
            <div className="text-[9px] text-slate-500 flex items-center gap-1">
              <AlertTriangle size={10} className="text-amber-500" /> Latency, crash, partition runs
            </div>
          </div>
        </div>

        {/* Topologies Library */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            Your Topologies
          </h3>

          {loading ? (
            <div className="text-center py-12 text-sm text-slate-500 font-mono">Loading files...</div>
          ) : topologies.length === 0 ? (
            <div className="text-center py-16 bg- border border-dashed border-slate-850 rounded-2xl space-y-3">
              <p className="text-slate-400 text-sm">No custom topologies found.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-xs font-bold rounded-lg transition-colors border border-"
              >
                Create your first design
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {topologies.map((t) => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/editor?id=${t.id}`)}
                  className="group bg- hover:bg- border border-slate-850 hover:border-slate-750 rounded-2xl p-5 space-y-4 shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors truncate w-4/5">{t.name}</h4>
                      <button
                        onClick={(e) => handleDelete(t.id, e)}
                        className="p-1 hover:bg- rounded border border-transparent hover:border- text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 h-8">{t.description || 'No description provided.'}</p>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-3 border-t border-">
                    <span>UPDATED: {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : 'N/A'}</span>
                    <span className="flex items-center gap-1 text-indigo-400 font-semibold group-hover:underline">
                      Open Sandbox <Play size={8} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg- z-50 flex items-center justify-center p-6 select-none animate-fade-in">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-in text-sm"
          >
            <h3 className="text-lg font-bold">New Topology Layout</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Billing Gateway System"
                  value={newTopologyName}
                  onChange={(e) => setNewTopologyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Description</label>
                <textarea
                  placeholder="Topology to inspect database replication bottlenecks..."
                  value={newTopologyDesc}
                  onChange={(e) => setNewTopologyDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-slate-100"
              >
                Create Sandbox
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
