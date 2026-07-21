import { describe, expect, it } from 'vitest'
import { clamp, generateTrend } from './math'

describe('math utilities', () => {
  it('clamps values to a closed interval', () => {
    expect(clamp(-2, 0, 10)).toBe(0)
    expect(clamp(12, 0, 10)).toBe(10)
    expect(clamp(6, 0, 10)).toBe(6)
  })

  it('generates deterministic telemetry trends', () => {
    expect(generateTrend(4, 10, 2, 3)).toEqual(generateTrend(4, 10, 2, 3))
  })
})
