import { lazy, Suspense } from 'react'
import { DigitalTwinCanvas } from '@/components/scene/DigitalTwinCanvas'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { HudShell } from '@/components/hud/HudShell'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'

const CesiumMap = lazy(() => import('@/components/gis/CesiumMap'))
const ExhibitionExperience = lazy(() => import('@/components/exhibition/ExhibitionExperience'))

function LoadingScreen({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="gis-loading-screen">
      <span>{eyebrow}</span>
      <strong>{title}</strong>
      <i />
    </div>
  )
}

function DigitalTwinApp() {
  useKeyboardShortcuts()
  const experienceMode = useDigitalTwinStore((state) => state.experienceMode)
  const renderMode = useDigitalTwinStore((state) => state.renderMode)
  if (experienceMode === 'exhibition') {
    return (
      <main className="app-shell app-shell--exhibition">
        <Suspense fallback={<LoadingScreen eyebrow="EXHIBITION ENGINE" title="正在装载未来艺术馆" />}>
          <ExhibitionExperience />
        </Suspense>
      </main>
    )
  }

  return (
    <main className="app-shell">
      {renderMode === 'twin' ? (
        <DigitalTwinCanvas />
      ) : (
        <Suspense fallback={<LoadingScreen eyebrow="GIS ENGINE" title="正在装载 Cesium 地理信息系统" />}>
          <CesiumMap />
        </Suspense>
      )}
      <HudShell />
    </main>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <DigitalTwinApp />
    </ErrorBoundary>
  )
}
