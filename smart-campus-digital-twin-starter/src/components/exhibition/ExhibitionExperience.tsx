import { ExhibitionCanvas } from './scene/ExhibitionCanvas'
import { ExhibitionHud } from './ui/ExhibitionHud'

export default function ExhibitionExperience() {
  return (
    <section className="exhibition-experience exhibition-experience--white-gallery">
      <ExhibitionCanvas />
      <ExhibitionHud />
    </section>
  )
}
