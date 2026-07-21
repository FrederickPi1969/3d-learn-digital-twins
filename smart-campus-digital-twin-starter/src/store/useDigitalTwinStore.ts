import { create } from 'zustand'
import type {
  DayPhase,
  ExperienceMode,
  GisExternalSource,
  RenderMode,
  ViewMode,
  WeatherKind,
} from '@/types/digitalTwin'
import { clamp } from '@/utils/math'

interface DigitalTwinState {
  experienceMode: ExperienceMode
  viewMode: ViewMode
  renderMode: RenderMode
  selectedBuildingId: string | null
  hoveredBuildingId: string | null
  activeFloor: number
  showLabels: boolean
  effectsEnabled: boolean
  telemetryPaused: boolean
  cameraResetNonce: number

  weatherKind: WeatherKind
  weatherIntensity: number
  windSpeed: number
  lightningEnabled: boolean
  dayPhase: DayPhase
  streetLightsEnabled: boolean
  searchlightsEnabled: boolean

  vegetationDensity: number
  vegetationMotionEnabled: boolean
  vehicleCount: number
  pedestrianCount: number
  entitySpeed: number

  extensionPanelOpen: boolean
  showGisCampusLayer: boolean
  showGisZonesLayer: boolean
  showGisOsmBuildings: boolean
  showGisExternalTileset: boolean
  gisExternalSource: GisExternalSource

  setExperienceMode: (mode: ExperienceMode) => void
  toggleExperienceMode: () => void
  enterBuilding: (buildingId: string, defaultFloor?: number) => void
  exitBuilding: () => void
  selectBuilding: (buildingId: string | null) => void
  setHoveredBuilding: (buildingId: string | null) => void
  setActiveFloor: (floor: number) => void
  setRenderMode: (mode: RenderMode) => void
  toggleRenderMode: () => void
  toggleLabels: () => void
  toggleEffects: () => void
  toggleTelemetry: () => void
  requestCameraReset: () => void

  setWeatherKind: (kind: WeatherKind) => void
  cycleWeather: () => void
  setWeatherIntensity: (value: number) => void
  setWindSpeed: (value: number) => void
  toggleLightning: () => void
  setDayPhase: (phase: DayPhase) => void
  cycleDayPhase: () => void
  toggleStreetLights: () => void
  toggleSearchlights: () => void

  setVegetationDensity: (value: number) => void
  toggleVegetationMotion: () => void
  setVehicleCount: (value: number) => void
  setPedestrianCount: (value: number) => void
  setEntitySpeed: (value: number) => void

  toggleExtensionPanel: () => void
  setExtensionPanelOpen: (open: boolean) => void
  toggleGisCampusLayer: () => void
  toggleGisZonesLayer: () => void
  toggleGisOsmBuildings: () => void
  toggleGisExternalTileset: () => void
  setGisExternalSource: (source: Partial<GisExternalSource>) => void
}

const getInitialExperienceMode = (): ExperienceMode => {
  const configuredDefault: ExperienceMode =
    import.meta.env.VITE_DEFAULT_EXPERIENCE === 'campus' ? 'campus' : 'exhibition'
  if (typeof window === 'undefined') return configuredDefault

  const requestedMode = new URLSearchParams(window.location.search).get('experience')
  return requestedMode === 'campus' || requestedMode === 'exhibition'
    ? requestedMode
    : configuredDefault
}

const WEATHER_SEQUENCE: readonly WeatherKind[] = ['clear', 'rain', 'snow', 'sandstorm']
const DAY_PHASE_SEQUENCE: readonly DayPhase[] = ['day', 'dusk', 'night', 'auto']

export const useDigitalTwinStore = create<DigitalTwinState>()((set) => ({
  experienceMode: getInitialExperienceMode(),
  viewMode: 'campus',
  renderMode: 'twin',
  selectedBuildingId: null,
  hoveredBuildingId: null,
  activeFloor: 1,
  showLabels: true,
  effectsEnabled: true,
  telemetryPaused: false,
  cameraResetNonce: 0,

  weatherKind: 'clear',
  weatherIntensity: 0.72,
  windSpeed: 0.38,
  lightningEnabled: true,
  dayPhase: 'night',
  streetLightsEnabled: true,
  searchlightsEnabled: true,

  vegetationDensity: 1,
  vegetationMotionEnabled: true,
  vehicleCount: 18,
  pedestrianCount: 34,
  entitySpeed: 1,

  extensionPanelOpen: false,
  showGisCampusLayer: true,
  showGisZonesLayer: true,
  showGisOsmBuildings: false,
  showGisExternalTileset: false,
  gisExternalSource: {
    tilesetUrl: import.meta.env.VITE_CESIUM_3D_TILES_URL ?? '',
    ionAssetId: import.meta.env.VITE_CESIUM_ION_ASSET_ID ?? '',
  },

  setExperienceMode: (mode) =>
    set((state) => ({
      experienceMode: mode,
      renderMode: mode === 'exhibition' ? 'twin' : state.renderMode,
      viewMode: 'campus',
      selectedBuildingId: null,
      hoveredBuildingId: null,
      extensionPanelOpen: false,
      cameraResetNonce: state.cameraResetNonce + 1,
    })),
  toggleExperienceMode: () =>
    set((state) => ({
      experienceMode: state.experienceMode === 'campus' ? 'exhibition' : 'campus',
      renderMode: 'twin',
      viewMode: 'campus',
      selectedBuildingId: null,
      hoveredBuildingId: null,
      extensionPanelOpen: false,
      cameraResetNonce: state.cameraResetNonce + 1,
    })),
  enterBuilding: (buildingId, defaultFloor = 1) =>
    set({
      experienceMode: 'campus',
      renderMode: 'twin',
      viewMode: 'building',
      selectedBuildingId: buildingId,
      hoveredBuildingId: null,
      activeFloor: Math.max(1, defaultFloor),
    }),
  exitBuilding: () =>
    set((state) => ({
      viewMode: 'campus',
      selectedBuildingId: null,
      hoveredBuildingId: null,
      activeFloor: 1,
      cameraResetNonce: state.cameraResetNonce + 1,
    })),
  selectBuilding: (buildingId) => set({ selectedBuildingId: buildingId }),
  setHoveredBuilding: (buildingId) => set({ hoveredBuildingId: buildingId }),
  setActiveFloor: (floor) => set({ activeFloor: Math.max(1, Math.round(floor)) }),
  setRenderMode: (mode) =>
    set((state) => ({
      experienceMode: 'campus',
      renderMode: mode,
      viewMode: mode === 'gis' ? 'campus' : state.viewMode,
      hoveredBuildingId: null,
      selectedBuildingId: mode === 'gis' ? null : state.selectedBuildingId,
      cameraResetNonce: state.cameraResetNonce + 1,
    })),
  toggleRenderMode: () =>
    set((state) => ({
      experienceMode: 'campus',
      renderMode: state.renderMode === 'twin' ? 'gis' : 'twin',
      viewMode: 'campus',
      selectedBuildingId: null,
      hoveredBuildingId: null,
      cameraResetNonce: state.cameraResetNonce + 1,
    })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  toggleEffects: () => set((state) => ({ effectsEnabled: !state.effectsEnabled })),
  toggleTelemetry: () => set((state) => ({ telemetryPaused: !state.telemetryPaused })),
  requestCameraReset: () =>
    set((state) => ({ cameraResetNonce: state.cameraResetNonce + 1 })),

  setWeatherKind: (kind) => set({ weatherKind: kind }),
  cycleWeather: () =>
    set((state) => {
      const currentIndex = WEATHER_SEQUENCE.indexOf(state.weatherKind)
      return { weatherKind: WEATHER_SEQUENCE[(currentIndex + 1) % WEATHER_SEQUENCE.length] }
    }),
  setWeatherIntensity: (value) => set({ weatherIntensity: clamp(value, 0, 1) }),
  setWindSpeed: (value) => set({ windSpeed: clamp(value, 0, 1) }),
  toggleLightning: () => set((state) => ({ lightningEnabled: !state.lightningEnabled })),
  setDayPhase: (phase) => set({ dayPhase: phase }),
  cycleDayPhase: () =>
    set((state) => {
      const currentIndex = DAY_PHASE_SEQUENCE.indexOf(state.dayPhase)
      return { dayPhase: DAY_PHASE_SEQUENCE[(currentIndex + 1) % DAY_PHASE_SEQUENCE.length] }
    }),
  toggleStreetLights: () =>
    set((state) => ({ streetLightsEnabled: !state.streetLightsEnabled })),
  toggleSearchlights: () =>
    set((state) => ({ searchlightsEnabled: !state.searchlightsEnabled })),

  setVegetationDensity: (value) => set({ vegetationDensity: clamp(value, 0.2, 1.4) }),
  toggleVegetationMotion: () =>
    set((state) => ({ vegetationMotionEnabled: !state.vegetationMotionEnabled })),
  setVehicleCount: (value) => set({ vehicleCount: Math.round(clamp(value, 0, 36)) }),
  setPedestrianCount: (value) =>
    set({ pedestrianCount: Math.round(clamp(value, 0, 72)) }),
  setEntitySpeed: (value) => set({ entitySpeed: clamp(value, 0.2, 2.2) }),

  toggleExtensionPanel: () =>
    set((state) => ({ extensionPanelOpen: !state.extensionPanelOpen })),
  setExtensionPanelOpen: (open) => set({ extensionPanelOpen: open }),
  toggleGisCampusLayer: () =>
    set((state) => ({ showGisCampusLayer: !state.showGisCampusLayer })),
  toggleGisZonesLayer: () =>
    set((state) => ({ showGisZonesLayer: !state.showGisZonesLayer })),
  toggleGisOsmBuildings: () =>
    set((state) => ({ showGisOsmBuildings: !state.showGisOsmBuildings })),
  toggleGisExternalTileset: () =>
    set((state) => ({ showGisExternalTileset: !state.showGisExternalTileset })),
  setGisExternalSource: (source) =>
    set((state) => ({ gisExternalSource: { ...state.gisExternalSource, ...source } })),
}))
