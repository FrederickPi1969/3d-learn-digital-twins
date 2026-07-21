import { describe, expect, it } from 'vitest'
import { getNightFactor, getWeatherVisibility, resolveDayPhase } from './environment'

describe('environment utilities', () => {
  it('resolves automatic day phases from local clock time', () => {
    expect(resolveDayPhase('auto', new Date(2026, 0, 1, 12, 0))).toBe('day')
    expect(resolveDayPhase('auto', new Date(2026, 0, 1, 18, 0))).toBe('dusk')
    expect(resolveDayPhase('auto', new Date(2026, 0, 1, 23, 0))).toBe('night')
  })

  it('keeps explicit day phases unchanged', () => {
    expect(resolveDayPhase('day')).toBe('day')
    expect(resolveDayPhase('dusk')).toBe('dusk')
    expect(resolveDayPhase('night')).toBe('night')
  })

  it('maps phases and weather to bounded visual factors', () => {
    expect(getNightFactor('day')).toBe(0)
    expect(getNightFactor('dusk')).toBeCloseTo(0.58)
    expect(getNightFactor('night')).toBe(1)
    expect(getWeatherVisibility('clear', 1)).toBe(1)
    expect(getWeatherVisibility('sandstorm', 1)).toBeCloseTo(0.38)
    expect(getWeatherVisibility('rain', 0.5)).toBeCloseTo(0.86)
  })
})
