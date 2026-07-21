import { AnimatePresence, motion } from 'motion/react'
import { Crosshair, Maximize2, Monitor, X } from 'lucide-react'
import { exhibitionExhibits } from '@/data/exhibition'
import { useExhibitionStore } from '@/store/useExhibitionStore'
import { ExhibitionFloorPlan } from './ExhibitionFloorPlan'

export function FloorPlanOverlay() {
  const open = useExhibitionStore((state) => state.floorPlanOpen)
  const setOpen = useExhibitionStore((state) => state.setFloorPlanOpen)
  const selectedExhibitId = useExhibitionStore((state) => state.selectedExhibitId)
  const requestCamera = useExhibitionStore((state) => state.requestCamera)
  const selected = exhibitionExhibits.find((item) => item.id === selectedExhibitId)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="floor-plan-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <motion.section
            initial={{ y: 28, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 18, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <header>
              <div>
                <span>SPATIAL NAVIGATION / DIGITAL FLOOR PLAN</span>
                <strong>未来艺术馆平面导航</strong>
              </div>
              <div className="floor-plan-overlay__header-actions">
                <button type="button" onClick={() => requestCamera('floor-screen')}><Monitor size={16} /> 查看墙面大屏</button>
                <button type="button" onClick={() => setOpen(false)} aria-label="关闭平面图"><X size={19} /></button>
              </div>
            </header>

            <div className="floor-plan-overlay__content">
              <div className="floor-plan-overlay__map">
                <ExhibitionFloorPlan interactive showLegend />
              </div>
              <aside>
                <div className="floor-plan-overlay__status">
                  <span><Crosshair size={15} /> 当前位置</span>
                  <strong>入口服务区 · KIOSK 01</strong>
                  <small>请选择展位，三维镜头会自动导航到目标展项。</small>
                </div>

                <div className="floor-plan-overlay__metrics">
                  <div><span>展位总数</span><strong>48</strong></div>
                  <div><span>开放展位</span><strong>46</strong></div>
                  <div><span>实时客流</span><strong>184</strong></div>
                  <div><span>环境指数</span><strong>98%</strong></div>
                </div>

                <div className="floor-plan-overlay__selection">
                  <span>CURRENT SELECTION</span>
                  {selected ? (
                    <>
                      <strong>{selected.zone}-{String(selected.boothNumber).padStart(2, '0')} · {selected.title}</strong>
                      <p>{selected.artist} · {selected.year}</p>
                      <button type="button" onClick={() => setOpen(false)}>
                        <Maximize2 size={16} /> 返回三维视图
                      </button>
                    </>
                  ) : (
                    <p>尚未选择展位。点击地图中的编号即可定位。</p>
                  )}
                </div>
              </aside>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
