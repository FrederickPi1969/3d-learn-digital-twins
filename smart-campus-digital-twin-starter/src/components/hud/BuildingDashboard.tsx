import { useMemo } from 'react'
import { buildRoomCells } from '@/data/interior'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import type { BuildingConfig, BuildingTelemetry } from '@/types/digitalTwin'
import { HEALTH_COLORS, healthLabel } from '@/utils/color'
import { formatCompact } from '@/utils/math'
import { MetricCard } from './MetricCard'
import { PanelFrame } from './PanelFrame'
import { Sparkline } from './Sparkline'

function FloorLoadBars({ loads, activeFloor }: { loads: readonly number[]; activeFloor: number }) {
  return (
    <div className="floor-load-bars">
      {loads.map((load, index) => (
        <div
          key={index}
          className={`floor-load-bars__bar ${index + 1 === activeFloor ? 'is-active' : ''}`}
          title={`F${index + 1}: ${load.toFixed(1)}%`}
        >
          <span style={{ height: `${load}%` }} />
        </div>
      ))}
    </div>
  )
}

export function BuildingDashboard({
  building,
  telemetry,
}: {
  building: BuildingConfig
  telemetry: BuildingTelemetry
}) {
  const activeFloor = useDigitalTwinStore((state) => state.activeFloor)
  const setActiveFloor = useDigitalTwinStore((state) => state.setActiveFloor)
  const rooms = useMemo(
    () => buildRoomCells(building).filter((room) => room.floor === activeFloor),
    [activeFloor, building],
  )
  const activeLoad = telemetry.floorLoads[activeFloor - 1] ?? 0

  return (
    <>
      <div className="dashboard-column dashboard-column--left building-column">
        <PanelFrame title={building.name} eyebrow={`${building.code} · BUILDING OVERVIEW`}>
          <div className="building-summary">
            <div className="building-summary__status">
              <span
                className="status-orb"
                style={{ '--status-color': HEALTH_COLORS[building.health] } as React.CSSProperties}
              />
              <div>
                <strong>{healthLabel(building.health)}</strong>
                <small>{building.description}</small>
              </div>
            </div>
            <div className="building-summary__numbers">
              <div><span>楼层</span><strong>{building.floors}</strong></div>
              <div><span>当前人数</span><strong>{telemetry.occupancy}</strong></div>
              <div><span>容量</span><strong>{building.capacity}</strong></div>
            </div>
          </div>
        </PanelFrame>

        <PanelFrame title="楼层导航" eyebrow="FLOOR NAVIGATION">
          <div className="floor-selector">
            {Array.from({ length: building.floors }, (_, index) => building.floors - index).map(
              (floor) => (
                <button
                  type="button"
                  key={floor}
                  className={floor === activeFloor ? 'is-active' : ''}
                  onClick={() => setActiveFloor(floor)}
                >
                  <span>F{String(floor).padStart(2, '0')}</span>
                  <small>{telemetry.floorLoads[floor - 1]?.toFixed(0) ?? 0}% 负荷</small>
                  <i style={{ width: `${telemetry.floorLoads[floor - 1] ?? 0}%` }} />
                </button>
              ),
            )}
          </div>
        </PanelFrame>
      </div>

      <div className="dashboard-column dashboard-column--right building-column">
        <PanelFrame title={`F${String(activeFloor).padStart(2, '0')} 环境态势`} eyebrow="ENVIRONMENT & IAQ">
          <div className="environment-grid">
            <MetricCard
              label="室内温度"
              value={telemetry.temperatureC.toFixed(1)}
              unit="°C"
              detail="舒适区间 22–26°C"
            />
            <MetricCard
              label="相对湿度"
              value={telemetry.humidityPercent.toFixed(0)}
              unit="%"
              accent="green"
              detail="目标区间 40–60%"
            />
            <MetricCard
              label="二氧化碳"
              value={formatCompact(telemetry.co2Ppm)}
              unit="ppm"
              accent={telemetry.co2Ppm > 900 ? 'amber' : 'cyan'}
              detail="新风系统联动"
            />
            <MetricCard
              label="PM2.5"
              value={telemetry.pm25UgM3.toFixed(1)}
              unit="μg/m³"
              accent="green"
              detail="空气质量优"
            />
          </div>
        </PanelFrame>

        <PanelFrame title="楼层负荷" eyebrow="FLOOR LOAD DISTRIBUTION">
          <div className="load-overview">
            <div className="load-overview__value">
              <span>当前楼层综合负荷</span>
              <strong>{activeLoad.toFixed(1)}<small>%</small></strong>
            </div>
            <FloorLoadBars loads={telemetry.floorLoads} activeFloor={activeFloor} />
          </div>
          <Sparkline values={telemetry.floorLoads} color="#5feaff" height={48} />
        </PanelFrame>

        <PanelFrame title="空间与设备" eyebrow="ROOM & EQUIPMENT STATUS">
          <div className="room-status-list">
            {rooms.map((room) => (
              <div key={room.id}>
                <span
                  className="room-status-list__dot"
                  style={{ background: HEALTH_COLORS[room.status] }}
                />
                <strong>{room.label}</strong>
                <small>{room.occupancy} 人</small>
                <em>{healthLabel(room.status)}</em>
              </div>
            ))}
          </div>
          <div className="equipment-summary">
            <div><span>实时功率</span><strong>{telemetry.powerKw.toFixed(1)} kW</strong></div>
            <div><span>冷冻水</span><strong>{telemetry.chilledWaterM3h.toFixed(1)} m³/h</strong></div>
            <div><span>在线设备</span><strong>{telemetry.activeDevices}</strong></div>
            <div><span>活动告警</span><strong>{telemetry.warnings}</strong></div>
          </div>
        </PanelFrame>
      </div>
    </>
  )
}
