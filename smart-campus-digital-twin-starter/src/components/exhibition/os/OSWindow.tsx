import type { ReactNode } from 'react'
import { Maximize2, Minimize2, Minus, X } from 'lucide-react'
import { Rnd } from 'react-rnd'
import type { ExhibitionAppId } from '@/types/exhibition'

export interface OSWindowState {
  appId: ExhibitionAppId
  title: string
  icon: ReactNode
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  minimized: boolean
  maximized: boolean
}

interface OSWindowProps {
  windowState: OSWindowState
  children: ReactNode
  onFocus: () => void
  onClose: () => void
  onMinimize: () => void
  onToggleMaximize: () => void
  onMove: (x: number, y: number) => void
  onResize: (width: number, height: number, x: number, y: number) => void
}

export function OSWindow({
  windowState,
  children,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMove,
  onResize,
}: OSWindowProps) {
  if (windowState.minimized) return null

  const size = windowState.maximized
    ? { width: '100%', height: '100%' }
    : { width: windowState.width, height: windowState.height }
  const position = windowState.maximized ? { x: 0, y: 0 } : { x: windowState.x, y: windowState.y }

  return (
    <Rnd
      className={`os-window ${windowState.maximized ? 'is-maximized' : ''}`}
      bounds="parent"
      size={size}
      position={position}
      minWidth={440}
      minHeight={300}
      disableDragging={windowState.maximized}
      enableResizing={!windowState.maximized}
      dragHandleClassName="os-window__titlebar-drag"
      style={{ zIndex: windowState.zIndex }}
      onMouseDown={onFocus}
      onDragStart={onFocus}
      onDragStop={(_, data) => onMove(data.x, data.y)}
      onResizeStart={onFocus}
      onResizeStop={(_, __, ref, ___, nextPosition) => {
        onResize(ref.offsetWidth, ref.offsetHeight, nextPosition.x, nextPosition.y)
      }}
    >
      <section className="os-window__surface">
        <header className="os-window__titlebar">
          <div className="os-window__titlebar-drag">
            <span className="os-window__icon">{windowState.icon}</span>
            <strong>{windowState.title}</strong>
          </div>
          <div className="os-window__controls">
            <button type="button" onClick={onMinimize} aria-label="最小化"><Minus size={15} /></button>
            <button type="button" onClick={onToggleMaximize} aria-label={windowState.maximized ? '还原' : '最大化'}>
              {windowState.maximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button type="button" className="is-close" onClick={onClose} aria-label="关闭"><X size={15} /></button>
          </div>
        </header>
        <div className="os-window__content">{children}</div>
      </section>
    </Rnd>
  )
}
