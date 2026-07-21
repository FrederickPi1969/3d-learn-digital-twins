export type Vec2 = readonly [number, number]
export type Vec3 = readonly [number, number, number]

export type ViewMode = 'campus' | 'building'
export type RenderMode = 'twin' | 'gis'
export type WeatherKind = 'clear' | 'rain' | 'snow' | 'sandstorm'
export type DayPhase = 'auto' | 'day' | 'dusk' | 'night'
export type BuildingCategory =
  | 'office'
  | 'research'
  | 'operations'
  | 'energy'
  | 'parking'
  | 'service'

export type HealthState = 'normal' | 'warning' | 'critical'

export interface BuildingConfig {
  id: string
  code: string
  name: string
  category: BuildingCategory
  position: Vec2
  size: Vec3
  rotation?: number
  floors: number
  occupancy: number
  capacity: number
  powerKw: number
  waterM3: number
  health: HealthState
  accent: string
  description: string
}

export interface RoadConfig {
  id: string
  points: readonly Vec2[]
  width: number
  glow?: boolean
}

export interface CampusTelemetry {
  timestamp: number
  waterTodayM3: number
  powerNowKw: number
  carbonTodayKg: number
  totalOccupancy: number
  availableParking: number
  activeDevices: number
  warnings: number
  waterTrend: number[]
  powerTrend: number[]
  occupancyTrend: number[]
  deviceTrend: number[]
}

export interface BuildingTelemetry {
  timestamp: number
  buildingId: string
  temperatureC: number
  humidityPercent: number
  co2Ppm: number
  pm25UgM3: number
  powerKw: number
  chilledWaterM3h: number
  occupancy: number
  activeDevices: number
  warnings: number
  floorLoads: number[]
}

export interface RoomCell {
  id: string
  floor: number
  label: string
  x: number
  z: number
  width: number
  depth: number
  status: HealthState
  occupancy: number
}

export interface GisAnchor {
  longitude: number
  latitude: number
  height: number
  label: string
}

export interface GisExternalSource {
  tilesetUrl: string
  ionAssetId: string
}
