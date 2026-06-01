import { create } from 'zustand'
import type { SimulationState, SimEvent, TrafficProfile } from '../types/simulation'

export interface SimulationStore {
  simState: SimulationState
  trafficProfile: TrafficProfile
  worker: Worker | null
  blastRadius: Record<string, number>
  isBlastRadiusActive: boolean

  setWorker: (worker: Worker | null) => void
  applyTick: (state: SimulationState) => void
  appendEvent: (event: SimEvent) => void
  setTrafficProfile: (profile: Partial<TrafficProfile>) => void
  setBlastRadius: (data: Record<string, number>) => void
  setBlastRadiusActive: (active: boolean) => void
  reset: () => void
}

const DEFAULT_SIM_STATE: SimulationState = {
  status: 'IDLE',
  currentTimeSec: 0,
  speedMultiplier: 1,
  totalRps: 0,
  totalErrorRatePercent: 0,
  systemP99LatencyMs: 0,
  failedNodeCount: 0,
  nodes: {},
  edges: {},
  eventLog: [],
}

const DEFAULT_TRAFFIC: TrafficProfile = {
  baseRps: 100,
  pattern: 'CONSTANT',
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  simState: DEFAULT_SIM_STATE,
  trafficProfile: DEFAULT_TRAFFIC,
  worker: null,
  blastRadius: {},
  isBlastRadiusActive: false,

  setWorker: (worker) => set({ worker }),

  applyTick: (state) => set({ simState: state }),

  appendEvent: (event) =>
    set((s) => ({
      simState: {
        ...s.simState,
        eventLog: [event, ...s.simState.eventLog].slice(0, 200),
      },
    })),

  setTrafficProfile: (profile) =>
    set((s) => ({ trafficProfile: { ...s.trafficProfile, ...profile } })),

  setBlastRadius: (data) => set({ blastRadius: data }),

  setBlastRadiusActive: (active) => set({ isBlastRadiusActive: active }),

  reset: () =>
    set({
      simState: DEFAULT_SIM_STATE,
      blastRadius: {},
      isBlastRadiusActive: false,
    }),
}))
