import { lazy, Suspense } from 'react'
import { DigitalTwinCanvas } from '@/components/scene/DigitalTwinCanvas'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { HudShell } from '@/components/hud/HudShell'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'

const CesiumMap = lazy(() => import('@/components/gis/CesiumMap'))

function DigitalTwinApp() {
  useKeyboardShortcuts()
  const renderMode = useDigitalTwinStore((state) => state.renderMode)

  return (
    <main className="app-shell">
      {renderMode === 'twin' ? (
        <DigitalTwinCanvas />
      ) : (
        <Suspense
          fallback={
            <div className="gis-loading-screen">
              <span>GIS ENGINE</span>
              <strong>正在装载 Cesium 地理信息系统</strong>
              <i />
            </div>
          }
        >
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
