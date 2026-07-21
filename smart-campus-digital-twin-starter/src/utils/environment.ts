import type { DayPhase, WeatherKind } from '@/types/digitalTwin'

export type ResolvedDayPhase = Exclude<DayPhase, 'auto'>

export const WEATHER_LABELS: Record<WeatherKind, string> = {
  clear: '晴朗',
  rain: '降雨',
  snow: '降雪',
  sandstorm: '沙尘',
}

export const DAY_PHASE_LABELS: Record<DayPhase, string> = {
  auto: '自动',
  day: '日间',
  dusk: '黄昏',
  night: '夜景',
}

export function resolveDayPhase(phase: DayPhase, date = new Date()): ResolvedDayPhase {
  if (phase !== 'auto') return phase

  const hour = date.getHours() + date.getMinutes() / 60
  if (hour >= 7.5 && hour < 17.2) return 'day'
  if ((hour >= 5.7 && hour < 7.5) || (hour >= 17.2 && hour < 19.4)) return 'dusk'
  return 'night'
}

export function getNightFactor(phase: DayPhase, date = new Date()): number {
  const resolved = resolveDayPhase(phase, date)
  if (resolved === 'day') return 0
  if (resolved === 'dusk') return 0.58
  return 1
}

export function getWeatherVisibility(kind: WeatherKind, intensity: number): number {
  if (kind === 'sandstorm') return 1 - intensity * 0.62
  if (kind === 'rain') return 1 - intensity * 0.28
  if (kind === 'snow') return 1 - intensity * 0.18
  return 1
}
