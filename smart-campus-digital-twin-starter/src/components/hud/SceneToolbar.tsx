import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import { DAY_PHASE_LABELS, WEATHER_LABELS } from '@/utils/environment'

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen()
  } else {
    await document.exitFullscreen()
  }
}

export function SceneToolbar() {
  const renderMode = useDigitalTwinStore((state) => state.renderMode)
  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)
  const showLabels = useDigitalTwinStore((state) => state.showLabels)
  const effectsEnabled = useDigitalTwinStore((state) => state.effectsEnabled)
  const telemetryPaused = useDigitalTwinStore((state) => state.telemetryPaused)
  const extensionPanelOpen = useDigitalTwinStore((state) => state.extensionPanelOpen)
  const requestCameraReset = useDigitalTwinStore((state) => state.requestCameraReset)
  const orbitCamera = useDigitalTwinStore((state) => state.orbitCamera)
  const cycleWeather = useDigitalTwinStore((state) => state.cycleWeather)
  const cycleDayPhase = useDigitalTwinStore((state) => state.cycleDayPhase)
  const toggleRenderMode = useDigitalTwinStore((state) => state.toggleRenderMode)
  const toggleLabels = useDigitalTwinStore((state) => state.toggleLabels)
  const toggleEffects = useDigitalTwinStore((state) => state.toggleEffects)
  const toggleTelemetry = useDigitalTwinStore((state) => state.toggleTelemetry)
  const toggleExtensionPanel = useDigitalTwinStore((state) => state.toggleExtensionPanel)

  return (
    <div className="scene-toolbar">
      <button type="button" onClick={() => orbitCamera(-1)} title="向左旋转镜头">
        <span>↶</span><small>左转</small>
      </button>
      <button type="button" onClick={() => orbitCamera(1)} title="向右旋转镜头">
        <span>↷</span><small>右转</small>
      </button>
      <button type="button" onClick={requestCameraReset} title="重置镜头（R）">
        <span>⌖</span><small>复位</small>
      </button>
      <button type="button" onClick={cycleWeather} title="切换天气（W）">
        <span>{weatherKind === 'rain' ? '╱' : weatherKind === 'snow' ? '❄' : weatherKind === 'sandstorm' ? '≋' : '◌'}</span>
        <small>{WEATHER_LABELS[weatherKind]}</small>
      </button>
      <button type="button" onClick={cycleDayPhase} title="切换昼夜（N）">
        <span>{dayPhase === 'night' ? '☾' : dayPhase === 'dusk' ? '◐' : dayPhase === 'auto' ? '◒' : '☼'}</span>
        <small>{DAY_PHASE_LABELS[dayPhase]}</small>
      </button>
      <button
        type="button"
        className={renderMode === 'gis' ? 'is-active' : ''}
        onClick={toggleRenderMode}
        title="切换园区孪生与 GIS（G）"
      >
        <span>◎</span><small>{renderMode === 'gis' ? 'GIS' : '孪生'}</small>
      </button>
      <button
        type="button"
        className={showLabels ? 'is-active' : ''}
        onClick={toggleLabels}
        title="切换楼宇标签（L）"
      >
        <span>▣</span><small>标签</small>
      </button>
      <button
        type="button"
        className={effectsEnabled ? 'is-active' : ''}
        onClick={toggleEffects}
        title="切换后期光效"
      >
        <span>✦</span><small>光效</small>
      </button>
      <button
        type="button"
        className={!telemetryPaused ? 'is-active' : ''}
        onClick={toggleTelemetry}
        title="暂停或恢复模拟遥测"
      >
        <span>{telemetryPaused ? '▶' : 'Ⅱ'}</span><small>数据</small>
      </button>
      <button
        type="button"
        className={extensionPanelOpen ? 'is-active' : ''}
        onClick={toggleExtensionPanel}
        title="扩展控制中心（E）"
      >
        <span>⚙</span><small>扩展</small>
      </button>
      <button type="button" onClick={() => void toggleFullscreen()} title="全屏">
        <span>⛶</span><small>全屏</small>
      </button>
    </div>
  )
}
