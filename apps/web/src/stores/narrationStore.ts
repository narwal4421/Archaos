import { create } from 'zustand'
import type { NarrationEntry } from '../types/narration'

export type NarrationStatus = 'connecting' | 'connected' | 'disconnected' | 'failed'

interface NarrationStore {
  entries: NarrationEntry[]
  isStreaming: boolean
  streamBuffer: string
  currentEntry: NarrationEntry | null
  modelUsed: string | null
  connectionStatus: NarrationStatus

  startStreaming: () => void
  appendToken: (token: string) => void
  finishStreaming: (concept: string, prediction: string, watchFor: string) => void
  confirmPrediction: (entryId: string) => void
  setModelUsed: (model: string | null) => void
  setConnectionStatus: (status: NarrationStatus) => void
  clear: () => void
}

export const useNarrationStore = create<NarrationStore>((set, get) => ({
  entries: [],
  isStreaming: false,
  streamBuffer: '',
  currentEntry: null,
  modelUsed: null,
  connectionStatus: 'connecting',

  startStreaming: () => set({ isStreaming: true, streamBuffer: '', modelUsed: null }),

  appendToken: (token) =>
    set((s) => ({ streamBuffer: s.streamBuffer + token })),

  finishStreaming: (concept, prediction, watchFor) => {
    const { streamBuffer } = get()
    // Try to parse narration from JSON buffer
    let narration = streamBuffer
    try {
      const parsed = JSON.parse(streamBuffer)
      narration = parsed.narration || streamBuffer
    } catch {
      // Raw text fallback
    }

    const entry: NarrationEntry = {
      id: Math.random().toString(36).slice(2),
      narration,
      concept,
      prediction,
      watchFor,
      timestamp: Date.now(),
    }

    set((s) => ({
      isStreaming: false,
      streamBuffer: '',
      currentEntry: entry,
      entries: [entry, ...s.entries].slice(0, 20),
    }))
  },

  confirmPrediction: (entryId) =>
    set((s) => ({
      entries: s.entries.map((e) =>
        e.id === entryId ? { ...e, predictionConfirmed: true } : e
      ),
    })),

  setModelUsed: (model) => set({ modelUsed: model }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  clear: () =>
    set({
      entries: [],
      isStreaming: false,
      streamBuffer: '',
      currentEntry: null,
      modelUsed: null,
      connectionStatus: 'connecting',
    }),
}))
