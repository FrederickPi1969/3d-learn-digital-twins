import { AnimatePresence, motion } from 'motion/react'
import { campusBuildings, getBuildingById } from '@/data/campus'
import { useBuildingTelemetry, useCampusTelemetry } from '@/hooks/useTelemetry'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import { DAY_PHASE_LABELS, WEATHER_LABELS } from '@/utils/environment'
import { BootOverlay } from './BootOverlay'
import { BottomNav } from './BottomNav'
import { BuildingDashboard } from './BuildingDashboard'
import { EnvironmentControlPanel } from './EnvironmentControlPanel'
import { HeaderBar } from './HeaderBar'
import { MacroDashboard } from './MacroDashboard'
import { SceneToolbar } from './SceneToolbar'

export function HudShell() {
  const viewMode = useDigitalTwinStore((state) => state.viewMode)
  const renderMode = useDigitalTwinStore((state) => state.renderMode)
  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)
  const vehicleCount = useDigitalTwinStore((state) => state.vehicleCount)
  const pedestrianCount = useDigitalTwinStore((state) => state.pedestrianCount)
  const selectedBuildingId = useDigitalTwinStore((state) => state.selectedBuildingId)
  const exitBuilding = useDigitalTwinStore((state) => state.exitBuilding)
  const campusTelemetry = useCampusTelemetry()
  const selectedBuilding = getBuildingById(selectedBuildingId)
  const buildingTelemetry = useBuildingTelemetry(selectedBuilding)

  return (
    <div className="hud-shell">
      <div className="screen-grid" aria-hidden="true" />
      <div className="screen-vignette" aria-hidden="true" />
      <HeaderBar />

      <AnimatePresence mode="wait">
        {viewMode === 'campus' ? (
          <motion.div
            key={`campus-dashboard-${renderMode}`}
            className="dashboard-layer"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.015 }}
            transition={{ duration: 0.28 }}
          >
            <MacroDashboard telemetry={campusTelemetry} />
          </motion.div>
        ) : (
          selectedBuilding && buildingTelemetry && (
            <motion.div
              key={`building-dashboard-${selectedBuilding.id}`}
              className="dashboard-layer"
              initial={{ opacity: 0, scale: 1.015 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.28 }}
            >
              <BuildingDashboard building={selectedBuilding} telemetry={buildingTelemetry} />
            </motion.div>
          )
        )}
      </AnimatePresence>

      <div className="environment-status-strip">
        <span>{renderMode === 'gis' ? 'CESIUM GIS' : 'THREE.JS TWIN'}</span>
        <i />
        <strong>{WEATHER_LABELS[weatherKind]}</strong>
        <i />
        <strong>{DAY_PHASE_LABELS[dayPhase]}</strong>
        <i />
        <span>车辆 {vehicleCount}</span>
        <span>人员 {pedestrianCount}</span>
      </div>

      <div className="interaction-hint">
        {renderMode === 'gis' ? (
          <>
            <span>左键旋转地球</span>
            <span>右键调整视角</span>
            <span>滚轮缩放</span>
            <span>双击楼宇进入孪生</span>
          </>
        ) : (
          <>
            <span>左键拖动平移</span>
            <span>滚轮缩放</span>
            <span>右键/双指旋转</span>
            <span>点击楼宇进入剖析</span>
          </>
        )}
      </div>

      {viewMode === 'building' && (
        <button type="button" className="back-to-campus" onClick={exitBuilding}>
          <span>‹‹</span> 返回园区总览 <kbd>ESC</kbd>
        </button>
      )}

      <div className="campus-counter">
        <span>{renderMode === 'gis' ? 'GIS 图层' : '园区楼宇'}</span>
        <strong>{renderMode === 'gis' ? 4 : campusBuildings.length}</strong>
        <small>{renderMode === 'gis' ? '组' : '栋'}</small>
      </div>

      <BottomNav />
      <SceneToolbar />
      <EnvironmentControlPanel />
      <BootOverlay />
    </div>
  )
}
