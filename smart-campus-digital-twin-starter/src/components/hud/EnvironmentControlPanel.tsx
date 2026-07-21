import { AnimatePresence, motion } from 'motion/react'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import type { DayPhase, WeatherKind } from '@/types/digitalTwin'
import { DAY_PHASE_LABELS, WEATHER_LABELS } from '@/utils/environment'

const WEATHER_OPTIONS: readonly WeatherKind[] = ['clear', 'rain', 'snow', 'sandstorm']
const DAY_PHASE_OPTIONS: readonly DayPhase[] = ['day', 'dusk', 'night', 'auto']

function RangeControl({
  label,
  value,
  minimum,
  maximum,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  minimum: number
  maximum: number
  step: number
  unit?: string
  onChange: (value: number) => void
}) {
  return (
    <label className="extension-range">
      <span>
        {label}
        <strong>
          {Number.isInteger(step) ? Math.round(value) : value.toFixed(step < 0.1 ? 2 : 1)}
          {unit}
        </strong>
      </span>
      <input
        type="range"
        min={minimum}
        max={maximum}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onToggle,
  disabled = false,
}: {
  label: string
  description: string
  checked: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className={`extension-toggle ${checked ? 'is-active' : ''}`}
      onClick={onToggle}
      disabled={disabled}
    >
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <i aria-hidden="true" />
    </button>
  )
}

export function EnvironmentControlPanel() {
  const open = useDigitalTwinStore((state) => state.extensionPanelOpen)
  const setOpen = useDigitalTwinStore((state) => state.setExtensionPanelOpen)
  const renderMode = useDigitalTwinStore((state) => state.renderMode)
  const setRenderMode = useDigitalTwinStore((state) => state.setRenderMode)

  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const weatherIntensity = useDigitalTwinStore((state) => state.weatherIntensity)
  const windSpeed = useDigitalTwinStore((state) => state.windSpeed)
  const lightningEnabled = useDigitalTwinStore((state) => state.lightningEnabled)
  const setWeatherKind = useDigitalTwinStore((state) => state.setWeatherKind)
  const setWeatherIntensity = useDigitalTwinStore((state) => state.setWeatherIntensity)
  const setWindSpeed = useDigitalTwinStore((state) => state.setWindSpeed)
  const toggleLightning = useDigitalTwinStore((state) => state.toggleLightning)

  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)
  const streetLightsEnabled = useDigitalTwinStore((state) => state.streetLightsEnabled)
  const searchlightsEnabled = useDigitalTwinStore((state) => state.searchlightsEnabled)
  const setDayPhase = useDigitalTwinStore((state) => state.setDayPhase)
  const toggleStreetLights = useDigitalTwinStore((state) => state.toggleStreetLights)
  const toggleSearchlights = useDigitalTwinStore((state) => state.toggleSearchlights)

  const vegetationDensity = useDigitalTwinStore((state) => state.vegetationDensity)
  const vegetationMotionEnabled = useDigitalTwinStore(
    (state) => state.vegetationMotionEnabled,
  )
  const vehicleCount = useDigitalTwinStore((state) => state.vehicleCount)
  const pedestrianCount = useDigitalTwinStore((state) => state.pedestrianCount)
  const entitySpeed = useDigitalTwinStore((state) => state.entitySpeed)
  const setVegetationDensity = useDigitalTwinStore((state) => state.setVegetationDensity)
  const toggleVegetationMotion = useDigitalTwinStore(
    (state) => state.toggleVegetationMotion,
  )
  const setVehicleCount = useDigitalTwinStore((state) => state.setVehicleCount)
  const setPedestrianCount = useDigitalTwinStore((state) => state.setPedestrianCount)
  const setEntitySpeed = useDigitalTwinStore((state) => state.setEntitySpeed)

  const showGisCampusLayer = useDigitalTwinStore((state) => state.showGisCampusLayer)
  const showGisZonesLayer = useDigitalTwinStore((state) => state.showGisZonesLayer)
  const showGisOsmBuildings = useDigitalTwinStore((state) => state.showGisOsmBuildings)
  const showGisExternalTileset = useDigitalTwinStore(
    (state) => state.showGisExternalTileset,
  )
  const gisExternalSource = useDigitalTwinStore((state) => state.gisExternalSource)
  const toggleGisCampusLayer = useDigitalTwinStore((state) => state.toggleGisCampusLayer)
  const toggleGisZonesLayer = useDigitalTwinStore((state) => state.toggleGisZonesLayer)
  const toggleGisOsmBuildings = useDigitalTwinStore(
    (state) => state.toggleGisOsmBuildings,
  )
  const toggleGisExternalTileset = useDigitalTwinStore(
    (state) => state.toggleGisExternalTileset,
  )
  const setGisExternalSource = useDigitalTwinStore((state) => state.setGisExternalSource)

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="extension-panel"
          initial={{ opacity: 0, x: 26, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 26, scale: 0.98 }}
          transition={{ duration: 0.24 }}
        >
          <header className="extension-panel__header">
            <div>
              <span>ENVIRONMENT / GIS EXTENSION</span>
              <strong>场景扩展控制中心</strong>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="关闭扩展控制中心">
              ×
            </button>
          </header>

          <div className="extension-panel__scroll">
            <section className="extension-section">
              <div className="extension-section__title">
                <span>01</span>
                <div>
                  <strong>天气模拟</strong>
                  <small>图形处理器粒子、地面积水与能见度联动</small>
                </div>
              </div>
              <div className="extension-segmented extension-segmented--four">
                {WEATHER_OPTIONS.map((kind) => (
                  <button
                    type="button"
                    key={kind}
                    className={weatherKind === kind ? 'is-active' : ''}
                    onClick={() => setWeatherKind(kind)}
                  >
                    {WEATHER_LABELS[kind]}
                  </button>
                ))}
              </div>
              <RangeControl
                label="天气强度"
                value={weatherIntensity}
                minimum={0}
                maximum={1}
                step={0.01}
                onChange={setWeatherIntensity}
              />
              <RangeControl
                label="风场强度"
                value={windSpeed}
                minimum={0}
                maximum={1}
                step={0.01}
                onChange={setWindSpeed}
              />
              <ToggleRow
                label="雷暴闪光"
                description="降雨强度较高时随机触发环境闪电"
                checked={lightningEnabled}
                onToggle={toggleLightning}
                disabled={weatherKind !== 'rain'}
              />
            </section>

            <section className="extension-section">
              <div className="extension-section__title">
                <span>02</span>
                <div>
                  <strong>昼夜与夜景</strong>
                  <small>天空、雾、曝光、窗光与园区灯光统一驱动</small>
                </div>
              </div>
              <div className="extension-segmented extension-segmented--four">
                {DAY_PHASE_OPTIONS.map((phase) => (
                  <button
                    type="button"
                    key={phase}
                    className={dayPhase === phase ? 'is-active' : ''}
                    onClick={() => setDayPhase(phase)}
                  >
                    {DAY_PHASE_LABELS[phase]}
                  </button>
                ))}
              </div>
              <ToggleRow
                label="道路与庭院灯"
                description="实例化灯杆、光池和局部点光源"
                checked={streetLightsEnabled}
                onToggle={toggleStreetLights}
              />
              <ToggleRow
                label="楼顶探照灯"
                description="旋转体积光束与高动态范围泛光"
                checked={searchlightsEnabled}
                onToggle={toggleSearchlights}
              />
            </section>

            <section className="extension-section">
              <div className="extension-section__title">
                <span>03</span>
                <div>
                  <strong>绿化与动态实体</strong>
                  <small>实例化植被、车辆样条路径与员工步行动画</small>
                </div>
              </div>
              <RangeControl
                label="绿化密度"
                value={vegetationDensity}
                minimum={0.2}
                maximum={1.4}
                step={0.05}
                unit="×"
                onChange={setVegetationDensity}
              />
              <ToggleRow
                label="植被风摆"
                description="顶点着色器风场随天气风速变化"
                checked={vegetationMotionEnabled}
                onToggle={toggleVegetationMotion}
              />
              <RangeControl
                label="园区车辆"
                value={vehicleCount}
                minimum={0}
                maximum={36}
                step={1}
                unit=" 辆"
                onChange={setVehicleCount}
              />
              <RangeControl
                label="园区员工"
                value={pedestrianCount}
                minimum={0}
                maximum={72}
                step={1}
                unit=" 人"
                onChange={setPedestrianCount}
              />
              <RangeControl
                label="实体速度"
                value={entitySpeed}
                minimum={0.2}
                maximum={2.2}
                step={0.05}
                unit="×"
                onChange={setEntitySpeed}
              />
            </section>

            <section className="extension-section">
              <div className="extension-section__title">
                <span>04</span>
                <div>
                  <strong>地理信息系统桥接</strong>
                  <small>Cesium、WGS84、局部东—北—天坐标与 3D Tiles</small>
                </div>
              </div>
              <div className="extension-segmented">
                <button
                  type="button"
                  className={renderMode === 'twin' ? 'is-active' : ''}
                  onClick={() => setRenderMode('twin')}
                >
                  园区孪生
                </button>
                <button
                  type="button"
                  className={renderMode === 'gis' ? 'is-active' : ''}
                  onClick={() => setRenderMode('gis')}
                >
                  Cesium GIS
                </button>
              </div>
              <ToggleRow
                label="园区局部图层"
                description="楼宇、道路和绿化转换到真实地球坐标"
                checked={showGisCampusLayer}
                onToggle={toggleGisCampusLayer}
              />
              <ToggleRow
                label="功能分区 GeoJSON"
                description="研发、运营与服务分区矢量面"
                checked={showGisZonesLayer}
                onToggle={toggleGisZonesLayer}
              />
              <ToggleRow
                label="Cesium OSM Buildings"
                description="需要在环境变量中配置 Cesium ion Token"
                checked={showGisOsmBuildings}
                onToggle={toggleGisOsmBuildings}
              />
              <label className="extension-input">
                <span>3D Tiles URL</span>
                <input
                  value={gisExternalSource.tilesetUrl}
                  placeholder="https://host/tileset.json"
                  onChange={(event) => setGisExternalSource({ tilesetUrl: event.target.value })}
                />
              </label>
              <label className="extension-input">
                <span>Cesium ion Asset ID</span>
                <input
                  inputMode="numeric"
                  value={gisExternalSource.ionAssetId}
                  placeholder="例如 96188"
                  onChange={(event) => setGisExternalSource({ ionAssetId: event.target.value })}
                />
              </label>
              <ToggleRow
                label="加载外部 3D Tiles"
                description="优先使用 URL；URL 为空时使用 Asset ID"
                checked={showGisExternalTileset}
                onToggle={toggleGisExternalTileset}
              />
            </section>
          </div>

          <footer className="extension-panel__footer">
            <span>W 天气</span>
            <span>N 昼夜</span>
            <span>G GIS</span>
            <span>E 面板</span>
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
