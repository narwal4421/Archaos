export interface NarrationEntry {
  id: string
  narration: string
  concept: string
  prediction: string
  watchFor: string
  predictionConfirmed?: boolean
  timestamp: number
}

export interface NarrationState {
  isStreaming: boolean
  streamBuffer: string
  entries: NarrationEntry[]
  currentEntry: NarrationEntry | null
}
