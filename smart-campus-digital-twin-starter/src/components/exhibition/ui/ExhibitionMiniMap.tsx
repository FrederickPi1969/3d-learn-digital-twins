import { MapPinned, Maximize2 } from 'lucide-react'
import { useExhibitionStore } from '@/store/useExhibitionStore'
import { ExhibitionFloorPlan } from './ExhibitionFloorPlan'

export function ExhibitionMiniMap() {
  const showMiniMap = useExhibitionStore((state) => state.showMiniMap)
  const setFloorPlanOpen = useExhibitionStore((state) => state.setFloorPlanOpen)
  if (!showMiniMap) return null

  return (
    <aside className="exhibition-mini-map">
      <header>
        <span><MapPinned size={14} /> LIVE FLOOR MAP</span>
        <button type="button" onClick={() => setFloorPlanOpen(true)} aria-label="放大平面图"><Maximize2 size={15} /></button>
      </header>
      <ExhibitionFloorPlan compact interactive={false} showLegend={false} />
      <footer><i /> KIOSK 01 · ENTRANCE</footer>
    </aside>
  )
}
