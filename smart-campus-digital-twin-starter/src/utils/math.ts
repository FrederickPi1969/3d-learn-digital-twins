export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export function lerp(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha
}

export function dampFactor(lambda: number, deltaSeconds: number): number {
  return 1 - Math.exp(-lambda * deltaSeconds)
}

export function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

export function generateTrend(
  length: number,
  base: number,
  amplitude: number,
  seed: number,
): number[] {
  return Array.from({ length }, (_, index) => {
    const slowWave = Math.sin((index / Math.max(1, length - 1)) * Math.PI * 2 + seed) * amplitude
    const noise = (seededNoise(seed * 31 + index * 7) - 0.5) * amplitude * 0.7
    return Math.max(0, base + slowWave + noise)
  })
}

export function formatCompact(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value)
}
