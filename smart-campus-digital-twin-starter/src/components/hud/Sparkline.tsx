import { useId, useMemo } from 'react'

interface SparklineProps {
  values: readonly number[]
  color?: string
  height?: number
  fillOpacity?: number
}

export function Sparkline({
  values,
  color = '#4ee7ff',
  height = 54,
  fillOpacity = 0.16,
}: SparklineProps) {
  const gradientId = useId().replace(/:/g, '')
  const width = 240
  const padding = 3

  const geometry = useMemo(() => {
    const minimum = Math.min(...values)
    const maximum = Math.max(...values)
    const range = Math.max(1, maximum - minimum)
    const points = values.map((value, index) => {
      const x = padding + (index / Math.max(1, values.length - 1)) * (width - padding * 2)
      const y =
        padding +
        (1 - (value - minimum) / range) * (height - padding * 2)
      return [x, y] as const
    })
    const linePath = points
      .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(' ')
    const areaPath = `${linePath} L ${width - padding} ${height - padding} L ${padding} ${
      height - padding
    } Z`
    return { linePath, areaPath }
  }, [height, values])

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={fillOpacity * 1.8} />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={geometry.areaPath} fill={`url(#${gradientId})`} />
      <path d={geometry.linePath} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <path
        d={geometry.linePath}
        fill="none"
        stroke={color}
        strokeWidth="6"
        opacity="0.12"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
