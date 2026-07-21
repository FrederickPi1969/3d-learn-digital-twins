import { useLiveClock } from '@/hooks/useLiveClock'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import { DAY_PHASE_LABELS, WEATHER_LABELS } from '@/utils/environment'

const WEATHER_TEMPERATURES = {
  clear: 26,
  rain: 21,
  snow: -2,
  sandstorm: 31,
} as const

export function HeaderBar() {
  const clock = useLiveClock()
  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)
  const renderMode = useDigitalTwinStore((state) => state.renderMode)

  return (
    <header className="top-header">
      <div className="top-header__left">
        <span className="weather-chip">杭州&nbsp; {WEATHER_TEMPERATURES[weatherKind]}°C</span>
        <span className="weather-chip weather-chip--muted">
          {WEATHER_LABELS[weatherKind]} · {DAY_PHASE_LABELS[dayPhase]}
        </span>
      </div>

      <div className="top-header__title-wrap">
        <span className="top-header__wing top-header__wing--left" />
        <div className="top-header__title">
          <span>SMART CAMPUS DIGITAL TWIN · {renderMode === 'gis' ? 'GIS ENGINE' : 'REALTIME ENGINE'}</span>
          <strong>智慧园区可视化系统</strong>
        </div>
        <span className="top-header__wing top-header__wing--right" />
      </div>

      <div className="top-header__right">
        <div className="clock-block">
          <span>{clock.date} · {clock.weekday}</span>
          <strong>{clock.time}</strong>
        </div>
        <div className="brand-lockup">
          <span>{renderMode === 'gis' ? 'CESIUM WGS84' : 'THREE WEBGL'}</span>
          <strong>山海数字孪生</strong>
        </div>
      </div>
    </header>
  )
}
