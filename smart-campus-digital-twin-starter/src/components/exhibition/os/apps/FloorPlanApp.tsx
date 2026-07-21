import { LocateFixed, MapPin, Navigation, XCircle } from 'lucide-react'
import { getExhibitById } from '@/data/exhibition'
import { useExhibitionStore } from '@/store/useExhibitionStore'
import { ExhibitionFloorPlan } from '@/components/exhibition/ui/ExhibitionFloorPlan'

export function FloorPlanApp() {
  const selectedExhibitId = useExhibitionStore((state) => state.selectedExhibitId)
  const closeOs = useExhibitionStore((state) => state.closeOs)
  const requestCamera = useExhibitionStore((state) => state.requestCamera)
  const selected = getExhibitById(selectedExhibitId)

  return (
    <div className="os-floor-plan-app">
      <aside>
        <div className="os-app-heading">
          <span>LIVE SPATIAL SERVICE</span>
          <strong>展厅平面导航</strong>
          <p>点击任意展位编号，系统会同步选中展项并驱动三维镜头导航。</p>
        </div>
        <div className="os-floor-plan-app__current">
          <span><LocateFixed size={15} /> 当前位置</span>
          <strong>入口服务区 · KIOSK 01</strong>
          <small>东经 120.1551 · 北纬 30.2741</small>
        </div>
        <div className="os-floor-plan-app__selection">
          <span><MapPin size={15} /> 目标展位</span>
          {selected ? (
            <>
              <strong>{selected.zone}-{String(selected.boothNumber).padStart(2, '0')}</strong>
              <h3>{selected.title}</h3>
              <p>{selected.artist} · {selected.year}</p>
              <button type="button" onClick={() => {
                requestCamera('exhibit')
                closeOs()
              }}><Navigation size={16} /> 开始三维导航</button>
            </>
          ) : (
            <div className="os-floor-plan-app__empty"><XCircle size={22} /><p>尚未选择目标展位</p></div>
          )}
        </div>
        <div className="os-floor-plan-app__stats">
          <div><span>开放展项</span><b>46 / 48</b></div>
          <div><span>无障碍路线</span><b>已启用</b></div>
          <div><span>预计步行</span><b>{selected ? `${2 + (selected.boothNumber % 6)} 分钟` : '--'}</b></div>
        </div>
      </aside>
      <main><ExhibitionFloorPlan interactive showLegend /></main>
    </div>
  )
}
