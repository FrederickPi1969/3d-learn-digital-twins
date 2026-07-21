import { ExhibitionCanvas } from './scene/ExhibitionCanvas'
import { VirtualDesktop } from './os/VirtualOSDesktop'
import { ExhibitionHud } from './ui/ExhibitionHud'
import { useExhibitionStore } from '@/store/useExhibitionStore'

export default function ExhibitionExperience() {
  const osOpen = useExhibitionStore((state) => state.osOpen)
  const initialApp = useExhibitionStore((state) => state.osInitialApp)
  const sessionNonce = useExhibitionStore((state) => state.osSessionNonce)
  return (
    <section className="exhibition-experience exhibition-experience--white-gallery">
      <ExhibitionCanvas />
      <ExhibitionHud />
      {osOpen && <div className="virtual-os-focus-layer"><VirtualDesktop key={sessionNonce} initialApp={initialApp} /></div>}
    </section>
  )
}
