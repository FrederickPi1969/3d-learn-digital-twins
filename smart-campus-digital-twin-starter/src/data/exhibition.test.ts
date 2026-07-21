import { describe, expect, it } from 'vitest'
import { EXHIBITION_HALL, exhibitionExhibits, getExhibitsByZone } from './exhibition'

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

  it('allocates twelve exhibits to each curatorial zone', () => {
    for (const zone of ['A', 'B', 'C', 'D'] as const) {
      expect(getExhibitsByZone(zone)).toHaveLength(12)
    }
  })
})
