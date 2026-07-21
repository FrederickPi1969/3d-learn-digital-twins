import type { FeatureCollection, Polygon } from 'geojson'
import type { GisAnchor, Vec2 } from '@/types/digitalTwin'

export const CAMPUS_GIS_ANCHOR: GisAnchor = {
  longitude: 120.15515,
  latitude: 30.27415,
  height: 18,
  label: '杭州智慧园区示例锚点',
}

interface CampusZone {
  id: string
  name: string
  category: string
  color: string
  polygon: readonly Vec2[]
}

export const campusZones: readonly CampusZone[] = [
  {
    id: 'zone-rd',
    name: '研发创新区',
    category: 'research',
    color: '#26c8ff',
    polygon: [
      [-17.8, -12.1],
      [8.8, -12.1],
      [8.8, -3.0],
      [-17.8, -3.0],
      [-17.8, -12.1],
    ],
  },
  {
    id: 'zone-core',
    name: '综合运营区',
    category: 'operations',
    color: '#41f1c6',
    polygon: [
      [-16.2, -2.4],
      [16.2, -2.4],
      [16.2, 6.9],
      [-16.2, 6.9],
      [-16.2, -2.4],
    ],
  },
  {
    id: 'zone-service',
    name: '配套服务区',
    category: 'service',
    color: '#9688ff',
    polygon: [
      [-14.8, 7.2],
      [16.3, 7.2],
      [16.3, 12.5],
      [-14.8, 12.5],
      [-14.8, 7.2],
    ],
  },
]

const METERS_PER_DEGREE_LATITUDE = 111_320

export function localMetersToDegrees([east, north]: Vec2): [number, number] {
  const longitudeScale = METERS_PER_DEGREE_LATITUDE * Math.cos((CAMPUS_GIS_ANCHOR.latitude * Math.PI) / 180)
  return [
    CAMPUS_GIS_ANCHOR.longitude + east / longitudeScale,
    CAMPUS_GIS_ANCHOR.latitude + north / METERS_PER_DEGREE_LATITUDE,
  ]
}

export const campusZonesGeoJson: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: campusZones.map((zone) => ({
    type: 'Feature',
    id: zone.id,
    properties: {
      name: zone.name,
      category: zone.category,
      color: zone.color,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [zone.polygon.map(localMetersToDegrees)],
    },
  })),
}
