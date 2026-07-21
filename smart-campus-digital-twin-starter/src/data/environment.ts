import * as THREE from 'three'
import { campusBuildings, campusRoads } from '@/data/campus'
import type { Vec2 } from '@/types/digitalTwin'
import { seededNoise } from '@/utils/math'

export type VegetationSpecies = 'deciduous' | 'conifer' | 'shrub'

export interface VegetationInstance {
  id: string
  position: Vec2
  scale: number
  rotation: number
  species: VegetationSpecies
  tone: number
}

interface PlantingZone {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  count: number
  speciesBias: number
}

const plantingZones: readonly PlantingZone[] = [
  { minX: -21, maxX: -17.2, minZ: -12.8, maxZ: 12.4, count: 58, speciesBias: 0.28 },
  { minX: 17.1, maxX: 21, minZ: -12.4, maxZ: 12.6, count: 56, speciesBias: 0.34 },
  { minX: -17.5, maxX: 17.5, minZ: 10.8, maxZ: 13.3, count: 52, speciesBias: 0.4 },
  { minX: -17.4, maxX: 17.2, minZ: -13.1, maxZ: -10.5, count: 48, speciesBias: 0.3 },
  { minX: -16.4, maxX: -8.7, minZ: -1.2, maxZ: 2.2, count: 26, speciesBias: 0.12 },
  { minX: 7.0, maxX: 15.6, minZ: -0.5, maxZ: 2.9, count: 28, speciesBias: 0.16 },
  { minX: -7.0, maxX: 7.3, minZ: -4.6, maxZ: 0.1, count: 32, speciesBias: 0.2 },
]

function pointToSegmentDistance(point: Vec2, start: Vec2, end: Vec2): number {
  const dx = end[0] - start[0]
  const dz = end[1] - start[1]
  const lengthSquared = dx * dx + dz * dz
  if (lengthSquared === 0) return Math.hypot(point[0] - start[0], point[1] - start[1])

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point[0] - start[0]) * dx + (point[1] - start[1]) * dz) / lengthSquared,
    ),
  )
  const closestX = start[0] + projection * dx
  const closestZ = start[1] + projection * dz
  return Math.hypot(point[0] - closestX, point[1] - closestZ)
}

function isOutsideBuildings([x, z]: Vec2, margin: number): boolean {
  return campusBuildings.every((building) => {
    const halfWidth = building.size[0] / 2 + margin
    const halfDepth = building.size[2] / 2 + margin
    return (
      Math.abs(x - building.position[0]) > halfWidth ||
      Math.abs(z - building.position[1]) > halfDepth
    )
  })
}

function isOutsideRoads(point: Vec2, margin: number): boolean {
  return campusRoads.every((road) => {
    for (let index = 0; index < road.points.length - 1; index += 1) {
      if (
        pointToSegmentDistance(point, road.points[index], road.points[index + 1]) <
        road.width / 2 + margin
      ) {
        return false
      }
    }
    return true
  })
}

function generateVegetation(): VegetationInstance[] {
  const vegetation: VegetationInstance[] = []
  let seed = 700

  plantingZones.forEach((zone, zoneIndex) => {
    let accepted = 0
    let attempts = 0
    while (accepted < zone.count && attempts < zone.count * 15) {
      const x = zone.minX + seededNoise(seed + attempts * 3) * (zone.maxX - zone.minX)
      const z = zone.minZ + seededNoise(seed + attempts * 5 + 19) * (zone.maxZ - zone.minZ)
      const plantRoll = seededNoise(seed + attempts * 11 + 37)
      const species: VegetationSpecies =
        plantRoll < 0.2
          ? 'shrub'
          : plantRoll < 0.2 + zone.speciesBias
            ? 'conifer'
            : 'deciduous'
      const margin = species === 'shrub' ? 0.42 : 0.78
      const position = [x, z] as const

      if (isOutsideBuildings(position, margin) && isOutsideRoads(position, margin * 0.45)) {
        vegetation.push({
          id: `plant-${zoneIndex}-${accepted}`,
          position,
          scale: species === 'shrub' ? 0.55 + seededNoise(seed + attempts * 17) * 0.5 : 0.78 + seededNoise(seed + attempts * 17) * 0.58,
          rotation: seededNoise(seed + attempts * 23) * Math.PI * 2,
          species,
          tone: seededNoise(seed + attempts * 29),
        })
        accepted += 1
      }
      attempts += 1
    }
    seed += 997
  })

  return vegetation
}

export const vegetationInstances = generateVegetation()

function samplePolyline(points: readonly Vec2[], spacing: number, edgeOffset = 0): Vec2[] {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    points[0][0] === points.at(-1)?.[0] && points[0][1] === points.at(-1)?.[1],
    'catmullrom',
    0.16,
  )
  const samples = Math.max(2, Math.floor(curve.getLength() / spacing))
  return Array.from({ length: samples }, (_, index) => {
    const t = index / samples
    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t).normalize()
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x)
    point.addScaledVector(normal, edgeOffset * (index % 2 === 0 ? 1 : -1))
    return [point.x, point.z] as const
  })
}

export const streetLightPositions: readonly Vec2[] = [
  ...samplePolyline(campusRoads[0].points, 3.4, 1.45),
  ...samplePolyline(campusRoads[1].points, 3.8, 1.05),
]

export const pedestrianRoutes: readonly (readonly Vec2[])[] = [
  [
    [-15.5, 1.7],
    [-10.5, 1.9],
    [-6.5, 1.3],
    [-1.5, 1.5],
    [3.0, 1.7],
    [8.2, 2.1],
    [14.7, 2.9],
  ],
  [
    [-2.2, -10.8],
    [-2.0, -6.0],
    [-1.8, -2.0],
    [-1.1, 2.0],
    [0.1, 6.4],
    [1.2, 11.6],
  ],
  [
    [-13.9, -8.7],
    [-8.8, -5.0],
    [-4.0, -2.3],
    [1.8, -2.0],
    [7.4, -3.2],
    [13.9, -6.7],
  ],
  [
    [-13.5, 7.8],
    [-8.5, 6.3],
    [-3.0, 5.9],
    [2.4, 6.2],
    [7.5, 7.4],
    [13.8, 8.3],
  ],
]

export const searchlightBuildingIds = ['tower-a', 'tower-c', 'tower-d', 'tower-h'] as const
