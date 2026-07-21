import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string
  unit?: string
  icon?: ReactNode
  accent?: 'cyan' | 'amber' | 'green' | 'red'
  detail?: string
}

export function MetricCard({
  label,
  value,
  unit,
  icon,
  accent = 'cyan',
  detail,
}: MetricCardProps) {
  return (
    <div className={`metric-card metric-card--${accent}`}>
      {icon && <div className="metric-card__icon">{icon}</div>}
      <div className="metric-card__content">
        <span className="metric-card__label">{label}</span>
        <div className="metric-card__value-row">
          <strong>{value}</strong>
          {unit && <span>{unit}</span>}
        </div>
        {detail && <small>{detail}</small>}
      </div>
    </div>
  )
}
