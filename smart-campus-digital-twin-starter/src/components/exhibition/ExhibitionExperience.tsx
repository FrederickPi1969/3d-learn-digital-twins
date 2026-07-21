import { ExhibitionCanvas } from './scene/ExhibitionCanvas'
import { VirtualOSOverlay } from './os/VirtualOSOverlay'
import { ExhibitionHud } from './ui/ExhibitionHud'

export default function ExhibitionExperience() {
  return (
    <section className="exhibition-experience">
      <ExhibitionCanvas />
      <ExhibitionHud />
      <VirtualOSOverlay />
    </section>
  )
}
