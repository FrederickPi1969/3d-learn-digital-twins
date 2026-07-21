import type { Vec3 } from './digitalTwin'

export type ExhibitionZone = 'A' | 'B' | 'C' | 'D'
export type ExhibitCategory =
  | 'digital-art'
  | 'sculpture'
  | 'heritage'
  | 'generative'
  | 'industrial-design'
  | 'hologram'

export type ExhibitDisplayKind =
  | 'painting'
  | 'procedural-sculpture'
  | 'relic'
  | 'hologram'
  | 'imported-model'

export type ExhibitionCameraPreset =
  | 'overview'
  | 'entrance'
  | 'floor-screen'
  | 'kiosk'
  | 'exhibit'

export type ExhibitionAppId =
  | 'browser'
  | 'floor-plan'
  | 'gallery'
  | 'devices'
  | 'schedule'
  | 'settings'

export interface ExhibitConfig {
  id: string
  boothNumber: number
  zone: ExhibitionZone
  title: string
  subtitle: string
  artist: string
  year: number
  category: ExhibitCategory
  displayKind: ExhibitDisplayKind
  variant: number
  position: Vec3
  rotationY: number
  accent: string
  description: string
  modelUrl?: string
  imageUrl?: string
}

export interface ExhibitionZoneConfig {
  id: ExhibitionZone
  name: string
  shortName: string
  accent: string
  description: string
}

export interface ExhibitionScheduleItem {
  id: string
  time: string
  title: string
  location: string
  status: 'scheduled' | 'live' | 'completed'
}

export interface ExhibitionDevice {
  id: string
  name: string
  zone: ExhibitionZone | '公共区'
  kind: 'lighting' | 'display' | 'environment' | 'security'
  status: 'online' | 'warning' | 'offline'
  value: string
}
