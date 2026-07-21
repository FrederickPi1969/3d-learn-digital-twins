import { describe, expect, it } from 'vitest'
import { EXHIBITION_HALL, exhibitionExhibits, getExhibitsByZone } from './exhibition'
import { includedExhibitionAssets } from './exhibitionAssets'

describe('exhibition data', () => {
  it('creates exactly 48 uniquely numbered exhibits', () => {
    expect(exhibitionExhibits).toHaveLength(EXHIBITION_HALL.boothCount)
    expect(new Set(exhibitionExhibits.map((item) => item.id)).size).toBe(48)
    expect(new Set(exhibitionExhibits.map((item) => item.boothNumber)).size).toBe(48)
  })

  it('keeps every exhibit inside the hall footprint', () => {
    for (const exhibit of exhibitionExhibits) {
      expect(Math.abs(exhibit.position[0])).toBeLessThan(EXHIBITION_HALL.width / 2)
      expect(Math.abs(exhibit.position[2])).toBeLessThan(EXHIBITION_HALL.depth / 2)
    }
  })


  it('ships a varied local model catalog and maps it into the hall', () => {
    expect(includedExhibitionAssets.length).toBeGreaterThanOrEqual(18)
    const imported = exhibitionExhibits.filter((item) => item.displayKind === 'imported-model')
    expect(imported.length).toBeGreaterThanOrEqual(18)
    expect(new Set(imported.map((item) => item.modelUrl)).size).toBeGreaterThanOrEqual(16)
    for (const exhibit of imported) {
      expect(exhibit.modelUrl).toMatch(/^\/models\/exhibition\/.+\.glb$/)
      expect(exhibit.assetLicense).toBeTruthy()
      expect(exhibit.assetCredit).toBeTruthy()
    }
  })

  it('allocates twelve exhibits to each curatorial zone', () => {
    for (const zone of ['A', 'B', 'C', 'D'] as const) {
      expect(getExhibitsByZone(zone)).toHaveLength(12)
    }
  })
})
