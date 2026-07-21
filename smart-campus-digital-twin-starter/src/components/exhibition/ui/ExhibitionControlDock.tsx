import {
  Building2,
  Eye,
  EyeOff,
  GalleryHorizontalEnd,
  LayoutDashboard,
  Map,
  MonitorUp,
  PanelsTopLeft,
  RotateCcw,
} from 'lucide-react'
import { useExhibitionStore } from '@/store/useExhibitionStore'

export function ExhibitionControlDock() {
  const cameraPreset = useExhibitionStore((state) => state.cameraPreset)
  const showLabels = useExhibitionStore((state) => state.showLabels)
  const showArchitecture = useExhibitionStore((state) => state.showArchitecture)
  const requestCamera = useExhibitionStore((state) => state.requestCamera)
  const toggleLabels = useExhibitionStore((state) => state.toggleLabels)
  const toggleArchitecture = useExhibitionStore((state) => state.toggleArchitecture)
  const setFloorPlanOpen = useExhibitionStore((state) => state.setFloorPlanOpen)
  const openOs = useExhibitionStore((state) => state.openOs)
  const resetExhibition = useExhibitionStore((state) => state.resetExhibition)

  return (
    <nav className="exhibition-control-dock" aria-label="展览厅视图控制">
      <button type="button" className={cameraPreset === 'overview' ? 'is-active' : ''} onClick={() => requestCamera('overview')}>
        <LayoutDashboard size={18} /><span>总览</span>
      </button>
      <button type="button" className={cameraPreset === 'entrance' ? 'is-active' : ''} onClick={() => requestCamera('entrance')}>
        <Building2 size={18} /><span>入口</span>
      </button>
      <button type="button" className={cameraPreset === 'floor-screen' ? 'is-active' : ''} onClick={() => requestCamera('floor-screen')}>
        <MonitorUp size={18} /><span>导航大屏</span>
      </button>
      <button type="button" className={cameraPreset === 'kiosk' ? 'is-active' : ''} onClick={() => requestCamera('kiosk')}>
        <PanelsTopLeft size={18} /><span>交互终端</span>
      </button>
      <span className="exhibition-control-dock__divider" />
      <button type="button" onClick={() => setFloorPlanOpen(true)}>
        <Map size={18} /><span>平面图</span>
      </button>
      <button type="button" onClick={() => openOs(null)}>
        <GalleryHorizontalEnd size={18} /><span>虚拟系统</span>
      </button>
      <button type="button" className={showLabels ? 'is-active' : ''} onClick={toggleLabels}>
        {showLabels ? <Eye size={18} /> : <EyeOff size={18} />}<span>展签</span>
      </button>
      <button type="button" className={showArchitecture ? 'is-active' : ''} onClick={toggleArchitecture}>
        <Building2 size={18} /><span>建筑</span>
      </button>
      <button type="button" onClick={resetExhibition}>
        <RotateCcw size={18} /><span>复位</span>
      </button>
    </nav>
  )
}
