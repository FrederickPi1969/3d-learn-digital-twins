import { create } from 'zustand'
import type {
  ExhibitionAppId,
  ExhibitionCameraPreset,
  ExhibitionZone,
} from '@/types/exhibition'

interface ExhibitionState {
  selectedExhibitId: string | null
  hoveredExhibitId: string | null
  activeZone: ExhibitionZone | 'ALL'
  cameraPreset: ExhibitionCameraPreset
  cameraRequestNonce: number
  showLabels: boolean
  showMiniMap: boolean
  showArchitecture: boolean
  osOpen: boolean
  osInitialApp: ExhibitionAppId | null
  osSessionNonce: number
  floorPlanOpen: boolean
  ambientVisitors: number
  galleryLighting: number
  bloomIntensity: number

  selectExhibit: (id: string | null, focus?: boolean) => void
  setHoveredExhibit: (id: string | null) => void
  setActiveZone: (zone: ExhibitionZone | 'ALL') => void
  requestCamera: (preset: ExhibitionCameraPreset) => void
  toggleLabels: () => void
  toggleMiniMap: () => void
  toggleArchitecture: () => void
  openOs: (initialApp?: ExhibitionAppId | null) => void
  closeOs: () => void
  setFloorPlanOpen: (open: boolean) => void
  setAmbientVisitors: (count: number) => void
  setGalleryLighting: (value: number) => void
  setBloomIntensity: (value: number) => void
  resetExhibition: () => void
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const initialState = {
  selectedExhibitId: null,
  hoveredExhibitId: null,
  activeZone: 'ALL' as const,
  cameraPreset: 'overview' as const,
  cameraRequestNonce: 0,
  showLabels: true,
  showMiniMap: true,
  showArchitecture: true,
  osOpen: false,
  osInitialApp: null,
  osSessionNonce: 0,
  floorPlanOpen: false,
  ambientVisitors: 14,
  galleryLighting: 0.88,
  bloomIntensity: 0.82,
}

export const useExhibitionStore = create<ExhibitionState>()((set) => ({
  ...initialState,
  selectExhibit: (id, focus = true) =>
    set((state) => ({
      selectedExhibitId: id,
      cameraPreset: id && focus ? 'exhibit' : state.cameraPreset,
      cameraRequestNonce: id && focus ? state.cameraRequestNonce + 1 : state.cameraRequestNonce,
    })),
  setHoveredExhibit: (id) => set({ hoveredExhibitId: id }),
  setActiveZone: (zone) => set({ activeZone: zone }),
  requestCamera: (preset) =>
    set((state) => ({ cameraPreset: preset, cameraRequestNonce: state.cameraRequestNonce + 1 })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  toggleMiniMap: () => set((state) => ({ showMiniMap: !state.showMiniMap })),
  toggleArchitecture: () => set((state) => ({ showArchitecture: !state.showArchitecture })),
  openOs: (initialApp = null) =>
    set((state) => ({
      osOpen: true,
      osInitialApp: initialApp,
      osSessionNonce: state.osSessionNonce + 1,
      floorPlanOpen: false,
    })),
  closeOs: () => set({ osOpen: false, osInitialApp: null }),
  setFloorPlanOpen: (open) =>
    set(open ? { floorPlanOpen: true, osOpen: false } : { floorPlanOpen: false }),
  setAmbientVisitors: (count) => set({ ambientVisitors: Math.round(clamp(count, 0, 28)) }),
  setGalleryLighting: (value) => set({ galleryLighting: clamp(value, 0.35, 1.25) }),
  setBloomIntensity: (value) => set({ bloomIntensity: clamp(value, 0, 1.6) }),
  resetExhibition: () =>
    set((state) => ({
      ...initialState,
      cameraRequestNonce: state.cameraRequestNonce + 1,
      osSessionNonce: state.osSessionNonce + 1,
    })),
}))
