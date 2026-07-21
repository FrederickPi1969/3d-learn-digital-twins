import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Box, CalendarDays, MapPin, ScanLine, X } from 'lucide-react'
import { getExhibitById } from '@/data/exhibition'
import { useExhibitionStore } from '@/store/useExhibitionStore'

export function ExhibitDetailsPanel() {
  const selectedExhibitId = useExhibitionStore((state) => state.selectedExhibitId)
  const selectExhibit = useExhibitionStore((state) => state.selectExhibit)
  const openOs = useExhibitionStore((state) => state.openOs)
  const exhibit = getExhibitById(selectedExhibitId)

  return (
    <AnimatePresence>
      {exhibit && (
        <motion.aside
          className="exhibit-detail-panel"
          initial={{ opacity: 0, x: 36, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 24, scale: 0.98 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          style={{ '--exhibit-accent': exhibit.accent } as React.CSSProperties}
        >
          <div className="exhibit-detail-panel__scan" />
          <header>
            <div>
              <span>EXHIBIT PROFILE · {exhibit.zone} ZONE</span>
              <strong>{String(exhibit.boothNumber).padStart(2, '0')}</strong>
            </div>
            <button type="button" onClick={() => selectExhibit(null, false)} aria-label="关闭展品信息">
              <X size={18} />
            </button>
          </header>

          <div className="exhibit-detail-panel__hero">
            <span><ScanLine size={15} /> LIVE DIGITAL ARCHIVE</span>
            <h2>{exhibit.title}</h2>
            <p>{exhibit.subtitle}</p>
          </div>

          <div className="exhibit-detail-panel__facts">
            <div><MapPin size={15} /><span>展位</span><strong>{exhibit.zone}-{String(exhibit.boothNumber).padStart(2, '0')}</strong></div>
            <div><CalendarDays size={15} /><span>年代</span><strong>{exhibit.year}</strong></div>
            <div><Box size={15} /><span>类型</span><strong>{exhibit.category}</strong></div>
          </div>

          <div className="exhibit-detail-panel__artist">
            <span>ARTIST / STUDIO</span>
            <strong>{exhibit.artist}</strong>
          </div>

          <p className="exhibit-detail-panel__description">{exhibit.description}</p>

          <div className="exhibit-detail-panel__telemetry">
            <div><span>照度</span><b>168 lux</b><i style={{ width: '78%' }} /></div>
            <div><span>设备在线</span><b>100%</b><i style={{ width: '100%' }} /></div>
            <div><span>驻足热度</span><b>{62 + (exhibit.boothNumber % 31)}%</b><i style={{ width: `${62 + (exhibit.boothNumber % 31)}%` }} /></div>
          </div>

          <button type="button" className="exhibit-detail-panel__archive" onClick={() => openOs('gallery')}>
            在数字展册中打开 <ArrowUpRight size={17} />
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
