import { useEffect } from 'react'
import {
  ArrowLeft,
  Box,
  Cpu,
  GalleryHorizontalEnd,
  Map,
  MonitorSmartphone,
  Radio,
  UsersRound,
} from 'lucide-react'
import { exhibitionZones } from '@/data/exhibition'
import { useLiveClock } from '@/hooks/useLiveClock'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import { useExhibitionStore } from '@/store/useExhibitionStore'
import { ExhibitDetailsPanel } from './ExhibitDetailsPanel'
import { ExhibitionControlDock } from './ExhibitionControlDock'
import { ExhibitionMiniMap } from './ExhibitionMiniMap'
import { FloorPlanOverlay } from './FloorPlanOverlay'

export function ExhibitionHud() {
  const clock = useLiveClock()
  const activeZone = useExhibitionStore((state) => state.activeZone)
  const selectedExhibitId = useExhibitionStore((state) => state.selectedExhibitId)
  const ambientVisitors = useExhibitionStore((state) => state.ambientVisitors)
  const setActiveZone = useExhibitionStore((state) => state.setActiveZone)
  const setFloorPlanOpen = useExhibitionStore((state) => state.setFloorPlanOpen)
  const openOs = useExhibitionStore((state) => state.openOs)
  const closeOs = useExhibitionStore((state) => state.closeOs)
  const osOpen = useExhibitionStore((state) => state.osOpen)
  const floorPlanOpen = useExhibitionStore((state) => state.floorPlanOpen)
  const selectExhibit = useExhibitionStore((state) => state.selectExhibit)
  const requestCamera = useExhibitionStore((state) => state.requestCamera)
  const setRenderMode = useDigitalTwinStore((state) => state.setRenderMode)
  const exitBuilding = useDigitalTwinStore((state) => state.exitBuilding)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
      if (isTyping && event.key !== 'Escape') return

      if (event.key === 'Escape') {
        if (osOpen) closeOs()
        else if (floorPlanOpen) setFloorPlanOpen(false)
        else if (selectedExhibitId) selectExhibit(null, false)
        return
      }

      const key = event.key.toLowerCase()
      if (key === '1') requestCamera('overview')
      if (key === '2') requestCamera('floor-screen')
      if (key === '3') requestCamera('kiosk')
      if (key === 'm') setFloorPlanOpen(true)
      if (key === 'o') openOs(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    closeOs,
    floorPlanOpen,
    openOs,
    osOpen,
    requestCamera,
    selectExhibit,
    selectedExhibitId,
    setFloorPlanOpen,
  ])

  return (
    <div className="exhibition-hud">
      <div className="exhibition-hud__grid" aria-hidden="true" />
      <div className="exhibition-hud__vignette" aria-hidden="true" />

      <header className="exhibition-topbar">
        <div className="exhibition-topbar__brand">
          <span className="exhibition-topbar__logo"><GalleryHorizontalEnd size={22} /></span>
          <div>
            <span>SMART EXHIBITION DIGITAL TWIN</span>
            <strong>未来艺术馆智慧展陈平台</strong>
          </div>
        </div>

        <div className="exhibition-topbar__system">
          <span><Radio size={13} /> REALTIME</span>
          <i />
          <span>WEBGL 2.0</span>
          <i />
          <span>48 EXHIBITS</span>
        </div>

        <div className="exhibition-topbar__right">
          <div className="exhibition-topbar__clock">
            <span>{clock.date} · {clock.weekday}</span>
            <strong>{clock.time}</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              exitBuilding()
              setRenderMode('twin')
            }}
          >
            <ArrowLeft size={16} /> 返回智慧园区
          </button>
        </div>
      </header>

      <aside className="exhibition-zone-rail">
        <header>
          <span>CURATORIAL ZONES</span>
          <strong>展区筛选</strong>
        </header>
        <button type="button" className={activeZone === 'ALL' ? 'is-active' : ''} onClick={() => setActiveZone('ALL')}>
          <i style={{ background: '#e5fbff' }} />
          <span>ALL</span>
          <strong>全部展区</strong>
          <small>48</small>
        </button>
        {exhibitionZones.map((zone) => (
          <button type="button" key={zone.id} className={activeZone === zone.id ? 'is-active' : ''} onClick={() => setActiveZone(zone.id)}>
            <i style={{ background: zone.accent }} />
            <span>{zone.id}</span>
            <strong>{zone.shortName}</strong>
            <small>12</small>
          </button>
        ))}
        <footer>
          <button type="button" onClick={() => setFloorPlanOpen(true)}><Map size={17} /> 平面导航</button>
          <button type="button" onClick={() => openOs(null)}><MonitorSmartphone size={17} /> 访客系统</button>
        </footer>
      </aside>

      <aside className="exhibition-live-metrics">
        <div><UsersRound size={16} /><span>实时在馆</span><strong>{184 + ambientVisitors}</strong><small>人</small></div>
        <div><Box size={16} /><span>开放展项</span><strong>46</strong><small>/ 48</small></div>
        <div><Cpu size={16} /><span>设备在线</span><strong>98</strong><small>%</small></div>
      </aside>

      <div className="exhibition-interaction-hint">
        <span>拖动旋转</span><i />
        <span>滚轮缩放</span><i />
        <span>点击展品聚焦</span><i />
        <span>墙面大屏内运行访客系统</span>
      </div>

      <ExhibitDetailsPanel />
      <ExhibitionMiniMap />
      <ExhibitionControlDock />
      <FloorPlanOverlay />

      <div className="exhibition-keyboard-hint">
        <kbd>1</kbd> 总览 <kbd>2</kbd> 大屏 <kbd>3</kbd> 交互墙 <kbd>M</kbd> 地图 <kbd>O</kbd> 系统 <kbd>ESC</kbd> 关闭
      </div>
    </div>
  )
}
