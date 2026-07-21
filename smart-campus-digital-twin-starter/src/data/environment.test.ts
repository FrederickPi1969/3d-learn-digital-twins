import { describe, expect, it } from 'vitest'
import { pedestrianRoutes, streetLightPositions, vegetationInstances } from './environment'

describe('procedural campus environment data', () => {
  it('generates a stable, unique vegetation population inside campus bounds', () => {
    expect(vegetationInstances.length).toBeGreaterThan(200)
    expect(new Set(vegetationInstances.map((instance) => instance.id)).size).toBe(
      vegetationInstances.length,
    )

    vegetationInstances.forEach((instance) => {
      expect(Number.isFinite(instance.position[0])).toBe(true)
      expect(Number.isFinite(instance.position[1])).toBe(true)
      expect(Math.abs(instance.position[0])).toBeLessThanOrEqual(22)
      expect(Math.abs(instance.position[1])).toBeLessThanOrEqual(14)
      expect(instance.scale).toBeGreaterThan(0)
      expect(instance.tone).toBeGreaterThanOrEqual(0)
      expect(instance.tone).toBeLessThanOrEqual(1)
    })
  })

  it('contains all vegetation classes and usable movement paths', () => {
    const species = new Set(vegetationInstances.map((instance) => instance.species))
    expect(species).toEqual(new Set(['deciduous', 'conifer', 'shrub']))
    expect(streetLightPositions.length).toBeGreaterThan(10)
    expect(pedestrianRoutes.length).toBeGreaterThanOrEqual(3)
    pedestrianRoutes.forEach((route) => expect(route.length).toBeGreaterThanOrEqual(4))
  })
})
