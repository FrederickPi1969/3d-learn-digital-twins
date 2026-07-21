import type { ReactNode } from 'react'

interface PanelFrameProps {
  title: string
  eyebrow?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function PanelFrame({ title, eyebrow, children, className = '', action }: PanelFrameProps) {
  return (
    <section className={`hud-panel ${className}`}>
      <div className="hud-panel__corner hud-panel__corner--top-left" />
      <div className="hud-panel__corner hud-panel__corner--bottom-right" />
      <header className="hud-panel__header">
        <div>
          {eyebrow && <span className="hud-panel__eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        {action && <div className="hud-panel__action">{action}</div>}
      </header>
      <div className="hud-panel__body">{children}</div>
    </section>
  )
}
